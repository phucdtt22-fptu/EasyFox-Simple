'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, LogOut, User } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { InlineCampaignForm } from '@/components/inline/InlineCampaignForm';
import { InlineOnboardingForm } from '@/components/inline/InlineOnboardingForm';

export default function SimpleChatInterface() {
  const { user, signOut } = useAuth();
  const { messages, loading, sendMessage, clearChat } = useChat();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [, forceUpdate] = useState({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Re-render when messages change
  useEffect(() => {
    forceUpdate({}); // Force re-render when messages change
  }, [messages]);

  // Simple form detection - không dùng complex state management
  const hasForm = (response: string) => {
    return response.includes('show_campaign_form') || response.includes('show_onboarding_form');
  };

  const renderForm = (response: string) => {
    if (response.includes('show_campaign_form')) {
      return <InlineCampaignForm />;
    }
    if (response.includes('show_onboarding_form')) {
      return <InlineOnboardingForm />;
    }
    return null;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      
      {/* Header */}
      <div className="bg-white border-b border-orange-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-orange-600">EasyFox AI Assistant</h1>
            <span className="text-sm text-gray-500">({user?.email})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Button>
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Chat mới
            </Button>
            <Button
              onClick={() => signOut()}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Chào mừng đến với EasyFox AI!
              </h2>
              <p className="text-gray-500">
                Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const hasQuestion = msg.question && msg.question.trim();
              const hasResponse = msg.ai_response && msg.ai_response.trim();
              
              return (
                <div key={msg.id || `temp-msg-${index}`} className="space-y-2 mb-4">
                  {/* User Message */}
                  {hasQuestion && (
                    <div className="flex justify-end mb-2">
                      <div className="bg-orange-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md shadow-md">
                        <p className="whitespace-pre-wrap text-sm font-medium">{msg.question}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Response */}
                  {hasResponse && (
                    <div className="flex justify-start mb-2">
                      <div className="bg-white rounded-lg px-4 py-2 max-w-2xl border border-gray-200 shadow-sm">
                        <div className="text-gray-800">
                          <MarkdownRenderer content={msg.ai_response} />
                        </div>
                        
                        {/* Render inline forms nếu có tool response */}
                        {hasForm(msg.ai_response) && (
                          <div className="mt-4">
                            {renderForm(msg.ai_response)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-500">Đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-end gap-2 p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 min-h-[60px] max-h-32 resize-none border-0 focus:ring-0 focus:outline-none"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
