import { FastifyInstance } from 'fastify';
import { databaseService } from '../services/DatabaseService';
import { ApiResponse } from '../types';

export default async function databaseRoutes(fastify: FastifyInstance) {
  
  // Get database connection status
  fastify.get('/status', async (request, reply) => {
    try {
      const status = await databaseService.getConnectionStatus();
      const stats = await databaseService.getProviderStats();
      
      return reply.send({
        success: true,
        data: {
          connection: status,
          providerStats: stats,
          timestamp: new Date().toISOString()
        }
      } as ApiResponse);
      
    } catch (error) {
      fastify.log.error('Error getting database status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get database status'
      } as ApiResponse);
    }
  });
  
  // Initialize database (create indexes and demo data if needed)
  fastify.post('/initialize', async (request, reply) => {
    try {
      await databaseService.initializeDatabase();
      
      return reply.send({
        success: true,
        message: 'Database initialized successfully'
      } as ApiResponse);
      
    } catch (error) {
      fastify.log.error('Error initializing database:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to initialize database'
      } as ApiResponse);
    }
  });
  
  // Clear all providers (for testing purposes)
  fastify.delete('/providers/clear', async (request, reply) => {
    try {
      await databaseService.clearProviders();
      
      return reply.send({
        success: true,
        message: 'All providers cleared successfully'
      } as ApiResponse);
      
    } catch (error) {
      fastify.log.error('Error clearing providers:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to clear providers'
      } as ApiResponse);
    }
  });
} 
