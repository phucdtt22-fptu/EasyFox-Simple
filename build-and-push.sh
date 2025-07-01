#!/bin/bash

echo "🚀 Building and pushing EasyFox Docker images..."

# Build frontend
echo "📦 Building frontend..."
docker build -t phucdtt22/easyfox-frontend:latest .

# Build backend
echo "📦 Building backend..."
docker build -t phucdtt22/easyfox-backend:latest -f server/Dockerfile ./server

# Login to Docker Hub (you'll be prompted for credentials)
echo "🔐 Please login to Docker Hub:"
docker login

# Push frontend
echo "⬆️ Pushing frontend to Docker Hub..."
docker push phucdtt22/easyfox-frontend:latest

# Push backend
echo "⬆️ Pushing backend to Docker Hub..."
docker push phucdtt22/easyfox-backend:latest

echo "✅ Done! Both images have been pushed to Docker Hub"
echo "Frontend: phucdtt22/easyfox-frontend:latest"
echo "Backend: phucdtt22/easyfox-backend:latest"
