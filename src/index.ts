import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './utils/database';
import { providerService } from './services/ProviderService';
import { emailWorker } from './services/EmailWorker';
import emailRoutes from './routes/email';
import providerRoutes from './routes/provider';
import webhookRoutes from './routes/webhook';
import dashboardRoutes from './routes/dashboard';

// Load environment variables
dotenv.config();

const server: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
  }
});

async function start() {
  try {
    // Register CORS
    await server.register(cors, {
      origin: true, // Allow all origins for development
      credentials: true
    });

    // Connect to database
    await connectToDatabase();

    // Initialize providers
    await providerService.initializeProviders();

    // Start quota reset scheduler
    await providerService.startQuotaResetScheduler();

    // Start email worker
    await emailWorker.start();

    // Register routes
    await server.register(emailRoutes, { prefix: '/api/email' });
    await server.register(providerRoutes, { prefix: '/api/provider' });
    await server.register(webhookRoutes, { prefix: '/api/webhook' });
    await server.register(dashboardRoutes, { prefix: '/api/dashboard' });

    // Health check endpoint
    server.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start server
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Email Dispatch Service running on port ${port}`);
    console.log(`📊 Dashboard available at http://localhost:${port}/api/dashboard/stats`);
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await emailWorker.stop();
  await server.close();
  process.exit(0);
});

start();

