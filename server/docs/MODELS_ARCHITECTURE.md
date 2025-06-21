# Email Dispatcher - Database Models Architecture

## Overview
This document outlines the final database model architecture for the email dispatcher system that supports multiple third-party email platforms with Google OAuth authentication. The architecture follows clean architecture principles with clear separation between business logic types and database implementation.

## Architecture Principles

### Clean Architecture Implementation
- **Business Types**: Centralized in `/types` folder, framework-agnostic
- **Database Models**: In `/models` folder, Mongoose-specific implementations
- **Separation of Concerns**: Types represent business logic, models handle data persistence
- **Single Source of Truth**: All business interfaces defined once in `/types`

### Import Patterns
```typescript
// Business Logic Layer (Controllers/Services)
import type { Platform, User, EmailJob } from '../types';        // Business types
import { PlatformModel, UserModel, EmailJobModel } from '../models';  // DB operations

// Data Layer (Models)
import type { Platform } from '../types';                        // Import business type
interface PlatformDocument extends Platform, Document {}         // Extend for Mongoose
export const PlatformModel = mongoose.model(...);               // Export only model
```

## Core Models

### 1. **Platform** (`platforms` collection)
**Purpose**: Static reference data for supported email platforms (SendGrid, Mailgun, etc.)
- Managed by admins only, not editable by users
- Contains platform-specific API configurations
- Includes authentication methods and field mappings

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/Platform.ts`

**Key Fields**:
- `id`: Unique platform identifier
- `name`: Platform name (e.g., 'sendgrid', 'mailgun')
- `type`: Platform type enum
- `displayName`: User-friendly name
- `authType`: Authentication method required
- `defaultConfig`: Complete API configuration including endpoints, headers, field mappings

### 2. **User** (`users` collection)
**Purpose**: User accounts with Google OAuth integration
- Google-first authentication design
- Stores profile information from Google

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/User.ts`

**Key Fields**:
- `id`: Internal user ID
- `email`: User's email (from Google)
- `name`: Display name (from Google)
- `avatar`: Profile picture URL (from Google)
- `googleId`: Google OAuth unique identifier
- `role`: 'user' or 'admin'
- `lastLoginAt`: Last authentication timestamp

### 3. **UserProvider** (`user_providers` collection)
**Purpose**: Links users to their email platform credentials
- Stores API keys/secrets securely per user per platform
- Includes quota management and usage tracking

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/UserProvider.ts`

**Key Fields**:
- `id`: Unique provider instance ID
- `userId`: Reference to User
- `platformId`: Reference to Platform
- `name`: User-friendly name for this provider instance
- `apiKey`: Platform API key
- `apiSecret`: Platform API secret (if required)
- `dailyQuota`: Daily sending limit
- `usedToday`: Current day usage count
- `customConfig`: Optional platform config overrides

### 4. **EmailTemplate** (`email_templates` collection)
**Purpose**: User-created email templates with variable support
- Supports placeholder variables (e.g., {{name}}, {{email}})
- User-specific templates with proper isolation

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/EmailTemplate.ts`

**Key Fields**:
- `id`: Template ID
- `userId`: Template owner
- `name`: Template name (unique per user)
- `subject`: Email subject line
- `htmlContent`: HTML email body
- `textContent`: Plain text version (optional)
- `variables`: Array of placeholder variable names
- `category`: Template categorization

### 5. **EmailJob** (`email_jobs` collection)
**Purpose**: Tracks email sending requests
- Links templates with recipients and variables
- Tracks job status and metadata

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/EmailJob.ts`

**Key Fields**:
- `id`: Job ID
- `userId`: Job owner
- `subject`: Final rendered subject
- `body`: Final rendered body
- `recipients`: Array of recipient emails
- `status`: 'pending', 'processing', 'completed', 'failed'
- `templateId`: Source template (optional)
- `templateVariables`: Variable values used
- `userProviderId`: Provider used for sending

### 6. **EmailTarget** (`email_targets` collection)
**Purpose**: Tracks individual email delivery status
- One record per recipient per job
- Detailed delivery tracking and retry logic

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/EmailTarget.ts`

