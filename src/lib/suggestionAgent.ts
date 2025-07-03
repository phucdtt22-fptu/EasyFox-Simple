// TypeScript version of SuggestionAgent for Next.js API routes
import { ChatOpenAI } from "@langchain/openai";

interface User {
  id: string;
  business_name?: string;
  business_type?: string;
  target_audience?: string;
  notes?: string;
}

interface LastMessage {
  id?: string;
  question?: string;
  ai_response?: string;
}

interface BusinessContext {
  notes?: string;
}

interface SuggestionResult {
  success: boolean;
  suggestions: string[];
}

interface ContentBlock {
  text?: string;
  type?: string;
}

export class SuggestionAgent {
  private suggestionModel: ChatOpenAI;

  constructor() {
    // Debug environment variables trong Next.js runtime
    console.log('🔧 SuggestionAgent constructor called');
    console.log('🌍 Environment check:');
    console.log('   - NODE_ENV:', process.env.NODE_ENV);
    console.log('   - OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
    
    // Đọc trực tiếp từ process.env
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔑 API Keys check:');
    console.log('   - OPENAI_API_KEY:', openaiApiKey ? `${openaiApiKey.substring(0, 10)}...` : 'MISSING');
    
    if (!openaiApiKey) {
      console.error('❌ No OPENAI_API_KEY found in environment');
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    console.log('✅ Using OpenAI API key:', openaiApiKey.substring(0, 10) + '...');

    // Khởi tạo model
    try {
      this.suggestionModel = new ChatOpenAI({
        modelName: process.env.OPENAI_SUGGESTION_MODEL || "gpt-3.5-turbo",
        temperature: 0.5,
        openAIApiKey: openaiApiKey,
      });
      
      console.log('🎯 SuggestionAgent initialized successfully with OpenAI');
    } catch (modelError) {
      console.error('❌ Failed to initialize ChatOpenAI:', modelError);
      throw modelError;
    }
  }

  // Main method to generate suggestions
  async generateSuggestions(userInfo: User, lastMessage: LastMessage | null, businessContext: BusinessContext | null = null): Promise<SuggestionResult> {
    console.log('🎨 ==> STARTING AI-POWERED SUGGESTION GENERATION <==');
    console.log('📊 Input parameters:', {
      userInfo: !!userInfo,
      lastMessage: !!lastMessage,
      businessContext: !!businessContext,
      lastMessageId: lastMessage?.id,
      lastQuestion: lastMessage?.question?.substring(0, 100) + '...'
    });
    
    try {
      // Detect business type for more targeted suggestions
      const businessType = this.detectBusinessType(businessContext?.notes);
      
      // Create focused suggestion prompt
      const suggestionPrompt = `Bạn là AI assistant tạo gợi ý cho EasyFox Marketing Platform. 

CONTEXT:
- Onboarding: ${businessContext?.notes ? 'COMPLETED' : 'NOT COMPLETED'}
- Business Type: ${businessType}
${businessContext?.notes ? `- Business Info: ${businessContext.notes}` : ''}

TIN NHẮN CUỐI CÙNG:
${lastMessage?.question ? `User: ${lastMessage.question}` : 'Chưa có tin nhắn'}
${lastMessage?.ai_response ? `AI: ${lastMessage.ai_response}` : ''}

NHIỆM VỤ: 
Phân tích tin nhắn cuối cùng của AI và tạo 4 gợi ý ngắn gọn (8-15 từ) cho những gì USER có thể TRẢ LỜI lại.

QUAN TRỌNG: 
- Nếu AI vừa hỏi một câu hỏi → tạo gợi ý trả lời cho câu hỏi đó
- Nếu AI vừa chào hỏi → tạo gợi ý cách user có thể bắt đầu cuộc trò chuyện
- Nếu AI vừa đưa ra thông tin → tạo gợi ý câu hỏi tiếp theo hoặc phản hồi
- Luôn đóng vai KHÁCH HÀNG trả lời AI, không phải AI hỏi khách hàng

Chỉ trả về JSON array đơn giản, không thêm text hay giải thích gì khác.

VÍ DỤ FORMAT:
["Tôi muốn tạo chiến dịch marketing mới", "Hãy xem các chiến dịch hiện tại", "Giúp tôi lên lịch đăng bài", "Tư vấn tối ưu hóa nội dung"]

Chỉ trả về JSON array như ví dụ trên, không có text nào khác!`;

      console.log('📝 Suggestion context:');
      console.log(`   - Onboarding: ${businessContext?.notes ? 'YES' : 'NO'}`);
      console.log(`   - Business type: ${businessType}`);
      console.log(`   - Last message: ${lastMessage?.question ? 'YES' : 'NO'}`);

      console.log('🚀 Calling OpenAI suggestion model...');
      console.log('📤 Sending prompt to OpenAI API...');
      console.log('🔗 Model endpoint will be called with temperature 0.5...');
      
      const startTime = Date.now();
      const result = await this.suggestionModel.invoke(suggestionPrompt);
      const endTime = Date.now();
      
      console.log(`⏱️ OpenAI API call took ${endTime - startTime}ms`);
      console.log('📥 Received response from OpenAI API');
      
      // Handle different types of content
      const contentStr = typeof result.content === 'string' 
        ? result.content 
        : Array.isArray(result.content) 
          ? result.content.map(c => typeof c === 'string' ? c : (c as ContentBlock).text || '').join(' ')
          : '';
      
      console.log('🔍 Raw suggestion response length:', contentStr.length);
      console.log('🔍 Raw suggestion response preview:', contentStr.substring(0, 300) + '...');
      
      if (!contentStr || contentStr.length === 0) {
        console.log('⚠️ Empty response from OpenAI API');
        return this.getFallbackSuggestions(!!businessContext?.notes);
      }
      
      console.log('📝 Processing response text...');
      
      // Thử parse JSON trước
      let suggestions: string[] = [];
      
      try {
        // Tìm JSON array trong response
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log('� Found JSON in response:', jsonStr);
          
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            suggestions = parsed.filter(s => typeof s === 'string' && s.length > 0);
            console.log(`✅ Successfully parsed ${suggestions.length} suggestions from JSON`);
          }
        }
      } catch (jsonError) {
        console.log('⚠️ Failed to parse JSON, trying text parsing...', jsonError instanceof Error ? jsonError.message : 'Unknown error');
      }
      
      // Fallback: Parse text format nếu JSON không hoạt động
      if (suggestions.length === 0) {
        const responseText = contentStr.trim();
        const lines = responseText.split('\n');
        console.log(`📋 Found ${lines.length} lines in response`);
        
        // Format 1: Lines bắt đầu với "-"
        suggestions = lines
          .filter((line: string) => line.trim().startsWith('-'))
          .map((line: string) => line.trim().substring(1).trim())
          .filter((suggestion: string) => suggestion.length > 0);
        
        console.log(`🎯 Found ${suggestions.length} suggestions with "-" format`);
        
        // Format 2: Nếu không có "-", thử tìm lines có nội dung
        if (suggestions.length === 0) {
          suggestions = lines
            .filter((line: string) => {
              const trimmed = line.trim();
              return trimmed.length > 10 && 
                     !trimmed.toLowerCase().includes('gợi ý') &&
                     !trimmed.toLowerCase().includes('nhiệm vụ') &&
                     !trimmed.toLowerCase().includes('context');
            })
            .map((line: string) => line.trim())
            .slice(0, 4); // Chỉ lấy tối đa 4 suggestions
          
          console.log(`🎯 Found ${suggestions.length} suggestions with content filtering`);
        }
        
        // Format 3: Nếu vẫn không có, thử split bằng số
        if (suggestions.length === 0) {
          const numbered = responseText.match(/\d+\.\s*(.+)/g);
          if (numbered) {
            suggestions = numbered.map(s => s.replace(/\d+\.\s*/, '').trim());
            console.log(`🎯 Found ${suggestions.length} suggestions with numbered format`);
          }
        }
      }

      if (suggestions.length > 0) {
        console.log(`✅ Generated ${suggestions.length} suggestions:`);
        suggestions.forEach((s: string, i: number) => {
          console.log(`   ${i+1}. "${s}"`);
        });
        
        return {
          success: true,
          suggestions: suggestions
        };
      } else {
        console.log('⚠️ No valid suggestions found, generating fallback');
        return this.getFallbackSuggestions(!!businessContext?.notes);
      }

    } catch (error) {
      console.error('❌ Error generating suggestions:', error);
      
      // Log chi tiết lỗi để debug
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      
      // Kiểm tra xem có phải lỗi API key không
      if (error instanceof Error && error.message.includes('API key')) {
        console.error('🔑 API Key error detected');
      }
      
      console.log('🔄 Falling back to default suggestions');
      return this.getFallbackSuggestions(!!businessContext?.notes);
    }
  }

