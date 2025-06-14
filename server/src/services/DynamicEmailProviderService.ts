import mongoose from 'mongoose';
import Mustache from 'mustache';
import { EmailProviderModel, EmailProviderDocument } from '../models/EmailProvider';
import { EmailData, EmailProviderConfig } from '../types';

// Service class for handling email provider operations
export class DynamicEmailProviderService {
  
  /**
   * Prepare the HTTP request payload for a specific provider
   */
  static prepareRequest(provider: EmailProviderDocument, emailData: EmailData) {
    const { config } = provider;
    
    // Prepare template variables
    const templateData = this.mapEmailDataToTemplate(emailData, config.fieldMappings);
    
    // Render the payload template using Mustache
    const payloadString = JSON.stringify(config.payloadTemplate);
    const renderedPayload = Mustache.render(payloadString, templateData);
    const payload = JSON.parse(renderedPayload);
    
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
   * Map email data to template variables based on field mappings
   */
  private static mapEmailDataToTemplate(emailData: EmailData, mappings: any) {
    const templateData: any = {};
    
    // Map sender
    if (mappings.sender) {
      templateData.sender = emailData.sender;
    }
    
    // Map recipients
    if (mappings.recipients) {
      templateData.recipients = emailData.recipients;
    }
    
    // Map other fields
    templateData.subject = emailData.subject;
    templateData.htmlContent = emailData.htmlContent;
    templateData.textContent = emailData.textContent;
    
    if (emailData.cc && mappings.cc) {
      templateData.cc = emailData.cc;
    }
    
    if (emailData.bcc && mappings.bcc) {
      templateData.bcc = emailData.bcc;
    }
    
    if (emailData.attachments && mappings.attachments) {
      templateData.attachments = emailData.attachments;
    }
    
    return templateData;
  }
  
  /**
   * Add authentication headers based on provider configuration
   */
  private static addAuthenticationHeaders(
    headers: Record<string, string>, 
    provider: EmailProviderDocument, 
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
  
  /**
   * Get an active provider with available quota
   */
  static async getAvailableProvider(type?: string) {
    const query: any = {
      isActive: true,
      $expr: { $lt: ['$usedToday', '$dailyQuota'] }
    };
    
    if (type) {
      query.type = type;
    }
    
    return await EmailProviderModel.findOne(query);
  }
  
  /**
   * Update usage count after sending email
   */
  static async updateUsageCount(providerId: string) {
    await EmailProviderModel.updateOne(
      { id: providerId },
      { $inc: { usedToday: 1 } }
    );
  }
} 
