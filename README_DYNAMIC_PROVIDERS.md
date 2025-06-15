# Dynamic Email Provider Management UI

This document explains how to use the new dynamic email provider management interface that's been added to synchronize with your backend implementation.

## Overview

The UI now fully supports your dynamic email provider backend with the following features:

- **Simple Provider Configuration**: Easy setup for popular email services (SendGrid, Brevo, Mailgun, etc.)
- **Advanced Custom Providers**: Full control over API endpoints, headers, authentication, and payload templates
- **Real-time Testing**: Test configurations before saving
- **Provider Management**: Enable/disable, edit, delete providers
- **Visual Dashboard**: See quota usage, success rates, and provider status at a glance

## Features Implemented

### 1. Updated Type Definitions (`client/src/types/api.ts`)
- `DynamicProvider`: Main provider interface
- `ProviderConfig`: Configuration structure
- `ProviderPreset`: Available presets
- `SimpleProviderRequest` & `AdvancedProviderRequest`: Form data types
- `TestProviderResponse`: Test result interface

### 2. Enhanced API Service (`client/src/services/api.ts`)
Added methods for all dynamic provider endpoints:
- `getDynamicProviders()` - List all providers
- `createSimpleProvider()` - Create simple provider
- `createAdvancedProvider()` - Create advanced/custom provider
- `testProviderConfiguration()` - Test configuration
- `updateDynamicProvider()` - Update provider
- `deleteDynamicProvider()` - Delete provider
- `bulkProviderOperation()` - Bulk operations

### 3. Provider Form Component (`client/src/components/ProviderForm.tsx`)
Comprehensive form with two modes:

#### Simple Configuration
- Select from preset provider types (SendGrid, Brevo, Mailgun, etc.)
- Basic fields: name, API key, quota, active status
- Auto-configures endpoints and authentication based on preset

#### Advanced Configuration
- Full custom API configuration
- Custom endpoints, HTTP methods, headers
- Authentication types: API key, Basic Auth, Bearer Token
- Payload templates with variable substitution
- Field mappings for custom APIs

### 4. Updated Providers Page (`client/src/pages/Providers.tsx`)
- Real-time data from backend API
- Provider cards with status, quota usage, success rates
- Action menu: Edit, Enable/Disable, Delete
- Summary statistics dashboard
- Provider-specific icons and badges

## How to Use

### Starting the System

1. **Start the Backend Server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the Frontend**:
   ```bash
   cd client
   npm run dev
   ```

### Adding a Simple Provider

1. Go to the "Providers" page
2. Click "Add Provider"
3. Choose "Simple Configuration" tab
4. Select a provider type (e.g., "SendGrid")
5. Enter your API key
6. Set daily quota
7. Click "Test Configuration" to verify
8. Click "Create Provider"

### Adding a Custom Provider

1. Click "Add Provider"
2. Choose "Advanced Configuration" tab
3. Fill in basic details (name, type, API key)
4. Configure API endpoint and HTTP method
5. Set custom headers (JSON format)
6. Choose authentication type
7. Define payload template with variables like `{{sender.email}}`
8. Test configuration
9. Create provider

### Managing Providers

- **Toggle Status**: Use the switch on each provider card
- **Edit**: Click the menu (⋯) → Edit
- **Delete**: Click the menu (⋯) → Delete
- **View Details**: Each card shows quota usage, success rate, last activity

## Example Configurations

### SendGrid Simple Setup
```
Name: My SendGrid
Type: sendgrid
API Key: SG.your-api-key-here
Daily Quota: 5000
```

### Custom API Advanced Setup
```
Name: Custom Email Service
Type: custom
API Key: your-custom-key
Endpoint: https://api.yourdomain.com/v1/send
Method: POST
Headers: {
  "Content-Type": "application/json",
  "X-API-Key": "{{apiKey}}"
}
Payload Template: {
  "from": "{{sender.email}}",
  "to": "{{recipients.0.email}}",
  "subject": "{{subject}}",
  "html": "{{htmlContent}}"
}
```

## Testing

The backend includes comprehensive tests. Run them with:

```bash
cd server
node test-dynamic-providers.js
```

This will test:
- Provider presets retrieval
- Simple provider creation
- Advanced provider creation
- Configuration testing
- Provider management operations
- Bulk operations

## API Endpoints Used

The UI connects to these backend endpoints:

- `GET /api/dynamic-provider/presets` - Get available provider presets
- `GET /api/dynamic-provider/` - List providers
- `POST /api/dynamic-provider/simple` - Create simple provider
- `POST /api/dynamic-provider/advanced` - Create advanced provider
- `POST /api/dynamic-provider/test` - Test configuration
- `PUT /api/dynamic-provider/:id` - Update provider
- `DELETE /api/dynamic-provider/:id` - Delete provider
- `POST /api/dynamic-provider/bulk` - Bulk operations

## Key Features

### Real-time Validation
- Test configurations before saving
- Visual feedback for valid/invalid configs
- Preview generated payloads

### Flexible Configuration
- Simple mode for common providers
- Advanced mode for custom integrations
- Template variables for dynamic content

### Provider Management
- Visual status indicators
- Quota monitoring with warnings
- Success rate tracking
- Easy enable/disable toggles

### Modern UI
- Responsive design
- Toast notifications
- Loading states
- Error handling
- Confirmation dialogs

The UI is now fully synchronized with your dynamic provider backend and provides a comprehensive interface for managing email providers without touching code! 
