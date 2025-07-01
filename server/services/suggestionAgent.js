const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

class SuggestionAgent {
  constructor() {
    // Kiểm tra API key trước khi khởi tạo
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable');
      throw new Error('Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable');
    }

    // Sử dụng model nhẹ hơn cho suggestions
    this.suggestionModel = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_SUGGESTION_MODEL || "gemini-1.5-flash",
      temperature: 0.5,
      apiKey: apiKey,
    });
    
    console.log('🎯 SuggestionAgent initialized with model:', process.env.GEMINI_SUGGESTION_MODEL || "gemini-1.5-flash");
    console.log('🔑 API key configured:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  }

  // Main method to generate suggestions
  async generateSuggestions(userInfo, lastMessage, businessContext = null) {
    console.log('🎨 Generating AI-powered suggestions...');
    
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
        { role: 'user', content: suggestionPrompt }
      ];

      console.log('🚀 Calling suggestion model...');
      const result = await this.suggestionModel.invoke(messages);
      
      console.log('🔍 Raw suggestion response:', result.content.substring(0, 200) + '...');
      
      // Thử parse JSON trước
      let suggestions = [];
      
      try {
        // Tìm JSON array trong response
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log('🔍 Found JSON in response:', jsonStr);
          
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            suggestions = parsed.filter(s => typeof s === 'string' && s.length > 0);
            console.log(`✅ Successfully parsed ${suggestions.length} suggestions from JSON`);
          }
        }
      } catch (jsonError) {
        console.log('⚠️ Failed to parse JSON, trying text parsing...');
      }
      
      // Fallback: Parse text format nếu JSON không hoạt động
      if (suggestions.length === 0) {
        // Parse plain text response với bullet points
        const responseText = result.content.trim();
        const lines = responseText.split('\n');
        suggestions = lines
          .filter((line) => line.trim().startsWith('-'))
          .map((line) => line.trim().substring(1).trim())
          .filter((suggestion) => suggestion.length > 0);
      }

      if (suggestions.length > 0) {
        console.log(`✅ Generated ${suggestions.length} suggestions:`);
        suggestions.forEach((s, i) => {
          console.log(`   ${i+1}. "${s}"`);
        });
        
        return {
          success: true,
          suggestions: suggestions
        };
      } else {
        console.log('⚠️ No valid suggestions found, generating fallback');
        return this.getFallbackSuggestions(businessContext?.notes);
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
      return this.getFallbackSuggestions(businessContext?.notes);
    }
  }

  // Fallback suggestions when AI fails
  getFallbackSuggestions(hasOnboarding) {
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
  detectBusinessType(onboardingNotes) {
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

module.exports = SuggestionAgent;
