#!/bin/bash

# Stop Infrastructure Services

echo "🛑 Stopping Email Dispatcher Infrastructure..."

# Stop application services first (if running)
if docker-compose -f docker-compose.dev.yml ps -q >/dev/null 2>&1; then
    echo "📦 Stopping application services first..."
    docker-compose -f docker-compose.dev.yml down
fi

# Stop infrastructure services
echo "📦 Stopping infrastructure services..."
cd infra && docker-compose -f docker-compose.infra.yml down

echo "✅ All services stopped!" 
