import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../types';
import { EmailProviderModel } from '../models/EmailProvider';

export default async function providerRoutes(fastify: FastifyInstance) {
  
  // Get all providers with their status
  fastify.get('/list', async (request, reply) => {
    try {
      const providers = await EmailProviderModel.find().select('-apiKey');
      
      return reply.send({
        success: true,
        data: providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type,
          dailyQuota: provider.dailyQuota,
          usedToday: provider.usedToday,
          remainingToday: provider.dailyQuota - provider.usedToday,
          isActive: provider.isActive,
          lastResetDate: provider.lastResetDate
        }))
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting providers:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Update provider status
  fastify.patch<{ 
    Params: { providerId: string };
    Body: { isActive: boolean } 
  }>('/:providerId/status', async (request, reply) => {
    try {
      const { providerId } = request.params;
      const { isActive } = request.body;

      const provider = await EmailProviderModel.findOneAndUpdate(
        { id: providerId },
        { isActive },
        { new: true }
      ).select('-apiKey');

      if (!provider) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: provider,
        message: `Provider ${isActive ? 'activated' : 'deactivated'} successfully`
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error updating provider status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Reset provider quota (manual reset)
  fastify.post<{ Params: { providerId: string } }>('/:providerId/reset-quota', async (request, reply) => {
    try {
      const { providerId } = request.params;

      const provider = await EmailProviderModel.findOneAndUpdate(
        { id: providerId },
        { 
          usedToday: 0,
          lastResetDate: new Date()
        },
        { new: true }
      ).select('-apiKey');

      if (!provider) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: provider,
        message: 'Provider quota reset successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error resetting provider quota:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get provider statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const providers = await EmailProviderModel.find();
      
      const stats = {
        totalProviders: providers.length,
        activeProviders: providers.filter(p => p.isActive).length,
        totalDailyQuota: providers.reduce((sum, p) => sum + p.dailyQuota, 0),
        totalUsedToday: providers.reduce((sum, p) => sum + p.usedToday, 0),
        providers: providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type,
          dailyQuota: provider.dailyQuota,
          usedToday: provider.usedToday,
          remainingToday: provider.dailyQuota - provider.usedToday,
          usagePercentage: Math.round((provider.usedToday / provider.dailyQuota) * 100),
          isActive: provider.isActive
        }))
      };

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
}

