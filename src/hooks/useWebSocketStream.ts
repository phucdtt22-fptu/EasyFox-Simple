'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import io, { Socket } from 'socket.io-client'

export interface StreamEvent {
  type: 'ai_response' | 'tool_start' | 'tool_end' | 'agent_action'
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  output?: unknown
  messageId: string
  chatSessionId?: string
  timestamp: string
}

export function useWebSocketStream() {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([])
  
  // Debounced logging to prevent spam
  const logCount = useRef(0)

  // Handle stream events with proper state management
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    // Add timestamp if not present
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    }
    
    // Only log every 5th event to reduce spam
    if (logCount.current % 5 === 0) {
      console.log('📡 Stream event received:', eventWithTimestamp.type, eventWithTimestamp.messageId)
    }
    logCount.current++
    
    setStreamEvents(prev => {
      // Prevent duplicate events
      const exists = prev.some(e => 
        e.messageId === eventWithTimestamp.messageId && 
        e.type === eventWithTimestamp.type && 
        e.timestamp === eventWithTimestamp.timestamp
      )
      
      if (exists) {
        return prev
      }
      
      return [...prev, eventWithTimestamp]
    })
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) {
      // Disconnect if no user
      if (socketRef.current) {
        console.log('🔌 Disconnecting WebSocket - no user')
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
        setStreamEvents([])
      }
      return
    }

    // Prevent multiple connections
    if (socketRef.current) {
      console.log('🔌 WebSocket already connected')
      return
    }

    // Create WebSocket connection
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://e.tinmoius.com:3001')
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')

    console.log('🔌 Connecting to WebSocket server:', serverUrl)
    
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        userId: user.id // Send userId in connection query
      }
    })

    socketRef.current = socket

    // Handle connection
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id)
      setIsConnected(true)
      
      // Authenticate with userId
      socket.emit('authenticate', { userId: user.id })
    })

    // Handle authentication response
    socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('✅ WebSocket authenticated for user:', user.id)
      } else {
        console.error('❌ WebSocket authentication failed:', data.error)
      }
    })

    // Handle stream events
    socket.on('stream_event', handleStreamEvent)

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason)
      setIsConnected(false)
    })

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Handle reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      // Re-authenticate after reconnection
      socket.emit('authenticate', { userId: user.id })
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      if (attemptNumber <= 3) { // Only log first few attempts
        console.log('🔄 WebSocket reconnection attempt:', attemptNumber)
      }
    })

    socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection error:', error.message)
    })

    socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed')
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection')
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setIsConnected(false)
    }
  }, [user?.id, handleStreamEvent])

  // Clear stream events for new session or specific criteria
  const clearStreamEvents = useCallback((options?: {
    messageId?: string
    keepRecentCount?: number
    olderThan?: Date
  }) => {
    if (!options) {
      // Clear all events
      console.log('🧹 Clearing all stream events')
      setStreamEvents([])
      logCount.current = 0
      return
    }

    setStreamEvents(prev => {
      let filtered = prev

      // Filter by messageId if specified
      if (options.messageId) {
        filtered = filtered.filter(event => event.messageId !== options.messageId)
      }

      // Keep only recent events if specified
      if (options.keepRecentCount && options.keepRecentCount > 0) {
        filtered = filtered.slice(-options.keepRecentCount)
      }

      // Remove events older than specified date
      if (options.olderThan) {
        filtered = filtered.filter(event => 
          new Date(event.timestamp) >= options.olderThan!
        )
      }

      if (filtered.length !== prev.length) {
        console.log(`🧹 Cleared ${prev.length - filtered.length} stream events`)
      }

      return filtered
    })
  }, [])

  // Get events for specific message (strict mapping logic)
  const getEventsForMessage = useCallback((messageId: string) => {
    if (!messageId) return []
    
    // Only return events that exactly match the messageId
    // This prevents old events from bleeding into new messages
    return streamEvents.filter(event => event.messageId === messageId)
  }, [streamEvents])

  // Get all recent stream events (for debugging)
  const getRecentEvents = useCallback((limit = 20) => {
    return streamEvents.slice(-limit)
  }, [streamEvents])

  return {
    isConnected,
    streamEvents,
    clearStreamEvents,
    getEventsForMessage,
    getRecentEvents
  }
}
