# EasyFox Suggestions Feature

## Overview
Tính năng gợi ý (Suggestions) thực sự sử dụng AI được thêm vào EasyFox để cung cấp các gợi ý thông minh cho người dùng sau mỗi tin nhắn từ AI assistant.

## Key Improvements (Latest Update)

### **Simplified Suggestions Flow**
- **Simple Logic**: AI chỉ cần đưa ra danh sách gợi ý ngắn gọn dựa trên câu hỏi cuối cùng
- **Fast Response**: Không phân tích phức tạp, chỉ tập trung vào câu hỏi hiện tại của AI
- **Direct Display**: Khi click suggestion thì hiển thị y hệt câu đó trong chat
- **Quick & Easy**: Flow nhanh, đơn giản, ít tốn thời gian xử lý

### **Smart State Management**
- `lastAiResponseId`: Track AI response để tránh duplicate suggestions
- Reset khi clear chat hoặc switch sessions
- Logic thông minh: không generate nếu đã có cho response đó

## Components Added/Modified

### 1. ModernMessage Component (`src/components/ui/modern-message.tsx`)
- Hiển thị suggestions dưới tin nhắn AI cuối cùng
- Animations mượt mà với Framer Motion
- Loading state khi đang tải suggestions
- Click handlers để gửi suggestion như tin nhắn mới
- Sử dụng AuthContext để lấy user thật

### 2. useChat Hook (`src/hooks/useChat.ts`)
- **NEW**: `lastAiResponseId` state để track AI responses
- **IMPROVED**: Logic generate suggestions sau mọi AI response
- **FIXED**: Reset tracking khi clear/switch sessions
- **ENHANCED**: Smart duplicate prevention

### 3. Backend Integration
- Gọi backend endpoint `/chat` với `is_suggestion_request: true`
- Sử dụng `GEMINI_SUGGESTION_MODEL` environment variable từ docker-compose
- User authentication thông qua AuthContext

### 4. TypeScript Types (`src/types/index.ts`)
- `Suggestion` interface đơn giản

## Features

### UI/UX
- **Brand Colors**: Orange/red theme phù hợp với EasyFox
- **Animations**: Smooth fade-in cho suggestions
- **Loading State**: Hiển thị "Đang tạo gợi ý..." với icon pulse
- **Hover Effects**: Button hover với scale animation
- **Vietnamese Support**: UI text bằng tiếng Việt

### Functionality
- **Smart Display**: Chỉ hiển thị suggestions cho tin nhắn AI cuối cùng
- **Real AI Integration**: Sử dụng backend với Gemini AI model
- **User Context**: Sử dụng thông tin user thật từ Supabase Auth
- **Persistent Suggestions**: Luôn có suggestions sau mọi AI response
- **Click to Send**: Click suggestion để gửi như tin nhắn mới
- **Session Management**: Proper cleanup khi switch/clear chat

## Technical Details

### Suggestion Generation Logic
```typescript
// Generate focused suggestions based on AI's last question/request
const suggestionPrompt = `Dựa trên câu hỏi cuối của AI: "${lastAiResponse}"

Hãy đưa ra 4 câu trả lời ngắn gọn mà khách hàng có thể sẽ nói. Chỉ cần những câu trả lời đơn giản, thực tế.

Trả về JSON format:
[
  {"title": "Tùy chọn 1", "label": "Mô tả ngắn", "action": "Câu trả lời đầy đủ"},
  {"title": "Tùy chọn 2", "label": "Mô tả ngắn", "action": "Câu trả lời đầy đủ"},
  {"title": "Tùy chọn 3", "label": "Mô tả ngắn", "action": "Câu trả lời đầy đủ"},
  {"title": "Tùy chọn 4", "label": "Mô tả ngắn", "action": "Câu trả lời đầy đủ"}
]`

// Track AI responses để tránh duplicate
const [lastAiResponseId, setLastAiResponseId] = useState<string | null>(null)

// Generate suggestions khi có AI response mới
useEffect(() => {
  const lastMessage = messages[messages.length - 1]
  const hasNewAiResponse = lastMessage?.ai_response && 
    lastMessage.id !== lastAiResponseId
  
  if (hasNewAiResponse) {
    setLastAiResponseId(lastMessage.id)
    generateSuggestedActions()
  }
}, [messages])
```

## Integration Points

### Backend API
- Endpoint: `${NEXT_PUBLIC_API_URL}/chat`
- Method: POST
- Body: `{ question, user_id, user_info, is_suggestion_request: true }`
- Uses: `GEMINI_SUGGESTION_MODEL` environment variable

### Environment Variables (in docker-compose.production.yml)
```
GEMINI_API_KEY=${GEMINI_API_KEY}
GEMINI_SUGGESTION_MODEL=${GEMINI_SUGGESTION_MODEL:-gemini-1.5-flash}
```

## Usage

Khi người dùng nhận được tin nhắn từ AI:
1. AI phân tích câu hỏi/yêu cầu cuối cùng mà assistant đã đưa ra
2. Kết hợp với thông tin onboarding của user để hiểu context
3. Dự đoán 3-4 câu trả lời phù hợp mà user có thể sẽ đưa ra
4. Hiển thị suggestions như những câu trả lời có thể cho câu hỏi hiện tại
5. User click vào suggestion để trả lời nhanh

**Ví dụ:**
- AI hỏi: "Bạn muốn tập trung vào loại nội dung nào?"
- Suggestions: "Hình ảnh sản phẩm", "Video hướng dẫn", "Bài viết chia sẻ", "Story Instagram"

## File Structure
```
src/
├── components/ui/
│   ├── modern-message.tsx          # Updated with real AI suggestions
│   └── modern-chat.tsx             # Updated to pass callback
└── types/
    └── index.ts                    # Updated with Suggestion type
```

## Key Changes from Mock to Real AI
- ❌ Removed frontend API route `/api/suggestions`
- ✅ Use backend `/chat` endpoint with `is_suggestion_request: true`
- ✅ Real user authentication via AuthContext
- ✅ Use `GEMINI_SUGGESTION_MODEL` from docker-compose
- ✅ Parse AI response properly (JSON array of suggestion objects)
