# Email Dispatcher - Full Stack Application

A comprehensive email dispatch service with intelligent provider switching, queue management, and monitoring capabilities.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + TypeScript + Fastify + MongoDB + RabbitMQ
- **Infrastructure**: Docker + Docker Compose + Nginx
- **CI/CD**: GitHub Actions with automated testing and deployment

## 🚀 Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/email-dispatcher.git
   cd email-dispatcher
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration
   ```

3. **Start with Docker Compose**
   ```bash
   # Start all services in development mode
   docker compose -f docker-compose.dev.yml up -d
   
   # View logs
   docker compose -f docker-compose.dev.yml logs -f
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - RabbitMQ Management: http://localhost:15672 (admin/password123)
   - MongoDB: localhost:27017

### Production Deployment

#### Option 1: Self-hosted VPS

1. **Setup VPS** (Ubuntu 20.04+ recommended)
   ```bash
   # Download and run setup script
   wget https://raw.githubusercontent.com/your-username/email-dispatcher/main/deploy/setup-vps.sh
   chmod +x setup-vps.sh
   sudo DOMAIN=yourdomain.com ./setup-vps.sh
   ```

2. **Configure environment**
   ```bash
   cd /opt/email-dispatcher
   sudo nano .env
   # Add your actual configuration
   ```

3. **Deploy**
   ```bash
   sudo -u emaildispatcher ./deploy.sh
   ```

#### Option 2: Using External Services

For production with external MongoDB and RabbitMQ:

```bash
# Copy environment template
cp .env.example .env

# Edit with your external service URLs
MONGODB_URI=mongodb://user:pass@your-mongodb-cluster/email_service
RABBITMQ_URL=amqp://user:pass@your-rabbitmq-instance

# Deploy without self-hosted services
docker compose -f docker-compose.prod.yml up -d
```

#### Option 3: With Self-hosted Database

```bash
# Deploy with MongoDB and RabbitMQ included
docker compose -f docker-compose.prod.yml --profile with-db --profile with-queue up -d
```

## 🛠️ Development

### Local Development without Docker

#### Backend Setup
```bash
cd server
npm install
cp environment-template.txt .env

# Start MongoDB and RabbitMQ (via Docker)
docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7-jammy
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=password123 rabbitmq:3-management-alpine

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Testing

#### Backend Tests
```bash
cd server
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # With coverage report
```

#### Frontend Tests
```bash
cd client
npm run lint               # ESLint
npm run build              # Production build test
```

## 📋 Docker Commands Reference

### Development
```bash
# Start development environment
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f [service]

# Rebuild services
docker compose -f docker-compose.dev.yml up -d --build

# Stop services
docker compose -f docker-compose.dev.yml down
```

### Production
```bash
# Deploy production
docker compose -f docker-compose.prod.yml up -d

# Update deployment
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# View production logs
docker compose -f docker-compose.prod.yml logs -f

# Scale services
docker compose -f docker-compose.prod.yml up -d --scale server=2
```

### Useful Commands
```bash
# Execute commands in containers
docker compose exec server npm run build
docker compose exec client npm run lint

# Database operations
docker compose exec mongodb mongosh -u admin -p password123
docker compose exec server npm run db:migrate

# Cleanup
docker compose down -v  # Remove volumes
docker system prune -a  # Clean up Docker
```

## 🔧 Configuration

### Environment Variables

#### Required
- `MONGODB_URI`: MongoDB connection string
- `RABBITMQ_URL`: RabbitMQ connection URL
- `DEFAULT_FROM_EMAIL`: Verified sender email
- `DEFAULT_FROM_NAME`: Sender name

#### Email Providers (at least one required)
- `BREVO_API_KEY`: Brevo API key
- `SENDGRID_API_KEY`: SendGrid API key
- `MAILJET_API_KEY`: Mailjet public:private key

#### Optional
- `FORCE_DEBUG_MODE`: Save emails as files instead of sending
- `TEST_EMAIL`: Test recipient email

### Docker Compose Profiles

- `with-db`: Include self-hosted MongoDB
- `with-queue`: Include self-hosted RabbitMQ
- `with-logging`: Include log aggregation

Example:
```bash
docker compose -f docker-compose.prod.yml --profile with-db --profile with-queue up -d
```

## 🚀 CI/CD Pipeline

The project includes a comprehensive GitHub Actions pipeline:

### Features
- ✅ Automated testing (unit + integration)
- 🔍 Security scanning with Trivy
- 🐳 Docker image building and pushing
- 🚀 Automated deployment to VPS
- 📊 Test coverage reporting

### Setup GitHub Secrets

For deployment, configure these secrets in your GitHub repository:

```
VPS_HOST=your-server-ip
VPS_USERNAME=your-ssh-username
VPS_SSH_KEY=your-private-ssh-key
VPS_PORT=22

# Optional: for staging environment
STAGING_VPS_HOST=your-staging-server-ip
```

### Workflow Triggers
- **Push to `main`**: Deploy to production
- **Push to `develop`**: Deploy to staging
- **Pull requests**: Run tests and security scans

## 📊 Monitoring & Logging

### Health Checks
- Frontend: `http://localhost/`
- Backend: `http://localhost:4000/health`

### Log Locations
- Application logs: `docker compose logs -f`
- Health check logs: `/opt/email-dispatcher/logs/health-check.log`
- Nginx logs: `/var/log/nginx/`

### Monitoring Commands
```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Application metrics
curl http://localhost:4000/api/dashboard/stats
```

## 🔒 Security

### Features
- Non-root container users
- Security headers in Nginx
- Firewall configuration (UFW)
- Fail2ban protection
- SSL/TLS with Let's Encrypt
- Vulnerability scanning in CI/CD

### Best Practices
- Regular security updates
- Strong passwords for services
- Network isolation with Docker networks
- Regular backups
- Log monitoring

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
docker compose exec mongodb mongodump --out /backup --authenticationDatabase admin -u admin -p password123

# Restore backup
docker compose exec mongodb mongorestore /backup --authenticationDatabase admin -u admin -p password123
```

### Application Data
```bash
# Backup volumes
docker run --rm -v email-dispatcher_mongodb_data:/source -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /source .

# Restore volumes
docker run --rm -v email-dispatcher_mongodb_data:/target -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /target
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep 4000
   ```

2. **Docker permission issues**
   ```bash
   sudo chmod 666 /var/run/docker.sock
   # Or add user to docker group
   sudo usermod -aG docker $USER
   ```

3. **Memory issues**
   ```bash
   # Check Docker memory usage
   docker stats
   # Increase Docker memory limits
   ```

4. **Database connection issues**
   ```bash
   # Check MongoDB logs
   docker compose logs mongodb
   # Test connection
   docker compose exec server npm run db:test
   ```

### Getting Help

- Check the [Issues](https://github.com/your-username/email-dispatcher/issues) page
- Review application logs: `docker compose logs -f`
- Check the documentation in the `docs/` directory
