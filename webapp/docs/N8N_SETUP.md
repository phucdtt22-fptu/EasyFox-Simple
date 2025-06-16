# Hướng dẫn Setup N8N cho EasyFox

## 1. Cài đặt N8N

### Option 1: Docker (Khuyến nghị)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Option 2: npm
```bash
npm install n8n -g
n8n start
```

## 2. Tạo Workflow cho EasyFox AI Agent

### Webhook Trigger
1. Tạo webhook node với URL: `/webhook/easyfox-ai`
2. Method: POST
3. Response Mode: Respond to Webhook

### Input Data
Webhook sẽ nhận data từ EasyFox backend:
```json
{
  "question": "câu hỏi của user",
  "user_id": "uuid",
  "chat_history_id": "string",
  "user_info": {
    "id": "uuid",
    "email": "string", 
    "name": "string",
    "notes": "string|null"
  },
  "chat_history": [...]
}
```

## 3. Required Tools/Nodes

### A. Database Connection (Supabase)
- **Node**: HTTP Request hoặc Supabase node
- **Purpose**: Kết nối với Supabase database
- **Config**: 
  - URL: Supabase API URL
  - Headers: Authorization với service_role key
  - RLS bypass để AI có thể read/write data

### B. Onboarding Tool
- **Function**: Cập nhật user.notes với thông tin onboarding
- **Input**: User business info từ conversation
- **Output**: Success/failure status
- **SQL**: 
```sql
UPDATE users 
SET notes = $1, updated_at = NOW() 
WHERE id = $2
```

### C. Campaign Creation Tool  
- **Function**: Tạo campaign và schedule entries
- **Input**: User info, campaign details
- **Actions**:
  1. Insert campaign record
  2. Generate 4-tier content structure
  3. Insert schedule entries for posts
- **Output**: Campaign ID và schedule overview

### D. Query Tool
- **Function**: Lấy thông tin campaigns, schedule của user
- **Input**: User ID, query type
- **Output**: Formatted data
- **Queries**:
```sql
-- Get campaigns
SELECT * FROM campaigns WHERE user_id = $1;

-- Get schedule  
SELECT s.*, c.name as campaign_name 
FROM schedule s 
JOIN campaigns c ON s.campaign_id = c.id 
WHERE s.user_id = $1 
ORDER BY s.scheduled_date;
```

### E. AI Agent (ChatGPT/Claude)
- **Function**: Main conversational AI
- **System Prompt**:
```
Bạn là trợ lý AI marketing chuyên nghiệp cho EasyFox platform.
Mục tiêu: Hỗ trợ doanh nghiệp nhỏ và vừa tại Mỹ (nail salon, spa, nhà hàng, café) tạo chiến dịch marketing hiệu quả.

Quy trình:
1. Nếu user.notes trống -> Bắt đầu onboarding
2. Thu thập: loại hình kinh doanh, địa điểm, đối tượng khách hàng, ngân sách, mạng xã hội
3. Sau onboarding -> Tạo campaign với cấu trúc 4 tầng
4. Trả lời câu hỏi về marketing, content, lịch đăng bài

Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
```

### F. Content Generation Tool
- **Function**: Tạo nội dung cho posts
- **Input**: Content brief, campaign info
- **Output**: Full content, hashtags, captions
- **Integration**: Có thể dùng OpenAI API

## 4. Workflow Logic

```
Webhook → Parse Input → Check User Onboarding Status
    ↓
If not onboarded:
    → AI Onboarding Conversation → Update User Notes
    ↓
If onboarded:
    → AI Response + Tool Calls (if needed)
    ↓
Generate Response → Send to Webhook Response
```

## 5. Tool Execution Pattern

1. **AI decides** which tools to call based on user question
2. **Execute tools** in sequence or parallel
3. **Format results** for user consumption  
4. **Return response** với markdown formatting

## 6. Environment Variables in N8N

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key (if using)
```

## 7. Testing

Test webhook với sample payload:
```bash
curl -X POST http://localhost:5678/webhook/easyfox-ai \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Xin chào, tôi muốn tạo chiến dịch marketing",
    "user_id": "test-user-123",
    "chat_history_id": "chat_123", 
    "user_info": {
      "id": "test-user-123",
      "email": "test@example.com",
      "name": "Test User",
      "notes": null
    },
    "chat_history": []
  }'
```

## 8. Production Deployment

1. Deploy N8N trên cloud (Railway, Heroku, VPS)
2. Enable webhook authentication
3. Setup SSL certificate
4. Update backend với production webhook URL
5. Monitor logs và performance

## Notes

- N8N workflow cần handle errors gracefully
- Implement retry logic cho database operations
- Log all interactions cho debugging
- Rate limiting cho API calls
- Backup workflow configuration
