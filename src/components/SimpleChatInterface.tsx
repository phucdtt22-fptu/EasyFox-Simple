'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useWebSocketStream } from '@/hooks/useWebSocketStream';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Plus, User, LogOut, Send } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { ChatMessage } from '@/types';

export default function SimpleChatInterface() {
  const { user, signOut } = useAuth();
  const { messages, loading, sendMessage, startNewChat, currentSessionId } = useChat();
  const { isConnected, streamEvents, clearStreamEvents, getEventsForMessage } = useWebSocketStream();
  const router = useRouter();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    
    // Send message - real-time events will be handled by WebSocket
    await sendMessage(message);
  };

  const handleNewChat = () => {
    console.log('🗑️ Starting new chat');
    clearStreamEvents(); // Clear stream events
    startNewChat(); // Start new session
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Group messages by conversation flow
  const groupedMessages = messages.reduce((groups: ChatMessage[][], message: ChatMessage) => {
    if (message.message_type === 'user') {
      // Start new group with user message
      groups.push([message]);
    } else if (groups.length > 0) {
      // Add to current group
      groups[groups.length - 1].push(message);
    } else {
      // Edge case: AI message without user message
      groups.push([message]);
    }
    return groups;
  }, []);

  // Render a single message
  const renderMessage = (message: ChatMessage) => {
    const messageStreamEvents = getEventsForMessage(message.id);
    
    switch (message.message_type) {
      case 'user':
        return (
          <div className="flex justify-end">
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="bg-orange-500 text-white rounded-2xl px-4 py-3 max-w-lg">
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-4xl w-full">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="flex-1">
                {/* Show real-time stream events if available */}
                {messageStreamEvents.length > 0 ? (
                  <div className="space-y-3">
                    {messageStreamEvents
                      .filter(e => e.type === 'ai_response')
                      .map((event, index) => (
                        <div key={`stream-ai-${index}`} className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                          <div className="text-gray-800 prose prose-sm max-w-none">
                            <MarkdownRenderer content={event.content || ''} />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  /* Show database content */
                  message.content && (
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="text-gray-800 prose prose-sm max-w-none">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case 'tool_start':
        return (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-4xl w-full">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">🔧</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  AI đang thực hiện: {message.metadata?.toolName || 'Công cụ'}
                </div>
                <div className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                  Đang xử lý...
                </div>
              </div>
            </div>
          </div>
        );

      case 'tool_end':
        return (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-4xl w-full">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✅</span>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex-1">
                <div className="text-sm font-medium text-green-900 mb-1">
                  Hoàn thành: {message.metadata?.toolName || 'Công cụ'}
                </div>
                {message.metadata?.toolOutput !== undefined && message.metadata?.toolOutput !== null && (
                  <div className="text-xs text-green-700 bg-green-100 rounded p-2 mt-1">
                    <pre className="whitespace-pre-wrap">
                      {(() => {
                        const output = message.metadata.toolOutput;
                        if (typeof output === 'string') {
                          return output;
                        }
                        try {
                          return JSON.stringify(output, null, 2);
                        } catch {
                          return String(output);
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-600">
          <h1 className="text-lg font-semibold text-white">EasyFox AI</h1>
          <p className="text-xs text-slate-300 mt-1">Marketing Assistant</p>
          {currentSessionId && (
            <p className="text-xs text-slate-400 mt-1">Session: {currentSessionId.slice(-8)}</p>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Chat mới
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* User Section */}
        <div className="p-4 border-t border-slate-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => router.push('/profile')}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              onClick={() => signOut()}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Kết nối real-time' : 'Mất kết nối'}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                Messages: {messages.length} | Stream: {streamEvents.length}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto py-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-orange-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Chào mừng đến với EasyFox AI!
                  </h2>
                  <p className="text-gray-600">
                    Tôi là trợ lý marketing AI của bạn. Hãy bắt đầu cuộc trò chuyện để tôi giúp bạn phát triển doanh nghiệp.
                  </p>
                  <div className="mt-6 space-y-2">
                    <p className="text-sm text-gray-500">Bạn có thể hỏi tôi về:</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Tạo chiến dịch marketing</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Phân tích đối thủ</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Ý tưởng nội dung</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 px-4">
                  {messages.map((message: ChatMessage) => (
                    <div key={message.id}>
                      {renderMessage(message)}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start px-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-sm text-gray-500 ml-2">Đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 p-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn của bạn..."
                  className="flex-1 min-h-[20px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus:outline-none placeholder-gray-500"
                  disabled={loading}
                  rows={1}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white p-2 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <p className="text-xs text-gray-500 text-center mt-2">
              EasyFox AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
