import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../types';
import { userProviderService } from '../services/UserProviderService';
import { platformService } from '../services/PlatformService';

export default async function userProviderRoutes(fastify: FastifyInstance) {
  
  // Get all user providers for a user
  fastify.get<{ 
    Params: { userId: string };
    Querystring: { active?: string };
  }>('/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const { active } = request.query;

      let providers;
      if (active === 'true') {
        providers = await userProviderService.getActiveUserProviders(userId);
      } else {
        providers = await userProviderService.getUserProviders(userId);
      }

      // Hide sensitive information
      const sanitizedProviders = providers.map(provider => ({
        ...provider,
        apiKey: '***HIDDEN***',
        apiSecret: provider.apiSecret ? '***HIDDEN***' : undefined
      }));

      return reply.send({
        success: true,
        data: sanitizedProviders
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting user providers:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get specific user provider by ID
  fastify.get<{ 
    Params: { userId: string; providerId: string };
  }>('/:userId/:providerId', async (request, reply) => {
    try {
      const { userId, providerId } = request.params;

      const provider = await userProviderService.getUserProviderById(userId, providerId);
      
      if (!provider) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      // Hide sensitive information
      const sanitizedProvider = {
        ...provider,
        apiKey: '***HIDDEN***',
        apiSecret: provider.apiSecret ? '***HIDDEN***' : undefined
      };

      return reply.send({
        success: true,
        data: sanitizedProvider
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting user provider:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Create new user provider
  fastify.post<{ 
    Params: { userId: string };
    Body: {
      platformId: string;
      name: string;
      apiKey: string;
      apiSecret?: string;
      dailyQuota: number;
      customConfig?: any;
    };
  }>('/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const { platformId, name, apiKey, apiSecret, dailyQuota, customConfig } = request.body;

      // Validate required fields
      if (!platformId || !name || !apiKey || !dailyQuota) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: platformId, name, apiKey, dailyQuota'
        } as ApiResponse);
      }

      // Validate platform exists
      const platform = await platformService.getPlatformById(platformId);
      if (!platform) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid platform ID'
        } as ApiResponse);
      }

      // Validate daily quota
      if (dailyQuota <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Daily quota must be greater than 0'
        } as ApiResponse);
      }

      const newProvider = await userProviderService.createUserProvider(userId, {
        platformId,
        name,
        apiKey,
        apiSecret,
        dailyQuota,
        customConfig
      });

      // Hide sensitive information in response
      const sanitizedProvider = {
        ...newProvider,
        apiKey: '***HIDDEN***',
        apiSecret: newProvider.apiSecret ? '***HIDDEN***' : undefined
      };

      return reply.code(201).send({
        success: true,
        data: sanitizedProvider,
        message: 'User provider created successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error creating user provider:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({
          success: false,
          error: error.message
        } as ApiResponse);
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Update user provider
  fastify.put<{ 
    Params: { userId: string; providerId: string };
    Body: Partial<{
      name: string;
      apiKey: string;
      apiSecret: string;
      dailyQuota: number;
      isActive: boolean;
      customConfig: any;
    }>;
  }>('/:userId/:providerId', async (request, reply) => {
    try {
      const { userId, providerId } = request.params;
      const updateData = request.body;

      // Validate daily quota if provided
      if (updateData.dailyQuota !== undefined && updateData.dailyQuota <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Daily quota must be greater than 0'
        } as ApiResponse);
      }

      const updatedProvider = await userProviderService.updateUserProvider(
        userId, 
        providerId, 
        updateData
      );

      if (!updatedProvider) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      // Hide sensitive information in response
      const sanitizedProvider = {
        ...updatedProvider,
        apiKey: '***HIDDEN***',
        apiSecret: updatedProvider.apiSecret ? '***HIDDEN***' : undefined
      };

      return reply.send({
        success: true,
        data: sanitizedProvider,
        message: 'User provider updated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error updating user provider:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({
          success: false,
          error: error.message
        } as ApiResponse);
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Delete user provider (soft delete)
  fastify.delete<{ 
    Params: { userId: string; providerId: string };
  }>('/:userId/:providerId', async (request, reply) => {
    try {
      const { userId, providerId } = request.params;

      const deleted = await userProviderService.deleteUserProvider(userId, providerId);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        message: 'User provider deleted successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error deleting user provider:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get user provider statistics
  fastify.get<{ 
    Params: { userId: string };
  }>('/:userId/stats', async (request, reply) => {
    try {
      const { userId } = request.params;

      const stats = await userProviderService.getProviderStats(userId);

      return reply.send({
        success: true,
        data: stats
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting provider stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Test provider connection
  fastify.post<{ 
    Params: { userId: string; providerId: string };
  }>('/:userId/:providerId/test', async (request, reply) => {
    try {
      const { userId, providerId } = request.params;

      const testResult = await userProviderService.testProviderConnection(userId, providerId);

      return reply.send({
        success: testResult.success,
        data: testResult.details,
        message: testResult.message
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error testing provider connection:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get available providers (active and under quota)
  fastify.get<{ 
    Params: { userId: string };
  }>('/:userId/available', async (request, reply) => {
    try {
      const { userId } = request.params;

      const providers = await userProviderService.getAvailableProviders(userId);

      // Hide sensitive information
      const sanitizedProviders = providers.map(provider => ({
        ...provider,
        apiKey: '***HIDDEN***',
        apiSecret: provider.apiSecret ? '***HIDDEN***' : undefined
      }));

      return reply.send({
        success: true,
        data: sanitizedProviders
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting available providers:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Reset provider usage (for testing/admin purposes)
  fastify.post<{ 
    Params: { userId: string; providerId: string };
  }>('/:userId/:providerId/reset-usage', async (request, reply) => {
    try {
      const { userId, providerId } = request.params;

      // Verify provider belongs to user
      const provider = await userProviderService.getUserProviderById(userId, providerId);
      if (!provider) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      await userProviderService.resetProviderUsage(providerId);

      return reply.send({
        success: true,
        message: 'Provider usage reset successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error resetting provider usage:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}
