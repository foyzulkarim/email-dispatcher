import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import emailRoutes from '../../src/routes/email';
import providerRoutes from '../../src/routes/provider';
import dashboardRoutes from '../../src/routes/dashboard';
import templateRoutes from '../../src/routes/template';
import dynamicProviderRoutes from '../../src/routes/dynamic-provider';

// Mock database connection
jest.mock('../../src/utils/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock all services
jest.mock('../../src/services/DatabaseService', () => ({
  databaseService: {
    initializeDatabase: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/services/ProviderService', () => ({
  providerService: {
    initializeProviders: jest.fn().mockResolvedValue({}),
    startQuotaResetScheduler: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/services/EmailWorker', () => ({
  emailWorker: {
    start: jest.fn().mockResolvedValue({}),
    stop: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/services/DebugEmailService', () => ({
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
