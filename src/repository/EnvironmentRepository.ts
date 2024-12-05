import { Environment, environmentSchema } from '@estuary/types';
import MongoRepository from './MongoRepository.js';
import { IRepositoryManager } from './repository-types.js';

export default class EnvironmentRepository extends MongoRepository<Environment> {
  constructor(repositoryManager: IRepositoryManager) {
    super('environment', environmentSchema, repositoryManager);
  }
}
