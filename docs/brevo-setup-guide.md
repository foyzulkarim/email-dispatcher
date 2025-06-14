# Brevo Integration Setup Guide

## Overview
Your email service now supports real Brevo email sending! This guide will help you set up and test the Brevo integration.

## Quick Setup

### 1. Get Your Brevo API Key
1. Go to [Brevo Console](https://app.brevo.com/settings/keys/api)
2. Create a new API key (if you don't have one)
3. Copy the API key

### 2. Set Environment Variables
1. Copy `environment-template.txt` to `.env`
2. Update the following variables:
   ```env
   BREVO_API_KEY=your_actual_api_key_here
   DEFAULT_FROM_EMAIL=your-verified-sender@domain.com
   DEFAULT_FROM_NAME=Your Name
   TEST_EMAIL=your-test-email@gmail.com
   ```

### 3. Verify Sender Email
Make sure your `DEFAULT_FROM_EMAIL` is verified in Brevo:
- Go to Brevo Console → Senders & IP
- Add and verify your sender email address

## Testing the Integration

### 1. Start the Server
```bash
npm start
```

### 2. Run the Test Suite
```bash
node test-brevo.js
```

This will:
- ✅ Create a Brevo provider
- ✅ List all providers
- ✅ Send a test email (if API key is valid)
- ✅ Test the main email API

### 3. Manual Testing via API

#### Create a Brevo Provider:
```bash
curl -X POST http://localhost:3000/providers/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Brevo Provider",
    "type": "brevo",
    "apiKey": "your_api_key_here",
    "dailyQuota": 1000
  }'
```

#### Test Email Sending:
```bash
curl -X POST http://localhost:3000/providers/test \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider_id_from_above",
    "testEmail": "your-email@example.com"
  }'
```

#### Send Email via Main API:
```bash
curl -X POST http://localhost:3000/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Hello from Brevo!",
    "body": "<h1>Test Email</h1><p>This email was sent via Brevo integration.</p>",
    "recipients": ["recipient@example.com"]
  }'
```

## Brevo-Specific Features

### Request Format
The system automatically formats requests for Brevo's API:
```json
{
  "sender": {
    "email": "sender@domain.com",
    "name": "Sender Name"
  },
  "to": [{
    "email": "recipient@domain.com",
    "name": "Recipient Name"
  }],
  "subject": "Email Subject",
  "htmlContent": "<h1>HTML Content</h1>",
  "textContent": "Plain text content"
}
```

### Response Handling
- Success: Returns `messageId` from Brevo
- Error: Returns error details for debugging

## Monitoring

### Check Provider Status:
```bash
curl http://localhost:3000/providers/list
```

### Check Provider Stats:
```bash
curl http://localhost:3000/providers/stats
```

### Check Email Job Status:
```bash
curl http://localhost:3000/emails/status/{jobId}
```

## Common Issues

1. **"Provider is not active"** - Check if your API key is valid
2. **"No available email providers"** - Make sure you have created and activated a provider
3. **"Authentication failed"** - Verify your Brevo API key
4. **"Sender not verified"** - Verify your sender email in Brevo console

## Next Steps

Once Brevo is working, you can:
1. Add more providers (SendGrid, Mailgun, etc.)
2. Set up provider failover
3. Implement webhooks for delivery tracking
4. Add template support for dynamic content

Your email service is now ready to send real emails through Brevo! 🚀 
