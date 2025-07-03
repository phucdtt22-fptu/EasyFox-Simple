import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SuggestionAgent } from '@/lib/suggestionAgent';

export async function POST(req: NextRequest) {
  console.log('🎯 === SUGGESTION API CALLED ===');
  
  try {
    // Get Authorization header
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    const body = await req.json();
    const { lastMessage, businessContext } = body;

    console.log('📊 Suggestion request data:');
    console.log('   - Has lastMessage:', !!lastMessage);
    console.log('   - Has businessContext:', !!businessContext);

    // Get user info
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('❌ Error fetching user info:', userError);
      return NextResponse.json({ error: 'Error fetching user info' }, { status: 500 });
    }

    // Initialize SuggestionAgent
    let suggestionAgent: SuggestionAgent;
    try {
      console.log('🔧 Initializing SuggestionAgent...');
      console.log('🔑 OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
      console.log('🎯 Model:', process.env.OPENAI_SUGGESTION_MODEL || "gpt-3.5-turbo");
      
      suggestionAgent = new SuggestionAgent();
      console.log('✅ SuggestionAgent initialized successfully');
    } catch (initError) {
      console.error('❌ Failed to initialize SuggestionAgent:', initError);
      console.error('❌ Error details:', {
        message: initError instanceof Error ? initError.message : 'Unknown error',
        stack: initError instanceof Error ? initError.stack : undefined,
        openaiApiKey: process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
      });
      
      // Fallback suggestions based on context
      const fallbackSuggestions = businessContext?.notes ? [
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

      console.log('🔄 Returning fallback suggestions due to initialization error');
      return NextResponse.json({
        success: true,
        suggestions: fallbackSuggestions
      });
    }

    console.log('🤖 Generating suggestions with SuggestionAgent...');
    console.log('📊 Input data:', {
      hasUserInfo: !!userInfo,
      hasLastMessage: !!lastMessage,
      hasBusinessContext: !!businessContext,
      lastMessagePreview: lastMessage ? `${lastMessage.question?.substring(0, 50)}...` : 'No last message'
    });
    
    // Generate suggestions using the dedicated agent
    const result = await suggestionAgent.generateSuggestions(
      userInfo as { id: string; business_name?: string; business_type?: string; target_audience?: string; notes?: string },
      lastMessage,
      businessContext
    );

    console.log('🎯 SuggestionAgent result:', result);

    if (result.success && result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
      console.log(`✅ Successfully generated ${result.suggestions.length} AI suggestions:`, result.suggestions);
      
      // Log suggestions to database for analytics (optional)
      try {
        await supabase
          .from('suggestions_log')
          .insert({
            user_id: user.id,
            suggestions: result.suggestions,
            context_type: businessContext?.notes ? 'with_onboarding' : 'without_onboarding',
            last_message_id: lastMessage?.id || null,
            created_at: new Date().toISOString()
          });
        console.log('📝 Suggestions logged to database');
      } catch (logError) {
        console.warn('⚠️ Failed to log suggestions:', logError);
        // Continue anyway, logging is not critical
      }

      return NextResponse.json({
        success: true,
        suggestions: result.suggestions
      });
    } else {
      console.log('❌ Failed to generate suggestions');
      
      // Don't return fallback suggestions in the middle of chat
      // Let frontend handle when to show default suggestions
      return NextResponse.json({
        success: false,
        suggestions: []
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in suggestions API:', error);
    
    // Don't return fallback suggestions in the middle of chat
    return NextResponse.json({
      success: false,
      suggestions: []
    });
  }
}
