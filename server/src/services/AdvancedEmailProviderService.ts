import mongoose from 'mongoose';
import Mustache from 'mustache';
import { EmailData } from '../types';

// Enhanced Email Provider Service with better template handling
export class AdvancedEmailProviderService {
  
  /**
   * Prepare the HTTP request payload for a specific provider
   * This version handles complex nested structures better
   */
  static prepareRequest(provider: any, emailData: EmailData) {
    const { config } = provider;
    
    // Transform email data to match provider-specific format
    const transformedData = this.transformEmailData(emailData, provider.type);
    
    // Process the payload template
    const payload = this.processTemplate(config.payloadTemplate, transformedData);
    
    // Prepare headers
    const headers = { ...config.headers };
    this.addAuthenticationHeaders(headers, provider, config.authentication);
    
    return {
      url: config.endpoint,
      method: config.method,
      headers,
      payload
    };
  }
  
  /**
   * Process template with custom logic for different data structures
   */
  private static processTemplate(template: any, data: any): any {
    if (typeof template === 'string') {
      return Mustache.render(template, data);
    }
    
    if (Array.isArray(template)) {
      return template.map(item => this.processTemplate(item, data));
    }
    
    if (template && typeof template === 'object') {
      const result: any = {};
      
      for (const [key, value] of Object.entries(template)) {
        // Handle special template keys
        if (key.startsWith('{{#') && key.endsWith('}}')) {
          // This is a conditional section
          const conditionKey = key.slice(3, -2);
          if (data[conditionKey]) {
            Object.assign(result, this.processTemplate(value, data));
          }
        } else if (key.includes('{{') && key.includes('}}')) {
          // This is a templated key
          const processedKey = Mustache.render(key, data);
          result[processedKey] = this.processTemplate(value, data);
        } else {
          result[key] = this.processTemplate(value, data);
        }
      }
      
      return result;
    }
    
    return template;
  }
  
  /**
   * Transform email data to provider-specific format
   */
  private static transformEmailData(emailData: EmailData, providerType: string): any {
    const baseData = { ...emailData };
    
    switch (providerType) {
      case 'brevo':
        return this.transformForBrevo(baseData);
      case 'sendgrid':
        return this.transformForSendGrid(baseData);
      case 'mailjet':
        return this.transformForMailjet(baseData);
      default:
        return baseData;
    }
  }
  
  private static transformForBrevo(data: EmailData) {
    return {
      ...data,
      // Transform recipients for Brevo's messageVersions structure
      messageVersions: [
        {
          to: data.recipients,
          ...(data.cc && { cc: data.cc }),
          ...(data.bcc && { bcc: data.bcc })
        }
      ]
    };
  }
  
  private static transformForSendGrid(data: EmailData) {
    return {
      ...data,
      // Transform for SendGrid's personalizations structure
      personalizations: {
        to: data.recipients,
        ...(data.cc && { cc: data.cc }),
        ...(data.bcc && { bcc: data.bcc })
      },
      // Transform content array
      content: [
        ...(data.htmlContent ? [{
          type: 'text/html',
          value: data.htmlContent
        }] : []),
        ...(data.textContent ? [{
          type: 'text/plain',
          value: data.textContent
        }] : [])
      ]
    };
  }
  
  private static transformForMailjet(data: EmailData) {
    return {
      ...data,
      // Transform for Mailjet's Messages structure
      Messages: [
        {
          From: data.sender,
          To: data.recipients,
          ...(data.cc && { Cc: data.cc }),
          ...(data.bcc && { Bcc: data.bcc }),
          Subject: data.subject,
          ...(data.textContent && { TextPart: data.textContent }),
          ...(data.htmlContent && { HTMLPart: data.htmlContent })
        }
      ]
    };
  }
  
  private static addAuthenticationHeaders(
    headers: Record<string, string>, 
    provider: any, 
    authConfig: any
  ) {
    switch (authConfig.type) {
      case 'api-key':
        const headerName = authConfig.headerName || 'api-key';
        const prefix = authConfig.prefix || '';
        headers[headerName] = `${prefix}${provider.apiKey}`;
        break;
        
      case 'bearer':
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
        break;
        
      case 'basic':
        if (provider.apiSecret) {
          const credentials = Buffer.from(`${provider.apiKey}:${provider.apiSecret}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
        
      case 'custom':
        if (authConfig.customHeaders) {
          Object.entries(authConfig.customHeaders).forEach(([key, value]) => {
            headers[key] = Mustache.render(value as string, { 
              apiKey: provider.apiKey, 
              apiSecret: provider.apiSecret 
            });
          });
        }
        break;
    }
  }
}

// Simplified provider configurations using the transformation approach
export const SIMPLIFIED_PROVIDER_CONFIGS = {
  brevo: {
    id: 'brevo-001',
    name: 'Brevo Primary',
    type: 'brevo',
    dailyQuota: 10000,
    config: {
      endpoint: 'https://api.brevo.com/v3/smtp/email',
      method: 'POST' as const,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      authentication: {
        type: 'api-key' as const,
        headerName: 'api-key'
      },
      payloadTemplate: {
        sender: '{{sender}}',
        subject: '{{subject}}',
        htmlContent: '{{htmlContent}}',
        messageVersions: '{{messageVersions}}'
      }
    }
  },
  
  sendgrid: {
    id: 'sendgrid-001',
    name: 'SendGrid Primary',
    type: 'sendgrid',
    dailyQuota: 15000,
    config: {
      endpoint: 'https://api.sendgrid.com/v3/mail/send',
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json'
      },
      authentication: {
        type: 'bearer' as const
      },
      payloadTemplate: {
        personalizations: ['{{personalizations}}'],
        from: '{{sender}}',
        subject: '{{subject}}',
        content: '{{content}}'
      }
    }
  },
  
  mailjet: {
    id: 'mailjet-001',
    name: 'Mailjet Primary',
    type: 'mailjet',
    dailyQuota: 8000,
    config: {
      endpoint: 'https://api.mailjet.com/v3.1/send',
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json'
      },
      authentication: {
        type: 'basic' as const
      },
      payloadTemplate: '{{Messages}}'
    }
  }
};

// Usage example with the simplified approach
export async function sendEmailWithAdvancedService() {
  const emailData: EmailData = {
    sender: {
      email: 'sender@example.com',
      name: 'John Doe'
    },
    recipients: [
      { email: 'recipient1@example.com', name: 'Alice' },
      { email: 'recipient2@example.com', name: 'Bob' }
    ],
    cc: [
      { email: 'cc@example.com', name: 'Manager' }
    ],
    subject: 'Test Email',
    htmlContent: '<h1>Hello World</h1><p>This is a test email.</p>',
    textContent: 'Hello World\n\nThis is a test email.'
  };

  // Get provider (simplified for example)
  const provider = SIMPLIFIED_PROVIDER_CONFIGS.sendgrid;
  
  // Prepare the request
  const request = AdvancedEmailProviderService.prepareRequest(provider, emailData);
  
  console.log('Generated request:', JSON.stringify(request, null, 2));
  
  // The request will be properly formatted for the specific provider
} 
