# Email Dispatch Service - Full Stack Application

## Overview

This is a comprehensive full stack application built with Fastify, TypeScript, MongoDB, and React that provides intelligent email dispatch services with multiple provider support, quota management, and real-time monitoring.

## Architecture

### server (Fastify + TypeScript + MongoDB)
- **Framework**: Fastify with TypeScript for high-performance API server
- **Database**: MongoDB with Mongoose ODM for data persistence
- **Features**:
  - RESTful API endpoints for email job management
  - Multiple email provider support (Brevo, MailerLite)
  - Intelligent provider switching based on quotas and availability
  - Real-time job processing with background workers
  - Webhook handling for delivery status updates
  - Suppression list management
  - Comprehensive logging and monitoring

### client (React + TypeScript)
- **Framework**: React with TypeScript for type-safe UI development
- **Features**:
  - Responsive dashboard with real-time statistics
  - Email job submission and monitoring interface
  - Provider management and status monitoring
  - Real-time updates with auto-refresh functionality
  - Mobile-responsive design with custom CSS

## Features

### Core Functionality
1. **Email Job Management**
   - Submit email jobs with multiple recipients
   - Real-time job status tracking
   - Automatic retry logic for failed deliveries
   - Batch processing with configurable limits

2. **Multi-Provider Support**
   - Brevo (formerly Sendinblue) integration
   - MailerLite integration
   - Intelligent provider switching based on:
     - Daily quota limits
     - Provider availability
     - Historical performance

3. **Quota Management**
   - Daily quota tracking per provider
   - Automatic quota reset at midnight
   - Real-time quota monitoring
   - Provider failover when quotas are exceeded

4. **Suppression List Management**
   - Global suppression list for bounced emails
   - Automatic suppression on hard bounces
   - Manual suppression list management
   - Suppression reason tracking

5. **Webhook Integration**
   - Real-time delivery status updates
   - Support for multiple provider webhook formats
   - Event logging and tracking
   - Automatic status synchronization

6. **Dashboard and Monitoring**
   - Real-time statistics and metrics
   - Job status visualization
   - Provider performance monitoring
   - Historical data analysis

### Technical Features
1. **High Performance**
   - Fastify framework for optimal performance
   - Background job processing
   - Connection pooling and optimization
   - Efficient database queries

2. **Type Safety**
   - Full TypeScript implementation
   - Comprehensive type definitions
   - Compile-time error checking
   - Enhanced developer experience

3. **Scalability**
   - Horizontal scaling support
   - Database indexing for performance
   - Configurable worker processes
   - Load balancing ready

4. **Reliability**
   - Comprehensive error handling
   - Automatic retry mechanisms
   - Health check endpoints
   - Graceful shutdown handling

## API Endpoints

### Email Management
- `POST /api/email/submit` - Submit new email job
- `GET /api/email/job/:id` - Get job status
- `GET /api/email/jobs` - List all jobs with filtering
- `DELETE /api/email/job/:id` - Cancel job

