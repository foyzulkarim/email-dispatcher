# Email Dispatch System - Core Requirements & Expected Behavior

## Executive Summary

The Email Dispatch System is a multi-provider email service that allows users to manage multiple email service providers, create reusable HTML email templates with variable substitution, and send emails through any configured provider. The system acts as an intelligent abstraction layer that handles provider-specific API formats, rate limiting, and delivery tracking.

## Core Components

### 1. Email Provider Management

**Purpose**: Allow users to configure multiple email service providers for redundancy, load balancing, and cost optimization.

**Key Features**:
- **Provider Configuration Storage**:
  - Provider Name (user-defined identifier)
  - Provider Type (brevo, sendgrid, mailgun, mailjet, postmark, custom, etc.)
  - API Key & API Secret (authentication credentials)
  - API Base URL (provider's endpoint)
  - Request Template (copied from API vendor documentation)
  - Daily Quota Management (rate limiting)
  - Provider Status (active/inactive)

- **Multi-Provider Support**:
  - Support for popular providers (Brevo, SendGrid, Mailgun, Mailjet, etc.)
  - Custom provider configuration for proprietary APIs
  - Automatic format conversion between providers
  - Provider-specific authentication handling

- **Intelligent Provider Selection**:
  - Automatic failover when a provider fails
  - Load balancing across multiple active providers
  - Quota-aware routing (skip providers that hit daily limits)
  - Provider health monitoring

### 2. Email Template Management

**Purpose**: Enable users to create reusable email templates with dynamic content insertion.

**Key Features**:
- **Template Structure**:
  - Template Name & Description
  - Subject Line (supports variables)
  - HTML Content (main email body)
  - Optional Text Content (fallback)
  - Variable Definitions (extracted from {{variable}} syntax)
  - Template Categories for organization

- **Variable System**:
  - Double curly brace syntax: `{{variable_name}}`
  - Automatic variable extraction from content
  - Variable validation during email sending
  - Support for nested variables and complex data structures
  - No business logic in templates (pure presentation)

- **Template Management**:
  - Create, update, delete, and list templates
  - Template versioning and history
  - Template activation/deactivation
  - Template usage analytics

### 3. Email Sending & Processing

**Purpose**: Execute email delivery through selected providers with proper tracking and error handling.

**Email Sending Workflow**:
1. **User Input**:
   - Select email template
   - Select provider (or auto-select)
   - Provide recipient email addresses
   - Supply template variables
   - Click "Send"

2. **System Processing**:
   - Validate template and variables
   - Process template (substitute variables in HTML/subject)
   - Select optimal provider based on:
     - User preference (if specified)
     - Provider availability and health
     - Daily quota remaining
     - Historical performance
   - Convert email data to provider-specific format
   - Execute HTTP API call to provider
   - Handle provider response

3. **Response Handling**:
   - Parse provider response for success/failure
   - Extract message IDs for tracking
   - Save delivery status and metadata
   - Update provider usage statistics
   - Handle failures with retry logic or failover

## Technical Architecture

### Data Models

1. **EmailProvider**:
   ```
   - id, name, type, apiKey
   - dailyQuota, usedToday, isActive
   - config (provider-specific settings)
   - lastResetDate, timestamps
   ```

2. **EmailTemplate**:
   ```
   - id, name, description, subject
   - htmlContent, textContent, variables
   - category, isActive, createdBy
   - timestamps
   ```

3. **EmailJob**:
   ```
   - id, subject, body, recipients
   - status (pending/processing/completed/failed)
   - templateId, templateVariables
   - metadata, timestamps
   ```

4. **EmailTarget**:
   ```
   - id, jobId, email, status
   - providerId, sentAt, failureReason
   - retryCount, timestamps
   ```

### API Endpoints

- **Providers**: `/providers/*` - CRUD operations for email providers
- **Templates**: `/templates/*` - Template management and variable processing
- **Emails**: `/emails/*` - Send emails and track delivery status
- **Dashboard**: `/dashboard/*` - System statistics and monitoring
- **Webhooks**: `/webhooks/*` - Handle provider delivery notifications

## Expected System Behavior

### Provider Management Behavior
- **Creation**: User provides API credentials and configuration; system validates and stores securely
- **Testing**: System can send test emails to verify provider configuration
- **Automatic Failover**: If primary provider fails, system automatically tries backup providers
- **Quota Management**: System tracks daily usage and stops using providers when quota is exceeded
- **Health Monitoring**: System monitors provider response times and success rates

### Template Processing Behavior
- **Variable Extraction**: System automatically identifies `{{variable}}` patterns in templates
- **Validation**: Before sending, system ensures all required variables are provided
- **Substitution**: System replaces variables with actual values in both HTML and subject
- **Error Handling**: Clear error messages for missing or invalid variables

### Email Sending Behavior
- **Queue Processing**: Large email batches are processed asynchronously
- **Provider Selection**: System intelligently selects the best available provider
- **Format Conversion**: Same email content is automatically formatted for different providers
- **Delivery Tracking**: System tracks each email's delivery status individually
- **Retry Logic**: Failed emails are retried with exponential backoff
- **Rate Limiting**: System respects provider rate limits to avoid API throttling

### Error Handling & Recovery
- **Provider Failures**: Automatic failover to backup providers
- **Rate Limiting**: Graceful handling of rate limit responses
- **Invalid Data**: Clear validation errors for malformed requests
- **Network Issues**: Retry logic with exponential backoff
- **Webhook Processing**: Handle delivery status updates from providers

## Success Criteria

The system successfully meets requirements when:

1. **Provider Management**: Users can easily add multiple email providers and the system automatically handles provider-specific API formats
2. **Template Flexibility**: Users can create rich HTML templates with variables that work across all providers
3. **Reliable Delivery**: System successfully delivers emails even when individual providers fail
4. **Performance**: System handles high-volume email sending with proper queuing and rate limiting
5. **Monitoring**: Users have visibility into delivery status, provider performance, and system health
6. **Scalability**: System can handle multiple concurrent users and large email volumes

## Integration Points

- **External APIs**: HTTP integrations with email service providers
- **Database**: MongoDB for persistent storage of configurations and job data
- **Queue System**: RabbitMQ for asynchronous email processing
- **Monitoring**: Webhook endpoints for delivery status updates
- **Authentication**: Secure storage of API credentials

This system serves as a unified email delivery platform that abstracts the complexity of multiple email providers while providing robust template management and delivery tracking capabilities. 
