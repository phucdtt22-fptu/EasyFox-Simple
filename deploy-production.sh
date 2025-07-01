#!/bin/bash

echo "🚀 EasyFox Production Deployment"

# Update Docker images
echo "📥 Pulling latest images..."
docker pull phucdtt22fptu/easyfox-simple-fe:latest
docker pull phucdtt22fptu/easyfox-simple-be:latest

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.production.yml up -d

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
echo "📱 Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "🔧 Backend: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "📋 To view logs: docker-compose -f docker-compose.production.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.production.yml down"
