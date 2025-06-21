#!/bin/bash

# Start Infrastructure Services
# This script starts MongoDB, RabbitMQ, and other shared infrastructure

echo "🚀 Starting Email Dispatcher Infrastructure..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start infrastructure services
echo "📦 Starting shared infrastructure services..."
cd infra && docker-compose -f docker-compose.infra.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check MongoDB
echo "🔍 Checking MongoDB..."
if docker exec shared-mongodb mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
    echo "✅ MongoDB is ready"
else
    echo "❌ MongoDB is not ready yet, please wait a moment and try again"
fi

# Check RabbitMQ
echo "🔍 Checking RabbitMQ..."
if docker exec shared-rabbitmq rabbitmq-diagnostics -q ping >/dev/null 2>&1; then
    echo "✅ RabbitMQ is ready"
    echo "🌐 RabbitMQ Management UI: http://localhost:15672"
    echo "ℹ️  Check your .env.infra file for credentials"
else
    echo "❌ RabbitMQ is not ready yet, please wait a moment and try again"
fi

echo ""
echo "✅ Infrastructure services are starting up!"
echo "📊 MongoDB: localhost:27017"
echo "🐰 RabbitMQ: localhost:5672"
echo "🌐 RabbitMQ Management: http://localhost:15672"
echo ""
echo "To start the application services, run: ./start-app.sh"
echo "To stop infrastructure, run: ./stop-infra.sh" 
