'use client'

import { useState, useEffect } from 'react'
import { ChatMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  // Load chat history
  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadChatHistory = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading chat history:', error)
    } else {
      setMessages(data || [])
    }
  }

  const sendMessage = async (question: string) => {
    if (!user) return

    setLoading(true)

    try {
      // Get user info for AI
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Create temporary chat history ID
      const chatHistoryId = `chat_${Date.now()}`

      // Send to backend API which will call N8N
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          user_id: user.id,
          chat_history_id: chatHistoryId,
          user_info: userData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Save to database
        const { data: newMessage, error } = await supabase
          .from('chat_history')
          .insert([
            {
              user_id: user.id,
              question,
              ai_response: result.response,
            },
          ])
          .select()
          .single()

        if (error) {
          console.error('Error saving chat message:', error)
        } else {
          setMessages(prev => [...prev, newMessage])
        }
      } else {
        console.error('Error from AI:', result.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    messages,
    loading,
    sendMessage,
    loadChatHistory,
  }
}
