#!/bin/bash

# Stop Application Services Only
# This keeps infrastructure services running

echo "🛑 Stopping Email Dispatcher Application..."

# Stop application services
docker-compose -f docker-compose.dev.yml down

echo "✅ Application services stopped!"
echo "ℹ️  Infrastructure services are still running"
echo "📊 MongoDB: localhost:27017"
echo "🐰 RabbitMQ: localhost:5672"
echo ""
echo "To restart application: ./start-app.sh"
echo "To stop infrastructure: ./stop-infra.sh" 
