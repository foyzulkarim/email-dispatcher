import { EmailProviderModel } from '../models/EmailProvider';
import {
  SimpleProviderConfigPayload,
  AdvancedProviderConfigPayload,
  EmailProviderConfig,
  EmailData,
} from '../types';
import { AdvancedEmailProviderService } from './AdvancedEmailProviderService';

export class ProviderConfigurationService {
  /**
   * Save advanced provider configuration (for custom providers)
   */
  static async saveAdvancedProvider(payload: AdvancedProviderConfigPayload) {
    const fullConfig = {
      id: this.generateProviderId(),
      name: payload.name,
      type: payload.type,
      apiKey: payload.apiKey,
      apiSecret: payload.apiSecret,
      dailyQuota: payload.dailyQuota,
      usedToday: 0,
      isActive: payload.isActive,
      lastResetDate: new Date(),
      config: {
        endpoint: payload.endpoint,
        method: payload.method,
        headers: payload.headers,
        authentication: payload.authentication,
        payloadTemplate: payload.payloadTemplate,
        fieldMappings: (payload.fieldMappings && Object.keys(payload.fieldMappings).length > 0) 
          ? payload.fieldMappings 
          : {
              sender: 'sender',
              recipients: 'recipients',
              subject: 'subject',
              htmlContent: 'htmlContent',
            },
        responseMapping: {},
      },
    };

    return await EmailProviderModel.create(fullConfig);
  }

  /**
   * Test provider configuration before saving
   */
  static async testProviderConfiguration(
    payload: SimpleProviderConfigPayload | AdvancedProviderConfigPayload
  ) {
    // Create temporary provider object
    const tempProvider = await this.buildAdvancedProvider(
      payload as AdvancedProviderConfigPayload
    );

    // Test email data
    const testEmailData: EmailData = {
      sender: { email: 'test@example.com', name: 'Test Sender' },
      recipients: [{ email: 'recipient@example.com', name: 'Test Recipient' }],
      subject: 'Test Configuration',
      htmlContent: '<p>This is a test email to validate the configuration.</p>',
    };

    try {
      // Prepare request without sending
      const request = AdvancedEmailProviderService.prepareRequest(
        tempProvider,
        testEmailData
      );

      return {
        success: true,
        message: 'Configuration is valid',
        generatedPayload: request.payload,
        headers: request.headers,
      };
    } catch (error) {
      return {
        success: false,
        message: `Configuration error: ${(error as Error).message}`,
        error: error,
      };
    }
  }

  /**
   * Update existing provider configuration
   */
  static async updateProvider(
    providerId: string,
    updates: Partial<SimpleProviderConfigPayload>
  ) {
    const provider = await EmailProviderModel.findOne({ id: providerId });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Update basic fields
    if (updates.name) provider.name = updates.name;
    if (updates.dailyQuota !== undefined)
      provider.dailyQuota = updates.dailyQuota;
    if (updates.isActive !== undefined) provider.isActive = updates.isActive;
    if (updates.apiKey) provider.apiKey = updates.apiKey;
    if (updates.apiSecret !== undefined) provider.apiSecret = updates.apiSecret;

    // Update config if custom endpoint or headers provided
    if (updates.customEndpoint) {
      provider.config.endpoint = updates.customEndpoint;
    }

    if (updates.customHeaders) {
      provider.config.headers = {
        ...provider.config.headers,
        ...updates.customHeaders,
      };
    }

    await provider.save();
    return provider;
  }

  /**
   * Delete a provider
   */
  static async deleteProvider(providerId: string) {
    const result = await EmailProviderModel.deleteOne({ id: providerId });

    if (result.deletedCount === 0) {
      throw new Error('Provider not found');
    }

    return { success: true, message: 'Provider deleted successfully' };
  }

  /**
   * Get provider by ID with configuration
   */
  static async getProvider(providerId: string) {
    const provider = await EmailProviderModel.findOne({
      id: providerId,
    }).select('-apiKey -apiSecret');

    if (!provider) {
      throw new Error('Provider not found');
    }

    return provider;
  }

  /**
   * List all providers with filtering options
   */
  static async listProviders(
    filters: {
      type?: string;
      isActive?: boolean;
      hasQuotaRemaining?: boolean;
    } = {}
  ) {
    const query: any = {};

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.hasQuotaRemaining) {
      query.$expr = { $lt: ['$usedToday', '$dailyQuota'] };
    }

    return await EmailProviderModel.find(query).select('-apiKey -apiSecret');
  }

  private static buildAdvancedProvider(payload: AdvancedProviderConfigPayload) {
    return {
      id: 'temp-test',
      type: payload.type,
      apiKey: payload.apiKey,
      apiSecret: payload.apiSecret,
      config: {
        endpoint: payload.endpoint,
        method: payload.method,
        headers: payload.headers,
        authentication: payload.authentication,
        payloadTemplate: payload.payloadTemplate,
        fieldMappings: payload.fieldMappings || {},
      },
    };
  }

  private static generateProviderId(): string {
    return `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static formatProviderName(type: string): string {
    const names: Record<string, string> = {
      brevo: 'Brevo (formerly Sendinblue)',
      sendgrid: 'SendGrid',
      mailjet: 'Mailjet',
      mailgun: 'Mailgun',
      postmark: 'Postmark',
      ses: 'Amazon SES',
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  private static getProviderDescription(type: string): string {
    const descriptions: Record<string, string> = {
      brevo: 'Popular email marketing platform with reliable delivery',
      sendgrid: 'Cloud-based email delivery service by Twilio',
      mailjet: 'Email service provider with real-time monitoring',
      mailgun: 'Email API service for developers',
      postmark: 'Fast and reliable transactional email service',
      ses: "Amazon's cloud-based email sending service",
    };
    return descriptions[type] || 'Custom email provider configuration';
  }
}
