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
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize chat session
  useEffect(() => {
    if (user && !chatSessionId) {
      // Check for existing session
      const existingSessionId = localStorage.getItem(`chat_session_${user.id}`)
      
      if (existingSessionId) {
        setChatSessionId(existingSessionId)
      } else {
        // Create new session
        const newSessionId = `chat_${user.id}_${Date.now()}`
        localStorage.setItem(`chat_session_${user.id}`, newSessionId)
        setChatSessionId(newSessionId)
      }
    }
  }, [user, chatSessionId])

  // Load chat history when session is ready
  const loadChatHistory = useCallback(async () => {
    if (!user || !chatSessionId) return

    try {
      console.log('📚 Loading chat history for session:', chatSessionId)
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_session_id', chatSessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading chat history:', error)
        return
      }

      if (data && data.length > 0) {
        console.log('✅ Loaded chat history:', data.length, 'messages')
        setMessages(data.map(msg => msg as unknown as ChatMessage))
      } else {
        console.log('📭 No chat history found for session')
        setMessages([])
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error)
    }
  }, [user, chatSessionId])

  useEffect(() => {
    if (user && chatSessionId && !isInitialized) {
      console.log('🔄 Loading chat history for first time')
      loadChatHistory()
      setIsInitialized(true)
    }
  }, [user, chatSessionId, loadChatHistory, isInitialized])

  // Send message
  const sendMessage = useCallback(async (question: string) => {
    if (!user || !chatSessionId) {
      console.error('❌ Missing user or chatSessionId:', { user: !!user, chatSessionId })
      return { success: false, error: 'User or session not available' }
    }

    console.log('🚀 Starting sendMessage with question:', question.substring(0, 50) + '...')

    // Create user message immediately
    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      question,
      ai_response: '',
      created_at: new Date().toISOString(),
      chat_session_id: chatSessionId,
    }

    console.log('📝 Adding user message to UI:', userMessage)
    
    // Add to UI immediately - FORCE UPDATE
    setMessages(prev => {
      const updated = [...prev, userMessage]
      console.log('📝 Messages state updated to:', updated)
      return updated
    })
    
    setLoading(true)

    try {
      console.log('🚀 Sending message to API')
      
      // Get user info
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      const userInfo = userData || {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        notes: null
      }

      // Call API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          user_id: user.id,
          chat_history_id: chatSessionId,
          user_info: userInfo,
          campaigns: campaignsData || [],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ API Response:', result)

      if (result.success) {
        // Save to database
        const { data: newMessage, error } = await supabase
          .from('chat_history')
          .insert([
            {
              user_id: user.id,
              question,
              ai_response: result.response,
              chat_session_id: chatSessionId,
            },
          ])
          .select()
          .single()

        if (error) {
          console.error('❌ Error saving to DB:', error)
          // Update UI even if DB save fails
          console.log('🔄 Updating UI with API response (DB save failed)')
          setMessages(prev => {
            const updated = prev.map(msg => {
              console.log('🔍 Checking message for update:', msg.id, 'vs', userMessage.id)
              return msg.id === userMessage.id 
                ? { ...msg, ai_response: result.response }
                : msg
            })
            console.log('📝 Messages updated after API response:', updated)
            return updated
          })
        } else {
          console.log('✅ Saved to DB successfully, updating UI with DB message')
          // Replace temp message with real one
          setMessages(prev => {
            const updated = prev.map(msg => {
              console.log('🔍 Checking message for DB update:', msg.id, 'vs', userMessage.id)
              return msg.id === userMessage.id 
                ? (newMessage as unknown as ChatMessage)
                : msg
            })
            console.log('📝 Messages updated with DB message:', updated)
            return updated
          })
        }

        return { success: true }
      } else {
        console.error('❌ API Error:', result.error)
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ Network Error:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }, [user, chatSessionId])

  // Clear chat
  const clearChat = useCallback(() => {
    if (!user) return
    
    // Create new session
    const newSessionId = `chat_${user.id}_${Date.now()}`
    
    setChatSessionId(newSessionId)
    localStorage.setItem(`chat_session_${user.id}`, newSessionId)
    setMessages([])
    setIsInitialized(false) // Reset để load lại history cho session mới
    
    console.log('🗑️ Chat cleared, new session:', newSessionId)
  }, [user])

  return {
    messages,
    loading,
    chatSessionId,
    sendMessage,
    loadChatHistory,
    clearChat,
  }
}
