# EasyFox Marketing Platform

Nền tảng marketing tự động hóa dành cho các doanh nghiệp nhỏ và vừa tại Mỹ.

## 🚀 Tính năng chính

- **Trợ lý AI Marketing**: Chat với AI để tạo chiến dịch và nội dung
- **Onboarding tự động**: AI thu thập thông tin doanh nghiệp
- **Quản lý chiến dịch**: Tạo và theo dõi các chiến dịch marketing
- **Lịch đăng bài**: Lên lịch nội dung cho nhiều mạng xã hội
- **Tạo nội dung 4 tầng**: Content Pillars → Categories → Angles → Brief
- **Giao diện chat hiện đại**: Hỗ trợ markdown và syntax highlighting

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: N8N workflows
- **Styling**: TailwindCSS với theme cam/đỏ

## 📋 Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- Supabase account
- N8N instance (cho AI backend)

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repo-url>
cd webapp
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình environment variables
Tạo file `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# N8N Configuration
N8N_WEBHOOK_URL=your_n8n_webhook_url

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

### 4. Setup Database
1. Tạo project mới trên [Supabase](https://supabase.com)
2. Chạy SQL schema trong `database/schema.sql`
3. Enable RLS trên tất cả tables

### 5. Chạy ứng dụng
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng biệt:
# Frontend
npm run dev

# Backend  
npm run server:dev
```

## 📁 Cấu trúc thư mục

```
webapp/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── login/          # Trang đăng nhập
│   │   ├── register/       # Trang đăng ký
│   │   └── page.tsx        # Trang chủ
│   ├── components/         # React components
│   │   ├── ChatInterface.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── context/           # React Context
│   │   └── AuthContext.tsx
│   ├── hooks/             # Custom hooks
│   │   └── useChat.ts
│   ├── lib/               # Utilities
│   │   └── supabase.ts
│   └── types/             # TypeScript types
│       └── index.ts
├── server/                # Express backend
│   ├── index.js          # Main server file
│   └── package.json      # Backend dependencies
├── database/             # Database schema
│   └── schema.sql
└── .github/
    └── copilot-instructions.md
```

## 🗄 Database Schema

### Tables
- **users**: Thông tin người dùng (extends Supabase auth)
- **chat_history**: Lịch sử trò chuyện với AI
- **campaigns**: Thông tin chiến dịch marketing
- **schedule**: Lịch đăng bài với cấu trúc 4 tầng
- **settings**: Cài đặt người dùng

### 4-Tier Content Structure
1. **Content Pillars**: Trụ cột định hướng (4-6 pillars)
2. **Content Categories**: Loại nội dung cụ thể
3. **Content Angles**: Góc nhìn triển khai
4. **Content Brief**: Nội dung chi tiết được AI tạo

## 🔧 API Endpoints

### Backend API (Express)
- `POST /api/chat`: Gửi tin nhắn tới AI
- `GET /api/campaigns/:userId`: Lấy campaigns của user
- `GET /api/schedule/:userId`: Lấy lịch đăng bài
- `GET /health`: Health check

### N8N Integration
Backend sẽ gọi N8N webhook với payload:
```json
{
  "question": "user question",
  "user_id": "uuid",
  "chat_history_id": "string", 
  "user_info": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "notes": "string|null"
  },
  "chat_history": [...previous_messages]
}
```

## 🎨 UI/UX Design

- **Colors**: Orange (#f97316) và Red (#dc2626)
- **Typography**: Inter font
- **Layout**: Responsive, mobile-first
- **Components**: Modern, clean design
- **Language**: Vietnamese

## 🔐 Security

- Supabase RLS (Row Level Security) enabled
- JWT authentication
- User data isolation
- Secure API endpoints

## 📝 Development Notes

### N8N Workflow Requirements
Bạn cần tạo N8N workflow với các tools:
- **Onboarding Tool**: Cập nhật user notes
- **Campaign Tool**: Tạo campaigns và schedule
- **Database Query Tool**: Lấy thông tin user
- **Response Tool**: Trả về câu trả lời cho user

### Environment Setup
1. Frontend chạy trên port 3000
2. Backend chạy trên port 3001  
3. Supabase cung cấp database và auth
4. N8N webhook cần được expose public

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
```

### Backend (Railway/Heroku)
```bash
cd server
npm start
```

## 📞 Support

Để được hỗ trợ, hãy tạo issue trong repository này.

## 📄 License

MIT License
