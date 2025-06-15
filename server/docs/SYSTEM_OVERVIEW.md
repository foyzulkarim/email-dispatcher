# Email Dispatch Service - System Overview

## Introduction

The Email Dispatch Service is a comprehensive backend system built with Fastify, TypeScript, and MongoDB that provides intelligent email dispatch services with multiple provider support, quota management, and real-time monitoring.

## Core Features

### 1. Multi-Provider Email Dispatch
- Support for multiple email service providers (Brevo, SendGrid, Mailjet, etc.)
- Intelligent provider selection based on quotas and availability
- Provider-specific payload formatting
- Quota management and automatic reset

### 2. Template System
- Variable substitution with `{variable}` and `{{variable}}` syntax
- HTML and plain text content support
- Template categories for organization
- Built-in variables (`recipient_email`, `current_date`, `current_year`)
- Template preview functionality

### 3. Debug Email Mode
- Local HTML file generation for testing without API credits
- Visual preview of emails
- Automatic cleanup of old debug files
- Seamless switching between debug and live modes

### 4. Dynamic Provider Configuration
- Configure providers without code changes
- Support for popular email services
- Custom provider configurations
- Advanced templating with Mustache
- Configuration testing

### 5. Job Processing
- Background job processing with RabbitMQ
- Automatic retry for failed deliveries
- Suppression list management
- Comprehensive job status tracking

## Architecture

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
                       │                  │
                       └──────────────────┘
```

### Components

#### API Layer (`src/routes/`)
- **email.ts**: Email job submission and status endpoints
- **template.ts**: Template management and preview endpoints
- **provider.ts**: Email provider management
- **dynamic-provider.ts**: Dynamic provider configuration
- **dashboard.ts**: Statistics and monitoring
- **webhook.ts**: Provider webhook handling
- **database.ts**: Database management utilities

#### Service Layer (`src/services/`)
- **EmailProcessorService**: RabbitMQ job processor
- **EmailWorker**: Background email worker
- **TemplateService**: Template processing and variable substitution
- **ProviderService**: Email provider management
- **DynamicEmailProviderService**: Dynamic provider handling
- **AdvancedEmailProviderService**: Advanced provider configurations
- **DebugEmailService**: Debug mode email handling
- **QueueService**: RabbitMQ connection and job queueing
- **DatabaseService**: Database initialization and utilities

#### Data Layer (`src/models/`)
- **EmailJob**: Email job records
- **EmailTarget**: Individual email targets
- **EmailProvider**: Email service providers
- **EmailTemplate**: Reusable email templates with variables
- **Suppression**: Blocked email addresses
- **WebhookEvent**: Provider webhook events

## Current Implementation Status

### Fully Implemented Features
- ✅ Template system with variable substitution
- ✅ Multi-provider support architecture
- ✅ Debug email mode
- ✅ Dynamic provider configuration
- ✅ Job processing and tracking
- ✅ Dashboard statistics
- ✅ Database management

### Partially Implemented Features
- ⚠️ Real email sending (currently uses mock implementations)
- ⚠️ Webhook handling (structure exists but not fully implemented)
- ⚠️ Authentication (not implemented)

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
- `PATCH /api/provider/:id/status` - Enable/disable provider
- `POST /api/provider/:id/reset-quota` - Reset provider quota
- `GET /api/provider/stats` - Get provider statistics

### Dynamic Provider Management
- `POST /api/dynamic-provider/simple` - Create simple provider
- `POST /api/dynamic-provider/advanced` - Create advanced provider
- `POST /api/dynamic-provider/test` - Test provider configuration
- `GET /api/dynamic-provider/presets` - Get available presets
- `GET /api/dynamic-provider` - List providers
- `GET /api/dynamic-provider/:providerId` - Get provider by ID
- `PUT /api/dynamic-provider/:providerId` - Update provider
- `DELETE /api/dynamic-provider/:providerId` - Delete provider
- `POST /api/dynamic-provider/bulk` - Bulk operations

### Dashboard & Monitoring
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/dashboard/chart/volume` - Get volume chart data
- `GET /api/dashboard/chart/providers` - Get provider chart data

### Webhooks
- `POST /api/webhook/:provider` - Receive webhook events
- `GET /api/webhook/events` - List webhook events

## Environment Configuration

```env
# Database
MONGODB_URI=mongodb://localhost:27017/email-dispatch

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Email Providers
BREVO_API_KEY=your_brevo_api_key
BREVO_DAILY_QUOTA=300
MAILERLITE_API_KEY=your_mailerlite_api_key  
MAILERLITE_DAILY_QUOTA=1000

# Default sender
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=Your Company Name

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

## Testing

```bash
# Test debug email functionality
node test-debug-email.js

# Test multi-provider functionality
node test-multi-providers.js

# Test dynamic providers
node test-dynamic-providers.js

# Test Brevo provider
node test-brevo.js
```