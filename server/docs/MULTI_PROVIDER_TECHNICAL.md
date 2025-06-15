# Multi-Provider Email System - Technical Implementation

## Overview

The Multi-Provider Email System allows the application to send emails through multiple email service providers using a common interface. This document provides technical details about the implementation.

## Core Components

### 1. Models

- **EmailProviderModel**: MongoDB schema for storing provider configurations:

```typescript
const EmailProviderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['brevo', 'mailerlite', 'sendgrid', 'mailgun', 'postmark', 'mailjet', 'ses', 'custom']
  },
  apiKey: { type: String, required: true },
  apiSecret: { type: String },
  dailyQuota: { type: Number, required: true, default: 100 },
  usedToday: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastResetDate: { type: Date, default: Date.now },
  config: {
    // Provider-specific configuration
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 2. Services

#### EmailProviderService

Core service for handling email providers:

```typescript
export class EmailProviderService {
  private advancedProviderService: AdvancedEmailProviderService;
  
  constructor() {
    this.advancedProviderService = new AdvancedEmailProviderService();
  }
  
  async initializeProviders(): Promise<void> {
    // Initialize default providers if none exist
  }
  
  async startQuotaResetScheduler(): Promise<void> {
    // Reset provider quotas daily
  }
  
  async sendEmail(provider: EmailProvider, emailRequest: EmailSendRequest): Promise<ProviderResponse> {
    // Send email through provider
  }
  
  async getAvailableProviders(): Promise<EmailProvider[]> {
    // Get all active providers with available quota
  }
  
  async incrementProviderUsage(providerId: string): Promise<void> {
    // Update provider usage after successful send
  }
  
  async testProvider(provider: EmailProvider): Promise<ProviderResponse> {
    // Test provider configuration
  }
}
```

#### ProviderService

Service for managing provider initialization and quota reset:

```typescript
export class ProviderService {
  async initializeProviders(): Promise<void> {
    try {
      // Check if providers exist
      const providerCount = await EmailProviderModel.countDocuments();
      
      if (providerCount === 0) {
        console.log('🔧 No email providers found. Creating default providers...');
        
        // Create default providers
        await this.createDefaultProviders();
        
        console.log('✅ Default email providers created');
      } else {
        console.log(`✅ Found ${providerCount} existing email providers`);
      }
    } catch (error) {
      console.error('❌ Error initializing providers:', error);
      throw error;
    }
  }
  
  private async createDefaultProviders(): Promise<void> {
    // Create default providers based on environment variables
  }
  
