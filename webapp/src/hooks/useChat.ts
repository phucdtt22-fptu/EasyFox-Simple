'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)

  const sendWelcomeMessage = useCallback(async (sessionId: string) => {
    if (!user) return

    try {
      console.log('Sending welcome message for new chat session:', sessionId)
      
      // Get user info and campaigns for AI
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get user's campaigns for context
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      // Send welcome notification to AI
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "Người dùng vừa bắt đầu một cuộc trò chuyện mới. Hãy chào họ và giới thiệu về dịch vụ của EasyFox.",
          user_id: user.id,
          chat_history_id: sessionId,
          user_info: userData,
          campaigns: campaignsData || [],
          is_welcome_message: true,
        }),
      })

      const result = await response.json()
      console.log('Welcome message AI response received for session:', sessionId)

      if (result.success) {
        // Save only AI welcome response to database (without system message)
        const { data: newMessage, error } = await supabase
          .from('chat_history')
          .insert([
            {
              user_id: user.id,
              question: null, // No question to display
              ai_response: result.response,
              chat_session_id: sessionId,
            },
          ])
          .select()
          .single()

        if (!error && newMessage) {
          setMessages([newMessage])
        }
      }
    } catch (error) {
      console.error('Error sending welcome message:', error)
    }
  }, [user])

  // Initialize chat session ID
  useEffect(() => {
    if (user && !chatSessionId) {
      // Check if we have an existing chat session in localStorage
      const existingSessionId = localStorage.getItem(`chat_session_${user.id}`)
      
      if (existingSessionId) {
        console.log('Using existing chat session:', existingSessionId)
        setChatSessionId(existingSessionId)
      } else {
        // Create new chat session
        const newSessionId = `chat_${user.id}_${Date.now()}`
        console.log('Creating new chat session:', newSessionId)
        setChatSessionId(newSessionId)
        localStorage.setItem(`chat_session_${user.id}`, newSessionId)
      }
    }
  }, [user, chatSessionId])

  // Send welcome message for new sessions
  useEffect(() => {
    if (user && chatSessionId) {
      // Check if this is a new session (not in localStorage before)
      const existingSessionId = localStorage.getItem(`chat_session_${user.id}`)
      
      if (existingSessionId !== chatSessionId) {
        // This is a new session, send welcome message
        setTimeout(() => {
          sendWelcomeMessage(chatSessionId)
        }, 1000)
      }
    }
  }, [user, chatSessionId, sendWelcomeMessage])

  // Load chat history for current session
  useEffect(() => {
    if (user && chatSessionId) {
      loadChatHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, chatSessionId])

  const loadChatHistory = async () => {
    if (!user || !chatSessionId) return

    console.log('Loading chat history for session:', chatSessionId)

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('chat_session_id', chatSessionId) // Filter by current session
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading chat history:', error)
    } else {
      console.log('Loaded chat history:', data?.length, 'messages')
      setMessages(data || [])
      
      // If this is a new session with no messages and we're not in a fresh session creation,
      // and local storage exists, send welcome message
      if (data && data.length === 0) {
        const existingSessionId = localStorage.getItem(`chat_session_${user.id}`)
        if (existingSessionId === chatSessionId) {
          // This is a restored session that has no messages, likely because user cleared data
          // Don't send welcome message for restored empty sessions to avoid duplicates
          console.log('Restored empty session, skipping welcome message')
        }
      }
    }
  }

  const sendMessage = async (question: string) => {
    if (!user || !chatSessionId) return { success: false, error: 'User or session not available' }

    // Create temporary message to show user input immediately
    const tempMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      question,
      ai_response: '',
      created_at: new Date().toISOString(),
      chat_session_id: chatSessionId,
    }

    // Add user message immediately to UI
    setMessages(prev => [...prev, tempMessage])
    setLoading(true)

    try {
      console.log('Sending message with chat session ID:', chatSessionId)
      
      // Get user info and campaigns for AI
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get user's campaigns for context
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      // Use consistent chat session ID
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          user_id: user.id,
          chat_history_id: chatSessionId, // Use consistent session ID
          user_info: userData,
          campaigns: campaignsData || [],
        }),
      })

      const result = await response.json()
      console.log('AI response received for session:', chatSessionId)

      if (result.success) {
        // Save to database with session ID
        const { data: newMessage, error } = await supabase
          .from('chat_history')
          .insert([
            {
              user_id: user.id,
              question,
              ai_response: result.response,
              chat_session_id: chatSessionId, // Add session ID to database
            },
          ])
          .select()
          .single()

        if (error) {
          console.error('Error saving chat message:', error)
          // If saving fails, keep the temp message but add error state
        } else {
          // Replace temp message with real message from database
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessage.id ? newMessage : msg
          ))
        }
        return { success: true }
      } else {
        console.error('Error from AI:', result.error)
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const clearChat = useCallback(() => {
    if (!user) return
    
    // Create new chat session
    const newSessionId = `chat_${user.id}_${Date.now()}`
    console.log('Creating new chat session:', newSessionId)
    
    setChatSessionId(newSessionId)
    localStorage.setItem(`chat_session_${user.id}`, newSessionId)
    setMessages([])
    
    // Auto send welcome message for new chat
    setTimeout(() => {
      sendWelcomeMessage(newSessionId)
    }, 1000) // Delay to ensure session is properly set
  }, [user, sendWelcomeMessage])

  const switchToSession = (sessionId: string) => {
    if (!user) return
    
    console.log('Switching to chat session:', sessionId)
    setChatSessionId(sessionId)
    localStorage.setItem(`chat_session_${user.id}`, sessionId)
    setMessages([]) // Clear current messages, will be reloaded by useEffect
  }

  return {
    messages,
    loading,
    chatSessionId,
    sendMessage,
    loadChatHistory,
    clearChat,
    switchToSession,
  }
}
