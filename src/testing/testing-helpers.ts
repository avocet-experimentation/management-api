import {
  FeatureFlagDraft,
  EstuaryMongoCollectionName,
  ExperimentDraft,
  EstuaryMongoTypes,
  DraftRecord,
} from '@estuary/types';
import cfg from '../envalid.js';
import RepositoryManager from '../repository/RepositoryManager.js';
import MongoRepository from '../repository/MongoRepository.js';

export const repoManager = new RepositoryManager(cfg.MONGO_TESTING_URI);

const insertIntoRepo = async <T extends EstuaryMongoTypes>(
  resultsArray: string[],
  objectArr: DraftRecord<T>[],
  repo: MongoRepository<T>,
) => {
  const promises: Promise<string>[] = [];

  objectArr.forEach((obj) => promises.push(repo.create(obj)));

  const resolved = await Promise.all(promises);
  resultsArray.push(...resolved);
};

export const insertFlags = async (
  resultsArray: string[],
  flags: FeatureFlagDraft[],
) => {
  await insertIntoRepo(resultsArray, flags, repoManager.featureFlag);
};

export const insertExperiments = async (
  resultsArray: string[],
  experiments: ExperimentDraft[],
) => {
  await insertIntoRepo(resultsArray, experiments, repoManager.experiment);
};

export const eraseCollection = async (
  collectionName: EstuaryMongoCollectionName,
) => repoManager.client.db().dropCollection(collectionName);

export const eraseTestData = async () => {
  await eraseCollection('featureFlag');
  await eraseCollection('experiment');
  await eraseCollection('clientPropDef');
  await eraseCollection('clientConnection');
  await eraseCollection('environment');
  await eraseCollection('user');
};
