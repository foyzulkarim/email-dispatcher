# Email Dispatch Service - API Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently no authentication required. Implement authentication for production use.

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Email Management

### Submit Email Job
**POST** `/email/submit`

Submit a new email job for processing.

**Request Body:**
```json
{
  "subject": "Email Subject",
  "body": "Email body content",
  "recipients": ["user1@example.com", "user2@example.com"],
  "metadata": {
    "campaign": "newsletter",
    "source": "website"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "9db235b0-7496-4da0-8bb2-e40d3becc7cd",
    "status": "pending",
    "totalTargets": 2,
    "validRecipients": 2,
    "invalidRecipients": 0
  }
}
```

### Get Job Status
**GET** `/email/job/:id`

Get the status and details of a specific email job.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "9db235b0-7496-4da0-8bb2-e40d3becc7cd",
    "subject": "Email Subject",
    "status": "completed",
    "totalTargets": 2,
    "processedTargets": 2,
    "successfulTargets": 2,
    "failedTargets": 0,
    "createdAt": "2025-06-08T03:38:57.000Z",
    "updatedAt": "2025-06-08T03:39:06.000Z"
  }
}
```

### List Jobs
**GET** `/email/jobs`

Get a list of all email jobs with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status (pending, processing, completed, failed)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "9db235b0-7496-4da0-8bb2-e40d3becc7cd",
        "subject": "Email Subject",
        "status": "completed",
        "totalTargets": 2,
        "successfulTargets": 2,
        "createdAt": "2025-06-08T03:38:57.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Provider Management

### List Providers
**GET** `/provider/list`

Get all configured email providers and their status.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "brevo",
      "name": "Brevo",
      "type": "brevo",
      "dailyQuota": 300,
      "usedToday": 0,
      "remainingToday": 300,
      "usagePercentage": 0,
      "isActive": true
    },
    {
      "id": "mailerlite",
      "name": "MailerLite",
      "type": "mailerlite",
      "dailyQuota": 1000,
      "usedToday": 0,
      "remainingToday": 1000,
      "usagePercentage": 0,
      "isActive": true
    }
  ]
}
```

### Update Provider Status
**PATCH** `/provider/:id/status`

Enable or disable a specific email provider.

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "brevo",
    "isActive": true
  }
}
```

### Reset Provider Quota
**POST** `/provider/:id/reset-quota`

Reset the daily quota usage for a provider (useful for testing).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "brevo",
    "usedToday": 0,
    "remainingToday": 300
  }
}
```

### Get Provider Statistics
**GET** `/provider/stats`

Get detailed statistics for all providers.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProviders": 2,
    "activeProviders": 2,
    "totalQuota": 1300,
    "usedQuota": 0,
    "remainingQuota": 1300,
    "providers": [
      {
        "id": "brevo",
        "name": "Brevo",
        "usagePercentage": 0,
        "isActive": true
      }
    ]
  }
}
```

## Dashboard

### Get Dashboard Statistics
**GET** `/dashboard/stats`

Get comprehensive dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalJobs": 1,
      "totalTargets": 2,
      "suppressionCount": 0,
      "activeProviders": 2
    },
    "jobStats": {
      "pending": 0,
      "processing": 0,
      "completed": 1,
      "failed": 0
    },
    "targetStats": {
      "pending": 0,
      "sent": 2,
      "failed": 0,
      "blocked": 0
    },
    "todayStats": {
      "sent": 2,
      "failed": 0,
      "total": 2
    },
    "providers": [
      {
        "id": "brevo",
        "name": "Brevo",
        "dailyQuota": 300,
        "usedToday": 0,
        "usagePercentage": 0,
        "isActive": true
      }
    ],
    "recentJobs": [
      {
        "id": "9db235b0-7496-4da0-8bb2-e40d3becc7cd",
        "subject": "Test Email from Email Dispatch Service",
        "status": "completed",
        "createdAt": "2025-06-08T03:38:57.000Z"
      }
    ]
  }
}
```

### Get Volume Chart Data
**GET** `/dashboard/chart/volume`

Get email volume data for charts.

**Query Parameters:**
- `days` (number): Number of days to include (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["2025-06-01", "2025-06-02", "2025-06-08"],
    "datasets": [
      {
        "label": "Sent",
        "data": [0, 0, 2]
      },
      {
        "label": "Failed",
        "data": [0, 0, 0]
      }
    ]
  }
}
```

### Get Provider Chart Data
**GET** `/dashboard/chart/providers`

Get provider usage data for charts.

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Brevo", "MailerLite"],
    "datasets": [
      {
        "label": "Usage",
        "data": [0, 0]
      }
    ]
  }
}
```

## Webhooks

### Receive Webhook Events
**POST** `/webhook/:provider`

Receive webhook events from email providers.

**Path Parameters:**
- `provider` (string): Provider name (brevo, mailerlite)

**Request Body:** (varies by provider)

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### List Webhook Events
**GET** `/webhook/events`

Get a list of received webhook events.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `eventType` (string): Filter by event type
- `providerId` (string): Filter by provider

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-id",
        "providerId": "brevo",
        "eventType": "delivered",
        "targetEmail": "user@example.com",
        "timestamp": "2025-06-08T03:39:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Health Check

### Application Health
**GET** `/health`

Check the health status of the application.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-08T03:36:10.729Z"
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |

## Rate Limiting

Currently no rate limiting is implemented. For production use, implement appropriate rate limiting based on your requirements.

## Examples

### Submit Email with cURL
```bash
curl -X POST http://localhost:3001/api/email/submit \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Welcome to our service",
    "body": "Thank you for signing up!",
    "recipients": ["user@example.com"]
  }'
```

### Get Job Status with cURL
```bash
curl http://localhost:3001/api/email/job/9db235b0-7496-4da0-8bb2-e40d3becc7cd
```

### List Jobs with Filtering
```bash
curl "http://localhost:3001/api/email/jobs?status=completed&limit=10"
```