### Provider Management
- `GET /api/provider/list` - Get all providers
- `PATCH /api/provider/:id/status` - Update provider status
- `POST /api/provider/:id/reset-quota` - Reset provider quota
- `GET /api/provider/stats` - Get provider statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/chart/volume` - Get volume chart data
- `GET /api/dashboard/chart/providers` - Get provider chart data

### Webhooks
- `POST /api/webhook/:provider` - Receive webhook events
- `GET /api/webhook/events` - List webhook events

### Health Check
- `GET /health` - Application health status

## Data Models

### EmailJob
```typescript
interface EmailJob {
  id: string;
  subject: string;
  body: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalTargets: number;
  processedTargets: number;
  successfulTargets: number;
  failedTargets: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### EmailTarget
```typescript
interface EmailTarget {
  id: string;
  jobId: string;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'blocked';
  providerId?: string;
  externalId?: string;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### EmailProvider
```typescript
interface EmailProvider {
  id: string;
  name: string;
  type: 'brevo' | 'mailerlite';
  apiKey: string;
  dailyQuota: number;
  usedToday: number;
  isActive: boolean;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Technology Stack

### Backend Dependencies
- **fastify**: Fast and low overhead web framework
- **@fastify/cors**: CORS support for cross-origin requests
- **@fastify/mongodb**: MongoDB plugin for Fastify
- **mongoose**: MongoDB object modeling for Node.js
- **typescript**: TypeScript language support
- **ts-node**: TypeScript execution environment
- **nodemon**: Development server with auto-restart
- **dotenv**: Environment variable management
- **uuid**: UUID generation for unique identifiers

### Frontend Dependencies
- **react**: React library for building user interfaces
- **@types/react**: TypeScript definitions for React
- **axios**: HTTP client for API requests
- **recharts**: Charting library for data visualization
- **lucide-react**: Icon library for UI components

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Nodemon**: Development server auto-restart

## Environment Configuration

### Backend Environment Variables
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/email-dispatch
BREVO_API_KEY=your_brevo_api_key
MAILERLITE_API_KEY=your_mailerlite_api_key
```

### Frontend Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```




### Database Setup

The application automatically creates the necessary database collections and indexes on first run. Default email providers (Brevo and MailerLite) are initialized with placeholder API keys.

To configure real email providers:
1. Obtain API keys from Brevo and/or MailerLite
2. Update the provider configurations via the admin dashboard
3. Set the providers as active to begin sending emails

## Usage Guide

### Submitting Email Jobs

1. **Via Web Interface**
   - Navigate to the "Submit Job" section
   - Fill in the email subject and body
   - Add recipients (individual or bulk paste)
   - Click "Submit Email Job"

2. **Via API**
   ```bash
   curl -X POST http://localhost:3001/api/email/submit \
     -H "Content-Type: application/json" \
     -d '{
       "subject": "Test Email",
       "body": "Hello from Email Dispatch Service!",
       "recipients": ["user1@example.com", "user2@example.com"]
     }'
   ```

### Monitoring Jobs

1. **Dashboard Overview**
   - View total jobs, emails, and success rates
   - Monitor provider status and quotas
   - Track today's activity

2. **Job Monitor**
   - Filter jobs by status (pending, processing, completed, failed)
   - View detailed job information
   - Track individual email delivery status

### Managing Providers

1. **Provider Status**
   - View all configured email providers
   - Monitor daily quota usage
   - Enable/disable providers as needed

2. **Quota Management**
   - Quotas reset automatically at midnight
   - Manual quota reset available for testing
   - Real-time quota tracking

## API Documentation

### Authentication
Currently, the API does not require authentication. In a production environment, implement proper authentication and authorization mechanisms.

### Request/Response Format
All API endpoints accept and return JSON data. Successful responses include a `success: true` field, while errors include `success: false` with error details.

### Error Handling
The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

### Rate Limiting
No rate limiting is currently implemented. Consider adding rate limiting for production deployments.

## Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db/email-dispatch
   PORT=3001
   ```

2. **Backend Deployment**
   ```bash
   # Build the application
   npm run build
   
   # Start with PM2 (recommended)
   npm install -g pm2
   pm2 start dist/index.js --name email-dispatch-backend
   ```

3. **Frontend Deployment**
   ```bash
   # Build for production
   npm run build
   
   # Serve with nginx or similar
   # Copy build/ contents to web server directory
   ```

### Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/email-dispatch
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Cloud Deployment Options

1. **Backend Options**
   - Heroku with MongoDB Atlas
   - AWS EC2 with RDS/DocumentDB
   - Google Cloud Run with Cloud Firestore
   - DigitalOcean App Platform

2. **Frontend Options**
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - GitHub Pages

## Configuration

### Email Provider Configuration

#### Brevo (Sendinblue)
1. Sign up at https://www.brevo.com/
2. Generate API key from account settings
3. Update provider configuration in database or via API

#### MailerLite
1. Sign up at https://www.mailerlite.com/
2. Generate API key from integrations section
3. Update provider configuration in database or via API

### MongoDB Configuration

For production deployments, consider:
- Connection pooling settings
- Read/write concerns
- Index optimization
- Backup strategies

### Performance Tuning

1. **Backend Optimization**
   - Adjust worker concurrency based on server capacity
   - Configure connection pool sizes
   - Implement caching for frequently accessed data

2. **Database Optimization**
   - Create appropriate indexes
   - Monitor query performance
   - Implement data archiving for old jobs

3. **Frontend Optimization**
   - Enable gzip compression
   - Implement lazy loading
   - Optimize bundle size

## Security Considerations

### Production Security Checklist

1. **Authentication & Authorization**
   - Implement user authentication
   - Add role-based access control
   - Secure API endpoints

2. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement proper input validation

3. **API Security**
   - Add rate limiting
   - Implement request validation
   - Use CORS appropriately

4. **Infrastructure Security**
   - Secure MongoDB instance
   - Use environment variables for secrets
   - Regular security updates

## Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   - `/health` endpoint for basic health monitoring
   - Database connectivity checks
   - Provider availability monitoring

2. **Metrics Collection**
   - Job processing metrics
   - Provider performance metrics
   - Error rate monitoring

3. **Logging**
   - Structured logging with timestamps
   - Error tracking and alerting
   - Audit trail for important operations

### Recommended Monitoring Tools

- **Application Performance**: New Relic, DataDog
- **Error Tracking**: Sentry, Rollbar
- **Infrastructure**: Prometheus + Grafana
- **Uptime Monitoring**: Pingdom, UptimeRobot


## Changelog

### Version 1.0.0
- Initial release with core functionality
- Multi-provider email dispatch
- Real-time dashboard
- Webhook integration
- Quota management

