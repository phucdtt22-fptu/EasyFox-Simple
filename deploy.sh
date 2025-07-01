#!/bin/bash

echo "🚀 Building EasyFox Application"

# Copy environment file
if [ ! -f .env.production ]; then
    echo "📝 Creating production environment file..."
    cp .env.production.example .env.production
    echo "⚠️  Please edit .env.production with your actual values"
fi

# Build and start with Docker Compose
echo "🐳 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "✅ EasyFox is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
