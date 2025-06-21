import axios, { AxiosResponse } from 'axios';
import { EmailProvider, EmailSendRequest, ProviderResponse, ProviderConfig, EmailProviderConfig } from '../../types';
import { EmailProviderModel } from './EmailProvider';

export class EmailProviderService {
  
  /**
   * Send email using configured provider
   */
  async sendEmail(provider: EmailProvider, emailRequest: EmailSendRequest): Promise<ProviderResponse> {
    try {
      console.log(`📤 Sending email via ${provider.name} to ${emailRequest.to}`);
      
      // Build request based on provider configuration
      const requestConfig = this.buildRequestConfig(provider.config, emailRequest, provider.apiKey);
      
      // Make HTTP request
      const response: AxiosResponse = await axios(requestConfig);
      
      // Parse response based on provider configuration
      const providerResponse = this.parseResponse(provider.config, response);
      
      console.log(`✅ Email sent successfully via ${provider.name}: ${providerResponse.messageId}`);
      return providerResponse;
      
    } catch (error: any) {
      console.error(`❌ Email sending failed via ${provider.name}:`, error.message);
      
      return {
        success: false,
        error: this.extractErrorMessage(error),
        rawResponse: error.response?.data
      };
    }
  }

  /**
   * Build HTTP request configuration based on provider config
   */
  private buildRequestConfig(config: ProviderConfig | EmailProviderConfig, emailRequest: EmailSendRequest, apiKey: string): any {
    // Handle both old and new config formats
    if ('baseUrl' in config) {
      // Legacy ProviderConfig format
      return this.buildLegacyRequestConfig(config as ProviderConfig, emailRequest, apiKey);
    } else {
      // New EmailProviderConfig format - simplified version for compatibility
      return this.buildDynamicRequestConfig(config as EmailProviderConfig, emailRequest, apiKey);
    }
  }

  private buildLegacyRequestConfig(config: ProviderConfig, emailRequest: EmailSendRequest, apiKey: string): any {
    const url = config.baseUrl + config.endpoints.send;
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': config.requestFormat.contentType,
      'User-Agent': 'EmailDispatchService/1.0'
    };
    
    // Add authentication
    switch (config.authentication.type) {
      case 'api_key':
        if (config.authentication.headerName) {
          const prefix = config.authentication.headerPrefix || '';
          headers[config.authentication.headerName] = prefix + apiKey;
        }
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'basic':
        headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
        break;
    }
    
    // Build request body from template
    const requestBody = this.buildRequestBody(config.requestFormat.bodyTemplate, emailRequest);
    
    return {
      method: config.requestFormat.method,
      url,
      headers,
      data: requestBody,
      timeout: 30000, // 30 second timeout
      validateStatus: (status: number) => status < 500 // Don't throw on 4xx errors
    };
  }

  /**
   * Build request body by replacing placeholders in template
   */
  private buildRequestBody(template: string, emailRequest: EmailSendRequest): any {
    let bodyString = template;
    
    // Replace placeholders with actual values
    const replacements: Record<string, any> = {
      '{{to}}': emailRequest.to,
      '{{toName}}': emailRequest.toName || emailRequest.to.split('@')[0], // Use part before @ as default name
      '{{subject}}': emailRequest.subject,
      '{{htmlContent}}': emailRequest.htmlContent,
      '{{textContent}}': emailRequest.textContent || '',
      '{{fromEmail}}': emailRequest.fromEmail || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
      '{{fromName}}': emailRequest.fromName || process.env.DEFAULT_FROM_NAME || 'Email Service',
      '{{metadata}}': JSON.stringify(emailRequest.metadata || {})
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      bodyString = bodyString.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    // Parse as JSON if content type is JSON
    try {
      return JSON.parse(bodyString);
    } catch {
      return bodyString; // Return as string for form data
    }
  }

  private buildDynamicRequestConfig(config: EmailProviderConfig, emailRequest: EmailSendRequest, apiKey: string): any {
    // Simple implementation for basic compatibility
    return {
      method: config.method,
      url: config.endpoint,
      headers: config.headers,
      data: {
        from: emailRequest.fromEmail || 'noreply@example.com',
        to: emailRequest.to,
        subject: emailRequest.subject,
        html: emailRequest.htmlContent,
        text: emailRequest.textContent
      },
      timeout: 30000,
      validateStatus: (status: number) => status < 500
    };
  }

  /**
   * Parse provider response based on configuration
   */
  private parseResponse(config: ProviderConfig | EmailProviderConfig, response: AxiosResponse): ProviderResponse {
    // Handle both old and new config formats
    if ('responseFormat' in config) {
      // Legacy ProviderConfig format
      return this.parseLegacyResponse(config as ProviderConfig, response);
    } else {
      // New EmailProviderConfig format
      return this.parseDynamicResponse(config as EmailProviderConfig, response);
    }
  }

  private parseLegacyResponse(config: ProviderConfig, response: AxiosResponse): ProviderResponse {
    const data = response.data;
    
    // Check if request was successful
    const isSuccess = response.status >= 200 && response.status < 300;
    
    // Extract success status if configured
    let success = isSuccess;
    if (config.responseFormat.successField) {
      success = this.getNestedValue(data, config.responseFormat.successField) === true;
    }
    
    // Extract message ID if configured
    let messageId: string | undefined;
    if (config.responseFormat.messageIdField) {
      messageId = this.getNestedValue(data, config.responseFormat.messageIdField);
    }
    
    // Extract error message if configured
    let error: string | undefined;
    if (!success && config.responseFormat.errorField) {
      error = this.getNestedValue(data, config.responseFormat.errorField);
    }
    
    return {
      success,
      messageId,
      error: error || (success ? undefined : 'Unknown error'),
      rawResponse: data
    };
  }

  private parseDynamicResponse(config: EmailProviderConfig, response: AxiosResponse): ProviderResponse {
    // Simple implementation - more sophisticated parsing can be added based on responseMapping
    const success = response.status >= 200 && response.status < 300;
    const messageId = response.data?.id || response.data?.messageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success,
      messageId,
      statusCode: response.status,
      rawResponse: response.data
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extract error message from axios error
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  /**
   * Get all active providers sorted by usage
   */
  async getAvailableProviders(): Promise<EmailProvider[]> {
    return await EmailProviderModel.find({
      isActive: true,
      $expr: { $lt: ['$usedToday', '$dailyQuota'] }
    }).sort({ usedToday: 1 });
  }

  /**
   * Update provider usage after successful send
   */
  async incrementProviderUsage(providerId: string): Promise<void> {
    await EmailProviderModel.updateOne(
      { id: providerId },
      { $inc: { usedToday: 1 } }
    );
  }

  /**
   * Test provider configuration
   */
  async testProvider(provider: EmailProvider): Promise<ProviderResponse> {
    const testEmail: EmailSendRequest = {
      to: 'test@example.com',
      subject: 'Test Email - Configuration Check',
      htmlContent: '<p>This is a test email to verify provider configuration.</p>',
      textContent: 'This is a test email to verify provider configuration.'
    };
    
    return await this.sendEmail(provider, testEmail);
  }
}

export const emailProviderService = new EmailProviderService(); 
