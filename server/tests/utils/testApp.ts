import Fastify, { FastifyInstance } from 'fastify';
import emailRoutes from '../../src/routes/email';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false // Disable logging during tests
  });

  // Register only the email routes for testing
  await app.register(emailRoutes, { prefix: '/api/email' });

  return app;
} 
