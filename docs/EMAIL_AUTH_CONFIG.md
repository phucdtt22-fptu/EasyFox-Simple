# Email Authentication Configuration Guide

## Cấu hình Email Authentication cho EasyFox

Để cấu hình xác thực email cho ứng dụng EasyFox, bạn cần thiết lập các biến môi trường sau:

### 1. Các biến môi trường cần thiết

Trong file `.env.local` của bạn, thêm hoặc cập nhật các biến sau:

```bash
# Email Authentication Configuration
# Domain/URL cho email callback authentication
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Redirect URL sau khi xác thực email thành công
NEXT_PUBLIC_AUTH_REDIRECT_URL=/auth/callback

# Redirect URL sau khi xác thực email thất bại
NEXT_PUBLIC_AUTH_ERROR_URL=/login?error=auth_failed
```

### 2. Thay đổi theo môi trường

#### Development (localhost)
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### GitHub Codespaces
```bash
NEXT_PUBLIC_SITE_URL=https://your-codespace-url.app.github.dev
```

#### Production
```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### 3. Cấu hình Supabase Dashboard

Trong Supabase Dashboard của bạn:

1. Đi đến **Authentication > Settings**
2. Trong phần **Site URL**, thiết lập:
   - **Site URL**: URL chính của ứng dụng (ví dụ: `https://your-domain.com`)
3. Trong phần **Redirect URLs**, thêm:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (cho development)

### 4. Tính năng được hỗ trợ

- ✅ Email confirmation sau đăng ký
- ✅ Magic link authentication  
- ✅ Tự động redirect sau xác thực
- ✅ Xử lý lỗi xác thực
- ✅ Hiển thị trạng thái loading

### 5. Flow xác thực

1. Người dùng đăng ký tài khoản tại `/register`
2. Hiển thị thông báo "Đăng ký thành công! Kiểm tra email..."
3. Hệ thống gửi email xác thực với link: `https://e.tinmoius.com/auth/callback?token=...`
4. Người dùng click link trong email
5. Supabase redirect đến `/auth/callback`
6. Trang callback hiển thị "Xác thực email thành công!" 
7. Tự động redirect về trang chính `/` sau 2 giây
8. Người dùng đã đăng nhập và có thể sử dụng ứng dụng

### 6. Lưu ý quan trọng

- Đảm bảo `NEXT_PUBLIC_SITE_URL` khớp với domain thực tế
- Kiểm tra Redirect URLs trong Supabase Dashboard
- Test trên nhiều môi trường khác nhau
- Kiểm tra email confirmation trong thư mục spam

### 7. Debug

Nếu gặp vấn đề:
1. Kiểm tra console browser cho lỗi JavaScript
2. Xem logs trong Supabase Dashboard
3. Đảm bảo các URL redirect được cấu hình chính xác
4. Test với email thật (không dùng email test)
