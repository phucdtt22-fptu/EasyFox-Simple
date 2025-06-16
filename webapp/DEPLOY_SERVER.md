# EasyFox Production Deployment

## Quick Deploy on Server

### 1. Cài đặt Docker & Docker Compose
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. Download files
```bash
# Tạo thư mục và tải files
mkdir easyfox && cd easyfox

# Tải docker-compose file
wget https://raw.githubusercontent.com/your-repo/webapp/main/docker-compose.production.yml

# Tải deploy script
wget https://raw.githubusercontent.com/your-repo/webapp/main/deploy-production.sh
chmod +x deploy-production.sh
```

### 3. Cập nhật IP server
```bash
# Lấy IP server
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"

# Sửa file docker-compose.production.yml
sed -i "s/your-server-ip/$SERVER_IP/g" docker-compose.production.yml
```

### 4. Deploy
```bash
./deploy-production.sh
```

### 5. Truy cập ứng dụng
- Frontend: `http://YOUR_SERVER_IP:3000`
- Backend API: `http://YOUR_SERVER_IP:3001`

## Domain Setup (Optional)

### Với Nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Management Commands

```bash
# Xem logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Update to latest
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Stop services
docker-compose -f docker-compose.production.yml down

# Remove everything
docker-compose -f docker-compose.production.yml down -v --rmi all
```

## Monitoring

```bash
# Container status
docker-compose -f docker-compose.production.yml ps

# Resource usage
docker stats

# Health check
curl http://localhost:3001/health
```

## Environment Variables (Pre-configured)

- ✅ Supabase URL & Key
- ✅ N8N Webhook URL  
- ✅ JWT Secret
- ✅ All production settings

Không cần file .env - tất cả đã được cấu hình sẵn trong docker-compose.production.yml
