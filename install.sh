#!/bin/bash

echo "🚀 EasyFox - One-Click Deploy Script"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt. Đang cài đặt Docker..."
    sudo apt update
    sudo apt install docker.io docker-compose -y
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker đã được cài đặt. Vui lòng logout và login lại, sau đó chạy script này một lần nữa."
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "🌐 Server IP: $SERVER_IP"

# Create docker-compose file with correct IP
cat > docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    image: phucdtt22fptu/easyfox-simple-fe:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=https://niyvcieaapojhoqyinmg.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXZjaWVhYXBvamhvcXlpbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzMwODAsImV4cCI6MjA2NTIwOTA4MH0.Lc6BlY0As7UcgdVDJzTytLyEmq6TlzxTPBdUcfncLYY
      - NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: phucdtt22fptu/easyfox-simple-be:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - NEXT_PUBLIC_SUPABASE_URL=https://niyvcieaapojhoqyinmg.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXZjaWVhYXBvamhvcXlpbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzMwODAsImV4cCI6MjA2NTIwOTA4MH0.Lc6BlY0As7UcgdVDJzTytLyEmq6TlzxTPBdUcfncLYY
      - N8N_WEBHOOK_URL=https://n8n.aiphuc.com/webhook/easyfox-ai-assistant
      - JWT_SECRET=easyfox-jwt-secret-key-2025-production
      - FRONTEND_URL=http://$SERVER_IP:3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  default:
    driver: bridge
EOF

echo "📥 Pulling latest images from Docker Hub..."
docker pull phucdtt22fptu/easyfox-simple-fe:latest
docker pull phucdtt22fptu/easyfox-simple-be:latest

echo "🛑 Stopping existing containers (if any)..."
docker-compose down 2>/dev/null || true

echo "🚀 Starting EasyFox application..."
docker-compose up -d

echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "✅ EasyFox deployed successfully!"
echo "======================================"
echo "📱 Frontend: http://$SERVER_IP:3000"
echo "🔧 Backend API: http://$SERVER_IP:3001"
echo "📊 Health Check: http://$SERVER_IP:3001/health"
echo ""
echo "📋 Management commands:"
echo "  View logs:    docker-compose logs -f"
echo "  Stop app:     docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Update:       docker-compose pull && docker-compose up -d"
echo ""
echo "🎉 Happy coding with EasyFox!"