  async startQuotaResetScheduler(): Promise<void> {
    // Reset provider quotas daily
  }
}
```

### 3. Provider Configuration

Provider-specific configurations are stored in `src/config/providers.ts`:

```typescript
export const providerConfigs: Record<string, ProviderConfig> = {
  brevo: {
    baseUrl: 'https://api.brevo.com/v3',
    endpoints: {
      send: '/smtp/email'
    },
    authentication: {
      type: 'api_key',
      headerName: 'api-key'
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: `{
        "sender": {
          "name": "{{fromName}}",
          "email": "{{fromEmail}}"
        },
        "to": [{
          "email": "{{to}}",
          "name": "{{toName}}"
        }],
        "subject": "{{subject}}",
        "htmlContent": "{{htmlContent}}",
        "textContent": "{{textContent}}"
      }`
    },
    responseFormat: {
      messageIdField: 'messageId'
    }
  },
  // Other provider configurations...
};
```

## Email Sending Flow

### 1. Provider Selection

The system selects the best available provider based on quota usage:

```typescript
async getAvailableProviders(): Promise<EmailProvider[]> {
  return await EmailProviderModel.find({
    isActive: true,
    $expr: { $lt: ['$usedToday', '$dailyQuota'] }
  }).sort({ usedToday: 1 });
}
```

### 2. Email Request Standardization

All email requests use a common format:

```typescript
export interface EmailSendRequest {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
  metadata?: Record<string, any>;
}
```

### 3. Provider-Specific Formatting

The system formats the request according to each provider's requirements:

```typescript
async sendEmail(provider: EmailProvider, emailRequest: EmailSendRequest): Promise<ProviderResponse> {
  try {
    // Use the advanced provider service for dynamic providers
    if (provider.config) {
      return await this.advancedProviderService.sendEmail(provider, emailRequest);
    }
    
    // Legacy provider handling
    const config = providerConfigs[provider.type];
    if (!config) {
      throw new Error(`Unsupported provider type: ${provider.type}`);
    }
    
    // Format request based on provider configuration
    const requestBody = this.formatRequestBody(config, emailRequest);
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': config.requestFormat.contentType
    };
    
    // Add authentication
    this.addAuthentication(headers, config, provider);
    
    // Send request
    const response = await axios({
      method: config.requestFormat.method,
      url: `${config.baseUrl}${config.endpoints.send}`,
      headers,
      data: requestBody
    });
    
    // Process response
    return this.processResponse(config, response);
  } catch (error) {
    // Handle error
    return {
      success: false,
      error: this.extractErrorMessage(error)
    };
  }
}
```

### 4. Template-Based Formatting

The system uses template strings to format requests:

```typescript
private formatRequestBody(config: ProviderConfig, request: EmailSendRequest): any {
  let template = config.requestFormat.bodyTemplate;
  
  // Replace variables in template
  const variables = {
    to: request.to,
    toName: request.toName || request.to.split('@')[0],
    subject: request.subject,
    htmlContent: request.htmlContent,
    textContent: request.textContent || request.htmlContent.replace(/<[^>]*>/g, ''),
    fromEmail: request.fromEmail || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
    fromName: request.fromName || process.env.DEFAULT_FROM_NAME || 'Email Service'
  };
  
  // Replace all variables in template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  });
  
  // Parse JSON template
  if (config.requestFormat.contentType === 'application/json') {
    return JSON.parse(template);
  }
  
  // Parse form data template
  if (config.requestFormat.contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams();
    const data = JSON.parse(template);
    Object.entries(data).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    return params;
  }
  
  return template;
}
```

### 5. Authentication Handling

The system supports multiple authentication methods:

```typescript
private addAuthentication(headers: Record<string, string>, config: ProviderConfig, provider: EmailProvider): void {
  const auth = config.authentication;
  
  if (!auth) return;
  
  switch (auth.type) {
    case 'api_key':
      headers[auth.headerName || 'X-API-Key'] = provider.apiKey;
      break;
    case 'bearer':
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
      break;
    case 'basic':
      const credentials = Buffer.from(`${provider.apiKey}:${provider.apiSecret || ''}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      break;
    case 'custom':
      if (auth.headerName) {
        headers[auth.headerName] = auth.headerPrefix 
          ? `${auth.headerPrefix} ${provider.apiKey}`
          : provider.apiKey;
      }
      break;
  }
}
```

### 6. Response Processing

The system processes provider responses consistently:

```typescript
private processResponse(config: ProviderConfig, response: AxiosResponse): ProviderResponse {
  const data = response.data;
  
  // Check for success field if specified
  if (config.responseFormat.successField) {
    const isSuccess = this.getNestedValue(data, config.responseFormat.successField);
    if (!isSuccess) {
      return {
        success: false,
        error: this.getNestedValue(data, config.responseFormat.errorField) || 'Unknown error',
        rawResponse: data
      };
    }
  }
  
  // Extract message ID if specified
  let messageId = undefined;
  if (config.responseFormat.messageIdField) {
    messageId = this.getNestedValue(data, config.responseFormat.messageIdField);
  }
  
  return {
    success: true,
    messageId,
    rawResponse: data
  };
}
```

## Provider Quota Management

### 1. Quota Tracking

The system tracks provider usage:

```typescript
async incrementProviderUsage(providerId: string): Promise<void> {
  await EmailProviderModel.updateOne(
    { id: providerId },
    { $inc: { usedToday: 1 } }
  );
}
```

### 2. Quota Reset

Quotas are reset daily:

```typescript
async startQuotaResetScheduler(): Promise<void> {
  try {
    console.log('🔄 Starting quota reset scheduler');
    
    // Run immediately to reset any quotas if needed
    await this.resetQuotasIfNeeded();
    
    // Schedule to run every hour
    setInterval(async () => {
      await this.resetQuotasIfNeeded();
    }, 60 * 60 * 1000); // Every hour
    
    console.log('✅ Quota reset scheduler started');
  } catch (error) {
    console.error('❌ Error starting quota reset scheduler:', error);
  }
}

private async resetQuotasIfNeeded(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find providers that need quota reset
    const providers = await EmailProviderModel.find({
      lastResetDate: { $lt: today }
    });
    
    if (providers.length > 0) {
      console.log(`🔄 Resetting quotas for ${providers.length} providers`);
      
      // Reset quotas
      await EmailProviderModel.updateMany(
        { lastResetDate: { $lt: today } },
        { 
          $set: { 
            usedToday: 0,
            lastResetDate: now
          }
        }
      );
      
      console.log('✅ Provider quotas reset successfully');
    }
  } catch (error) {
    console.error('❌ Error resetting provider quotas:', error);
  }
}
```

## Integration with Email Processing

The multi-provider system is integrated with the email processing flow:

```typescript
// In EmailProcessorService.processEmailTarget
// Find an available provider
const provider = await EmailProviderModel.findOne({
  isActive: true,
  $expr: { $lt: ['$usedToday', '$dailyQuota'] }
}).sort({ usedToday: 1 });

if (!provider) {
  throw new Error('No available email providers');
}

// Prepare email request
const emailRequest = {
  to: email,
  toName: email.split('@')[0], // Use part before @ as default name
  subject,
  htmlContent: body,
  textContent: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  fromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
  fromName: process.env.DEFAULT_FROM_NAME || 'Email Service',
  metadata: metadata || {}
};

// Send email using the provider service
const response = await emailProviderService.sendEmail(provider, emailRequest);

if (response.success) {
  // Update provider usage
  await emailProviderService.incrementProviderUsage(provider.id);
  console.log(`✅ Email sent successfully to ${email} via ${provider.name}: ${response.messageId}`);
} else {
  throw new Error(response.error || 'Email sending failed');
}
```

## Provider Testing

The system includes functionality to test provider configurations:

```typescript
async testProvider(provider: EmailProvider): Promise<ProviderResponse> {
  const testEmail: EmailSendRequest = {
    to: 'test@example.com',
    subject: 'Test Email - Configuration Check',
    htmlContent: '<p>This is a test email to verify provider configuration.</p>',
    textContent: 'This is a test email to verify provider configuration.'
  };
  
  return await this.sendEmail(provider, testEmail);
}
```

## Provider Initialization

The system initializes default providers on startup:

```typescript
private async createDefaultProviders(): Promise<void> {
  const providers = [];
  
  // Brevo provider
  if (process.env.BREVO_API_KEY) {
    providers.push({
      id: 'brevo',
      name: 'Brevo (formerly Sendinblue)',
      type: 'brevo',
      apiKey: process.env.BREVO_API_KEY,
      dailyQuota: parseInt(process.env.BREVO_DAILY_QUOTA || '300'),
      usedToday: 0,
      isActive: true,
      lastResetDate: new Date()
    });
  }
  
  // MailerLite provider
  if (process.env.MAILERLITE_API_KEY) {
    providers.push({
      id: 'mailerlite',
      name: 'MailerLite',
      type: 'mailerlite',
      apiKey: process.env.MAILERLITE_API_KEY,
      dailyQuota: parseInt(process.env.MAILERLITE_DAILY_QUOTA || '1000'),
      usedToday: 0,
      isActive: true,
      lastResetDate: new Date()
    });
  }
  
  // Create providers if any are configured
  if (providers.length > 0) {
    await EmailProviderModel.insertMany(providers);
  } else {
    console.log('⚠️ No provider API keys found in environment variables');
  }
}
```

## API Endpoints

### Provider Management

```typescript
// List all providers
fastify.get('/list', async (request, reply) => {
  try {
    const providers = await EmailProviderModel.find({}, {
      apiKey: 0, // Exclude API key from response
      apiSecret: 0 // Exclude API secret from response
    });
    
    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      dailyQuota: provider.dailyQuota,
      usedToday: provider.usedToday,
      remainingToday: provider.dailyQuota - provider.usedToday,
      usagePercentage: Math.round((provider.usedToday / provider.dailyQuota) * 100),
      isActive: provider.isActive
    }));
    
    return {
      success: true,
      data: formattedProviders
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Update provider status
fastify.patch('/:id/status', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { isActive } = request.body as { isActive: boolean };
    
    const provider = await EmailProviderModel.findOne({ id });
    if (!provider) {
      return {
        success: false,
        error: `Provider with ID ${id} not found`
      };
    }
    
    await EmailProviderModel.updateOne(
      { id },
      { isActive }
    );
    
    return {
      success: true,
      data: {
        id,
        isActive
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Reset provider quota
fastify.post('/:id/reset-quota', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    
    const provider = await EmailProviderModel.findOne({ id });
    if (!provider) {
      return {
        success: false,
        error: `Provider with ID ${id} not found`
      };
    }
    
    await EmailProviderModel.updateOne(
      { id },
      { 
        usedToday: 0,
        lastResetDate: new Date()
      }
    );
    
    return {
      success: true,
      data: {
        id,
        usedToday: 0,
        remainingToday: provider.dailyQuota
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
```

## Current Limitations

1. **Limited Provider Support**: Only a few providers are fully implemented
2. **No Webhook Integration**: Webhook handling for delivery status updates is not implemented
3. **Limited Error Handling**: Provider-specific error codes are not fully mapped
4. **No Rate Limiting**: Provider-specific rate limiting is not implemented
5. **No Retry Logic**: Failed requests are not automatically retried

## Future Enhancements

1. **Webhook Integration**: Process delivery confirmations from providers
2. **A/B Testing**: Split traffic between providers for testing
3. **Machine Learning**: Automatic provider selection based on performance
4. **Provider Analytics**: Track delivery rates and performance metrics
5. **Bulk Sending**: Optimize for large recipient lists