import { EmailProviderModel } from '../models/EmailProvider';
import { 
  SimpleProviderConfigPayload, 
  AdvancedProviderConfigPayload, 
  EmailProviderConfig,
  EmailData 
} from '../types';
import { AdvancedEmailProviderService } from './AdvancedEmailProviderService';
import { v4 as uuidv4 } from 'uuid';

// Preset configurations that UI can select from
const PROVIDER_PRESETS: Record<string, Partial<EmailProviderConfig>> = {
  brevo: {
    endpoint: 'https://api.brevo.com/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    authentication: {
      type: 'api-key',
      headerName: 'api-key'
    },
    payloadTemplate: {
      sender: '{{sender}}',
      subject: '{{subject}}',
      htmlContent: '{{htmlContent}}',
      messageVersions: '{{messageVersions}}'
    },
    fieldMappings: {
      sender: 'sender',
      recipients: 'messageVersions[0].to',
      subject: 'subject',
      htmlContent: 'htmlContent',
      cc: 'messageVersions[0].cc'
    }
  },
  
  sendgrid: {
    endpoint: 'https://api.sendgrid.com/v3/mail/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    authentication: {
      type: 'bearer'
    },
    payloadTemplate: {
      personalizations: ['{{personalizations}}'],
      from: '{{sender}}',
      subject: '{{subject}}',
      content: '{{content}}'
    },
    fieldMappings: {
      sender: 'from',
      recipients: 'personalizations[0].to',
      subject: 'subject',
      htmlContent: 'content[0].value',
      cc: 'personalizations[0].cc'
    }
  },
  
  mailjet: {
    endpoint: 'https://api.mailjet.com/v3.1/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    authentication: {
      type: 'basic'
    },
    payloadTemplate: '{{Messages}}',
    fieldMappings: {
      sender: 'Messages[0].From',
      recipients: 'Messages[0].To',
      subject: 'Messages[0].Subject',
      htmlContent: 'Messages[0].HTMLPart',
      textContent: 'Messages[0].TextPart',
      cc: 'Messages[0].Cc'
    }
  },

  mailgun: {
    endpoint: 'https://api.mailgun.net/v3/YOUR_DOMAIN/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    authentication: {
      type: 'basic'
    },
    payloadTemplate: {
      from: '{{sender.name}} <{{sender.email}}>',
      to: '{{recipients.0.email}}',
      subject: '{{subject}}',
      html: '{{htmlContent}}',
      text: '{{textContent}}'
    },
    fieldMappings: {
      sender: 'from',
      recipients: 'to',
      subject: 'subject',
      htmlContent: 'html',
      textContent: 'text'
    }
  },

  postmark: {
    endpoint: 'https://api.postmarkapp.com/email',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    authentication: {
      type: 'api-key',
      headerName: 'X-Postmark-Server-Token'
    },
    payloadTemplate: {
      From: '{{sender.email}}',
      To: '{{recipients.0.email}}',
      Subject: '{{subject}}',
      HtmlBody: '{{htmlContent}}',
      TextBody: '{{textContent}}',
      MessageStream: 'outbound'
    },
    fieldMappings: {
      sender: 'From',
      recipients: 'To',
      subject: 'Subject',
      htmlContent: 'HtmlBody',
      textContent: 'TextBody'
    }
  }
};

export class ProviderConfigurationService {
  
  /**
   * Save simple provider configuration (most common use case)
   */
  static async saveSimpleProvider(payload: SimpleProviderConfigPayload) {
    // Get preset configuration
    const preset = PROVIDER_PRESETS[payload.type as keyof typeof PROVIDER_PRESETS];
    
    if (!preset && payload.type !== 'custom') {
      throw new Error(`Preset not found for provider type: ${payload.type}`);
    }
    
    // Build full configuration
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
        ...preset,
        // Override with custom values if provided
        ...(payload.customEndpoint && { endpoint: payload.customEndpoint }),
        headers: {
          ...preset?.headers,
          ...payload.customHeaders
        }
      } as EmailProviderConfig
    };
    
    // Save to database
    return await EmailProviderModel.create(fullConfig);
  }
  
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
        fieldMappings: payload.fieldMappings || {
          sender: 'sender',
          recipients: 'recipients',
          subject: 'subject',
          htmlContent: 'htmlContent'
        },
        responseMapping: {}
      }
    };
    
    return await EmailProviderModel.create(fullConfig);
  }
  
  /**
   * Get available provider types with their preset information
   */
  static getProviderPresets() {
    return Object.entries(PROVIDER_PRESETS).map(([type, config]) => ({
      type,
      name: this.formatProviderName(type),
      description: this.getProviderDescription(type),
      authType: config.authentication?.type,
      requiresSecret: config.authentication?.type === 'basic',
      endpoint: config.endpoint
    }));
  }
  
  /**
   * Test provider configuration before saving
   */
  static async testProviderConfiguration(payload: SimpleProviderConfigPayload | AdvancedProviderConfigPayload) {
    // Create temporary provider object
    const tempProvider = payload.type === 'custom' 
      ? await this.buildAdvancedProvider(payload as AdvancedProviderConfigPayload)
      : await this.buildSimpleProvider(payload as SimpleProviderConfigPayload);
    
    // Test email data
    const testEmailData: EmailData = {
      sender: { email: 'test@example.com', name: 'Test Sender' },
      recipients: [{ email: 'recipient@example.com', name: 'Test Recipient' }],
      subject: 'Test Configuration',
      htmlContent: '<p>This is a test email to validate the configuration.</p>'
    };
    
    try {
      // Prepare request without sending
      const request = AdvancedEmailProviderService.prepareRequest(tempProvider, testEmailData);
      
      return {
        success: true,
        message: 'Configuration is valid',
        generatedPayload: request.payload,
        headers: request.headers
      };
    } catch (error) {
      return {
        success: false,
        message: `Configuration error: ${(error as Error).message}`,
        error: error
      };
    }
  }
  
  /**
   * Update existing provider configuration
   */
  static async updateProvider(providerId: string, updates: Partial<SimpleProviderConfigPayload>) {
    const provider = await EmailProviderModel.findOne({ id: providerId });
    
    if (!provider) {
      throw new Error('Provider not found');
    }

    // Update basic fields
    if (updates.name) provider.name = updates.name;
    if (updates.dailyQuota !== undefined) provider.dailyQuota = updates.dailyQuota;
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
        ...updates.customHeaders
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
    const provider = await EmailProviderModel.findOne({ id: providerId }).select('-apiKey -apiSecret');
    
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    return provider;
  }

  /**
   * List all providers with filtering options
   */
  static async listProviders(filters: { 
    type?: string; 
    isActive?: boolean; 
    hasQuotaRemaining?: boolean;
  } = {}) {
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
  
  private static buildSimpleProvider(payload: SimpleProviderConfigPayload) {
    const preset = PROVIDER_PRESETS[payload.type as keyof typeof PROVIDER_PRESETS];
    return {
      id: 'temp-test',
      type: payload.type,
      apiKey: payload.apiKey,
      apiSecret: payload.apiSecret,
      config: {
        ...preset,
        ...(payload.customEndpoint && { endpoint: payload.customEndpoint }),
        headers: { ...preset?.headers, ...payload.customHeaders }
      }
    };
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
        fieldMappings: payload.fieldMappings || {}
      }
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
      ses: 'Amazon SES'
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
      ses: 'Amazon\'s cloud-based email sending service'
    };
    return descriptions[type] || 'Custom email provider configuration';
  }
} 
