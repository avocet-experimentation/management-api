import {
  ClientPropMapping,
  ClientSDKFlagMapping,
  ClientSDKFlagValue,
  Environment,
  Experiment,
  FeatureFlag,
  FeatureFlagDraft,
  ForcedValue,
  SDKFlagManager,
} from '@avocet/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RepositoryManager } from '@avocet/mongo-client';
import cfg from '../envalid.js';

/**
 * Executes many asynchronous operations in parallel and returns once all of
 * the promises resolve or any one of them rejects.
 * @param cb any function that returns a `Promise`
 * @param argumentSets an array of tuples of arguments to pass into `cb`
 * @param promiseTransform an optional transform operation
 * @returns
 */
const parallelAsync = async <P, A extends Array<unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cb: (...args: A) => Promise<P>,
  argumentSets: A[],
) => {
  const promises: Promise<P>[] = [];

  for (let i = 0; i < argumentSets.length; i += 1) {
    const args = argumentSets[i];
    const promise = cb(...args);
    promises.push(promise);
  }

  return Promise.all(promises);
};

async function computeFlagValue(
  experimentRepo: RepositoryManager['experiment'],
  flag: FeatureFlag,
  environmentName: string,
  clientProps: ClientPropMapping,
): Promise<ClientSDKFlagValue> {
  const defaultReturn = {
    value: flag.value.initial,
    metadata: SDKFlagManager.singleIdString(flag.id),
  };

  const envRules = FeatureFlagDraft.getEnvironmentRules(flag, environmentName);
  const selectedRule = SDKFlagManager.enroll(envRules, clientProps);
  if (selectedRule === undefined) return defaultReturn;

  let fullRule: Experiment | ForcedValue;
  if (selectedRule.type === 'Experiment') {
    fullRule = await experimentRepo.get(selectedRule.id);
  } else {
    fullRule = selectedRule;
  }

  const ruleValue = SDKFlagManager.ruleValueAndMetadata(
    fullRule,
    flag.id,
    clientProps,
  );
  return ruleValue ?? defaultReturn;
}

interface FetchFlagsClientBody {
  apiKey: string;
  clientProps: ClientPropMapping;
}

interface FetchFlagClientRequest extends FetchFlagsClientBody {
  flagName: string;
}

const repos = new RepositoryManager(cfg.MONGO_API_URI);

const getEnvFromKey = async (apiKey: string): Promise<Environment> => {
  const connection = await repos.sdkConnection.findOne({ apiKeyHash: apiKey });
  if (!connection) throw new Error('No SDK connection found.');

  const environment = await repos.environment.get(connection.environmentId);
  if (!connection) throw new Error('No environment found.');

  return environment;
};

/**
 * Todo:
 * - pass client API key in body instead of environmentName
 * - use key to identify environment
 */
export const fetchFFlagHandler = async (
  request: FastifyRequest<{ Body: FetchFlagClientRequest }>,
  reply: FastifyReply,
): Promise<ClientSDKFlagMapping> => {
  const { apiKey, clientProps, flagName } = request.body;

  try {
    const environment = await getEnvFromKey(apiKey);
    const environmentName = environment.name;

    let currentValue: ClientSDKFlagValue = {
      value: null,
      metadata: SDKFlagManager.defaultIdString(),
    };

    const flag = await repos.featureFlag.findOne({
      name: flagName,
    });
    if (flag && environmentName in flag.environmentNames) {
      currentValue = await computeFlagValue(
        repos.experiment,
        flag,
        environmentName,
        clientProps,
      );
    }
    return await reply.code(200).send({ [flagName]: currentValue });
  } catch (e) {
    return reply.code(404);
  }
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<{ Body: FetchFlagsClientBody }>,
  reply: FastifyReply,
): Promise<ClientSDKFlagMapping> => {
  const { apiKey, clientProps } = request.body;

  try {
    const environment = await getEnvFromKey(apiKey);
    const environmentName = environment.name;

    const featureFlags = await repos.featureFlag.getEnvironmentFlags(environmentName);

    const resolve = await parallelAsync(
      (flag, ...args) =>
        computeFlagValue(repos.experiment, flag, ...args).then((result) => [
          flag.name,
          result,
        ]),
      featureFlags.map((flag) => [flag, environmentName, clientProps] as const),
    );

    const environmentValues = Object.fromEntries(resolve);
    return await reply.code(200).send(environmentValues);
  } catch (e: unknown) {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(e);
    }

    return reply.code(404);
  }
};
