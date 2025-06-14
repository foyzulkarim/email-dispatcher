# Dynamic Email Provider Configuration

This documentation covers the new dynamic email provider functionality that allows you to configure email providers on-the-fly without code changes.

## Overview

The dynamic provider system allows you to:
- Configure popular email providers (Brevo, SendGrid, Mailjet, etc.) with simple configurations
- Create completely custom provider configurations for any email API
- Test configurations before saving them
- Manage provider quotas and status dynamically
- Use advanced templating with Mustache for complex payloads

## Architecture

### Core Components

1. **EmailProviderModel** - Enhanced MongoDB schema that supports flexible configurations
2. **DynamicEmailProviderService** - Basic service for handling dynamic providers
3. **AdvancedEmailProviderService** - Advanced service with complex template processing
4. **ProviderConfigurationService** - Service for managing provider configurations
5. **Dynamic Provider API Routes** - REST endpoints for managing providers

### Key Features

- **Preset Configurations**: Pre-built configurations for popular providers
- **Advanced Templating**: Mustache-based template processing with provider-specific transformations
- **Configuration Testing**: Validate configurations before saving
- **Flexible Authentication**: Support for API keys, Bearer tokens, Basic auth, and custom headers
- **Dynamic Payload Generation**: Generate provider-specific payloads from templates

## API Endpoints

### Base URL: `/api/dynamic-provider`

#### Create Simple Provider
```http
POST /simple
Content-Type: application/json

{
  "name": "My Brevo Provider",
  "type": "brevo",
  "apiKey": "xkeysib-your-api-key-here",
  "dailyQuota": 1000,
  "isActive": true,
  "customEndpoint": "https://api.brevo.com/v3/smtp/email", // optional
  "customHeaders": { // optional
    "X-Custom-Header": "value"
  }
}
```

#### Create Advanced Provider
```http
POST /advanced
Content-Type: application/json

{
  "name": "Custom Email API",
  "type": "custom",
  "apiKey": "your-api-key",
  "dailyQuota": 500,
  "isActive": true,
  "endpoint": "https://api.example.com/v1/send",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "authentication": {
    "type": "api-key",
    "headerName": "X-API-Key"
  },
  "payloadTemplate": {
    "from": "{{sender.email}}",
    "to": "{{recipients.0.email}}",
    "subject": "{{subject}}",
    "html": "{{htmlContent}}"
  },
  "fieldMappings": {
    "sender": "from",
    "recipients": "to",
    "subject": "subject",
    "htmlContent": "html"
  }
}
```

#### Test Configuration
```http
POST /test
Content-Type: application/json

{
  "name": "Test Provider",
  "type": "brevo",
  "apiKey": "test-key",
  "dailyQuota": 100,
  "isActive": true
}
```

#### Get Available Presets
```http
GET /presets
```

#### List Providers
```http
GET /
GET /?type=brevo
GET /?isActive=true
GET /?hasQuotaRemaining=true
```

#### Get Provider by ID
```http
GET /:providerId
```

#### Update Provider
```http
PUT /:providerId
Content-Type: application/json

{
  "dailyQuota": 2000,
  "isActive": false
}
```

#### Delete Provider
```http
DELETE /:providerId
```

#### Bulk Operations
```http
POST /bulk
Content-Type: application/json

{
  "action": "activate", // or "deactivate", "reset-quota"
  "providerIds": ["provider1", "provider2"]
}
```

## Provider Types and Presets

### Supported Provider Types

1. **Brevo (formerly Sendinblue)**
   - Endpoint: `https://api.brevo.com/v3/smtp/email`
   - Auth: API Key header (`api-key`)
   - Format: JSON

2. **SendGrid**
   - Endpoint: `https://api.sendgrid.com/v3/mail/send`
   - Auth: Bearer token
   - Format: JSON

3. **Mailjet**
   - Endpoint: `https://api.mailjet.com/v3.1/send`
   - Auth: Basic authentication (requires apiSecret)
   - Format: JSON

4. **Mailgun**
   - Endpoint: `https://api.mailgun.net/v3/YOUR_DOMAIN/messages`
   - Auth: Basic authentication
   - Format: Form data

5. **Postmark**
   - Endpoint: `https://api.postmarkapp.com/email`
   - Auth: Custom header (`X-Postmark-Server-Token`)
   - Format: JSON

6. **Custom**
   - Fully configurable endpoint, authentication, and payload structure

## Configuration Structure

### EmailProviderConfig Interface

