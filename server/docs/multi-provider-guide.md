# Multi-Provider Email System Guide

## Overview

Your email service now supports **multiple email providers** with a **common interface**. The same email content is automatically formatted differently for each provider's API requirements.

## Supported Providers

| Provider | Authentication | API Format | Status |
|----------|----------------|------------|--------|
| **Brevo** | `api-key` header | JSON with `sender`/`to` | ✅ Ready |
| **SendGrid** | `Bearer` token | JSON with `personalizations` | ✅ Ready |
| **Mailjet** | Basic auth | JSON with `Messages` array | ✅ Ready |
| **Mailgun** | Basic auth | Form data | 🔧 Configured |
| **Postmark** | `X-Postmark-Server-Token` | JSON simple format | 🔧 Configured |
| **MailerLite** | `X-MailerLite-ApiKey` | JSON campaign format | 🔧 Configured |

## Common Pattern System

### Input: Standard Email Request
```javascript
{
  to: "recipient@example.com",
  toName: "Recipient Name", 
  subject: "Hello World",
  htmlContent: "<h1>Hello!</h1><p>This is HTML content.</p>",
  textContent: "Hello! This is text content.",
  fromEmail: "sender@domain.com",
  fromName: "Sender Name"
}
```

### Output: Provider-Specific Formats

#### 🔹 Brevo Format
```json
{
  "sender": {
    "email": "sender@domain.com",
    "name": "Sender Name"
  },
  "to": [{
    "email": "recipient@example.com", 
    "name": "Recipient Name"
  }],
  "subject": "Hello World",
  "htmlContent": "<h1>Hello!</h1><p>This is HTML content.</p>",
  "textContent": "Hello! This is text content."
}
```

#### 🔹 SendGrid Format  
```json
{
  "personalizations": [{
    "to": [{
      "email": "recipient@example.com",
      "name": "Recipient Name"
    }]
  }],
  "from": {
    "email": "sender@domain.com",
    "name": "Sender Name" 
  },
  "subject": "Hello World",
  "content": [
    {
      "type": "text/html",
      "value": "<h1>Hello!</h1><p>This is HTML content.</p>"
    },
    {
      "type": "text/plain", 
      "value": "Hello! This is text content."
    }
  ]
}
```

#### 🔹 Mailjet Format
```json
{
  "Messages": [{
    "From": {
      "Email": "sender@domain.com",
      "Name": "Sender Name"
    },
    "To": [{
      "Email": "recipient@example.com",
      "Name": "Recipient Name"
    }],
    "Subject": "Hello World",
    "TextPart": "Hello! This is text content.",
    "HTMLPart": "<h1>Hello!</h1><p>This is HTML content.</p>"
  }]
}
```

## Setup Instructions

### 1. Environment Configuration

Copy `environment-template.txt` to `.env` and configure your API keys:

```env
# Brevo
BREVO_API_KEY=your_brevo_api_key_here
BREVO_DAILY_QUOTA=300

# SendGrid  
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_DAILY_QUOTA=100

# Mailjet (format: "public_key:private_key")
MAILJET_API_KEY=your_public_key:your_private_key
MAILJET_DAILY_QUOTA=200

# Default sender (must be verified in all providers)
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=Your Company Name

# Testing
TEST_EMAIL=your-test-email@example.com
```

### 2. Provider Setup Guide

#### Brevo Setup
1. Go to [Brevo Console](https://app.brevo.com/settings/keys/api)
2. Create API key
3. Verify sender email in Senders & IP section

#### SendGrid Setup  
1. Go to [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
2. Create API key with "Mail Send" permissions
3. Verify sender email in Sender Authentication

#### Mailjet Setup
1. Go to [Mailjet API Keys](https://app.mailjet.com/account/api_keys)  
2. Get both API Key (public) and Secret Key (private)
3. Format as `public_key:private_key` in environment
4. Verify sender email in Account Settings

## API Usage

### Create Providers

```bash
# Create Brevo provider
curl -X POST http://localhost:3000/providers/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Brevo Provider",
    "type": "brevo", 
    "apiKey": "your_brevo_api_key",
    "dailyQuota": 1000
  }'

# Create SendGrid provider  
curl -X POST http://localhost:3000/providers/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My SendGrid Provider",
    "type": "sendgrid",
    "apiKey": "your_sendgrid_api_key", 
    "dailyQuota": 500
  }'

# Create Mailjet provider
curl -X POST http://localhost:3000/providers/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Mailjet Provider", 
    "type": "mailjet",
    "apiKey": "public_key:private_key",
    "dailyQuota": 300
  }'
```

### Send Emails

The system **automatically selects** the best available provider:

```bash
curl -X POST http://localhost:3000/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Multi-Provider Test",
    "body": "<h1>Hello!</h1><p>This email works with any provider!</p>",
    "recipients": ["recipient@example.com"]
  }'
```

### Test Providers

```bash
curl -X POST http://localhost:3000/providers/test \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider-id-here",
    "testEmail": "test@example.com"
  }'
```

## Provider Management

### List All Providers
```bash
curl http://localhost:3000/providers/list
```

### Get Provider Statistics  
```bash
curl http://localhost:3000/providers/stats
```

### Activate/Deactivate Provider
```bash
curl -X PATCH http://localhost:3000/providers/{providerId}/status \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

### Reset Provider Quota
```bash
curl -X POST http://localhost:3000/providers/{providerId}/reset-quota
```

## Testing

### Run Multi-Provider Test Suite
```bash
node test-multi-providers.js
```

This will:
- ✅ Create providers for all configured APIs
- ✅ Test email sending through each provider  
- ✅ Show provider statistics
- ✅ Demonstrate the common pattern system
- ✅ Test main API with provider rotation

### Test Individual Provider
```bash
node test-brevo.js  # Test just Brevo
```

## System Benefits

### 🔄 **Automatic Provider Rotation**
- System selects provider with lowest usage
- Automatic failover if one provider is down
- Load balancing across providers

### 🎯 **Common Interface**
- Same API call works with any provider
- No code changes when adding providers
- Consistent email formatting

### 📊 **Usage Monitoring**
- Track daily quotas per provider
- Monitor success/failure rates
- Provider performance analytics

### 🛡️ **Fault Tolerance**
- Multiple providers ensure delivery
- Automatic retry with different providers
- Graceful degradation

## Architecture Flow

```
Email Request
     ↓
Common Format Processing
     ↓
Provider Selection (lowest usage)
     ↓
Provider-Specific Formatting
     ↓ 
HTTP Request to Provider API
     ↓
Response Processing
     ↓
Usage Update & Statistics
```

## Configuration-Driven Design

Adding a new provider requires **zero code changes**:

1. Add configuration to `providers.ts`
2. Create provider via API
3. System automatically handles formatting

The template system uses `{{placeholder}}` replacement to transform common email data into provider-specific JSON structures.

## Next Steps

1. **Add More Providers**: Mailgun, Postmark, SES configurations ready
2. **Webhooks**: Implement delivery tracking from providers  
3. **Analytics**: Build provider performance dashboard
4. **Templates**: Combine with template system for dynamic content
5. **Scheduling**: Add email scheduling and queuing
6. **Bulk Sending**: Optimize for large recipient lists

Your email system is now **provider-agnostic** and **highly scalable**! 🚀 
