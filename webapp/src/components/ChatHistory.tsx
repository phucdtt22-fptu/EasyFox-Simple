'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

interface ChatSession {
  session_id: string
  created_at: string
  first_message: string | null
  message_count: number
}

interface ChatHistoryProps {
  onSessionSelect?: (sessionId: string) => void
  onSelectSession?: (sessionId: string) => void
  onClose?: () => void
  currentSessionId?: string
  isModal?: boolean
}

export default function ChatHistory({ 
  onSessionSelect, 
  onSelectSession, 
  onClose, 
  currentSessionId, 
  isModal = true 
}: ChatHistoryProps) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSessionSelect = onSessionSelect || onSelectSession

  const loadChatSessions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions/${user.id}`)
      const result = await response.json()

      if (result.success) {
        setSessions(result.data)
      } else {
        setError(result.error || 'Không thể tải lịch sử chat')
      }
    } catch (err) {
      console.error('Error loading chat sessions:', err)
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadChatSessions()
    }
  }, [user, loadChatSessions])

  const handleSelectSession = (sessionId: string) => {
    if (handleSessionSelect) {
      handleSessionSelect(sessionId)
    }
    if (isModal && onClose) {
      onClose()
    }
  }

  const deleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat-session/${user?.id}/${sessionId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        loadChatSessions()
        
        if (currentSessionId === sessionId && isModal && onClose) {
          onClose()
        }
      } else {
        alert('Không thể xóa cuộc trò chuyện: ' + result.error)
      }
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('Lỗi khi xóa cuộc trò chuyện')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hôm nay ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`
    } else {
      return date.toLocaleDateString('vi-VN')
    }
  }

  const truncateMessage = (message: string | null | undefined, maxLength: number = 50) => {
    if (!message) return 'Chat mới'
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  if (!isModal) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Lịch sử chat</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-400"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button
                onClick={loadChatSessions}
                className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Thử lại
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-400 text-sm">Chưa có chat nào</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => handleSelectSession(session.session_id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                    currentSessionId === session.session_id
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {truncateMessage(session.first_message, 30)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(session.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.session_id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-600 rounded text-red-400 hover:text-white transition-all"
                      title="Xóa cuộc trò chuyện"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Lịch sử trò chuyện</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadChatSessions}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Thử lại
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    currentSessionId === session.session_id
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                  onClick={() => handleSelectSession(session.session_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">
                        {truncateMessage(session.first_message)}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{formatDate(session.created_at)}</span>
                        <span>{session.message_count} tin nhắn</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.session_id, e)}
                      className="ml-2 text-red-500 hover:text-red-700 text-sm"
                      title="Xóa cuộc trò chuyện"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
