# Email Dispatch Service Architecture

## Current State: **MOCK IMPLEMENTATION - NO ACTUAL EMAILS SENT**

This document outlines the architecture and data flow of the Email Dispatch Service. **Important:** The current implementation only simulates email sending - no actual emails are delivered.

## System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTTP Client   │────│   Fastify API    │────│    Database     │
│                 │    │                  │    │   (MongoDB)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                │
                       ┌──────────────────┐
                       │   RabbitMQ       │
                       │   Job Queue      │
                       └──────────────────┘
                                │
                                │
                       ┌──────────────────┐
                       │  Email Workers   │
                       │  (MOCK ONLY)     │
                       └──────────────────┘
```

## Components Architecture

### 1. API Layer (`src/routes/`)
- **email.ts**: Email job submission and status endpoints
- **template.ts**: Template management and preview endpoints
- **provider.ts**: Email provider management
- **dashboard.ts**: Statistics and monitoring
- **webhook.ts**: Provider webhook handling
- **database.ts**: Database management utilities

### 2. Service Layer (`src/services/`)
- **EmailProcessorService**: RabbitMQ job processor (**MOCK**)
- **EmailWorker**: Background email worker (**MOCK**)
- **TemplateService**: Template processing and variable substitution
- **ProviderService**: Email provider management
- **QueueService**: RabbitMQ connection and job queueing
- **DatabaseService**: Database initialization and utilities

### 3. Data Layer (`src/models/`)
- **EmailJob**: Email job records
- **EmailTarget**: Individual email targets
- **EmailProvider**: Email service providers
- **EmailTemplate**: Reusable email templates with variables
- **Suppression**: Blocked email addresses
- **WebhookEvent**: Provider webhook events

## Complete Call Flow & Data Flow

### 1. Email Submission Flow

```
POST /api/email/submit
    │
    ├─ Validation (subject, body, recipients)
    │
    ├─ Suppression Check
    │   └─ Filter out blocked emails from SuppressionModel
    │
    ├─ Database Operations
    │   ├─ Create EmailJob record (status: 'pending')
    │   └─ Create EmailTarget records for each recipient
    │
    ├─ Queue Job
    │   └─ Publish jobId to RabbitMQ queue
    │
    └─ Return Response
        └─ { jobId, totalRecipients, validRecipients, suppressedRecipients }
```

### 2. Job Processing Flow (Dual System)

The system runs **TWO parallel processing mechanisms**:

#### A. RabbitMQ-based Processing (EmailProcessorService)
```
RabbitMQ Consumer
    │
    ├─ Receive jobId from queue
    │
    ├─ Load EmailJob from database
    │   └─ Update status: 'pending' → 'processing'
    │
    ├─ Load EmailTargets for jobId
    │
    ├─ Process Each Target
    │   ├─ Call mockEmailSending() ⚠️ MOCK ONLY
    │   │   └─ 5-second delay + 95% success simulation
    │   │
    │   └─ Update EmailTarget status: 'pending' → 'sent'/'failed'
    │
    └─ Update Job Status
        └─ 'processing' → 'completed'/'failed'
```

#### B. Background Worker Processing (EmailWorker)
```
EmailWorker (5-second intervals)
    │
    ├─ Query pending EmailTargets (batch size: 50)
    │
    ├─ Mark targets as 'processing'
    │
    ├─ Find Available Provider
    │   └─ Query EmailProviderModel (active + quota available)
    │
    ├─ Process Each Target
    │   ├─ Call sendEmailViaProvider() ⚠️ MOCK ONLY
    │   │   └─ 95% success simulation
    │   │
    │   ├─ Update EmailTarget status
    │   └─ Increment provider usage counter
    │
    └─ Update Job Statuses
        └─ Check all targets per job and update accordingly
```

### 3. Provider Management Flow

```
ProviderService.initializeProviders()
    │
    ├─ Create default providers if none exist
    │   ├─ Brevo (quota: 300/day, apiKey: env.BREVO_API_KEY)
    │   └─ MailerLite (quota: 1000/day, apiKey: env.MAILERLITE_API_KEY)
    │
    └─ Start Quota Reset Scheduler (hourly)
        └─ Reset usedToday counters daily
