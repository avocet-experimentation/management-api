/* eslint-disable no-console */
import Fastify from 'fastify';
import mercurius from 'mercurius';
import mercuriusLogging from 'mercurius-logging';
import cors from '@fastify/cors';
import { schema } from './graphql/schemas.js';
import { resolvers } from './graphql/resolvers.js';
import cfg from './envalid.js';

const server = Fastify({
  logger: true,
  disableRequestLogging: true,
});
// check if service is up during deployment; check on regular frequency
server.get('/healthcheck', async () => ({ status: 'OK' }));
// todo: replace '*' origin with environment variable referencing dashboard
server.register(cors, { prefix: 'graphql', origin: '*' });
server.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
});

server.register(mercuriusLogging);

server.listen({ port: cfg.MANAGEMENT_API_PORT }, (error, address) => {
  if (error instanceof Error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`\nAvocet management API running at ${address}`);
});
