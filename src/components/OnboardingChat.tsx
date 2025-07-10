'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Building2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { OnboardingFormData } from '@/types';

interface OnboardingChatProps {
  onComplete: () => void;
}

export default function OnboardingChat({ onComplete }: OnboardingChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'ai' | 'user';
    content: string;
    showForm?: boolean;
  }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI mở lời chào đầu tiên và hiển thị form ngay
  useEffect(() => {
    const initialMessage = {
      id: 'welcome',
      type: 'ai' as const,
      content: `🎉 **Chào mừng bạn đến với EasyFox AI!**

Tôi là trợ lý marketing AI của bạn. Để có thể hỗ trợ bạn tốt nhất, tôi cần tìm hiểu thêm về doanh nghiệp của bạn.

Vui lòng điền đầy đủ thông tin trong form bên dưới. Sau khi hoàn thành, tôi sẽ phân tích và đưa ra những gợi ý marketing phù hợp nhất cho doanh nghiệp của bạn! �`,
      showForm: true
    };
    
    setMessages([initialMessage]);
    setShowForm(true); // Hiển thị form ngay từ đầu
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Phân tích intent của user
      const userInput = input.trim().toLowerCase();
      
      if (userInput.includes('form') || userInput.includes('điền') || userInput.includes('nhanh')) {
        // User muốn dùng form
        const aiResponse = {
          id: `ai-${Date.now()}`,
          type: 'ai' as const,
          content: `✅ **Tuyệt vời!** Tôi sẽ đưa ra form onboarding để bạn điền thông tin nhanh chóng.

Vui lòng điền đầy đủ thông tin trong form bên dưới. Sau khi hoàn thành, tôi sẽ phân tích và đưa ra những gợi ý marketing phù hợp nhất cho doanh nghiệp của bạn! 🚀`,
          showForm: true
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setShowForm(true);
      } else {
        // User muốn chat tự do - gửi đến AI backend
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: input.trim(),
            user_id: user?.id,
            user_info: {
              id: user?.id,
              email: user?.email,
              name: user?.user_metadata?.name || user?.email || 'User'
            },
            onboarding_mode: true // Đánh dấu đây là mode onboarding
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        
        if (data.success) {
          const aiResponse = {
            id: `ai-${Date.now()}`,
            type: 'ai' as const,
            content: data.response,
            showForm: data.response.includes('show_onboarding_form') || 
                     (data.toolInvocations && data.toolInvocations.some((t: { toolName: string }) => t.toolName === 'Show_Onboarding_Form'))
          };
          
          setMessages(prev => [...prev, aiResponse]);
          
          if (aiResponse.showForm) {
            setShowForm(true);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: `ai-error-${Date.now()}`,
        type: 'ai' as const,
        content: '❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại hoặc sử dụng form onboarding bên dưới.'
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: OnboardingFormData) => {
    // Tạo business description từ form data
    const businessDescription = `Tên doanh nghiệp: ${data.businessName}. Loại hình: ${data.businessType}. Mô tả: ${data.businessDescription}. Địa điểm: ${data.businessLocation}. Quy mô: ${data.businessSize}. Số năm hoạt động: ${data.yearsInBusiness}. Sản phẩm/dịch vụ chính: ${data.mainProducts}. Khách hàng mục tiêu: ${data.targetCustomers}. Mục tiêu kinh doanh: ${data.businessGoals}.`;

    try {
      // Gửi dữ liệu đến backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `[ONBOARDING_COMPLETE] Tôi đã hoàn thành form onboarding với thông tin: ${businessDescription}`,
          user_id: user?.id,
          user_info: {
            id: user?.id,
            email: user?.email,
            name: user?.user_metadata?.name || user?.email || 'User'
          },
          onboarding_mode: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit onboarding data');
      }

      const result = await response.json();
      
      if (result.success) {
        // Ẩn form
        setShowForm(false);
        
        // Hiển thị tin nhắn hoàn thành
        const completionMessage = {
          id: `completion-${Date.now()}`,
          type: 'ai' as const,
          content: `🎉 **Tuyệt vời! Onboarding hoàn thành!**

Tôi đã ghi nhận đầy đủ thông tin về doanh nghiệp của bạn. Từ giờ, tôi sẽ sử dụng những thông tin này để:

✅ Đưa ra chiến lược marketing phù hợp
✅ Tạo nội dung sáng tạo và hiệu quả  
✅ Quản lý chiến dịch một cách tối ưu
✅ Hỗ trợ phân tích và tối ưu hóa

**Chào mừng bạn đến với EasyFox! Hãy bắt đầu hành trình marketing thành công!** 🚀

*Đang chuyển đến giao diện chat chính...*`
        };
        
        setMessages(prev => [...prev, completionMessage]);
        
        // Chờ 3 giây rồi chuyển về chat chính
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to process onboarding data');
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      
      // Hiển thị lỗi
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'ai' as const,
        content: '❌ Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleOnboardingSkip = () => {
    // Nếu user bỏ qua, vẫn chuyển về chat chính
    onComplete();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Onboarding Header */}
      <div className="bg-white border-b border-blue-200 px-4 py-3">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-600">EasyFox Onboarding</h1>
              <p className="text-sm text-gray-500">Thiết lập thông tin doanh nghiệp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2 mb-4">
              {msg.type === 'user' ? (
                <div className="flex justify-end mb-2">
                  <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md shadow-md">
                    <p className="whitespace-pre-wrap text-sm font-medium">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start mb-2">
                  <div className="bg-white rounded-lg px-4 py-2 max-w-2xl border border-gray-200 shadow-sm">
                    <div className="text-gray-800">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                    
                    {/* Render onboarding form nếu cần */}
                    {msg.showForm && showForm && (
                      <div className="mt-4">
                        <OnboardingForm 
                          onSubmit={handleOnboardingComplete}
                          onSkip={handleOnboardingSkip}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-500">Đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form - ẩn nếu đang hiển thị form */}
        {!showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-end gap-2 p-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Chia sẻ về doanh nghiệp của bạn hoặc gõ 'form' để điền form nhanh..."
                className="flex-1 min-h-[60px] max-h-32 resize-none border-0 focus:ring-0 focus:outline-none"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
