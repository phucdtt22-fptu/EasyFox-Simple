import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cấu hình Supabase client với auth options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Tự động refresh token
    autoRefreshToken: true,
    // Persist session trong localStorage
    persistSession: true,
    // Detect session trong URL
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          question: string
          ai_response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          ai_response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          ai_response?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          budget: number | null
          target_audience: string | null
          goals: string | null
          content_pillars: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          budget?: number | null
          target_audience?: string | null
          goals?: string | null
          content_pillars?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          budget?: number | null
          target_audience?: string | null
          goals?: string | null
          content_pillars?: string | null
          updated_at?: string
        }
      }
      schedule: {
        Row: {
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
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          scheduled_date: string
          platform: string
          content_pillar?: string | null
          content_category?: string | null
          content_angle?: string | null
          content_brief?: string | null
          full_content?: string | null
          image_url?: string | null
          video_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          scheduled_date?: string
          platform?: string
          content_pillar?: string | null
          content_category?: string | null
          content_angle?: string | null
          content_brief?: string | null
          full_content?: string | null
          image_url?: string | null
          video_url?: string | null
          status?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key?: string
          value?: string
          updated_at?: string
        }
      }
    }
  }
}
