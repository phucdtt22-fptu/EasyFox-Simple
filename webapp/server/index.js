const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.app\.github\.dev$/,  // Allow Codespace URLs
        /\.vercel\.app$/,       // Allow Vercel deployments
        /\.netlify\.app$/       // Allow Netlify deployments
      ]
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables for Supabase');
  process.exit(1);
}

if (!process.env.N8N_WEBHOOK_URL) {
  console.warn('⚠️ N8N_WEBHOOK_URL not set - chat functionality will not work');
}

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Chat endpoint - connects to N8N
app.post('/api/chat', async (req, res) => {
  console.log('🔥 Chat API called!', new Date().toISOString());
  console.log('📨 Request body:', req.body);
  
  try {
    const { question, user_id, chat_history_id, user_info } = req.body;

    // Validate required fields
    if (!question || !user_id || !user_info) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question, user_id, user_info'
      });
    }

    // Get chat history for context
    const { data: chatHistory, error: chatError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (chatError) {
      console.error('Error fetching chat history:', chatError);
    }

    // Prepare data for N8N
    const n8nPayload = {
      question,
      user_id,
      chat_history_id,
      user_info,
      chat_history: chatHistory || []
    };

    console.log('📤 Sending to N8N:', {
      url: process.env.N8N_WEBHOOK_URL,
      payload: n8nPayload
    });

    let aiResponse;

    try {
      // Call N8N webhook
      const n8nResponse = await axios.post(process.env.N8N_WEBHOOK_URL, n8nPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('📥 N8N Response:', n8nResponse.data);

      // Extract AI response from N8N result
      aiResponse = n8nResponse.data.response || n8nResponse.data.message || 'AI response not found';
      
    } catch (n8nError) {
      console.error('❌ N8N webhook error:', n8nError);
      
      // Fallback to mock response if N8N fails
      if (!user_info.notes) {
        // User hasn't been onboarded yet
        aiResponse = `Xin chào ${user_info.name}! 👋

Tôi là trợ lý AI marketing của EasyFox. Để có thể hỗ trợ bạn tốt nhất, tôi cần tìm hiểu thêm về doanh nghiệp của bạn.

**Bạn có thể chia sẻ với tôi:**
1. Loại hình kinh doanh (nail salon, spa, nhà hàng, café, v.v.)
2. Địa điểm kinh doanh
3. Đối tượng khách hàng chính
4. Ngân sách marketing hàng tháng (ước tính)
5. Các mạng xã hội hiện tại đang sử dụng

Thông tin này sẽ giúp tôi tạo ra chiến dịch marketing phù hợp và hiệu quả cho doanh nghiệp của bạn! 🚀

*(Lưu ý: Hiện tại đang sử dụng phản hồi dự phòng do lỗi kết nối N8N)*`;
      } else {
        // User has been onboarded
        aiResponse = `Tôi đã có thông tin cơ bản về doanh nghiệp của bạn rồi! 

**Tôi có thể giúp bạn:**
- ✨ Tạo nội dung marketing cho các mạng xã hội
- 📅 Lên lịch đăng bài tự động
- 🎯 Tối ưu hóa chiến dịch quảng cáo
- 📊 Phân tích hiệu quả marketing
- 💡 Đề xuất ý tưởng content mới

Bạn muốn tôi hỗ trợ điều gì hôm nay?

*(Lưu ý: Hiện tại đang sử dụng phản hồi dự phòng do lỗi kết nối N8N)*`;
      }
    }

    res.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'EasyFox Backend is running' });
});

// Get user campaigns
app.get('/api/campaigns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get schedule items
app.get('/api/schedule/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('schedule')
      .select(`
        *,
        campaigns(name)
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EasyFox Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  
  if (process.env.CODESPACE_NAME) {
    console.log(`🌐 Codespace URL: https://${process.env.CODESPACE_NAME}-${PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`);
  }
  
  if (NODE_ENV === 'production') {
    console.log(`🌍 Production server ready`);
  }
});
