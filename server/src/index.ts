import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './utils/database';
import { providerService } from './services/ProviderService';
import { emailWorker } from './services/EmailWorker';
import { databaseService } from './services/DatabaseService';
import { queueService } from './services/QueueService';
import { emailProcessorService } from './services/EmailProcessorService';
import { debugEmailService } from './services/DebugEmailService';
import emailRoutes from './routes/email';
import userProviderRoutes from './routes/user-provider';
import webhookRoutes from './routes/webhook';
import dashboardRoutes from './routes/dashboard';
import databaseRoutes from './routes/database';
import templateRoutes from './routes/template';

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

    // Initialize database (indexes, demo data if needed)
    await databaseService.initializeDatabase();

    // Start quota reset scheduler
    await providerService.startQuotaResetScheduler();

    // Initialize RabbitMQ connection
    try {
      await queueService.connect();
      
      // Start the job consumer
      await queueService.startConsumer(async (jobId: string) => {
        await emailProcessorService.processJob(jobId);
      });
      
      console.log('🔄 Email job processor started');
    } catch (error) {
      console.error('❌ Failed to initialize RabbitMQ:', error);
      console.log('⚠️  Server will continue without queue processing');
    }

    // Start email worker (keeping the existing worker for now)
    await emailWorker.start();

    // Initialize debug email service and cleanup old files
    await debugEmailService.cleanupOldFiles();

    // Register routes
    await server.register(emailRoutes, { prefix: '/api/email' });
    await server.register(userProviderRoutes, { prefix: '/api/user-provider' });
    await server.register(webhookRoutes, { prefix: '/api/webhook' });
    await server.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await server.register(databaseRoutes, { prefix: '/api/database' });
    await server.register(templateRoutes, { prefix: '/api/template' });

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
  
  try {
    // Stop email worker
    await emailWorker.stop();
    
    // Close RabbitMQ connection
    await queueService.disconnect();
    
    // Close server
    await server.close();
    console.log('Server closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

start();

