'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatMessage, ToolInvocation, OnboardingFormData } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [suggestedActions, setSuggestedActions] = useState<Array<{ title: string; label: string; action: string }>>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([])
  const [lastSuggestionMessageId, setLastSuggestionMessageId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false) // Prevent duplicate submissions
  const [lastRequestTime, setLastRequestTime] = useState(0) // Rate limiting for requests

  const sendWelcomeMessage = useCallback(async (sessionId: string) => {
    if (!user) return

    try {
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

      if (result.success) {
        // Handle tool invocations from welcome message
        if (result.toolInvocations && result.toolInvocations.length > 0) {
          setToolInvocations(result.toolInvocations)
        }
        
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
        // Mark existing session as already existed to prevent welcome message
        sessionStorage.setItem(`session_existed_${existingSessionId}`, 'true')
      } else {
        // Create new chat session only when there's no existing one
        const newSessionId = `chat_${user.id}_${Date.now()}`
        console.log('Creating new chat session:', newSessionId)
        setChatSessionId(newSessionId)
        localStorage.setItem(`chat_session_${user.id}`, newSessionId)
        // Don't mark this session as existed yet - let the welcome useEffect handle it
      }
    }
  }, [user, chatSessionId])

  // Send welcome message for new sessions only
  useEffect(() => {
    if (user && chatSessionId) {
      // Only send welcome message if:
      // 1. No messages in current session (truly new)
      // 2. Welcome hasn't been sent for this session yet
      const hasWelcome = sessionStorage.getItem(`welcome_sent_${chatSessionId}`)
      
      if (!hasWelcome && messages.length === 0) {
        // Mark welcome as sent for this session
        sessionStorage.setItem(`welcome_sent_${chatSessionId}`, 'true')
        
        // Send welcome message for new session
        setTimeout(() => {
          sendWelcomeMessage(chatSessionId)
        }, 1000)
      }
    }
  }, [user, chatSessionId, sendWelcomeMessage, messages.length])

  // Fetch AI suggestions after each AI response
  const fetchAISuggestions = useCallback(async (messageId?: string) => {
    if (!user || !chatSessionId || loadingSuggestions) {
      return
    }

    // If messageId is provided and it's the same as the last one we fetched suggestions for, skip
    if (messageId && lastSuggestionMessageId === messageId) {
      return
    }

    // Add delay to prevent rate limiting - increased delay
    await new Promise(resolve => setTimeout(resolve, 2000)) // Increased to 2 seconds

    try {
      setLoadingSuggestions(true)
      
      // Get user info for context
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data for suggestions:', userError)
        setSuggestedActions([])
        return
      }

      // Ensure we have minimum required user info
      const userInfo = userData || {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        notes: null
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "Gợi ý hành động tiếp theo cho người dùng",
          user_id: user.id,
          chat_history_id: chatSessionId,
          user_info: userInfo,
          is_suggestion_request: true,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        try {
          const suggestions = JSON.parse(result.response)
          if (Array.isArray(suggestions)) {
            setSuggestedActions(suggestions)
            // Mark this message as having suggestions fetched
            if (messageId) {
              setLastSuggestionMessageId(messageId)
            }
          }
        } catch (e) {
          console.warn('Failed to parse AI suggestions:', e)
          setSuggestedActions([])
        }
      } else {
        console.warn('Failed to fetch AI suggestions:', result.error)
        setSuggestedActions([])
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
      setSuggestedActions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }, [user, chatSessionId, lastSuggestionMessageId, loadingSuggestions])

  // Load chat history for current session
  const loadChatHistory = useCallback(async () => {
    if (!user || !chatSessionId) return

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('chat_session_id', chatSessionId) // Filter by current session
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading chat history:', error)
    } else {
      setMessages(data || [])
      
      // If there are messages and the last one is from AI, fetch suggestions
      if (data && data.length > 0) {
        const lastMessage = data[data.length - 1]
        if (lastMessage.ai_response && lastMessage.id) {
          // Only fetch suggestions if we haven't already fetched for this message
          if (lastSuggestionMessageId !== lastMessage.id) {
            setTimeout(() => {
              fetchAISuggestions(lastMessage.id)
            }, 500)
          }
        }
      }
    }
  }, [user, chatSessionId, fetchAISuggestions, lastSuggestionMessageId])

  // Load chat history for current session
  useEffect(() => {
    if (user && chatSessionId) {
      loadChatHistory()
    }
  }, [user, chatSessionId, loadChatHistory])

  const sendMessage = useCallback(async (question: string) => {
    if (!user || !chatSessionId) {
      console.error('❌ Missing user or chatSessionId:', { user: !!user, chatSessionId })
      return { success: false, error: 'User or session not available' }
    }

    // Rate limiting: prevent requests sent too quickly
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < 2000) { // Minimum 2 seconds between requests
      console.warn('Rate limiting: Request sent too quickly')
      return { success: false, error: 'Vui lòng chờ một chút trước khi gửi tin nhắn tiếp theo.' }
    }
    
    setLastRequestTime(now)

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
    setSuggestedActions([]) // Clear old suggestions when sending new message
    setLoading(true)

    try {
      console.log('Sending message with chat session ID:', chatSessionId)
      
      // Get user info and campaigns for AI
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('❌ Error fetching user data:', userError)
        throw new Error('Unable to fetch user information')
      }

      // Get user's campaigns for context
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      // Ensure we have minimum required user info
      const userInfo = userData || {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        notes: null
      }

      console.log('📤 Sending request with user info:', { 
        hasUserData: !!userData, 
        userId: user.id,
        userEmail: user.email 
      })

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
          user_info: userInfo,
          campaigns: campaignsData || [],
        }),
      })

      // Check for rate limiting
      if (response.status === 429) {
        console.warn('Rate limited, waiting before retry...')
        // Remove temp message and show error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        return { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }
      }

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
          
          // Handle tool invocations if present
          if (result.toolInvocations && result.toolInvocations.length > 0) {
            setToolInvocations(result.toolInvocations)
            // Don't fetch suggestions when there are tool invocations (like onboarding)
          } else {
            setToolInvocations([])
            
            // Only fetch suggestions for regular chat, not after tool executions
            setTimeout(() => {
              fetchAISuggestions(newMessage.id)
            }, 3000) // Increased delay to 3 seconds to avoid rate limiting
          }
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
  }, [user, chatSessionId, lastRequestTime, fetchAISuggestions])

  const clearChat = useCallback(() => {
    if (!user) return
    
    // Create new chat session
    const newSessionId = `chat_${user.id}_${Date.now()}`
    
    // Clear old session storage for clean start
    if (chatSessionId) {
      sessionStorage.removeItem(`session_existed_${chatSessionId}`)
      sessionStorage.removeItem(`welcome_sent_${chatSessionId}`)
    }
    
    setChatSessionId(newSessionId)
    localStorage.setItem(`chat_session_${user.id}`, newSessionId)
    setMessages([])
    setSuggestedActions([]) // Clear suggestions
    setLastSuggestionMessageId(null) // Reset suggestion tracking
    setToolInvocations([]) // Clear tool invocations
    
    // Don't mark the new session as existed - let welcome logic handle it
    console.log('Chat cleared, new session created:', newSessionId)
  }, [user, chatSessionId])

  const switchToSession = (sessionId: string) => {
    if (!user) return
    
    setChatSessionId(sessionId)
    localStorage.setItem(`chat_session_${user.id}`, sessionId)
    setMessages([]) // Clear current messages, will be reloaded by useEffect
    setSuggestedActions([]) // Clear suggestions when switching sessions
    setLastSuggestionMessageId(null) // Reset suggestion tracking
    
    // Mark switched session as already had welcome sent to prevent duplicate welcome
    sessionStorage.setItem(`welcome_sent_${sessionId}`, 'true')
    // Keep tool invocations - they will be managed by the new session
  }

  // Handle onboarding form submission
  const handleOnboardingSubmit = useCallback(async (data: OnboardingFormData) => {
    if (!user || !chatSessionId || isSubmitting) {
      console.log('Skipping onboarding submit:', { user: !!user, chatSessionId, isSubmitting })
      return
    }

    setIsSubmitting(true) // Prevent duplicate submissions
    
    // Add delay to prevent rate limiting  
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      // Send onboarding data directly to backend for processing via tools (avoid triggering suggestion detection)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: "ONBOARDING_DATA_SUBMISSION", // Non-triggering question
          user_id: user.id,
          chat_history_id: chatSessionId,
          user_info: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email,
          },
          onboarding_data: data, // Send raw data for backend processing
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Onboarding submitted successfully')
        
        // Create a new message for the UI to show the AI's response
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          user_id: user.id,
          question: null, // This was not a user question
          ai_response: result.response,
          created_at: new Date().toISOString(),
          chat_session_id: chatSessionId,
        }

        // Add the AI response to messages
        setMessages(prev => [...prev, newMessage])
        
        // Clear tool invocations after successful submission
        setToolInvocations([])
        
        // Fetch suggestions after onboarding completion
        setTimeout(() => {
          fetchAISuggestions(newMessage.id)
        }, 2000)
      } else {
        console.error('Error submitting onboarding:', result.error)
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error)
    } finally {
      setIsSubmitting(false) // Re-enable submissions
    }
  }, [user, chatSessionId, sendMessage, isSubmitting])

  const handleOnboardingSkip = useCallback(() => {
    // Could implement skip logic if needed
  }, [])

  const handleOnboardingConfirm = useCallback(() => {
    // Already saved, just acknowledge
  }, [])

  const handleOnboardingEdit = useCallback(() => {
    // Could allow editing if needed
  }, [])

  return {
    messages,
    loading,
    chatSessionId,
    sendMessage,
    loadChatHistory,
    clearChat,
    switchToSession,
    suggestedActions,
    loadingSuggestions,
    toolInvocations,
    fetchAISuggestions,
    handleOnboardingSubmit,
    handleOnboardingSkip,
    handleOnboardingConfirm,
    handleOnboardingEdit,
  }
}
