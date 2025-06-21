import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import emailRoutes from '../../src/modules/email-job/email-job.routes';
import providerRoutes from '../../src/modules/email-provider/email-provider.routes';
import dashboardRoutes from '../../src/modules/dashboard/dashboard.routes';
import templateRoutes from '../../src/modules/email-template/email-template.routes';
import dynamicProviderRoutes from '../../src/modules/email-provider/dynamic-provider.routes';

// Mock database connection
jest.mock('../../src/modules/core/utils/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock all services
jest.mock('../../src/modules/core/DatabaseService', () => ({
  databaseService: {
    initializeDatabase: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/modules/email-provider/ProviderService', () => ({
  providerService: {
    initializeProviders: jest.fn().mockResolvedValue({}),
    startQuotaResetScheduler: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/modules/email-job/EmailWorker', () => ({
  emailWorker: {
    start: jest.fn().mockResolvedValue({}),
    stop: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/modules/core/utils/DebugEmailService', () => ({
  debugEmailService: {
    cleanupOldFiles: jest.fn().mockResolvedValue({}),
  },
}));

export async function build(): Promise<FastifyInstance> {
  const server: FastifyInstance = Fastify({
    logger: false, // Disable logging in tests
  });

  // Register CORS
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register routes
  await server.register(emailRoutes, { prefix: '/api/email' });
  await server.register(providerRoutes, { prefix: '/api/provider' });
  await server.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await server.register(templateRoutes, { prefix: '/api/template' });
  await server.register(dynamicProviderRoutes, { prefix: '/api/dynamic-provider' });

  // Health check endpoint
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await server.ready();
  return server;
} 
