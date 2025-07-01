// TypeScript version of SuggestionAgent for Next.js API routes
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

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
  private suggestionModel: ChatGoogleGenerativeAI;

  constructor() {
    // Debug environment variables trong Next.js runtime
    console.log('🔧 SuggestionAgent constructor called');
    console.log('🌍 Environment check:');
    console.log('   - NODE_ENV:', process.env.NODE_ENV);
    console.log('   - All env keys containing GEMINI/GOOGLE/API:', 
      Object.keys(process.env).filter(k => 
        k.toLowerCase().includes('gemini') || 
        k.toLowerCase().includes('google') || 
        k.toLowerCase().includes('api')
      )
    );
    
    // Đọc trực tiếp từ process.env với fallback
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    console.log('🔑 API Keys check:');
    console.log('   - GOOGLE_API_KEY:', googleApiKey ? `${googleApiKey.substring(0, 10)}...` : 'MISSING');
    console.log('   - GEMINI_API_KEY:', geminiApiKey ? `${geminiApiKey.substring(0, 10)}...` : 'MISSING');
    
    const apiKey = googleApiKey || geminiApiKey;
    
    if (!apiKey) {
      console.error('❌ No API key found in environment');
      console.error('   Available env vars:', Object.keys(process.env).slice(0, 10));
      throw new Error('Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable');
    }

    console.log('✅ Using API key:', apiKey.substring(0, 10) + '...');

    // Khởi tạo model
    try {
      this.suggestionModel = new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_SUGGESTION_MODEL || "gemini-1.5-flash",
        temperature: 0.5,
        apiKey: apiKey,
      });
      
      console.log('🎯 SuggestionAgent initialized successfully');
    } catch (modelError) {
      console.error('❌ Failed to initialize ChatGoogleGenerativeAI:', modelError);
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
Tạo 4 gợi ý ngắn gọn (8-15 từ) cho những gì user có thể nói/hỏi tiếp theo.

QUAN TRỌNG: Chỉ trả về JSON array đơn giản, không thêm text hay giải thích gì khác.

VÍ DỤ FORMAT:
["Tôi muốn tạo chiến dịch marketing mới", "Hãy xem các chiến dịch hiện tại", "Giúp tôi lên lịch đăng bài", "Tư vấn tối ưu hóa nội dung"]

Chỉ trả về JSON array như ví dụ trên, không có text nào khác!`;

      console.log('📝 Suggestion context:');
      console.log(`   - Onboarding: ${businessContext?.notes ? 'YES' : 'NO'}`);
      console.log(`   - Business type: ${businessType}`);
      console.log(`   - Last message: ${lastMessage?.question ? 'YES' : 'NO'}`);

      const messages = [
        { role: 'user' as const, content: suggestionPrompt }
      ];

      console.log('🚀 Calling suggestion model...');
      console.log('📤 Sending prompt to Gemini API...');
      console.log('🔗 Model endpoint will be called with temperature 0.5...');
      
      const startTime = Date.now();
      const result = await this.suggestionModel.invoke(messages);
      const endTime = Date.now();
      
      console.log(`⏱️ Gemini API call took ${endTime - startTime}ms`);
      console.log('📥 Received response from Gemini API');
      
      // Handle different types of content
      const contentStr = typeof result.content === 'string' 
        ? result.content 
        : Array.isArray(result.content) 
          ? result.content.map(c => typeof c === 'string' ? c : (c as ContentBlock).text || '').join(' ')
          : '';
      
      console.log('🔍 Raw suggestion response length:', contentStr.length);
      console.log('🔍 Raw suggestion response preview:', contentStr.substring(0, 300) + '...');
      
      if (!contentStr || contentStr.length === 0) {
        console.log('⚠️ Empty response from Gemini API');
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
      "Tôi muốn tạo chiến dịch marketing mới",
      "Hãy xem các chiến dịch hiện tại của tôi", 
      "Giúp tôi lên lịch đăng bài",
      "Tư vấn tối ưu hóa nội dung"
    ] : [
      "Thiết lập thông tin doanh nghiệp",
      "Tôi cần hướng dẫn bắt đầu",
      "EasyFox có thể giúp gì cho tôi?",
      "Tạo chiến dịch marketing đầu tiên"
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
