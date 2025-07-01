export interface User {
  id: string
  email: string
  name: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  question: string | null // Can be null for AI-initiated messages
  ai_response: string
  chat_session_id: string
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  budget: number | null
  target_audience: string | null
  goals: string | null
  content_pillars: string | null
  notes: string | null // AI-collected information and conversation history
  created_at: string
  updated_at: string
}

export interface ScheduleItem {
  id: string
  campaign_id: string
  user_id: string
  scheduled_date: string
  platform: string
  content_pillar: string | null
  content_category: string | null
  content_angle: string | null
  content_brief: string | null
  full_content: string | null
  image_url: string | null
  video_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface N8NRequest {
  question: string
  user_id: string
  chat_history_id: string
  user_info: {
    id: string
    email: string
    name: string
    notes: string | null
  }
  campaigns?: Campaign[] // Include user's campaigns for context
  is_welcome_message?: boolean
}

export interface SuggestedAction {
  title: string  // Tiêu đề ngắn gọn để hiển thị
  label: string  // Mô tả chi tiết hơn
  action: string // Câu hỏi sẽ được gửi khi người dùng nhấp vào
}

export interface Suggestion {
  id: string
  text: string
  category?: string
}

// Onboarding Form Types
export interface OnboardingFormData {
  businessName: string
  businessType: string
  businessDescription: string
  businessLocation: string
  businessSize: string
  yearsInBusiness: string
  mainProducts: string
  targetCustomers: string
  businessGoals: string
}

export interface OnboardingToolCall {
  toolName: 'showOnboardingForm' | 'saveOnboardingData'
  state: 'call' | 'result'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any
  result?: OnboardingFormData
}

// Tool Invocation Types for chat messages
export interface ToolInvocation {
  toolCallId: string
  toolName: string
  state: 'call' | 'result'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any
}

// Extended ChatMessage to support tool invocations
export interface ChatMessageWithTools extends ChatMessage {
  toolInvocations?: ToolInvocation[]
}
