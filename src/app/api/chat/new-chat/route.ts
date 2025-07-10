import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to add a chat message to database
async function addChatMessage(
  userId: string,
  chatSessionId: string,
  messageType: 'user' | 'ai' | 'tool_start' | 'tool_end' | 'system',
  content: string | null,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      chat_session_id: chatSessionId,
      message_type: messageType,
      content,
      metadata: metadata || {}
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error adding chat message:', error);
    throw error;
  }

  console.log(`✅ Added ${messageType} message:`, data.id);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Verify user with Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { message, chatSessionId, userMessageId } = await req.json();
    
    if (!message || !chatSessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🚀 Processing chat message:', {
      userId: user.id,
      chatSessionId,
      userMessageId,
      messageLength: message.length
    });

    // Prepare request to backend AI server
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://e.tinmoius.com:3001'
      : 'http://localhost:3001';

    console.log('🤖 Sending to AI backend:', backendUrl);
    
    const backendResponse = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId: user.id,
        chatSessionId,
        userMessageId
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Backend AI error:', backendResponse.status, errorText);
      
      // Add error message to chat
      await addChatMessage(
        user.id,
        chatSessionId,
        'ai',
        `Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.`,
        { error: true, originalError: errorText }
      );

      return NextResponse.json({ 
        success: false, 
        error: 'AI processing failed' 
      }, { status: 500 });
    }

    const result = await backendResponse.json();
    console.log('✅ AI backend response:', result.success);

    // The AI response and tool events will be sent via WebSocket real-time
    // and then saved to database by the backend
    return NextResponse.json({ 
      success: true,
      messageId: userMessageId,
      chatSessionId
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
