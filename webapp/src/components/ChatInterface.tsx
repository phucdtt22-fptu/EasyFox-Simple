'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/context/AuthContext'
import ReactMarkdown from 'react-markdown'
import LoadingSpinner from './LoadingSpinner'

function ChatInterface() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, loading, sendMessage } = useChat()
  const { user, signOut } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    await sendMessage(question)
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold">
              <span className="text-orange-500">Easy</span>
              <span className="text-red-600">Fox</span>
            </span>
            <span className="text-gray-600">Trợ lý AI Marketing</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Xin chào, {user?.user_metadata?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🦊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chào mừng bạn đến với EasyFox!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Tôi là trợ lý AI marketing của bạn. Hãy bắt đầu bằng cách chia sẻ thông tin về doanh nghiệp của bạn để tôi có thể giúp tạo chiến dịch marketing phù hợp.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-4">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg px-4 py-3 max-w-xs lg:max-w-md xl:max-w-lg">
                <p className="text-sm font-medium">{message.question}</p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-4 py-3 max-w-xs lg:max-w-md xl:max-w-2xl shadow-sm border border-gray-200">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code({ children, className, ...props }: any) {
                        return (
                          <code 
                            className={`${className} bg-gray-100 px-2 py-1 rounded text-sm font-mono`} 
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      pre({ children, ...props }: any) {
                        return (
                          <pre 
                            className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono" 
                            {...props}
                          >
                            {children}
                          </pre>
                        )
                      }
                    }}
                  >
                    {message.ai_response}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <LoadingSpinner size="sm" text="AI đang suy nghĩ..." />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn của bạn..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatInterface
