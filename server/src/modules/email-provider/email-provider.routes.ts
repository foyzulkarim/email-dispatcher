import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../../types';
import { EmailProviderModel } from './EmailProvider';
import { v4 as uuidv4 } from 'uuid';
import { getProviderConfig, validateProviderConfig } from '../../config/providers';
import { emailProviderService } from './EmailProviderService';

interface CreateProviderRequest {
  name: string;
  type: 'brevo' | 'mailerlite' | 'sendgrid' | 'mailgun' | 'postmark' | 'mailjet' | 'ses' | 'custom';
  apiKey: string;
  dailyQuota: number;
}

interface TestProviderRequest {
  providerId: string;
  testEmail: string;
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

      // Validate type and get provider config
      const config = getProviderConfig(type);
      if (!config) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid provider type. Supported types: brevo, mailerlite, sendgrid, mailgun, postmark, mailjet, ses, custom'
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

      // Create new provider with configuration
      const newProvider = new EmailProviderModel({
        id: uuidv4(),
        name: name.trim(),
        type,
        apiKey,
        dailyQuota,
        usedToday: 0,
        isActive: true,
        lastResetDate: new Date(),
        config
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

  // Test provider by sending a test email
  fastify.post<{ Body: TestProviderRequest }>('/test', async (request, reply) => {
    try {
      const { providerId, testEmail } = request.body;

      // Validate required fields
      if (!providerId || !testEmail) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: providerId, testEmail'
        } as ApiResponse);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid email format'
        } as ApiResponse);
      }

      // Find the provider
      const provider = await EmailProviderModel.findOne({ id: providerId });
      if (!provider) {
        return reply.code(404).send({
          success: false,
          error: 'Provider not found'
        } as ApiResponse);
      }

      if (!provider.isActive) {
        return reply.code(400).send({
          success: false,
          error: 'Provider is not active'
        } as ApiResponse);
      }

      // Prepare test email
      const emailRequest = {
        to: testEmail,
        toName: testEmail.split('@')[0],
        subject: `Test Email from ${provider.name}`,
        htmlContent: `
          <h2>Test Email</h2>
          <p>This is a test email sent from <strong>${provider.name}</strong> provider.</p>
          <p>Provider Type: <strong>${provider.type}</strong></p>
          <p>Sent at: <strong>${new Date().toISOString()}</strong></p>
          <hr>
          <p><small>This email was sent to test the email provider configuration.</small></p>
        `,
        textContent: `Test Email - This is a test email sent from ${provider.name} provider (${provider.type}) at ${new Date().toISOString()}`,
        fromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.DEFAULT_FROM_NAME || 'Email Service Test',
        metadata: { test: true, providerId }
      };

      // Send test email
      const response = await emailProviderService.sendEmail(provider, emailRequest);

      if (response.success) {
        // Update provider usage
        await emailProviderService.incrementProviderUsage(provider.id);
        
        return reply.send({
          success: true,
          data: {
            messageId: response.messageId,
            provider: {
              id: provider.id,
              name: provider.name,
              type: provider.type
            },
            testEmail,
            sentAt: new Date().toISOString()
          },
          message: 'Test email sent successfully!'
        } as ApiResponse);
      } else {
        return reply.code(500).send({
          success: false,
          error: response.error || 'Failed to send test email'
        } as ApiResponse);
      }

    } catch (error) {
      fastify.log.error('Error testing provider:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}

