'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ChatMessage } from '@/types'

export function useNewChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>()

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Initialize session
  useEffect(() => {
    if (user?.id && !currentSessionId) {
      setCurrentSessionId(generateSessionId())
    }
  }, [user?.id, currentSessionId, generateSessionId])

  // Load chat history for current session
  const loadChatHistory = useCallback(async (sessionId?: string) => {
    if (!user?.id) return

    try {
      const targetSessionId = sessionId || currentSessionId
      if (!targetSessionId) return

      console.log('📥 Loading chat history for session:', targetSessionId)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_session_id', targetSessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error loading chat history:', error)
        return
      }

      console.log('✅ Loaded chat messages:', data?.length || 0)
      setMessages((data || []) as unknown as ChatMessage[])
    } catch (error) {
      console.error('❌ Error in loadChatHistory:', error)
    }
  }, [user?.id, currentSessionId])

  // Load history when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadChatHistory()
    }
  }, [currentSessionId, loadChatHistory])

  // Send a user message
  const sendUserMessage = useCallback(async (content: string): Promise<string | null> => {
    if (!user?.id || !currentSessionId) {
      console.error('❌ Cannot send message: missing user or session')
      return null
    }

    try {
      console.log('📤 Sending user message:', content.substring(0, 50) + '...')
      
      // Create user message
      const userMessage: Partial<ChatMessage> = {
        user_id: user.id,
        chat_session_id: currentSessionId,
        message_type: 'user',
        content: content.trim(),
        metadata: {}
      }

      // Insert to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([userMessage])
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving user message:', error)
        return null
      }

      // Add to local state immediately
      setMessages(prev => [...prev, data as unknown as ChatMessage])
      console.log('✅ User message saved with ID:', data.id)
      
      return (data as any).id as string
    } catch (error) {
      console.error('❌ Error in sendUserMessage:', error)
      return null
    }
  }, [user?.id, currentSessionId])

  // Add AI message
  const addAIMessage = useCallback(async (content: string, metadata?: Record<string, unknown>): Promise<string | null> => {
    if (!user?.id || !currentSessionId) {
      console.error('❌ Cannot add AI message: missing user or session')
      return null
    }

    try {
      console.log('🤖 Adding AI message:', content.substring(0, 50) + '...')
      
      const aiMessage: Partial<ChatMessage> = {
        user_id: user.id,
        chat_session_id: currentSessionId,
        message_type: 'ai',
        content: content.trim(),
        metadata: metadata || {}
      }

      // Insert to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([aiMessage])
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving AI message:', error)
        return null
      }

      // Add to local state immediately
      setMessages(prev => [...prev, data as unknown as ChatMessage])
      console.log('✅ AI message saved with ID:', data.id)
      
      return (data as any).id as string
    } catch (error) {
      console.error('❌ Error in addAIMessage:', error)
      return null
    }
  }, [user?.id, currentSessionId])

  // Add tool message (tool_start or tool_end)
  const addToolMessage = useCallback(async (
    type: 'tool_start' | 'tool_end',
    toolName: string,
    toolInput?: Record<string, unknown>,
    toolOutput?: unknown
  ): Promise<string | null> => {
    if (!user?.id || !currentSessionId) {
      console.error('❌ Cannot add tool message: missing user or session')
      return null
    }

    try {
      console.log(`🔧 Adding tool message (${type}):`, toolName)
      
      const toolMessage: Partial<ChatMessage> = {
        user_id: user.id,
        chat_session_id: currentSessionId,
        message_type: type,
        content: type === 'tool_start' ? `Starting ${toolName}...` : `Completed ${toolName}`,
        metadata: {
          toolName,
          toolInput,
          toolOutput
        }
      }

      // Insert to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([toolMessage])
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving tool message:', error)
        return null
      }

      // Add to local state immediately
      setMessages(prev => [...prev, data as unknown as ChatMessage])
      console.log(`✅ Tool message (${type}) saved with ID:`, data.id)
      
      return (data as any).id as string
    } catch (error) {
      console.error('❌ Error in addToolMessage:', error)
      return null
    }
  }, [user?.id, currentSessionId])

  // Send message and get AI response
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!user?.id || !currentSessionId) {
      console.error('❌ Cannot send message: missing user or session')
      return false
    }

    setLoading(true)
    
    try {
      // 1. Save user message
      const userMessageId = await sendUserMessage(content)
      if (!userMessageId) {
        throw new Error('Failed to save user message')
      }

      // 2. Send to AI backend
      console.log('🚀 Sending to AI backend...')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: content,
          chatSessionId: currentSessionId,
          userMessageId: userMessageId
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ AI response received:', result.success)
      
      return result.success || false
    } catch (error) {
      console.error('❌ Error in sendMessage:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentSessionId, sendUserMessage])

  // Start new chat session
  const startNewChat = useCallback(() => {
    console.log('🆕 Starting new chat session')
    const newSessionId = generateSessionId()
    setCurrentSessionId(newSessionId)
    setMessages([])
  }, [generateSessionId])

  // Clear current chat
  const clearChat = useCallback(() => {
    console.log('🗑️ Clearing current chat')
    setMessages([])
  }, [])

  return {
    messages,
    loading,
    currentSessionId,
    sendMessage,
    sendUserMessage,
    addAIMessage,
    addToolMessage,
    startNewChat,
    clearChat,
    loadChatHistory,
    setLoading
  }
}