  // Fallback suggestions when AI fails
  private getFallbackSuggestions(hasOnboarding: boolean): SuggestionResult {
    const fallbackSuggestions = hasOnboarding ? [
      "Tôi muốn tạo chiến dịch mới",
      "Xem chiến dịch hiện tại", 
      "Giúp lên lịch đăng bài",
      "Tư vấn tối ưu nội dung"
    ] : [
      "Tôi cần thiết lập doanh nghiệp",
      "Hướng dẫn tôi bắt đầu",
      "EasyFox có gì hay ho?",
      "Tạo chiến dịch đầu tiên"
    ];

    return {
      success: true,
      suggestions: fallbackSuggestions
    };
  }

  // Helper method to detect business type
  private detectBusinessType(onboardingNotes?: string): string {
    if (!onboardingNotes) return 'unknown';
    
    const notes = onboardingNotes.toLowerCase();
    
    if (notes.includes('quán cà phê') || notes.includes('café') || notes.includes('coffee')) {
      return 'coffee_shop';
    }
    if (notes.includes('tiệm nail') || notes.includes('nail salon') || notes.includes('làm nail')) {
      return 'nail_salon';
    }
    if (notes.includes('nhà hàng') || notes.includes('restaurant') || notes.includes('ăn uống')) {
      return 'restaurant';
    }
    if (notes.includes('spa') || notes.includes('massage') || notes.includes('thẩm mỹ')) {
      return 'spa';
    }
    if (notes.includes('shop') || notes.includes('cửa hàng') || notes.includes('bán hàng')) {
      return 'retail';
    }
    
    return 'general_business';
  }
}
