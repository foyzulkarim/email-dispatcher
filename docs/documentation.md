# Email Dispatcher - Project Documentation

This document provides a comprehensive overview of all files and directories in the Email Dispatcher project, explaining their purpose and important components.

## 📁 Project Structure Overview

```
email-dispatcher/
├── 📁 client/          # React frontend application
├── 📁 server/          # Node.js backend API
├── 📁 infra/           # Shared infrastructure (MongoDB, RabbitMQ)
├── 📁 deploy/          # Production deployment configurations
├── 📁 docs/            # Additional documentation
├── 📁 .github/         # GitHub Actions CI/CD workflows
└── 🔧 Configuration files
```

---

## 🎯 Root Level Files

### `README.md`
**Purpose**: Main project documentation and setup guide
**Key Sections**:
- Architecture overview (React + Node.js + MongoDB + RabbitMQ)
- Quick start instructions for development and production
- Environment setup and configuration
- Deployment options (VPS, Docker, cloud services)

### `Makefile`
**Purpose**: Automation commands for Docker operations and development workflow
**Important Commands**:
- `make infra-up`: Start shared infrastructure (MongoDB, RabbitMQ)
- `make dev`: Start development environment
- `make prod`: Start production environment
- `make test`: Run all tests
- `make clean`: Clean up containers and volumes

### `app.env.example`
**Purpose**: Template for application environment variables
**Key Configuration Areas**:
- Database connections (MongoDB URI)
- Message queue (RabbitMQ URL)
- Email provider API keys (Brevo, SendGrid, Mailjet, MailerLite)
- Default sender information
- Debug mode settings

### Docker Compose Files

#### `docker-compose.dev.yml`
**Purpose**: Development environment configuration
**Services**: Frontend, Backend, with hot-reload and development optimizations

#### `docker-compose.prod.yml`
**Purpose**: Production environment configuration
**Services**: Optimized builds, Nginx reverse proxy, production settings

### `.gitignore`
**Purpose**: Specifies files/directories to exclude from Git
**Key Exclusions**: node_modules, .env files, build artifacts, logs

### `.dockerignore`
**Purpose**: Excludes files from Docker build context for faster builds

---

## 🖥️ Client Directory (`/client/`)

### Purpose
React-based frontend application with modern UI components and TypeScript support.

### Key Files

#### `package.json`
**Dependencies**:
- **React 18**: Core framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built UI components
- **React Query**: Server state management
- **React Router**: Client-side routing
- **React Hook Form**: Form handling
- **Zod**: Schema validation

#### `Dockerfile`
**Purpose**: Multi-stage build for production
**Stages**:
1. Build stage: Compile TypeScript and bundle assets
2. Production stage: Nginx server with optimized static files

#### `nginx.conf`
**Purpose**: Nginx configuration for serving React app
**Features**: SPA routing support, gzip compression, caching headers

#### `vite.config.ts`
**Purpose**: Vite build tool configuration
**Settings**: React plugin, build optimizations, dev server proxy

#### `tailwind.config.ts`
**Purpose**: Tailwind CSS configuration
**Customizations**: Theme colors, component styles, animations

### Source Structure (`/client/src/`)

#### `main.tsx`
**Purpose**: Application entry point, React DOM rendering

#### `App.tsx`
**Purpose**: Root component with routing and global providers

#### `/pages/`
**Purpose**: Route components for different application views
**Typical Pages**: Dashboard, Email Composer, Analytics, Settings

#### `/components/`
**Purpose**: Reusable UI components
**Structure**: 
- `/ui/`: Basic shadcn/ui components
- Feature-specific components

#### `/hooks/`
**Purpose**: Custom React hooks for shared logic

#### `/services/`
**Purpose**: API client functions and external service integrations

#### `/types/`
**Purpose**: TypeScript type definitions

---

## 🔧 Server Directory (`/server/`)

### Purpose
Node.js backend API with TypeScript, providing email dispatch services with intelligent provider switching.

### Key Files

#### `package.json`
**Dependencies**:
- **Fastify**: High-performance web framework
- **TypeScript**: Type safety
- **MongoDB/Mongoose**: Database and ODM
- **amqplib**: RabbitMQ client
- **axios**: HTTP client for email providers
- **mustache**: Template engine
- **uuid**: Unique identifier generation

**Dev Dependencies**:
- **Jest**: Testing framework
- **Supertest**: HTTP testing
- **nodemon**: Development auto-restart

#### `Dockerfile`
**Purpose**: Multi-stage build for Node.js application
**Stages**:
1. Build stage: Install dependencies and compile TypeScript
2. Production stage: Minimal runtime with compiled JavaScript

#### `tsconfig.json`
**Purpose**: TypeScript compiler configuration
**Settings**: Target ES2020, strict mode, module resolution

#### `jest.config.js`
**Purpose**: Jest testing framework configuration
**Settings**: TypeScript support, test patterns, coverage

#### `mongo-init.js`
**Purpose**: MongoDB initialization script
**Function**: Creates database, collections, and initial indexes

