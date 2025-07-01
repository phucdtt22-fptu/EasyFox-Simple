const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const LangChainMarketingAgent = require('./services/langchainMarketingAgent');
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

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required for AI functionality');
  process.exit(1);
}

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Marketing Agent
const langchainAgent = new LangChainMarketingAgent(supabase);

// Rate limiting storage
const rateLimitMap = new Map();
const newChatLimitMap = new Map(); // Track new chat creation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_MINUTE = 10;
const MIN_MESSAGE_INTERVAL = 2000; // 2 seconds between messages
const MIN_NEW_CHAT_INTERVAL = 30000; // 30 seconds between new chats
const MAX_NEW_CHATS_PER_HOUR = 5; // Maximum 5 new chats per hour

// Spam detection focused on preventing rapid new chat creation
const spamDetection = {
  maxMessageLength: 10000, // Increased from 2000 to 10000 to allow longer messages
  repetitiveThreshold: 0.95, // Increased from 0.9 to 0.95 - only block nearly identical messages
  bannedWords: [], // Removed all banned words to allow more content
  
  checkSpam: (message, userHistory) => {
    // Only check for extremely long messages (10k+ characters)
    if (message.length > spamDetection.maxMessageLength) {
      return { isSpam: true, reason: 'Tin nhắn cực kỳ dài (hơn 10,000 ký tự)' };
    }

    // Check for highly repetitive messages (only exact or nearly exact duplicates)
    if (userHistory && userHistory.length > 0) {
      const recentMessages = userHistory.slice(-2); // Only last 2 messages
      for (const historyMsg of recentMessages) {
        if (historyMsg.question) {
          const similarity = calculateSimilarity(message, historyMsg.question);
          if (similarity > spamDetection.repetitiveThreshold) {
            return { isSpam: true, reason: 'Tin nhắn trùng lặp hoàn toàn' };
          }
        }
      }
    }

    return { isSpam: false };
  }
};

// Calculate string similarity
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Check if user is creating new chats too frequently
function checkNewChatSpam(userId) {
  const now = Date.now();
  const userKey = `newchat_${userId}`;
  
  if (!newChatLimitMap.has(userKey)) {
    newChatLimitMap.set(userKey, []);
  }
  
  const userNewChats = newChatLimitMap.get(userKey);
  
  // Clean old entries (older than 1 hour)
  const oneHourAgo = now - (60 * 60 * 1000);
  const recentChats = userNewChats.filter(timestamp => timestamp > oneHourAgo);
  newChatLimitMap.set(userKey, recentChats);
  
  // Check if last chat was created too recently
  if (recentChats.length > 0) {
    const lastChatTime = Math.max(...recentChats);
    if (now - lastChatTime < MIN_NEW_CHAT_INTERVAL) {
      return { 
        isSpam: true, 
        reason: `Vui lòng đợi ${Math.ceil(MIN_NEW_CHAT_INTERVAL / 1000)} giây trước khi tạo chat mới` 
      };
    }
  }
  
  // Check if too many chats created in the last hour
  if (recentChats.length >= MAX_NEW_CHATS_PER_HOUR) {
    return { 
      isSpam: true, 
      reason: `Bạn đã tạo quá nhiều chat mới. Vui lòng thử lại sau 1 giờ.` 
    };
  }
  
  // Record this new chat creation
  recentChats.push(now);
  newChatLimitMap.set(userKey, recentChats);
  
  return { isSpam: false };
}

