import { FastifyInstance } from 'fastify';
import { databaseService } from './DatabaseService';
import { ApiResponse } from '../../types';

export default async function databaseRoutes(fastify: FastifyInstance) {
  
  // Get database statistics
  fastify.get('/status', async (request, reply) => {
    try {
      const stats = await databaseService.getStats();
      
      return reply.send({
        success: true,
        data: {
          stats,
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
  
  // Clear all data (for testing purposes)
  fastify.delete('/clear', async (request, reply) => {
    try {
      await databaseService.clearAllData();
      
      return reply.send({
        success: true,
        message: 'All data cleared successfully'
      } as ApiResponse);
      
    } catch (error) {
      fastify.log.error('Error clearing data:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to clear data'
      } as ApiResponse);
    }
  });
}
