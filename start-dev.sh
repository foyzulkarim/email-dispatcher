#!/bin/bash

# Email Dispatcher Development Startup Script

echo "🚀 Starting Email Dispatcher Development Environment"
echo "=================================================="

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    echo "⚠️  Server .env file not found. Creating from example..."
    cp server/.env.example server/.env
    echo "📝 Please edit server/.env with your configuration"
fi

if [ ! -f "client/.env.development" ]; then
    echo "⚠️  Client .env.development file not found. Creating from example..."
    cp client/.env.example client/.env.development
    echo "📝 Please edit client/.env.development with your configuration"
fi

# Function to start server
start_server() {
    echo "🔧 Starting server..."
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    echo "✅ Server started (PID: $SERVER_PID)"
}

# Function to start client
start_client() {
    echo "🎨 Starting client..."
    cd client
    npm run dev &
    CLIENT_PID=$!
    cd ..
    echo "✅ Client started (PID: $CLIENT_PID)"
}

# Start both server and client
start_server
sleep 3
start_client

echo ""
echo "🎉 Development environment started!"
echo "📊 Server: http://localhost:4000"
echo "🌐 Client: http://localhost:5173"
echo "🔐 Auth Test: http://localhost:5173/auth-test"
echo ""
echo "💡 Development Login Credentials:"
echo "   Email: dev@example.com"
echo "   Name: Developer User"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit' INT
wait