**Key Fields**:
- `id`: Target ID
- `jobId`: Parent job reference
- `email`: Recipient email
- `status`: 'pending', 'sent', 'failed', 'blocked'
- `providerId`: Provider used for this target
- `sentAt`: Delivery timestamp
- `failureReason`: Error details if failed
- `retryCount`: Number of retry attempts

### 7. **WebhookEvent** (`webhook_events` collection)
**Purpose**: Stores webhook events from email platforms
- Tracks delivery confirmations, bounces, opens, clicks
- Used for analytics and suppression list management

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/WebhookEvent.ts`

**Key Fields**:
- `id`: Event ID
- `providerId`: Source provider
- `eventType`: 'delivered', 'bounced', 'opened', 'clicked', 'complained'
- `email`: Target email
- `timestamp`: Event timestamp
- `data`: Raw webhook payload

### 8. **Suppression** (`suppression_list` collection)
**Purpose**: Global suppression list for bounced/complained emails
- Prevents sending to problematic addresses
- Automatically populated from webhook events

**Business Type Location**: `/types/index.ts`
**Model Location**: `/models/Suppression.ts`

**Key Fields**:
- `email`: Suppressed email address (unique)
- `reason`: 'bounce', 'complaint', 'manual'
- `addedAt`: Suppression timestamp

## Key Relationships

```
User (1) ←→ (N) UserProvider ←→ (1) Platform
User (1) ←→ (N) EmailTemplate
User (1) ←→ (N) EmailJob
EmailJob (1) ←→ (N) EmailTarget
EmailTemplate (1) ←→ (N) EmailJob
UserProvider (1) ←→ (N) EmailJob
UserProvider (1) ←→ (N) WebhookEvent
```

## Data Flow

1. **Platform Setup**: Admins seed supported platforms
2. **User Registration**: Users authenticate via Google OAuth
3. **Provider Setup**: Users add their email platform credentials
4. **Template Creation**: Users create email templates with variables
5. **Email Sending**:
   - Create EmailJob with template and recipients
   - System creates EmailTarget for each recipient
   - Select appropriate UserProvider based on quotas
   - Process emails using Platform configuration
6. **Tracking**: WebhookEvents update EmailTarget status
7. **Suppression**: Failed deliveries populate suppression list

## Security Considerations

- API credentials stored separately from user data
- Google OAuth for authentication (no password storage)
- Proper indexing for multi-tenant data isolation
- Quota management to prevent abuse

## Scalability Features

- Proper indexing for efficient queries
- Separate collections for high-volume data (targets, events)
- Background job processing support
- Webhook event handling for real-time updates

## Files Structure

```
src/
├── types/
│   ├── index.ts             # ALL business type definitions
│   └── auth.ts              # Authentication-specific types
├── models/
│   ├── Platform.ts          # PlatformModel only
│   ├── User.ts              # UserModel only
│   ├── UserProvider.ts      # UserProviderModel only
│   ├── EmailTemplate.ts     # EmailTemplateModel only
│   ├── EmailJob.ts          # EmailJobModel only
│   ├── EmailTarget.ts       # EmailTargetModel only
│   ├── WebhookEvent.ts      # WebhookEventModel only
│   ├── Suppression.ts       # SuppressionModel only
│   └── index.ts             # Model exports only
├── seeds/
│   └── platforms.ts         # Platform seed data
└── utils/
    ├── seedDatabase.ts      # Database seeding utility
    └── authHelpers.ts       # Google OAuth helpers
```

## Clean Architecture Benefits

### ✅ **Type Safety & Consistency**
- Single source of truth for all business types
- No duplicate interface definitions
- Framework-agnostic business logic

### ✅ **Maintainability**
- Clear separation between business logic and data persistence
- Easy to change database implementation without affecting business logic
- Centralized type definitions for easy updates

### ✅ **Testability**
- Business types can be easily mocked
- Database models can be tested independently
- Clear boundaries between layers

### ✅ **Developer Experience**
- No TypeScript `isolatedModules` compilation errors
- Clean import statements
- Intuitive file organization

This architecture provides a solid foundation that's secure, scalable, and maintainable while following clean architecture principles and meeting all the stated requirements.