// Chat endpoint - uses Marketing Agent instead of N8N
app.post('/api/chat', async (req, res) => {
  console.log('🔥 Chat API called!', new Date().toISOString());
  console.log('📨 Request body:', req.body);
  
  try {
    const { question, user_id, chat_history_id, user_info, campaigns, is_welcome_message, is_suggestion_request, onboarding_data } = req.body;

    // Special handling for onboarding data submission
    if (onboarding_data && question === "ONBOARDING_DATA_SUBMISSION") {
      console.log('📝 Direct onboarding data submission detected');
      
      try {
        // Process onboarding data directly without suggestion detection
        const agentResult = await langchainAgent.processMessage(
          user_id,
          "Dữ liệu onboarding được gửi", // Non-triggering message
          null, // No existing onboarding notes yet
          [], // No chat history needed for onboarding
          onboarding_data // Pass the raw onboarding data
        );

        if (agentResult.success) {
          return res.json({
            success: true,
            response: agentResult.response,
            chat_history_id: chat_history_id
          });
        } else {
          throw new Error(agentResult.error || 'Onboarding processing failed');
        }
      } catch (error) {
        console.error('❌ Error processing onboarding data:', error);
        return res.status(500).json({
          success: false,
          error: 'Không thể xử lý thông tin onboarding. Vui lòng thử lại.'
        });
      }
    }

    // Validate required fields
    if (!question || !user_id || !user_info) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question, user_id, user_info'
      });
    }

    // Special handling for suggestion requests - SKIP ALL OTHER CHECKS
    if (is_suggestion_request) {
      console.log('📝 Generating AI-powered suggestions - skipping all spam and rate limit checks');
      
      try {
        // Get user onboarding notes (as text paragraph, not JSON)
        const onboardingNotes = user_info?.notes || null;
        
        // Get recent chat history for suggestion context
        let recentChatHistory = [];
        if (chat_history_id) {
          const { data: chatHistoryData, error: chatError } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', user_id)
            .eq('chat_session_id', chat_history_id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (!chatError && chatHistoryData) {
            recentChatHistory = chatHistoryData.reverse().map(msg => ({
              role: msg.question ? 'user' : 'assistant',
              content: msg.question || msg.ai_response
            }));
          }
        }
        
        console.log('🔍 Suggestion request context:');
        console.log('   - Has onboarding notes:', onboardingNotes ? 'YES' : 'NO');
        console.log('   - Chat history length:', recentChatHistory.length);
        if (onboardingNotes) {
          console.log('   - Business preview:', onboardingNotes.substring(0, 150) + '...');
        }
        if (recentChatHistory.length > 0) {
          console.log('   - Recent messages:');
          recentChatHistory.forEach((msg, i) => {
            console.log(`     ${i+1}. ${msg.role}: ${msg.content.substring(0, 80)}...`);
          });
        }

        const result = await langchainAgent.processMessage(user_id, question, onboardingNotes, recentChatHistory);
        
        if (result.success) {
          console.log('✅ AI suggestions generated successfully');
          
          // Log the response to ensure it's correct
          try {
            const parsedResponse = JSON.parse(result.response);
            console.log(`📤 Sending ${parsedResponse.length} suggestions to frontend`);
            parsedResponse.forEach((s, i) => {
              console.log(`   ${i+1}. ${s.title}: ${s.label}`);
            });
          } catch (e) {
            console.log('📤 Response preview:', result.response.substring(0, 200));
          }
          
          return res.json({
            success: true,
            response: result.response,
            chat_history_id: chat_history_id,
            isAIGenerated: true
          });
        } else {
          throw new Error(result.error || 'AI suggestion generation failed');
        }
      } catch (error) {
        console.error('❌ Error generating AI suggestions:', error);
        
        // Return error instead of fallback - force frontend to handle gracefully
        return res.status(500).json({
          success: false,
          error: 'Không thể tạo gợi ý AI. Vui lòng thử lại sau.',
          details: error.message
        });
      }
    }

    // Special handling for welcome messages (new chat creation)
    if (is_welcome_message) {
      // Check if user is creating new chats too frequently
      const newChatSpamCheck = checkNewChatSpam(user_id);
      if (newChatSpamCheck.isSpam) {
        return res.status(429).json({
          success: false,
          error: newChatSpamCheck.reason
        });
      }
    }

    // Rate limiting check (skip for welcome messages)
    if (!is_welcome_message) {
      const now = Date.now();
      const userKey = `rate_limit_${user_id}`;
      const userRateData = rateLimitMap.get(userKey) || { messages: [], lastMessage: 0 };

      // Check minimum interval between messages
      if (now - userRateData.lastMessage < MIN_MESSAGE_INTERVAL) {
        return res.status(429).json({
          success: false,
          error: 'Vui lòng chờ ít nhất 2 giây giữa các tin nhắn'
        });
      }

      // Clean old messages outside the window
      userRateData.messages = userRateData.messages.filter(
        timestamp => now - timestamp < RATE_LIMIT_WINDOW
      );

      // Check rate limit
      if (userRateData.messages.length >= MAX_MESSAGES_PER_MINUTE) {
        return res.status(429).json({
          success: false,
          error: 'Quá nhiều tin nhắn. Vui lòng chờ 1 phút trước khi gửi tiếp'
        });
      }

      // Update rate limit data
      userRateData.messages.push(now);
      userRateData.lastMessage = now;
      rateLimitMap.set(userKey, userRateData);
    }

    // Get chat history for context (skip for welcome messages to ensure fresh start)
    let chatHistory = [];
    if (!is_welcome_message) {
      let chatHistoryQuery = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user_id);

      // If chat_history_id (session_id) is provided, filter by session for focused context
      if (chat_history_id) {
        chatHistoryQuery = chatHistoryQuery.eq('chat_session_id', chat_history_id);
      }

      const { data: chatHistoryData, error: chatError } = await chatHistoryQuery
        .order('created_at', { ascending: false })
        .limit(10);

      if (chatError) {
        console.error('Error fetching chat history:', chatError);
      } else {
        chatHistory = chatHistoryData || [];
      }

      // SPAM DETECTION COMPLETELY DISABLED FOR ALL REQUESTS
      console.log('✅ SPAM DETECTION DISABLED - ALL MESSAGES ALLOWED');

      // New chat creation spam check (skip for existing chat sessions)
      if (!chat_history_id) {
        const newChatSpamCheck = checkNewChatSpam(user_id);
        if (newChatSpamCheck.isSpam) {
          return res.status(400).json({
            success: false,
            error: `Tin nhắn bị từ chối: ${newChatSpamCheck.reason}`
          });
        }
      }
    }

    console.log('🤖 Processing message with LangChain Marketing Agent...');

    try {
      // Get user onboarding notes (as text paragraph, not JSON)
      const onboardingNotes = user_info?.notes || null;

      console.log('🔍 Checking user onboarding notes:');
      console.log('   - Has notes:', onboardingNotes ? 'YES' : 'NO');
      if (onboardingNotes) {
        console.log('   - Notes preview:', onboardingNotes.substring(0, 100) + '...');
      }

      // Process message with LangChain Marketing Agent
      // Pass the text notes directly - AI will decide if onboarding is needed
      const agentResult = await langchainAgent.processMessage(
        user_id, 
        question, 
        onboardingNotes, // Pass the text notes directly, or null if not exists
        chatHistory.reverse().map(msg => ({
          role: msg.question ? 'user' : 'assistant',
          content: msg.question || msg.ai_response
        })),
        onboarding_data // Pass onboarding data if provided
      );

      console.log('🎯 LangChain Agent Result:', agentResult);

      if (!agentResult.success) {
        throw new Error(agentResult.error || 'LangChain Marketing agent failed');
      }

      // Prepare response
      const response = {
        success: true,
        response: agentResult.response
      };

      // Add tool invocation if present (for onboarding form)
      if (agentResult.toolInvocation) {
        console.log('🔧 Including toolInvocation in response:', agentResult.toolInvocation);
        response.toolInvocations = [agentResult.toolInvocation]; // Convert singular to array
      }

      // Add intermediate steps if present (for debugging)
      if (agentResult.intermediateSteps) {
        response.intermediateSteps = agentResult.intermediateSteps;
      }

      res.json(response);

    } catch (agentError) {
      console.error('❌ Marketing Agent error:', agentError);
      
      // Fallback response
      const fallbackResponse = !onboardingNotes
        ? `Xin chào ${user_info.name}!

Tôi là trợ lý AI marketing của EasyFox. Để có thể hỗ trợ bạn tốt nhất, tôi cần tìm hiểu thêm về doanh nghiệp của bạn.

**Bạn có thể chia sẻ với tôi:**
1. Loại hình kinh doanh (nail salon, spa, nhà hàng, café, v.v.)
2. Địa điểm kinh doanh
3. Đối tượng khách hàng chính
4. Ngân sách marketing hàng tháng (ước tính)
5. Các mạng xã hội hiện tại đang sử dụng

Thông tin này sẽ giúp tôi tạo ra chiến dịch marketing phù hợp và hiệu quả cho doanh nghiệp của bạn!`
        : `Tôi đã có thông tin cơ bản về doanh nghiệp của bạn rồi! 

**Tôi có thể giúp bạn:**
- Tạo chiến dịch marketing hoàn chỉnh
- Lên lịch đăng bài với content brief chi tiết
- Tối ưu hóa chiến lược nội dung
- Phân tích đối thủ cạnh tranh
- Đề xuất ý tưởng content mới

Bạn muốn tôi hỗ trợ điều gì hôm nay?`;

      res.json({
        success: true,
        response: fallbackResponse
      });
    }

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

