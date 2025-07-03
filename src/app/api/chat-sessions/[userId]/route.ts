import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all chat sessions for user
    const { data, error } = await supabase
      .from('chat_history')
      .select(`
        chat_session_id,
        created_at,
        question,
        ai_response
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching chat sessions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch chat sessions' },
        { status: 500 }
      )
    }

    // Group by session and get session info
    const sessionMap = new Map()
    
    interface ChatMessage {
      chat_session_id: string;
      created_at: string;
      question: string | null;
      ai_response: string | null;
    }
    
    (data as ChatMessage[])?.forEach((message) => {
      const sessionId = message.chat_session_id
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          session_id: sessionId,
          created_at: message.created_at,
          first_message: message.question || 'Chat mới',
          message_count: 0,
          last_updated: message.created_at,
          first_message_set: false
        })
      }
      
      const session = sessionMap.get(sessionId)
      session.message_count++
      
      // Use the first user question as session title
      if (message.question && typeof message.question === 'string' && !session.first_message_set) {
        session.first_message = message.question.substring(0, 50) + (message.question.length > 50 ? '...' : '')
        session.first_message_set = true
      }
      
      // Update last activity
      if (new Date(message.created_at) > new Date(session.last_updated)) {
        session.last_updated = message.created_at
      }
    })

    // Convert to array and sort by last activity
    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
      .map(session => ({
        session_id: session.session_id,
        created_at: session.created_at,
        first_message: session.first_message === 'Chat mới' ? 'Chat mới' : session.first_message,
        message_count: session.message_count
      }))

    return NextResponse.json({
      success: true,
      data: sessions
    })

  } catch (error) {
    console.error('Error in chat sessions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
