# Email Provider Integration Guide

## 🎯 **HTTP-Based Provider System**

This system uses **HTTP requests** instead of SDKs, making it:
- ✅ **Configuration-driven** - Add providers without code changes
- ✅ **Provider-agnostic** - Works with any REST API email service
- ✅ **No dependencies** - No SDK conflicts or version issues
- ✅ **Flexible** - Easy to customize for any provider

## 🏗️ **Architecture Benefits**

### Why HTTP over SDKs?

| Aspect | HTTP/CURL Approach ✅ | SDK Approach ❌ |
|--------|---------------------|------------------|
| **New Providers** | Database configuration only | Code changes + SDK install |
| **Dependencies** | Just axios | Multiple provider SDKs |
| **Flexibility** | Full control over requests | Limited to SDK features |
| **Updates** | Configuration changes | SDK version updates |
| **Consistency** | Same interface for all providers | Different patterns per SDK |
| **Bundle Size** | Minimal impact | Grows with each SDK |

## 📦 **Pre-configured Providers**

The system comes with configurations for popular providers:

- **Brevo** (formerly Sendinblue)
- **SendGrid**
- **Mailgun**  
- **Postmark**
- **MailerLite**
- **AWS SES**
- **Custom** (template for any provider)

## 🚀 **Quick Start**

### 1. Configure Provider in Database

```bash
curl -X POST http://localhost:3001/api/provider/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-brevo",
    "name": "Brevo Production",
    "type": "brevo",
    "apiKey": "xkeysib-your-actual-api-key-here",
    "dailyQuota": 300,
    "isActive": true
  }'
```

### 2. Send Email Immediately

```bash
curl -X POST http://localhost:3001/api/email/submit \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email via Brevo",
    "body": "<h1>Hello from Brevo!</h1><p>This email was sent via HTTP API.</p>",
    "recipients": ["test@example.com"]
  }'
```

**That's it!** No code changes needed. ✨

## 📋 **Provider Configuration Examples**

### Brevo Configuration

```json
{
  "id": "brevo-prod",
  "name": "Brevo Production",
  "type": "brevo",
  "apiKey": "xkeysib-your-api-key",
  "dailyQuota": 300,
  "isActive": true,
  "config": {
    "baseUrl": "https://api.brevo.com/v3",
    "endpoints": {
      "send": "/smtp/email"
    },
    "authentication": {
      "type": "api_key",
      "headerName": "api-key"
    },
    "requestFormat": {
      "method": "POST",
      "contentType": "application/json",
      "bodyTemplate": "{\"sender\":{\"name\":\"{{fromName}}\",\"email\":\"{{fromEmail}}\"},\"to\":[{\"email\":\"{{to}}\"}],\"subject\":\"{{subject}}\",\"htmlContent\":\"{{htmlContent}}\",\"textContent\":\"{{textContent}}\"}"
    },
    "responseFormat": {
      "messageIdField": "messageId"
    }
  }
}
```

### SendGrid Configuration

```json
{
  "id": "sendgrid-prod",
  "name": "SendGrid Production", 
  "type": "sendgrid",
  "apiKey": "SG.your-sendgrid-api-key",
  "dailyQuota": 1000,
  "isActive": true,
  "config": {
    "baseUrl": "https://api.sendgrid.com/v3",
    "endpoints": {
      "send": "/mail/send"
    },
    "authentication": {
      "type": "bearer"
    },
    "requestFormat": {
      "method": "POST",
      "contentType": "application/json",
      "bodyTemplate": "{\"personalizations\":[{\"to\":[{\"email\":\"{{to}}\"}]}],\"from\":{\"email\":\"{{fromEmail}}\",\"name\":\"{{fromName}}\"},\"subject\":\"{{subject}}\",\"content\":[{\"type\":\"text/html\",\"value\":\"{{htmlContent}}\"},{\"type\":\"text/plain\",\"value\":\"{{textContent}}\"}]}"
    },
    "responseFormat": {
      "messageIdField": "x-message-id"
    }
  }
}
```

### Custom Provider Configuration

```json
{
  "id": "custom-smtp",
  "name": "Custom SMTP Service",
  "type": "custom",
  "apiKey": "your-custom-api-key",
  "dailyQuota": 500,
  "isActive": true,
  "config": {
    "baseUrl": "https://api.yourservice.com/v1",
    "endpoints": {
      "send": "/send-email"
    },
    "authentication": {
      "type": "api_key",
      "headerName": "X-API-Key"
    },
    "requestFormat": {
      "method": "POST",
      "contentType": "application/json",
      "bodyTemplate": "{\"from\":{\"email\":\"{{fromEmail}}\",\"name\":\"{{fromName}}\"},\"to\":\"{{to}}\",\"subject\":\"{{subject}}\",\"html\":\"{{htmlContent}}\",\"text\":\"{{textContent}}\"}"
    },
    "responseFormat": {
      "messageIdField": "message_id",
      "successField": "success",
      "errorField": "error"
    }
  }
}
```

## 🔧 **API Endpoints for Provider Management**

### Create Provider
```bash
POST /api/provider/create
```

### List Providers  
```bash
GET /api/provider/list
```

### Update Provider
```bash
PUT /api/provider/:providerId
```

### Test Provider Configuration
```bash
POST /api/provider/:providerId/test
```

### Toggle Provider Active/Inactive
```bash
POST /api/provider/toggle/:providerId
```

## 🎛️ **Configuration Fields Explained**

### Authentication Types

| Type | Description | Example |
|------|-------------|---------|
| `api_key` | API key in header | `X-API-Key: your-key` |
| `bearer` | Bearer token | `Authorization: Bearer token` |
| `basic` | Basic auth | `Authorization: Basic base64(user:pass)` |
| `custom` | Custom implementation | AWS SIG4, etc. |