### Source Structure (`/server/src/`)

#### `index.ts`
**Purpose**: Application entry point
**Responsibilities**: Server startup, middleware registration, route mounting

#### `/config/`
**Purpose**: Configuration management
**Files**: Database config, environment variables, provider settings

#### `/models/`
**Purpose**: MongoDB/Mongoose data models
**Key Models**:
- Email schema
- Provider configuration
- Queue status
- Analytics data

#### `/routes/`
**Purpose**: API endpoint definitions
**Structure**: RESTful routes for emails, providers, analytics, health checks

#### `/services/`
**Purpose**: Business logic and external integrations
**Key Services**:
- Email provider clients (Brevo, SendGrid, Mailjet, MailerLite)
- Queue management
- Provider switching logic
- Template processing
- Analytics collection

#### `/types/`
**Purpose**: TypeScript type definitions for API contracts

#### `/utils/`
**Purpose**: Utility functions and helpers

### Test Structure (`/server/tests/`)

#### `/unit/`
**Purpose**: Unit tests for individual functions and classes

#### `/integration/`
**Purpose**: Integration tests for API endpoints and services

---

## 🏗️ Infrastructure Directory (`/infra/`)

### Purpose
Shared infrastructure services that can be used across development and production environments.

### Key Files

#### `docker-compose.infra.yml`
**Purpose**: Infrastructure services configuration
**Services**:
- **MongoDB**: Document database with authentication
- **RabbitMQ**: Message queue with management UI
- **Optional monitoring**: Prometheus, Grafana (with profile)

#### `env.infra.example`
**Purpose**: Environment variables for infrastructure services
**Variables**: Database credentials, queue settings, monitoring config

#### `/mongo-init/`
**Purpose**: MongoDB initialization scripts
**Function**: Database setup, user creation, index creation

#### `/rabbitmq/`
**Purpose**: RabbitMQ configuration files
**Contents**: Queue definitions, exchange setup, policies

---

## 🚀 Deploy Directory (`/deploy/`)

### Purpose
Production deployment configurations and scripts for VPS deployment.

### Key Files

#### `docker-compose.vps.yml`
**Purpose**: Complete production stack for VPS deployment
**Services**: Application services + infrastructure + monitoring + logging

#### `setup-vps.sh`
**Purpose**: Automated VPS setup script
**Functions**:
- Docker installation
- SSL certificate setup (Let's Encrypt)
- Firewall configuration
- System optimization

#### `nginx.prod.conf`
**Purpose**: Production Nginx configuration
**Features**:
- SSL termination
- Reverse proxy to backend
- Static file serving
- Security headers
- Rate limiting

#### `fluent-bit.conf`
**Purpose**: Log aggregation and forwarding configuration
**Function**: Collect and forward application logs

---

## 📚 Documentation Directory (`/docs/`)

### Purpose
Additional project documentation and guides.

**Typical Contents**:
- API documentation
- Architecture diagrams
- Deployment guides
- Troubleshooting guides

---

## 🔄 GitHub Directory (`/.github/`)

### Purpose
GitHub-specific configurations and CI/CD workflows.

### `/workflows/`
**Purpose**: GitHub Actions workflow definitions
**Typical Workflows**:
- Automated testing on pull requests
- Build and deployment pipelines
- Security scanning
- Dependency updates

---

## 📋 Important Configuration Files

### `README_DYNAMIC_PROVIDERS.md`
**Purpose**: Documentation for dynamic email provider switching
**Content**: Provider configuration, failover logic, quota management

### `INFRASTRUCTURE.md`
**Purpose**: Infrastructure setup and management guide
**Content**: Service dependencies, scaling considerations, monitoring setup

---

## 🔑 Key Architectural Decisions

### 1. **Microservices Architecture**
- Separate frontend and backend services
- Shared infrastructure layer
- Independent scaling and deployment

### 2. **Message Queue Integration**
- RabbitMQ for reliable email processing
- Asynchronous job processing
- Retry mechanisms and dead letter queues

### 3. **Multi-Provider Email Strategy**
- Intelligent provider switching
- Quota management and rate limiting
- Failover and redundancy

### 4. **Container-First Approach**
- Docker for consistent environments
- Docker Compose for orchestration
- Multi-stage builds for optimization

### 5. **TypeScript Throughout**
- Type safety in both frontend and backend
- Better developer experience
- Reduced runtime errors

---

## 🚨 Important Notes for Development

### Environment Setup Priority
1. Start with `make infra-up` (shared infrastructure)
2. Copy and configure `app.env.example` to `.env`
3. Run `make dev` for development environment

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows

### Security Considerations
- Environment variables for sensitive data
- API key rotation and management
- Rate limiting and input validation
- HTTPS in production

### Monitoring and Observability
- Application logs via Fluent Bit
- Health check endpoints
- Performance metrics collection
- Error tracking and alerting

This documentation should help you understand the purpose and structure of each component in the Email Dispatcher project. Each file serves a specific role in creating a robust, scalable email dispatch service.
