# Dynamic Email Provider System - Technical Implementation

## Overview

The Dynamic Email Provider System allows configuring and using email service providers without code changes. This document provides technical details about the implementation.

## Core Components

### 1. Models

- **EmailProviderModel**: Enhanced MongoDB schema that supports flexible configurations:

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
    endpoint: { type: String },
    method: { type: String, enum: ['POST', 'PUT', 'PATCH'], default: 'POST' },
    headers: { type: Schema.Types.Mixed, default: {} },
    authentication: {
      type: { type: String, enum: ['api-key', 'bearer', 'basic', 'custom'] },
      headerName: { type: String },
      prefix: { type: String },
      customHeaders: { type: Schema.Types.Mixed }
    },
    payloadTemplate: { type: Schema.Types.Mixed },
    fieldMappings: {
      sender: { type: String },
      recipients: { type: String },
      subject: { type: String },
      htmlContent: { type: String },
      textContent: { type: String },
      cc: { type: String },
      bcc: { type: String },
      attachments: { type: String }
    },
    responseMapping: {
      successField: { type: String },
      messageIdField: { type: String },
      errorField: { type: String }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 2. Services

#### DynamicEmailProviderService

Basic service for handling dynamic providers:

```typescript
export class DynamicEmailProviderService {
  static async createProvider(providerData: any): Promise<any> {
    // Implementation for creating providers
  }
  
  static async updateProvider(providerId: string, updateData: any): Promise<any> {
    // Implementation for updating providers
  }
  
  static async testProvider(providerConfig: any): Promise<any> {
    // Implementation for testing provider configurations
  }
  
  static async getAvailableProvider(type?: string) {
    // Get an active provider with available quota
  }
  
  static async updateUsageCount(providerId: string) {
    // Update usage count after sending email
  }
}
```

#### AdvancedEmailProviderService

Advanced service with complex template processing:

```typescript
export class AdvancedEmailProviderService {
  // Methods for handling advanced provider configurations
  // and template-based payload generation
}
```

#### ProviderConfigurationService

Service for managing provider configurations:

```typescript
export class ProviderConfigurationService {
  static getProviderPresets(): Record<string, any> {
    // Return preset configurations for popular providers
  }
  
  static createSimpleProviderConfig(payload: SimpleProviderConfigPayload): any {
    // Create provider configuration from simple payload
  }
  
  static createAdvancedProviderConfig(payload: AdvancedProviderConfigPayload): any {
    // Create provider configuration from advanced payload
  }
}
```

### 3. Routes

Dynamic provider API routes:

```typescript
// Dynamic provider routes
export default async function(fastify: FastifyInstance) {
  // Get provider presets
  fastify.get('/presets', async (request, reply) => {
    // Implementation
  });
  
  // Create simple provider
  fastify.post('/simple', async (request, reply) => {
    // Implementation
  });
  
  // Create advanced provider
  fastify.post('/advanced', async (request, reply) => {
    // Implementation
  });
  
  // Test provider configuration
  fastify.post('/test', async (request, reply) => {
    // Implementation
  });
  
  // List providers
  fastify.get('/', async (request, reply) => {
    // Implementation
  });
  
  // Get provider by ID
  fastify.get('/:providerId', async (request, reply) => {
    // Implementation
  });
  
  // Update provider
  fastify.put('/:providerId', async (request, reply) => {
    // Implementation
  });
  
  // Delete provider
  fastify.delete('/:providerId', async (request, reply) => {
    // Implementation
  });
  
  // Bulk operations
  fastify.post('/bulk', async (request, reply) => {
    // Implementation
  });
}
```

## Provider Configuration System

### 1. Provider Presets

The system includes preset configurations for popular email providers:

```typescript
static getProviderPresets(): Record<string, any> {
  return {
    brevo: {
      endpoint: 'https://api.brevo.com/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      authentication: {
        type: 'api-key',
        headerName: 'api-key'
      },
      payloadTemplate: {
        sender: {
          name: '{{sender.name}}',
          email: '{{sender.email}}'
        },
        to: [
          {
            email: '{{recipients.0.email}}',
            name: '{{recipients.0.name}}'
          }
        ],
        subject: '{{subject}}',
        htmlContent: '{{htmlContent}}',
        textContent: '{{textContent}}'
      },
      fieldMappings: {
        sender: 'sender',
        recipients: 'to',
        subject: 'subject',
        htmlContent: 'htmlContent',
        textContent: 'textContent'
      },
      responseMapping: {
        messageIdField: 'messageId'
      }
    },
    // Other provider presets...
  };
}
```

### 2. Simple Provider Creation

Creating a provider with minimal configuration:

```typescript
static createSimpleProviderConfig(payload: SimpleProviderConfigPayload): any {
  // Get preset for the provider type
  const presets = this.getProviderPresets();
  const preset = presets[payload.type];
  
  if (!preset) {
    throw new Error(`Unsupported provider type: ${payload.type}`);
  }
  
  // Create provider ID
  const providerId = this.generateProviderId();
  
  // Create provider configuration
  return {
    id: providerId,
    name: payload.name || this.formatProviderName(payload.type),
    type: payload.type,
    description: this.getProviderDescription(payload.type),
    dailyQuota: payload.dailyQuota || 100,
    usedToday: 0,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    lastResetDate: new Date(),
    apiKey: payload.apiKey,
    apiSecret: payload.apiSecret,
    config: {
      endpoint: payload.customEndpoint || preset.endpoint,
      method: preset.method,
      headers: {
        ...preset.headers,
        ...(payload.customHeaders || {})
      },
      authentication: preset.authentication,
      payloadTemplate: preset.payloadTemplate,
      fieldMappings: preset.fieldMappings,
      responseMapping: preset.responseMapping
    }
  };
}
```

### 3. Advanced Provider Creation

Creating a fully customized provider:

```typescript
static createAdvancedProviderConfig(payload: AdvancedProviderConfigPayload): any {
  // Create provider ID
  const providerId = this.generateProviderId();
  
  // Create provider configuration
  return {
    id: providerId,
    name: payload.name,
    type: payload.type,
    description: payload.description || 'Custom email provider configuration',
    dailyQuota: payload.dailyQuota || 100,
    usedToday: 0,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    lastResetDate: new Date(),
    apiKey: payload.apiKey,
    apiSecret: payload.apiSecret,
    config: {
      endpoint: payload.endpoint,
      method: payload.method,
      headers: payload.headers || {},
      authentication: payload.authentication,
      payloadTemplate: payload.payloadTemplate,
      fieldMappings: payload.fieldMappings || {},
      responseMapping: payload.responseMapping || {}
    }
  };
}
```

## Template Processing System

The system uses Mustache templating with provider-specific data transformations:

```typescript
async generatePayload(provider: EmailProvider, emailData: EmailData): Promise<any> {
  try {
    // Get the template
    const template = provider.config.payloadTemplate;
    
    // Convert template to string if it's an object
    const templateStr = typeof template === 'string' 
      ? template 
      : JSON.stringify(template);
    
    // Apply provider-specific transformations
    const transformedData = this.applyProviderTransformations(provider.type, emailData);
    
    // Render the template with Mustache
    const renderedTemplate = Mustache.render(templateStr, transformedData);
    
    // Parse the rendered template back to an object
    return JSON.parse(renderedTemplate);
  } catch (error) {
    console.error('Error generating provider payload:', error);
    throw new Error(`Failed to generate payload for provider ${provider.name}: ${error.message}`);
  }
}
```

### Provider-Specific Transformations

The system includes built-in transformations for popular providers:

```typescript
private applyProviderTransformations(providerType: string, emailData: EmailData): any {
  switch (providerType) {
    case 'brevo':
      return this.transformForBrevo(emailData);
    case 'sendgrid':
      return this.transformForSendGrid(emailData);
    case 'mailjet':
      return this.transformForMailjet(emailData);
    default:
      return emailData;
  }
}

private transformForBrevo(emailData: EmailData): any {
  // Brevo-specific transformations
  // ...
}

private transformForSendGrid(emailData: EmailData): any {
  // SendGrid-specific transformations
  // ...
}

private transformForMailjet(emailData: EmailData): any {
  // Mailjet-specific transformations
  // ...
}
```

## Email Sending Flow

### 1. Provider Selection

```typescript
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
```

### 2. Email Sending

```typescript
async sendEmail(provider: EmailProvider, emailData: EmailSendRequest): Promise<ProviderResponse> {
  try {
    // Convert EmailSendRequest to EmailData
    const data: EmailData = {
      sender: {
        email: emailData.fromEmail || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
        name: emailData.fromName || process.env.DEFAULT_FROM_NAME || 'Email Service'
      },
      recipients: [
        {
          email: emailData.to,
          name: emailData.toName || emailData.to.split('@')[0]
        }
      ],
      subject: emailData.subject,
      htmlContent: emailData.htmlContent,
      textContent: emailData.textContent
    };
    
    // Generate provider-specific payload
    const payload = await this.advancedProviderService.generatePayload(provider, data);
    
    // Prepare authentication
    const headers = await this.prepareAuthHeaders(provider);
    
    // Send the request
    const response = await axios({
      method: provider.config.method,
      url: provider.config.endpoint,
      headers: {
        ...provider.config.headers,
        ...headers
      },
      data: payload
    });
    
    // Process response
    return this.processResponse(provider, response);
  } catch (error) {
    // Handle error
    return {
      success: false,
      error: this.extractErrorMessage(error)
    };
  }
}
```

### 3. Authentication Handling

```typescript
private async prepareAuthHeaders(provider: EmailProvider): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const auth = provider.config.authentication;
  
  if (!auth) return headers;
  
  switch (auth.type) {
    case 'api-key':
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
      if (auth.customHeaders) {
        Object.entries(auth.customHeaders).forEach(([key, value]) => {
          // Replace {{apiKey}} and {{apiSecret}} placeholders
          const processedValue = String(value)
            .replace('{{apiKey}}', provider.apiKey)
            .replace('{{apiSecret}}', provider.apiSecret || '');
          headers[key] = processedValue;
        });
      }
      break;
  }
  
  return headers;
}
```

## Testing System

The system includes a comprehensive testing mechanism:

```typescript
static async testProvider(providerConfig: any): Promise<any> {
  try {
    // Create a temporary provider object
    const tempProvider = {
      ...providerConfig,
      config: providerConfig.config || {}
    };
    
    // Generate a test payload
    const testEmailData: EmailData = {
      sender: {
        email: 'test@example.com',
        name: 'Test Sender'
      },
      recipients: [
        {
          email: 'recipient@example.com',
          name: 'Test Recipient'
        }
      ],
      subject: 'Test Email',
      htmlContent: '<p>This is a test email.</p>',
      textContent: 'This is a test email.'
    };
    
    // Generate payload without sending
    const advancedService = new AdvancedEmailProviderService();
    const generatedPayload = await advancedService.generatePayload(tempProvider, testEmailData);
    
    return {
      success: true,
      message: 'Configuration is valid',
      generatedPayload
    };
  } catch (error) {
    return {
      success: false,
      message: `Configuration error: ${error.message}`
    };
  }
}
```

## API Usage Examples

### 1. Create Simple Provider

```javascript
const axios = require('axios');

const brevoProvider = {
  name: 'Production Brevo',
  type: 'brevo',
  apiKey: process.env.BREVO_API_KEY,
  dailyQuota: 5000,
  isActive: true
};

const response = await axios.post('http://localhost:3001/api/dynamic-provider/simple', brevoProvider);
console.log('Provider created:', response.data.data.id);
```

### 2. Create Advanced Provider

```javascript
const customProvider = {
  name: 'Internal Email Service',
  type: 'custom',
  apiKey: process.env.INTERNAL_API_KEY,
  dailyQuota: 1000,
  isActive: true,
  endpoint: 'https://internal-email.company.com/api/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  authentication: {
    type: 'custom',
    customHeaders: {
      'X-Service-Token': '{{apiKey}}',
      'X-Service-Version': 'v2'
    }
  },
  payloadTemplate: {
    message: {
      sender: '{{sender}}',
      recipients: '{{recipients}}',
      content: {
        subject: '{{subject}}',
        body: '{{htmlContent}}',
        format: 'html'
      },
      metadata: {
        source: 'dynamic-provider',
        timestamp: '{{timestamp}}'
      }
    }
  }
};

const response = await axios.post('http://localhost:3001/api/dynamic-provider/advanced', customProvider);
```

### 3. Test Configuration

```javascript
// Test configuration before saving
const testResult = await axios.post('http://localhost:3001/api/dynamic-provider/test', {
  name: 'Test Config',
  type: 'sendgrid',
  apiKey: 'SG.test-key',
  dailyQuota: 100,
  isActive: true
});

if (testResult.data.data.success) {
  console.log('Configuration is valid!');
  console.log('Generated payload:', testResult.data.data.generatedPayload);
} else {
  console.error('Configuration error:', testResult.data.data.message);
}
```

## Current Limitations

1. **Limited Error Handling**: Provider-specific error codes are not fully mapped
2. **No Webhook Integration**: Webhook handling for delivery status updates is not implemented
3. **Limited Validation**: Payload templates are not validated for correctness
4. **No Rate Limiting**: Provider-specific rate limiting is not implemented
5. **No Retry Logic**: Failed requests are not automatically retried

## Future Enhancements

1. **Webhook Integration**: Process delivery confirmations dynamically
2. **A/B Testing**: Split traffic between providers for testing
3. **Machine Learning**: Automatic provider selection based on performance
4. **Template Marketplace**: Share and reuse provider configurations
5. **Real-time Monitoring**: Live provider status and performance dashboards