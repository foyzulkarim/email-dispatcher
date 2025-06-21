import { FastifyInstance } from 'fastify';
import { ApiResponse, SimpleProviderConfigPayload, AdvancedProviderConfigPayload } from '../../types';
import { ProviderConfigurationService } from './ProviderConfigurationService';

export default async function dynamicProviderRoutes(fastify: FastifyInstance) {
  
  // Create simple provider configuration
  fastify.post<{ Body: SimpleProviderConfigPayload }>('/simple', async (request, reply) => {
    try {
      const payload = request.body;
      
      // Validate required fields
      if (!payload.name || !payload.type || !payload.apiKey || !payload.dailyQuota) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: name, type, apiKey, dailyQuota'
        } as ApiResponse);
      }

      // Validate daily quota
      if (payload.dailyQuota <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Daily quota must be greater than 0'
        } as ApiResponse);
      }

      const provider = await ProviderConfigurationService.saveSimpleProvider(payload);
      
      return reply.code(201).send({
        success: true,
        data: provider,
        message: 'Simple provider configuration created successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error creating simple provider:', error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message
      } as ApiResponse);
    }
  });

  // Create advanced provider configuration
  fastify.post<{ Body: AdvancedProviderConfigPayload }>('/advanced', async (request, reply) => {
    try {
      const payload = request.body;
      
      // Validate required fields
      if (!payload.name || !payload.type || !payload.apiKey || !payload.dailyQuota || 
          !payload.endpoint || !payload.method || !payload.headers || !payload.authentication || 
          !payload.payloadTemplate) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields for advanced configuration'
        } as ApiResponse);
      }

      const provider = await ProviderConfigurationService.saveAdvancedProvider(payload);
      
      return reply.code(201).send({
        success: true,
        data: provider,
        message: 'Advanced provider configuration created successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error creating advanced provider:', error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message
      } as ApiResponse);
    }
  });

  // Get available provider presets
  fastify.get('/presets', async (request, reply) => {
    try {
      const presets = ProviderConfigurationService.getProviderPresets();
      
      return reply.send({
        success: true,
        data: presets
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting provider presets:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Test provider configuration
  fastify.post<{ Body: SimpleProviderConfigPayload | AdvancedProviderConfigPayload }>('/test', async (request, reply) => {
    try {
      const payload = request.body;
      const result = await ProviderConfigurationService.testProviderConfiguration(payload);
      
      return reply.send({
        success: true,
        data: result
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error testing provider configuration:', error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message
      } as ApiResponse);
    }
  });

  // Update provider configuration
  fastify.put<{ 
    Params: { providerId: string };
    Body: Partial<SimpleProviderConfigPayload>
  }>('/:providerId', async (request, reply) => {
    try {
      const { providerId } = request.params;
      const updates = request.body;

      const provider = await ProviderConfigurationService.updateProvider(providerId, updates);
      
      return reply.send({
        success: true,
        data: provider,
        message: 'Provider updated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error updating provider:', error);
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      return reply.code(statusCode).send({
        success: false,
        error: (error as Error).message
      } as ApiResponse);
    }
  });

  // Delete provider
  fastify.delete<{ Params: { providerId: string } }>('/:providerId', async (request, reply) => {
    try {
      const { providerId } = request.params;
      
      const result = await ProviderConfigurationService.deleteProvider(providerId);
      
      return reply.send({
        success: true,
        data: result,
        message: 'Provider deleted successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error deleting provider:', error);
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      return reply.code(statusCode).send({
        success: false,
        error: (error as Error).message
      } as ApiResponse);
    }
  });

  // Get provider by ID
  fastify.get<{ Params: { providerId: string } }>('/:providerId', async (request, reply) => {
    try {
      const { providerId } = request.params;
      
      const provider = await ProviderConfigurationService.getProvider(providerId);
      
      return reply.send({
        success: true,
        data: provider
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting provider:', error);
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      return reply.code(statusCode).send({
        success: false,
        error: (error as Error).message
      } as ApiResponse);
    }
  });

  // List providers with filtering
  fastify.get<{ 
    Querystring: { 
      type?: string;
      isActive?: string;
      hasQuotaRemaining?: string;
    }
  }>('/', async (request, reply) => {
    try {
      const filters: any = {};
      
      if (request.query.type) {
        filters.type = request.query.type;
      }
      
      if (request.query.isActive) {
        filters.isActive = request.query.isActive === 'true';
      }
      
      if (request.query.hasQuotaRemaining) {
        filters.hasQuotaRemaining = request.query.hasQuotaRemaining === 'true';
      }
      
      const providers = await ProviderConfigurationService.listProviders(filters);
      
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
          lastResetDate: provider.lastResetDate,
          config: {
            endpoint: provider.config.endpoint,
            method: provider.config.method,
            authType: provider.config.authentication.type
          }
        }))
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error listing providers:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Bulk operations
  fastify.post<{ 
    Body: { 
      action: 'activate' | 'deactivate' | 'reset-quota';
      providerIds: string[];
    }
  }>('/bulk', async (request, reply) => {
    try {
      const { action, providerIds } = request.body;
      
      if (!action || !providerIds || !Array.isArray(providerIds)) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: action, providerIds'
        } as ApiResponse);
      }

      const results = [];
      
      for (const providerId of providerIds) {
        try {
          let result;
          
          switch (action) {
            case 'activate':
              result = await ProviderConfigurationService.updateProvider(providerId, { isActive: true });
              break;
            case 'deactivate':
              result = await ProviderConfigurationService.updateProvider(providerId, { isActive: false });
              break;
            case 'reset-quota':
              // This would need to be implemented in the service
              result = { id: providerId, message: 'Quota reset not implemented yet' };
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          
          results.push({
            providerId,
            success: true,
            data: result
          });
        } catch (error) {
          results.push({
            providerId,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      return reply.send({
        success: true,
        data: results,
        message: `Bulk ${action} operation completed`
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error in bulk operation:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}
