# EasyFox Docker Deployment

## Quick Start

### 1. Setup Environment
```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

### 2. Deploy with Docker Compose
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 3. Manual Docker Commands

#### Build Images
```bash
# Build backend
docker build -t easyfox-backend ./server

# Build frontend
docker build -t easyfox-frontend .
```

#### Run Containers
```bash
# Run backend
docker run -d \
  --name easyfox-backend \
  -p 3001:3001 \
  --env-file .env.production \
  easyfox-backend

# Run frontend
docker run -d \
  --name easyfox-frontend \
  -p 3000:3000 \
  --env-file .env.production \
  --link easyfox-backend:backend \
  easyfox-frontend
```

## Production Deployment

### Environment Variables Required

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

**N8N:**
- `N8N_WEBHOOK_URL`: Your N8N webhook endpoint

**Security:**
- `JWT_SECRET`: Strong secret for JWT tokens
- `FRONTEND_URL`: Your frontend domain (for CORS)

### Domain Setup

For production with custom domain:

1. Update `NEXT_PUBLIC_API_URL` in `.env.production`
2. Update `FRONTEND_URL` for CORS
3. Configure reverse proxy (nginx/traefik)

Example nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Health Checks
```bash
# Frontend health
curl http://localhost:3000

# Backend health
curl http://localhost:3001/health
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Container Status
```bash
# List running containers
docker-compose ps

# Container resource usage
docker stats
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Environment variables**: Check .env.production file
3. **Network issues**: Ensure containers can communicate
4. **Database connection**: Verify Supabase credentials

### Debug Commands
```bash
# Execute shell in container
docker-compose exec backend sh
docker-compose exec frontend sh

# View container logs
docker logs easyfox-backend
docker logs easyfox-frontend

# Restart services
docker-compose restart
```
