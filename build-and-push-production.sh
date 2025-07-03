#!/bin/bash

echo "🚀 Building and pushing EasyFox Docker images for production..."

# Set the correct Docker Hub username based on docker-compose.production.yml
DOCKER_USERNAME="phucdtt22fptu"
FE_IMAGE_NAME="easyfox-simple-fe"
BE_IMAGE_NAME="easyfox-simple-be"
TAG="latest"

# Build frontend with required environment variables
echo "📦 Building frontend..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://niyvcieaapojhoqyinmg.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXZjaWVhYXBvamhvcXlpbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzMwODAsImV4cCI6MjA2NTIwOTA4MH0.Lc6BlY0As7UcgdVDJzTytLyEmq6TlzxTPBdUcfncLYY" \
  --build-arg NEXT_PUBLIC_API_URL="https://be.tinmoius.com" \
  -t ${DOCKER_USERNAME}/${FE_IMAGE_NAME}:${TAG} .

# Build backend
echo "📦 Building backend..."
docker build -t ${DOCKER_USERNAME}/${BE_IMAGE_NAME}:${TAG} -f server/Dockerfile ./server

# Login to Docker Hub (you'll be prompted for credentials)
echo "🔐 Please login to Docker Hub:"
docker login

# Push frontend
echo "⬆️ Pushing frontend to Docker Hub..."
docker push ${DOCKER_USERNAME}/${FE_IMAGE_NAME}:${TAG}

# Push backend
echo "⬆️ Pushing backend to Docker Hub..."
docker push ${DOCKER_USERNAME}/${BE_IMAGE_NAME}:${TAG}

echo "✅ Done! Both images have been pushed to Docker Hub"
echo "Frontend: ${DOCKER_USERNAME}/${FE_IMAGE_NAME}:${TAG}"
echo "Backend: ${DOCKER_USERNAME}/${BE_IMAGE_NAME}:${TAG}"
