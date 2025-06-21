# Email Dispatcher - Docker Management Makefile

.PHONY: help build dev prod up down logs clean test install setup

# Default target
help: ## Show this help message
	@echo "Email Dispatcher - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Infrastructure commands
infra-up: ## Start shared infrastructure (MongoDB, RabbitMQ, etc.)
	cd infra && docker compose -f docker-compose.infra.yml up -d

infra-down: ## Stop shared infrastructure
	cd infra && docker compose -f docker-compose.infra.yml down

infra-logs: ## Show infrastructure logs
	cd infra && docker compose -f docker-compose.infra.yml logs -f

infra-clean: ## Stop infrastructure and remove volumes
	cd infra && docker compose -f docker-compose.infra.yml down -v

infra-monitoring: ## Start infrastructure with monitoring
	cd infra && docker compose -f docker-compose.infra.yml --profile with-monitoring up -d

# Development commands
dev: ## Start development environment 
	docker compose -f docker-compose.dev.yml up -d

dev-build: ## Build and start development environment
	docker compose -f docker-compose.dev.yml up -d --build

dev-logs: ## Show development logs
	docker compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop development environment
	docker compose -f docker-compose.dev.yml down

dev-clean: ## Stop development environment and remove volumes
	docker compose -f docker-compose.dev.yml down -v

dev-full: ## Start infrastructure and development environment
	$(MAKE) infra-up
	sleep 10
	$(MAKE) dev

dev-full-down: ## Stop both development and infrastructure
	$(MAKE) dev-down
	$(MAKE) infra-down

# Production commands
prod: ## Start production environment
	docker compose -f docker-compose.prod.yml up -d

prod-build: ## Build and start production environment
	docker compose -f docker-compose.prod.yml up -d --build

prod-logs: ## Show production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-external: ## Start production with external services (MongoDB Atlas, etc.)
	docker compose -f docker-compose.prod.yml up -d

# VPS deployment commands
vps-deploy: ## Deploy to VPS (production)
	docker compose -f deploy/docker-compose.vps.yml pull
	docker compose -f deploy/docker-compose.vps.yml up -d --remove-orphans

vps-logs: ## Show VPS deployment logs
	docker compose -f deploy/docker-compose.vps.yml logs -f

vps-down: ## Stop VPS deployment
	docker compose -f deploy/docker-compose.vps.yml down

# Testing
test: ## Run all tests
	@echo "Running server tests..."
	cd server && npm test
	@echo "Running client linting..."
	cd client && npm run lint

test-server: ## Run server tests only
	cd server && npm test

test-client: ## Run client tests/linting
	cd client && npm run lint && npm run build

test-coverage: ## Run tests with coverage
	cd server && npm run test:coverage

# Installation and setup
install: ## Install dependencies for both client and server
	@echo "Installing server dependencies..."
	cd server && npm ci
	@echo "Installing client dependencies..."
	cd client && npm ci

setup: ## Initial project setup
	@echo "Setting up environment..."
	cp server/environment-template.txt server/.env
	@echo "Server environment file created. Please edit server/.env with your configuration."
	@echo "Setting up infrastructure environment..."
	cd infra && cp env.infra.example .env
	@echo "Infrastructure environment file created."
	@echo "Installing dependencies..."
	$(MAKE) install
	@echo "Setup complete!"
	@echo "1. Edit server/.env with your application configuration"
	@echo "2. Edit infra/.env with your infrastructure configuration"
	@echo "3. Run 'make dev-full' to start with local infrastructure"
	@echo "   OR 'make dev' if using external services"

# Database operations (infrastructure)
db-reset: ## Reset shared MongoDB database
	cd infra && docker compose -f docker-compose.infra.yml down mongodb
	cd infra && docker volume rm infra_mongodb_data 2>/dev/null || true
	cd infra && docker compose -f docker-compose.infra.yml up -d mongodb

db-backup: ## Backup shared database
	cd infra && docker compose exec mongodb mongodump --out /backup --authenticationDatabase admin -u admin

db-shell: ## Open MongoDB shell (shared infra)
	cd infra && docker compose exec mongodb mongosh -u admin

db-shell-app: ## Open MongoDB shell for app database
	cd infra && docker compose exec mongodb mongosh -u emailservice email_service

# Utility commands
logs: ## Show logs for all services (development)
	docker compose -f docker-compose.dev.yml logs -f

ps: ## Show running containers
	docker compose ps

stats: ## Show container resource usage
	docker stats

clean: ## Clean up Docker resources
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up all Docker resources (destructive)
	docker system prune -a -f
	docker volume prune -f

# Health checks
health: ## Check application health
	@echo "Checking frontend health..."
	curl -f http://localhost:8080/ > /dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: FAILED"
	@echo "Checking backend health..."
	curl -f http://localhost:3001/health > /dev/null && echo "✅ Backend: OK" || echo "❌ Backend: FAILED"

# Development helpers
shell-server: ## Open shell in server container
	docker compose exec server /bin/sh

shell-client: ## Open shell in client container
	docker compose exec client /bin/sh

shell-db: ## Open shell in database container
	docker compose exec mongodb /bin/bash

restart: ## Restart all development services
	docker compose -f docker-compose.dev.yml restart

restart-server: ## Restart server service
	docker compose -f docker-compose.dev.yml restart server

restart-client: ## Restart client service
	docker compose -f docker-compose.dev.yml restart client

# Build commands
build-server: ## Build server Docker image
	docker build -t email-dispatcher-server:latest ./server

build-client: ## Build client Docker image
	docker build -t email-dispatcher-client:latest ./client

build-all: ## Build all Docker images
	$(MAKE) build-server
	$(MAKE) build-client

# Monitoring
monitor: ## Show real-time container stats
	watch docker compose ps

tail-logs: ## Tail all logs
	docker compose -f docker-compose.dev.yml logs -f --tail=100

# Backup and restore
backup: ## Create backup of volumes
	mkdir -p backups
	docker run --rm -v email-dispatcher_mongodb_data_dev:/source -v $(PWD)/backups:/backup alpine tar czf /backup/mongodb-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /source .

restore: ## Restore from backup (specify BACKUP_FILE=filename)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Please specify BACKUP_FILE=filename"; exit 1; fi
	docker run --rm -v email-dispatcher_mongodb_data_dev:/target -v $(PWD)/backups:/backup alpine tar xzf /backup/$(BACKUP_FILE) -C /target 
