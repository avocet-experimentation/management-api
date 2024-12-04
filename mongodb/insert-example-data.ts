import { ExperimentDraft, FeatureFlagDraft, ForcedValue } from '@estuary/types';
import { insertArray, repos } from './insert-helpers.js';

// assumes that default environments have already been inserted
const allEnvironments = await repos.environment.getMany();

// verify the testing environment exists - update code below if testing
// environment is removed from initial data
if (!allEnvironments.find((env) => env.name === 'testing')) {
  throw new Error(
    'No environment exists with name "testing"! Update example data file',
  );
}

// #region FEATURE FLAGS
const forceTrueInTesting = ForcedValue.template({
  environmentName: 'testing',
  value: true,
});

const exampleFeatureToggle = FeatureFlagDraft.template({
  name: 'example-feature-toggle',
  description: 'toggles the <insert feature here>',
  value: { type: 'boolean', initial: false },
  environmentNames: { production: true },
  overrideRules: [forceTrueInTesting],
});

const exampleSiteThemeFlag = FeatureFlagDraft.template({
  name: 'example-site-theme',
  description: "sets the website's theme to light or dark",
  value: { type: 'string', initial: 'light' },
});

const exampleFeatureFlags: FeatureFlagDraft[] = [
  exampleFeatureToggle,
  exampleSiteThemeFlag,
];

await insertArray(exampleFeatureFlags, repos.featureFlag);
// #endregion

// #region EXPERIMENTS
export const switchbackExperiment1 = ExperimentDraft.templateSwitchback({
  name: 'Example Switchback',
  description:
    'a simple switchback experiment with one group and two treatments',
  environmentName: 'prod',
});

export const abExperiment1 = ExperimentDraft.templateAB({
  name: 'Example A/B Experiment',
  description:
    'A bivariate A/B test with two groups and two independent variables (flags)',
  environmentName: 'prod',
});

export const exampleExperiments: ExperimentDraft[] = [
  switchbackExperiment1,
  abExperiment1,
];

await insertArray(exampleExperiments, repos.experiment);
// #endregion

// eslint-disable-next-line no-console
console.log('example data inserted');
process.exit(0);
