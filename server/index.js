const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://e.tinmoius.com',      
        'https://e.tinmoius.com:3000', 
        /\.app\.github\.dev$/,  
        /\.vercel\.app$/,       
        /\.netlify\.app$/       
      ]
    : true, 
  credentials: true,
  optionsSuccessStatus: 200
};

// Initialize Socket.IO with CORS settings
const io = socketIo(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// WebSocket connections storage
const socketConnections = new Map(); // userId -> socket

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('✅ Supabase initialized');

// Helper function to add a chat message to database
async function addChatMessage(userId, chatSessionId, messageType, content, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: userId,
        chat_session_id: chatSessionId,
        message_type: messageType,
        content,
        metadata
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding chat message:', error);
      throw error;
    }

    console.log(`✅ Added ${messageType} message:`, data.id);
    return data;
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
}

// Helper function to send stream event via WebSocket
function sendStreamEvent(userId, event) {
  const socket = socketConnections.get(userId);
  if (socket) {
    socket.emit('stream_event', event);
    console.log('📡 Sent stream event:', event.type, 'to user:', userId);
  } else {
    console.log('⚠️ No socket connection for user:', userId);
  }
}

// WebSocket handling
io.on('connection', (socket) => {
  console.log('🔌 New socket connection:', socket.id);

  // Handle authentication
  socket.on('authenticate', (data) => {
    const { userId } = data;
    
    if (userId) {
      socketConnections.set(userId, socket);
      console.log('✅ Socket authenticated for user:', userId);
      socket.emit('authenticated', { success: true });
    } else {
      console.log('❌ Socket authentication failed - no userId');
      socket.emit('authenticated', { success: false, error: 'No userId provided' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
    // Find and remove user from connections
    for (const [userId, userSocket] of socketConnections.entries()) {
      if (userSocket === socket) {
        socketConnections.delete(userId);
        console.log('✅ Removed user from connections:', userId);
        break;
      }
    }
  });
});

// Simple mock AI response function
async function getMockAIResponse(message, userId, chatSessionId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Send AI response stream event
      const aiEvent = {
        type: 'ai_response',
        content: `Cảm ơn bạn đã gửi tin nhắn: "${message}". Tôi là EasyFox AI và tôi sẽ giúp bạn với marketing!`,
        messageId: `ai_${Date.now()}`,
        chatSessionId,
        timestamp: new Date().toISOString()
      };
      
      sendStreamEvent(userId, aiEvent);
      
      resolve({
        success: true,
        response: aiEvent.content
      });
    }, 1000); // Simulate processing time
  });
}

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  console.log('🔥 Chat API called (New Structure)!', new Date().toISOString());
  console.log('📨 Request body:', req.body);
  
  try {
    const { message, userId, chatSessionId, userMessageId } = req.body;

    // Validate required fields
    if (!message || !userId || !chatSessionId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, userId, chatSessionId'
      });
    }

    console.log('📝 Processing message for user:', userId, 'session:', chatSessionId);

    // Send tool start event
    sendStreamEvent(userId, {
      type: 'tool_start',
      toolName: 'ProcessMessage',
      messageId: userMessageId,
      chatSessionId,
      timestamp: new Date().toISOString()
    });

    // Process with mock AI (replace with real AI later)
    const aiResult = await getMockAIResponse(message, userId, chatSessionId);

    if (aiResult.success) {
      // Save AI response to database
      await addChatMessage(
        userId,
        chatSessionId,
        'ai',
        aiResult.response,
        { processed_by: 'mock_ai' }
      );

      // Send tool end event
      sendStreamEvent(userId, {
        type: 'tool_end',
        toolName: 'ProcessMessage',
        output: 'Message processed successfully',
        messageId: userMessageId,
        chatSessionId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Message processing successful');
      
      return res.json({
        success: true,
        messageId: userMessageId,
        chatSessionId: chatSessionId
      });
    } else {
      throw new Error('AI processing failed');
    }

  } catch (error) {
    console.error('❌ Chat API error:', error);
    
    // Try to save error message
    try {
      const { userId, chatSessionId } = req.body;
      if (userId && chatSessionId) {
        await addChatMessage(
          userId,
          chatSessionId,
          'ai',
          'Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
          { error: true, originalError: error.message }
        );
      }
    } catch (saveError) {
      console.error('❌ Error saving error message:', saveError);
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connections: socketConnections.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