```

### 4. Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ HTTP Request│───▶│  EmailJob   │───▶│RabbitMQ Job │
│             │    │ (pending)   │    │   Queue     │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                    │
                           ▼                    ▼
                   ┌─────────────┐    ┌─────────────────┐
                   │EmailTargets │    │EmailProcessor   │
                   │ (pending)   │    │   Service       │
                   └─────────────┘    └─────────────────┘
                           │                    │
                           ▼                    ▼
                   ┌─────────────┐    ┌─────────────────┐
                   │EmailWorker  │───▶│   MOCK EMAIL    │
                   │ Background  │    │    SENDING      │
                   └─────────────┘    └─────────────────┘
                           │                    │
                           ▼                    ▼
                   ┌─────────────┐    ┌─────────────────┐
                   │EmailTargets │    │  Job Status     │
                   │(sent/failed)│    │  Update         │
                   └─────────────┘    └─────────────────┘
```

## Database Schema

### EmailJob Collection
```javascript
{
  id: string,                    // UUID
  subject: string,               // Email subject
  body: string,                  // Email body
  recipients: string[],          // Original recipients
  status: 'pending'|'processing'|'completed'|'failed',
  metadata: object,              // Custom metadata
  createdAt: Date,
  updatedAt: Date
}
```

### EmailTargets Collection
```javascript
{
  id: string,                    // UUID
  jobId: string,                 // Reference to EmailJob
  email: string,                 // Recipient email
  status: 'pending'|'sent'|'failed'|'blocked',
  providerId?: string,           // Which provider sent it
  sentAt?: Date,                 // When sent
  failureReason?: string,        // Failure details
  retryCount: number,            // Retry attempts
  createdAt: Date,
  updatedAt: Date
}
```

### EmailProviders Collection
```javascript
{
  id: string,                    // 'brevo'|'mailerlite'
  name: string,                  // Display name
  type: 'brevo'|'mailerlite',    // Provider type
  apiKey: string,                // API key (from env)
  dailyQuota: number,            // Daily send limit
  usedToday: number,             // Today's usage count
  isActive: boolean,             // Enable/disable
  lastResetDate: Date            // Last quota reset
}
```

## Critical Issues - Mock Implementation

### 🚨 EmailProcessorService.mockEmailSending()
```typescript
private async mockEmailSending(email: string): Promise<void> {
  console.log(`⏳ Sending email to ${email}... (mocking with 5s delay)`);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isSuccess = Math.random() > 0.05; // 95% success rate
      if (isSuccess) {
        resolve();
      } else {
        reject(new Error('Mock email sending failed'));
      }
    }, 5000); // 5-second delay
  });
}
```

### 🚨 EmailWorker.sendEmailViaProvider()
```typescript
private async sendEmailViaProvider(provider: any, target: any): Promise<boolean> {
  console.log(`Sending email to ${target.email} via ${provider.name} (${provider.type})`);
  
  // Simulate 95% success rate
  return Math.random() > 0.05;
}
```

## What's Missing for Real Email Sending

1. **Actual Provider Integrations**
   - Brevo API implementation
   - MailerLite API implementation
   - SMTP fallback

2. **Email Templates**
   - HTML/text template engine
   - Template variables replacement

3. **Authentication & Security**
   - API key validation
   - Rate limiting per provider

4. **Error Handling**
   - Provider-specific error codes
   - Bounce/complaint handling

5. **Monitoring & Alerting**
   - Provider health checks
   - Failed delivery notifications

## API Endpoints

### Email Operations
- `POST /api/email/submit` - Submit new email job (direct or template-based)
- `GET /api/email/job/:jobId` - Get job status
- `GET /api/email/jobs` - List all jobs (paginated)

### Template Management
- `GET /api/template/list` - List all templates (with pagination/filtering)
- `GET /api/template/:templateId` - Get template by ID
- `POST /api/template/create` - Create new template
- `PUT /api/template/:templateId` - Update template
- `DELETE /api/template/:templateId` - Delete template (soft delete)
- `POST /api/template/:templateId/preview` - Preview template with sample data
- `GET /api/template/categories` - Get all template categories

### Provider Management
- `GET /api/provider/list` - List all providers
- `POST /api/provider/toggle/:providerId` - Enable/disable provider
- `PUT /api/provider/:providerId/quota` - Update daily quota

### Dashboard & Monitoring
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/dashboard/providers` - Provider usage stats
- `GET /api/dashboard/recent-jobs` - Recent job activity

### Webhooks
- `POST /api/webhook/:providerId` - Receive provider webhooks

## Environment Variables Required

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/email-dispatch

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Email Providers (Currently unused - mock only)
BREVO_API_KEY=your_brevo_api_key
BREVO_DAILY_QUOTA=300
MAILERLITE_API_KEY=your_mailerlite_api_key  
MAILERLITE_DAILY_QUOTA=1000

# Server
PORT=3001
NODE_ENV=development
```

## Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

**Status:** The service is fully functional for testing and development but **DOES NOT SEND REAL EMAILS**. All email sending is simulated with mock functions. 
