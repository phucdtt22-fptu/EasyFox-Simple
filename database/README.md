# EasyFox Database Management

## 📋 Overview
Database được quản lý bằng 2 file chính:
- `complete_schema.sql`: Schema đầy đủ của database
- `reset_database.sql`: Xóa sạch database

## ⚠️ IMPORTANT RULES
**CHỈ CHỈNH SỬA FILE `complete_schema.sql` THÔI!**
- Mọi thay đổi database chỉ được thực hiện trong file `complete_schema.sql`
- Không tạo migration files riêng lẻ nữa
- Nếu cần thay đổi, sửa trực tiếp trong `complete_schema.sql`

## 🚀 How to Use

### Lần đầu setup database:
1. Mở Supabase SQL Editor
2. Chạy file `complete_schema.sql`

### Khi có thay đổi database:
1. Sửa trực tiếp trong file `complete_schema.sql`
2. Chạy `reset_database.sql` để xóa sạch
3. Chạy `complete_schema.sql` để tạo lại với thay đổi mới

### Backup trước khi reset:
```sql
-- Backup users
SELECT * FROM public.users;

-- Backup campaigns  
SELECT * FROM public.campaigns;

-- Backup chat history
SELECT * FROM public.chat_history;
```

## 📊 Current Schema

### Tables:
- `users`: User profiles and business info
- `chat_history`: AI conversations
- `campaigns`: Marketing campaigns with start/end dates
- `schedule`: 4-tier content scheduling
- `settings`: User preferences

### Key Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Proper indexes for performance
- ✅ Auto-updating timestamps
- ✅ Date range support for campaigns
- ✅ Tool invocation storage in chat

## 🔄 Migration History
- Initial schema with basic tables
- Added `start_date` and `end_date` to campaigns
- Added `toolinvocations` to chat_history
- Consolidated into single schema file

## 🎯 Remember
**ALWAYS edit `complete_schema.sql` for any database changes!**
