import { ExperimentDraft } from '@avocet/core';

export const experiment1 = ExperimentDraft.template({
  name: 'example experiment to embed',
  environmentName: 'prod',
});

export const switchbackExperiment1 = ExperimentDraft.templateSwitchback({
  name: 'my switchback',
  environmentName: 'prod',
});

export const abExperiment1 = ExperimentDraft.templateAB({
  name: 'two group test',
  environmentName: 'prod',
});

export const exampleExperiments: ExperimentDraft[] = [
  experiment1,
  switchbackExperiment1,
  abExperiment1,
].map((el) => Object.freeze(el));
