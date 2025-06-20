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