// Get chat history with pagination and session filtering
app.get('/api/chat-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { session_id, page = 1, limit = 50 } = req.query;

    console.log(`📚 Fetching chat history for user: ${userId}`);

    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId);

    // Filter by session if provided
    if (session_id) {
      query = query.eq('chat_session_id', session_id);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ 
      success: true, 
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data?.length || 0
      }
    });
  } catch (error) {
    console.error('Error in chat history endpoint:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all chat sessions for a user
app.get('/api/chat-sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🗂️ Fetching chat sessions for user: ${userId}`);

    const { data, error } = await supabase
      .from('chat_history')
      .select('chat_session_id, created_at, question')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Group by session and get first message of each session
    const sessions = {};
    data?.forEach(msg => {
      if (!sessions[msg.chat_session_id]) {
        sessions[msg.chat_session_id] = {
          session_id: msg.chat_session_id,
          created_at: msg.created_at,
          first_message: msg.question,
          message_count: 1
        };
      } else {
        sessions[msg.chat_session_id].message_count++;
        // Keep the earliest message as first_message
        if (new Date(msg.created_at) < new Date(sessions[msg.chat_session_id].created_at)) {
          sessions[msg.chat_session_id].first_message = msg.question;
          sessions[msg.chat_session_id].created_at = msg.created_at;
        }
      }
    });

    const sessionList = Object.values(sessions).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    res.json({ 
      success: true, 
      data: sessionList
    });
  } catch (error) {
    console.error('Error in chat sessions endpoint:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete chat session
app.delete('/api/chat-session/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    console.log(`🗑️ Deleting chat session: ${sessionId} for user: ${userId}`);

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)
      .eq('chat_session_id', sessionId);

    if (error) {
      console.error('Error deleting chat session:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error in delete chat session endpoint:', error);
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
