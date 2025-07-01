import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OnboardingFormData } from '@/types';

// Tool functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleToolCalls(toolCalls: any[], userId: string) {
  const results = [];
  
  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall;
    
    switch (name) {
      case 'showOnboardingForm':
        results.push({
          toolCallId: toolCall.id,
          toolName: 'showOnboardingForm',
          state: 'result',
          result: {}
        });
        break;
        
      case 'showOnboardingData':
        results.push({
          toolCallId: toolCall.id,
          toolName: 'showOnboardingData',
          state: 'result',
          result: args.data
        });
        break;
        
      case 'saveOnboardingData':
        try {
          // Create business description from onboarding data
          const data = args.data as OnboardingFormData;
          const businessDescription = generateBusinessDescription(data);
          
          // Update user notes in database
          const { error: updateError } = await supabase
            .from('users')
            .update({ notes: businessDescription })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating user notes:', updateError);
            throw updateError;
          }
          
          results.push({
            toolCallId: toolCall.id,
            toolName: 'saveOnboardingData',
            state: 'result',
            result: { success: true, description: businessDescription }
          });
        } catch {
          results.push({
            toolCallId: toolCall.id,
            toolName: 'saveOnboardingData',
            state: 'result',
            result: { success: false, error: 'Failed to save data' }
          });
        }
        break;
        
      default:
        results.push({
          toolCallId: toolCall.id,
          toolName: name,
          state: 'result',
          result: { error: 'Unknown tool' }
        });
    }
  }
  
  return results;
}

// Generate business description from onboarding data
function generateBusinessDescription(data: OnboardingFormData): string {
  return `
## Hồ sơ Doanh nghiệp: ${data.businessName}

**Thông tin cơ bản:**
- Tên doanh nghiệp: ${data.businessName}
- Loại hình: ${data.businessType}
- Mô tả: ${data.businessDescription}
- Vị trí: ${data.businessLocation || 'Chưa cập nhật'}
- Quy mô: ${data.businessSize || 'Chưa cập nhật'}
- Năm hoạt động: ${data.yearsInBusiness || 'Chưa cập nhật'}

**Sản phẩm/Dịch vụ chính:**
${data.mainProducts}

**Khách hàng mục tiêu:**
${data.targetCustomers}

**Mục tiêu kinh doanh:**
${data.businessGoals}

---
*Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}*
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle tool calls first
    if (body.toolCalls && body.user_id) {
      const toolResults = await handleToolCalls(body.toolCalls, body.user_id);
      return NextResponse.json({
        success: true,
        toolResults: toolResults
      });
    }
    
    // Handle onboarding data submission directly
    if (body.onboarding_data && body.user_id) {
      try {
        const data = body.onboarding_data as OnboardingFormData;
        const businessDescription = generateBusinessDescription(data);
        
        // Update user notes in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ notes: businessDescription })
          .eq('id', body.user_id);
          
        if (updateError) {
          console.error('Error updating user notes:', updateError);
          throw updateError;
        }
        
        // Return success response without tool invocations
        return NextResponse.json({
          success: true,
          response: `✅ **Đã lưu thông tin doanh nghiệp thành công!**

Cảm ơn bạn đã cung cấp thông tin chi tiết về **${data.businessName}**. Tôi đã ghi nhận đầy đủ:

🏢 **Thông tin doanh nghiệp:** ${data.businessType}
📍 **Vị trí:** ${data.businessLocation || 'Chưa cập nhật'}  
👥 **Quy mô:** ${data.businessSize || 'Chưa cập nhật'}
📅 **Kinh nghiệm:** ${data.yearsInBusiness || 'Chưa cập nhật'} năm

🎯 **Sản phẩm/dịch vụ chính:** ${data.mainProducts}
👤 **Khách hàng mục tiêu:** ${data.targetCustomers}
🚀 **Mục tiêu kinh doanh:** ${data.businessGoals}

Từ giờ tôi sẽ sử dụng thông tin này để hỗ trợ bạn tốt hơn trong việc xây dựng chiến lược marketing, tạo nội dung và quản lý chiến dịch phù hợp với đặc thù doanh nghiệp của bạn.

**Bạn muốn bắt đầu với điều gì?** 🚀`,
          chat_history_id: body.chat_history_id,
          toolInvocations: [], // No tool invocations for direct handling
        });
      } catch (error) {
        console.error('Error saving onboarding data:', error);
        return NextResponse.json({
          success: false,
          error: 'Không thể lưu thông tin doanh nghiệp. Vui lòng thử lại.'
        }, { status: 500 });
      }
    }
    
    // Handle both old format (messages) and new format (question)
    let requestData;
    
    if (body.question) {
      // New format from useChat.ts
      requestData = {
        question: body.question,
        user_id: body.user_id,
        chat_history_id: body.chat_history_id,
        user_info: body.user_info,
        campaigns: body.campaigns || [],
        chat_history: body.chat_history || [], // Add chat history
        onboarding_data: body.onboarding_data || null, // Add onboarding data
      };
    } else if (body.messages) {
      // Old Gemini-style format
      const lastMessage = body.messages[body.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Invalid message format - last message must be from user');
      }
      
      requestData = {
        question: lastMessage.content,
        user_id: body.user_info?.id,
        user_info: body.user_info,
        campaigns: [],
      };
    } else {
      throw new Error('Invalid request format - missing question or messages');
    }

    if (!requestData.user_info) {
      throw new Error('User info is required');
    }

    // Forward request to backend server with correct format
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Thêm timeout và retry logic
    const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, timeout = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (retries > 0 && error instanceof Error && error.name === 'AbortError') {
          console.log(`Request timed out, retrying... (${retries} attempts left)`);
          return fetchWithRetry(url, options, retries - 1, timeout);
        }
        throw error;
      }
    };
    
    const response = await fetchWithRetry(
      `${backendUrl}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Return response in format expected by useChat.ts
    if (data.success && data.response) {
      return NextResponse.json({
        success: true,
        response: data.response,
        chat_history_id: data.chat_history_id || requestData.chat_history_id,
        toolInvocations: data.toolInvocations || (data.toolInvocation ? [data.toolInvocation] : []), // Handle both singular and plural
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error || 'Unknown error'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
