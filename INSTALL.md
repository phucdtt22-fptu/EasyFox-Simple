# 🦊 EasyFox - AI Marketing Platform

## 🚀 One-Click Installation

### Cách 1: Script tự động (Khuyến nghị)
```bash
curl -sSL https://raw.githubusercontent.com/phucdtt22fptu/EasyFox-Simple/main/webapp/install.sh | bash
```

### Cách 2: Manual
```bash
# 1. Tạo thư mục
mkdir easyfox && cd easyfox

# 2. Tải script
wget https://raw.githubusercontent.com/phucdtt22fptu/EasyFox-Simple/main/webapp/install.sh
chmod +x install.sh

# 3. Chạy
./install.sh
```

### Cách 3: Docker Compose trực tiếp
```bash
# Tải docker-compose.yml
wget https://raw.githubusercontent.com/phucdtt22fptu/EasyFox-Simple/main/webapp/docker-compose.production.yml -O docker-compose.yml

# Sửa IP server
SERVER_IP=$(hostname -I | awk '{print $1}')
sed -i "s/your-server-ip/$SERVER_IP/g" docker-compose.yml

# Chạy
docker-compose up -d
```

## 📱 Truy cập ứng dụng

Sau khi cài đặt thành công:
- **Frontend**: `http://YOUR_SERVER_IP:3000`
- **Backend API**: `http://YOUR_SERVER_IP:3001`

## 🔧 Quản lý

```bash
# Xem logs
docker-compose logs -f

# Dừng ứng dụng
docker-compose down

# Khởi động lại
docker-compose restart

# Cập nhật phiên bản mới
docker-compose pull && docker-compose up -d
```

## 🛠️ Yêu cầu hệ thống

- Ubuntu/Debian/CentOS
- RAM: 1GB+
- Disk: 5GB+
- Docker & Docker Compose (script sẽ tự cài)

## 🌟 Tính năng

- ✅ AI Chat Assistant
- ✅ User Authentication (Supabase)
- ✅ Marketing Campaign Management  
- ✅ Content Scheduling
- ✅ Vietnamese Language Support
- ✅ Responsive UI

## 📞 Hỗ trợ

- GitHub: https://github.com/phucdtt22fptu/EasyFox-Simple
- Email: phucdtt22@gmail.com

---
*Powered by Next.js, Supabase & N8N* 🚀
