#!/bin/bash

# Start Application Services
# This script starts the email dispatcher server and client

echo "🚀 Starting Email Dispatcher Application..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if infrastructure services are accessible
echo "🔍 Checking infrastructure services..."

# Check MongoDB accessibility (port 27017)
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not accessible on localhost:27017. Please start infrastructure first:"
    echo "   ./start-infra.sh"
    exit 1
fi

# Check RabbitMQ accessibility (port 5672)
if ! nc -z localhost 5672 2>/dev/null; then
    echo "❌ RabbitMQ is not accessible on localhost:5672. Please start infrastructure first:"
    echo "   ./start-infra.sh"
    exit 1
fi

echo "✅ Infrastructure services are running"

# Start application services
echo "📦 Starting application services..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Application services are starting up!"
echo "🖥️  Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:4000"
echo ""
echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "To stop application: docker-compose -f docker-compose.dev.yml down" 
