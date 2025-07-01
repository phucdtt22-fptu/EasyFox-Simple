# EasyFox API Documentation

## Backend Endpoints

### Base URL
```
http://localhost:3001 (development)
https://your-backend-domain.com (production)
```

## Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "EasyFox Backend is running"
}
```

### 2. Chat with AI
```http
POST /api/chat
```

**Request Body:**
```json
{
  "question": "Xin chào, tôi muốn tạo chiến dịch marketing cho tiệm nail",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "chat_history_id": "chat_1234567890",
  "user_info": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "notes": null
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Xin chào Nguyễn Văn A! 👋\n\nTôi là trợ lý AI marketing của EasyFox..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Missing required fields: question, user_id, user_info"
}
```

### 3. Get User Campaigns
```http
GET /api/campaigns/:userId
```

**Parameters:**
- `userId` (string): User UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Chiến dịch Thu Đông 2024",
      "budget": 500.00,
      "target_audience": "Phụ nữ 25-45 tuổi",
      "goals": "Tăng awareness và thu hút khách hàng mới",
      "content_pillars": ["Beauty Tips", "Seasonal Trends", "Customer Stories", "Behind the Scenes"],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 4. Get User Schedule
```http
GET /api/schedule/:userId
```

**Parameters:**
- `userId` (string): User UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e12b-34d5-a678-901234567000",
      "campaign_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "scheduled_date": "2024-01-20",
      "platform": "instagram",
      "content_pillar": "Beauty Tips",
      "content_category": "Tutorial",
      "content_angle": "Quick nail care at home",
      "content_brief": "Hướng dẫn chăm sóc móng tại nhà trong 5 phút",
      "full_content": null,
      "image_url": null,
      "video_url": null,
      "status": "draft",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "campaigns": {
        "name": "Chiến dịch Thu Đông 2024"
      }
    }
  ]
}
```

## Data Models

### User
```typescript
interface User {
  id: string              // UUID
  email: string          // User email
  name: string           // Full name
  notes: string | null   // AI onboarding info (JSON string)
  created_at: string     // ISO timestamp
  updated_at: string     // ISO timestamp
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id: string         // UUID
  user_id: string    // User UUID
  question: string   // User question
  ai_response: string // AI response (markdown)
  created_at: string // ISO timestamp
}
```

### Campaign
```typescript
interface Campaign {
  id: string                  // UUID
  user_id: string            // User UUID  
  name: string               // Campaign name
  budget: number | null      // Budget in USD
  target_audience: string | null // Target description
  goals: string | null       // Campaign goals
  content_pillars: string[] | null // Array of pillars
  created_at: string         // ISO timestamp
  updated_at: string         // ISO timestamp
}
```

### ScheduleItem
```typescript
interface ScheduleItem {
  id: string                    // UUID
  campaign_id: string          // Campaign UUID
  user_id: string              // User UUID
  scheduled_date: string       // Date (YYYY-MM-DD)
  platform: string             // 'facebook', 'instagram', 'tiktok', etc.
  content_pillar: string | null    // Tier 1
  content_category: string | null  // Tier 2
  content_angle: string | null     // Tier 3
  content_brief: string | null     // Tier 4 (AI generated)
  full_content: string | null      // Final content
  image_url: string | null         // Image URL
  video_url: string | null         // Video URL
  status: string                   // 'draft', 'approved', 'posted'
  created_at: string               // ISO timestamp
  updated_at: string               // ISO timestamp
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid authentication |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

## Authentication

EasyFox sử dụng Supabase Auth. Frontend sẽ tự động gửi JWT token trong headers:

```http
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Chat API**: 10 requests per minute per user
- **Other APIs**: 100 requests per minute per user

## N8N Integration

Backend sẽ gọi N8N webhook với payload:

```json
{
  "question": "string",
  "user_id": "uuid", 
  "chat_history_id": "string",
  "user_info": {
    "id": "uuid",
    "email": "string",
    "name": "string", 
    "notes": "string|null"
  },
  "chat_history": [
    {
      "id": "uuid",
      "question": "string",
      "ai_response": "string",
      "created_at": "string"
    }
  ]
}
```

N8N sẽ trả về:
```json
{
  "response": "Markdown formatted response from AI"
}
```