```typescript
interface EmailProviderConfig {
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  payloadTemplate: Record<string, any>;
  authentication: {
    type: 'api-key' | 'bearer' | 'basic' | 'custom';
    headerName?: string;
    prefix?: string;
    customHeaders?: Record<string, string>;
  };
  fieldMappings: {
    sender: string;
    recipients: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: string;
    bcc?: string;
    attachments?: string;
  };
  responseMapping: {
    successField?: string;
    messageIdField?: string;
    errorField?: string;
  };
}
```

## Template System

The system uses Mustache templating with provider-specific data transformations.

### Available Template Variables

```typescript
interface EmailData {
  sender: {
    email: string;
    name?: string;
  };
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  cc?: Array<{
    email: string;
    name?: string;
  }>;
  bcc?: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    type: string;
  }>;
}
```

### Template Examples

#### Basic Template
```json
{
  "from": "{{sender.email}}",
  "to": "{{recipients.0.email}}",
  "subject": "{{subject}}",
  "html": "{{htmlContent}}"
}
```

#### Advanced Template with Loops
```json
{
  "from": "{{sender.email}}",
  "to": [
    {{#recipients}}
    {
      "email": "{{email}}",
      "name": "{{name}}"
    }{{^@last}},{{/@last}}
    {{/recipients}}
  ],
  "subject": "{{subject}}",
  "content": [
    {
      "type": "text/html",
      "value": "{{htmlContent}}"
    }
  ]
}
```

## Provider-Specific Transformations

The `AdvancedEmailProviderService` includes built-in transformations for popular providers:

### Brevo Transformation
- Wraps recipients in `messageVersions` array structure
- Handles CC/BCC within message versions

### SendGrid Transformation
- Creates `personalizations` structure
- Transforms content into array format with type specification

### Mailjet Transformation
- Wraps email data in `Messages` array
- Maps fields to Mailjet's specific naming convention

## Usage Examples

### Simple Provider Creation (JavaScript)

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

### Advanced Custom Provider

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

### Configuration Testing

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

## Error Handling

The system provides comprehensive error handling:

### Configuration Validation Errors
- Missing required fields
- Invalid provider types
- Malformed templates
- Authentication configuration issues

### Runtime Errors
- Provider not found
- Quota exceeded
- Template rendering errors
- HTTP request failures

### Example Error Response
```json
{
  "success": false,
  "error": "Configuration error: Invalid authentication type 'invalid-auth'",
  "details": {
    "field": "authentication.type",
    "allowedValues": ["api-key", "bearer", "basic", "custom"]
  }
}
```

## Best Practices

### Security
1. **Never expose API keys** in client-side code
2. **Use environment variables** for sensitive configuration
3. **Implement proper access controls** for provider management endpoints
4. **Regularly rotate API keys** and update provider configurations

### Performance
1. **Use provider quotas** to prevent overuse
2. **Monitor provider performance** and switch providers when needed
3. **Cache provider configurations** to reduce database lookups
4. **Implement circuit breakers** for failing providers

### Maintenance
1. **Test configurations** before deploying to production
2. **Keep provider presets updated** with latest API changes
3. **Monitor provider API changes** and update configurations accordingly
4. **Implement proper logging** for debugging provider issues

## Testing

Run the comprehensive test suite:

```bash
cd server
node test-dynamic-providers.js
```

This will test:
- Provider preset retrieval
- Simple provider creation
- Advanced provider creation
- Configuration testing
- Provider management operations
- Bulk operations
- Error handling scenarios

## Migration from Legacy Providers

To migrate from the legacy provider system:

1. **Export existing configurations** from the old system
2. **Create equivalent dynamic providers** using the new API
3. **Test configurations** thoroughly
4. **Update application code** to use the new provider selection logic
5. **Gradually phase out** legacy providers

## Monitoring and Analytics

The system provides built-in monitoring capabilities:

- **Quota tracking** - Monitor daily usage per provider
- **Success rates** - Track email delivery success rates
- **Performance metrics** - Monitor response times and failures
- **Provider rotation** - Automatic failover to backup providers

Access monitoring data via the dashboard API:
```http
GET /api/dashboard/provider-stats
GET /api/dashboard/provider-performance/:providerId
```

## Future Enhancements

Planned improvements include:

1. **Webhook handling** - Process delivery confirmations dynamically
2. **A/B testing** - Split traffic between providers for testing
3. **Machine learning** - Automatic provider selection based on performance
4. **Template marketplace** - Share and reuse provider configurations
5. **Real-time monitoring** - Live provider status and performance dashboards 
