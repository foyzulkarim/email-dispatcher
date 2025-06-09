import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../types';
import { EmailProviderModel } from '../models/EmailProvider';
import { v4 as uuidv4 } from 'uuid';

interface CreateProviderRequest {
  name: string;
  type: 'brevo' | 'mailerlite';
  apiKey: string;
  dailyQuota: number;
}

export default async function providerRoutes(fastify: FastifyInstance) {
  
  // Create a new provider
  fastify.post<{ Body: CreateProviderRequest }>('/create', async (request, reply) => {
    try {
      const { name, type, apiKey, dailyQuota } = request.body;

      // Validate required fields
      if (!name || !type || !apiKey || !dailyQuota) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: name, type, apiKey, dailyQuota'
        } as ApiResponse);
      }

      // Validate type
      if (!['brevo', 'mailerlite'].includes(type)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid provider type. Must be either "brevo" or "mailerlite"'
        } as ApiResponse);
      }

      // Validate daily quota
      if (dailyQuota <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Daily quota must be greater than 0'
        } as ApiResponse);
      }

      // Check if provider with same name already exists
      const existingProvider = await EmailProviderModel.findOne({ name: name.trim() });
      if (existingProvider) {
        return reply.code(409).send({
          success: false,
          error: 'A provider with this name already exists'
        } as ApiResponse);
      }

      // Create new provider
      const newProvider = new EmailProviderModel({
        id: uuidv4(),
        name: name.trim(),
        type,
        apiKey,
        dailyQuota,
        usedToday: 0,
        isActive: true,
        lastResetDate: new Date()
      });

      await newProvider.save();

      // Return provider without API key
      const providerResponse = {
        id: newProvider.id,
        name: newProvider.name,
        type: newProvider.type,
        dailyQuota: newProvider.dailyQuota,
        usedToday: newProvider.usedToday,
        remainingToday: newProvider.dailyQuota - newProvider.usedToday,
        isActive: newProvider.isActive,
        lastResetDate: newProvider.lastResetDate
      };

      return reply.code(201).send({
        success: true,
        data: providerResponse,
        message: 'Email provider created successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error creating provider:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
  
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