### Request Format

- **method**: HTTP method (`POST`, `PUT`)
- **contentType**: Content type (`application/json`, `application/x-www-form-urlencoded`)
- **bodyTemplate**: Template with placeholders like `{{to}}`, `{{subject}}`

### Response Format

- **messageIdField**: Path to message ID in response (e.g., `data.messageId`)
- **successField**: Path to success boolean (e.g., `success`)
- **errorField**: Path to error message (e.g., `error.message`)

## 🔄 **How It Works**

### 1. Request Building
```typescript
// Template: {"to": "{{to}}", "subject": "{{subject}}"}
// Variables: {to: "user@example.com", subject: "Hello"}
// Result: {"to": "user@example.com", "subject": "Hello"}
```

### 2. Authentication
```typescript
// api_key: adds header "X-API-Key: your-key"
// bearer: adds header "Authorization: Bearer your-token"  
// basic: adds header "Authorization: Basic base64(key)"
```

### 3. Response Parsing
```typescript
// Response: {"messageId": "abc123", "status": "sent"}
// messageIdField: "messageId" -> extracts "abc123"
```

## 🔍 **Adding New Provider (No Code Changes!)**

### Step 1: Research Provider API
- Find API documentation
- Identify authentication method
- Note request/response format

### Step 2: Create Configuration
```json
{
  "baseUrl": "https://api.newprovider.com",
  "endpoints": {"send": "/send"},
  "authentication": {"type": "api_key", "headerName": "Authorization"},
  "requestFormat": {
    "method": "POST",
    "contentType": "application/json", 
    "bodyTemplate": "{\"to\":\"{{to}}\",\"subject\":\"{{subject}}\",\"body\":\"{{htmlContent}}\"}"
  },
  "responseFormat": {"messageIdField": "id"}
}
```

### Step 3: Add to Database
```bash
curl -X POST http://localhost:3001/api/provider/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "new-provider",
    "name": "New Provider",
    "type": "custom",
    "apiKey": "your-api-key",
    "dailyQuota": 1000,
    "isActive": true,
    "config": { /* your config here */ }
  }'
```

### Step 4: Test
```bash
curl -X POST http://localhost:3001/api/provider/new-provider/test
```

**Done!** No code deployment needed. 🎉

## 🔄 **Migration from SDKs**

If you're currently using SDKs:

### Before (SDK Approach)
```typescript
// Different code for each provider
import brevo from '@sendinblue/client-js';
import sgMail from '@sendgrid/mail';
import mailgun from 'mailgun-js';

// Provider-specific implementations
if (provider === 'brevo') {
  await brevo.send(brevoFormat);
} else if (provider === 'sendgrid') {
  await sgMail.send(sendgridFormat);
} else if (provider === 'mailgun') {
  await mailgun.messages().send(mailgunFormat);
}
```

### After (HTTP Approach)
```typescript
// Same code for all providers
const response = await emailProviderService.sendEmail(provider, {
  to: 'user@example.com',
  subject: 'Hello',
  htmlContent: '<p>Hello World!</p>'
});
```

## 🎯 **Real Production Example**

### Environment Setup
```bash
# .env file
BREVO_API_KEY=xkeysib-your-actual-brevo-key
SENDGRID_API_KEY=SG.your-actual-sendgrid-key
MAILGUN_API_KEY=your-actual-mailgun-key
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
DEFAULT_FROM_NAME=Your Company
```

### Provider Initialization
```bash
# Initialize providers on startup
curl -X POST http://localhost:3001/api/provider/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "brevo-primary",
    "name": "Brevo Primary",
    "type": "brevo", 
    "apiKey": "xkeysib-your-key",
    "dailyQuota": 300,
    "isActive": true
  }'

curl -X POST http://localhost:3001/api/provider/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sendgrid-fallback",
    "name": "SendGrid Fallback",
    "type": "sendgrid",
    "apiKey": "SG.your-key", 
    "dailyQuota": 1000,
    "isActive": true
  }'
```

### Send Production Email
```bash
curl -X POST http://localhost:3001/api/email/submit \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "welcome-template-id",
    "templateVariables": {
      "first_name": "John",
      "company_name": "Acme Corp",
      "dashboard_link": "https://app.acme.com/dashboard"
    },
    "recipients": ["john@example.com"],
    "metadata": {
      "campaign": "user-onboarding",
      "user_id": "12345"
    }
  }'
```

## 📊 **Monitoring & Observability**

The system automatically tracks:
- ✅ Provider usage and quotas
- ✅ Success/failure rates per provider
- ✅ Response times and message IDs
- ✅ Error messages and retry attempts

```bash
# Monitor provider performance
curl http://localhost:3001/api/dashboard/providers

# Response:
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "brevo-primary",
        "name": "Brevo Primary", 
        "usedToday": 45,
        "dailyQuota": 300,
        "successRate": 98.2,
        "avgResponseTime": 245
      }
    ]
  }
}
```

## 🏆 **Summary: Why This Approach Wins**

1. **⚡ Zero Code Changes**: Add providers via API calls
2. **🔧 Configuration-Driven**: Everything controllable via database
3. **🚀 Provider Agnostic**: Works with any REST API
4. **📦 Lightweight**: No SDK dependencies  
5. **🎛️ Full Control**: Custom timeouts, retries, logging
6. **🔄 Easy Switching**: Change providers without deployment
7. **🧪 Easy Testing**: Test configurations independently
8. **📈 Scalable**: Add unlimited providers

**Result**: A flexible, maintainable email system that adapts to your needs without code changes! 🎉 
