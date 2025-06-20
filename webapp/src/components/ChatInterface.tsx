'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/context/AuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import LoadingSpinner from './LoadingSpinner'
import ChatHistory from './ChatHistory'
import SpamNotification from './SpamNotification'
import { Menu, Plus, BookOpen, LogOut, Bot, Copy, Check } from 'lucide-react'

function ChatInterface() {
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [spamNotification, setSpamNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ''
  })
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, loading, chatSessionId, sendMessage, clearChat, switchToSession } = useChat()
  const { user, signOut } = useAuth()

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

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
    const result = await sendMessage(question)
    
    // Show spam notification if message was rejected
    if (!result.success && result.error) {
      setSpamNotification({
        show: true,
        message: result.error
      })
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={sidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            {sidebarOpen && (
              <button
                onClick={clearChat}
                className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                title="Tạo chat mới"
              >
                <Plus className="w-4 h-4" />
                <span>Chat mới</span>
              </button>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-2">
              <h2 className="text-lg font-semibold">
                <span className="text-orange-400">Easy</span>
                <span className="text-red-400">Fox</span>
              </h2>
              <p className="text-gray-400 text-sm">Trợ lý AI Marketing</p>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          {sidebarOpen ? (
            <ChatHistory 
              onSessionSelect={(sessionId) => {
                switchToSession(sessionId)
              }}
              isModal={false}
            />
          ) : (
            <div className="p-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full p-3 hover:bg-gray-700 rounded-lg transition-colors text-center"
                title="Xem lịch sử chat"
              >
                <BookOpen className="w-5 h-5 mx-auto" />
              </button>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-300">
                {user?.user_metadata?.name || user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 hover:bg-gray-700 rounded-lg transition-colors text-center"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-800">Chat với AI</h1>
              {chatSessionId && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  ID: {chatSessionId.split('_').pop()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <Bot className="w-16 h-16 text-orange-500" />
              </div>
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
              {/* User message - only show if question exists */}
              {message.question && (
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg px-4 py-3 max-w-xs lg:max-w-md xl:max-w-lg">
                    <p className="text-sm font-medium">{message.question}</p>
                  </div>
                </div>
              )}

              {/* AI response - only show if response exists */}
              {message.ai_response && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg px-4 py-3 max-w-xs lg:max-w-md xl:max-w-4xl shadow-sm border border-gray-200">
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Enhanced code blocks with syntax highlighting and copy button
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            const language = match ? match[1] : 'text'
                            const codeString = String(children).replace(/\n$/, '')
                            const codeId = `code-${Date.now()}-${Math.random()}`
                            
                            if (!inline && match) {
                              return (
                                <div className="relative group">
                                  <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 text-xs rounded-t-lg">
                                    <span className="font-medium">{language.toUpperCase()}</span>
                                    <button
                                      onClick={() => copyToClipboard(codeString, codeId)}
                                      className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                                      title="Copy code"
                                    >
                                      {copiedCode === codeId ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={language}
                                    PreTag="div"
                                    className="!mt-0 !rounded-t-none"
                                    customStyle={{
                                      margin: 0,
                                      borderTopLeftRadius: 0,
                                      borderTopRightRadius: 0,
                                    }}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              )
                            }

                            return (
                              <code 
                                className="bg-orange-50 text-orange-800 px-2 py-1 rounded text-sm font-mono border border-orange-200" 
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                          // Enhanced tables
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          table({ children, ...props }: any) {
                            return (
                              <div className="overflow-x-auto my-4">
                                <table 
                                  className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" 
                                  {...props}
                                >
                                  {children}
                                </table>
                              </div>
                            )
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          thead({ children, ...props }: any) {
                            return (
                              <thead className="bg-gray-50" {...props}>
                                {children}
                              </thead>
                            )
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          th({ children, ...props }: any) {
                            return (
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" 
                                {...props}
                              >
                                {children}
                              </th>
                            )
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          td({ children, ...props }: any) {
                            return (
                              <td 
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200" 
                                {...props}
                              >
                                {children}
                              </td>
                            )
                          },
                          // Enhanced blockquotes
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          blockquote({ children, ...props }: any) {
                            return (
                              <blockquote 
                                className="border-l-4 border-orange-500 bg-orange-50 pl-4 py-2 my-4 italic text-gray-700" 
                                {...props}
                              >
                                {children}
                              </blockquote>
                            )
                          },
                          // Enhanced lists
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          ul({ children, ...props }: any) {
                            return (
                              <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                                {children}
                              </ul>
                            )
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          ol({ children, ...props }: any) {
                            return (
                              <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                                {children}
                              </ol>
                            )
                          },
                          // Enhanced headings
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          h1({ children, ...props }: any) {
                            return (
                              <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2" {...props}>
                                {children}
                              </h1>
                            )
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          h2({ children, ...props }: any) {
                            return (
                              <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-3" {...props}>
                                {children}
                              </h2>
                            )
                          },
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          h3({ children, ...props }: any) {
                            return (
                              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props}>
                                {children}
                              </h3>
                            )
                          },
                          // Enhanced links
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          a({ children, ...props }: any) {
                            return (
                              <a 
                                className="text-orange-600 hover:text-orange-800 underline font-medium" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                {...props}
                              >
                                {children}
                              </a>
                            )
                          }
                        }}
                      >
                        {message.ai_response}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
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

        {/* Spam Notification */}
        <SpamNotification
          message={spamNotification.message}
          show={spamNotification.show}
          onClose={() => setSpamNotification({ show: false, message: '' })}
        />
      </div>
    </div>
  )
}

export default ChatInterface
