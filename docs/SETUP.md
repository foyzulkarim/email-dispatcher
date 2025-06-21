# Email Dispatcher Setup Guide

This guide explains how to set up and run the Email Dispatcher with separated infrastructure and application services.

## Architecture Overview

The system is now split into two main components:

1. **Infrastructure Services** (`infra/`): Shared services like MongoDB, RabbitMQ, Redis, etc.
2. **Application Services** (`docker-compose.dev.yml`): Email Dispatcher server and client

This separation allows you to:
- Deploy infrastructure services in the cloud while running the application locally
- Share infrastructure between multiple applications
- Scale infrastructure and application services independently

## Quick Start

### 1. Start Infrastructure Services

First, start the shared infrastructure services:

```bash
./start-infra.sh
```

This will start:
- MongoDB on port 27017
- RabbitMQ on port 5672 (Management UI on 15672)
- Redis on port 6379 (optional)

### 2. Start Application Services

Once infrastructure is running, start the application:

```bash
./start-app.sh
```

This will start:
- Email Dispatcher Server on port 3001
- Email Dispatcher Client on port 8080

### 3. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **RabbitMQ Management**: http://localhost:15672 (admin/password123)

## Manual Setup

### Infrastructure Services

1. **Configure Environment** (optional):
   ```bash
   cd infra
   cp env.infra.example .env
   # Edit .env with your preferred settings
   ```

2. **Start Infrastructure**:
   ```bash
   cd infra
   docker-compose -f docker-compose.infra.yml up -d
   ```

### Application Services

1. **Start Application**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

## Stopping Services

### Stop Application Only
```bash
./stop-app.sh
# or
docker-compose -f docker-compose.dev.yml down
```

### Stop All Services
```bash
./stop-infra.sh
# or manually:
docker-compose -f docker-compose.dev.yml down
cd infra && docker-compose -f docker-compose.infra.yml down
```

## Troubleshooting

### MongoDB Connection Issues

If you see `ECONNREFUSED` errors:

1. **Check if infrastructure is running**:
   ```bash
   docker ps | grep shared-mongodb
   ```

2. **Check MongoDB logs**:
   ```bash
   docker logs shared-mongodb
   ```

3. **Verify network connectivity**:
   ```bash
   docker exec email-dispatcher-server-dev ping shared-mongodb
   ```

### RabbitMQ Connection Issues

1. **Check RabbitMQ status**:
   ```bash
   docker exec shared-rabbitmq rabbitmq-diagnostics status
   ```

2. **Access RabbitMQ Management**:
   - URL: http://localhost:15672
   - Username: admin
   - Password: password123

### Service Health Checks

The application services include health checks that wait for infrastructure to be ready:

- `mongodb-check`: Ensures MongoDB is accessible
- `rabbitmq-check`: Ensures RabbitMQ is accessible

## Development Workflow

### Development with Hot Reload

Both services support hot reload in development:

1. **Server**: Changes to `server/src` trigger automatic rebuilds
2. **Client**: Changes to `client/src` trigger automatic rebuilds

### Viewing Logs

```bash
# Application logs
docker-compose -f docker-compose.dev.yml logs -f

# Infrastructure logs
cd infra && docker-compose -f docker-compose.infra.yml logs -f

# Specific service logs
docker logs email-dispatcher-server-dev
docker logs shared-mongodb
```

## Production Deployment

### Cloud Infrastructure

You can deploy the infrastructure services to cloud providers:

1. **AWS**: Use ECS, EKS, or EC2 with the infrastructure docker-compose
2. **Google Cloud**: Use Cloud Run, GKE, or Compute Engine
3. **Azure**: Use Container Instances, AKS, or Virtual Machines

### Environment Variables

For production, update these environment variables:

```env
# In docker-compose.dev.yml
MONGODB_URI=mongodb://your-cloud-mongodb:27017/email-dispatcher-db
RABBITMQ_URL=amqp://user:pass@your-cloud-rabbitmq:5672/email-dispatcher
```

## Network Configuration

### Docker Networks

- `infra_shared-infra`: External network for infrastructure services
- `app-network`: Internal network for application services

### Port Reference

| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27017 | Database |
| RabbitMQ | 5672 | Message Queue |
| RabbitMQ Management | 15672 | Web UI |
| Redis | 6379 | Cache (optional) |
| Email Server | 3001 | Backend API |
| Email Client | 8080 | Frontend |

## Security Notes

### Default Credentials

The default setup uses simple credentials for development. For production:

1. **Change all passwords** in `infra/.env`
2. **Use environment variables** for sensitive data
3. **Enable authentication** on all services
4. **Use SSL/TLS** for external connections

### Network Security

- Infrastructure services are isolated in their own network
- Application services can only access infrastructure through defined networks
- External access is limited to necessary ports only

## Customization

### Adding New Infrastructure Services

1. Add service to `infra/docker-compose.infra.yml`
2. Update network configuration
3. Add health checks if needed
4. Update environment variables

### Modifying Application Configuration

1. Update `docker-compose.dev.yml`
2. Modify environment variables
3. Update network configuration if needed

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker ps`
3. Check network connectivity between services
4. Ensure all required ports are available
5. Review the MongoDB and RabbitMQ connection strings 
