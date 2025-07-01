#!/bin/bash

echo "🚀 Building and pushing EasyFox Docker images for production..."

# Set the correct Docker Hub username based on docker-compose.production.yml
DOCKER_USERNAME="phucdtt22fptu"
FE_IMAGE_NAME="easyfox-simple-fe"
BE_IMAGE_NAME="easyfox-simple-be"
TAG="latest"

# Build frontend
echo "📦 Building frontend..."
docker build -t ${DOCKER_USERNAME}/${FE_IMAGE_NAME}:${TAG} .

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
