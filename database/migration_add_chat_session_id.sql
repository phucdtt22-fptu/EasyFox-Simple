-- Migration: Add chat_session_id to chat_history table
-- Date: $(date +%Y-%m-%d)
-- Purpose: Support persistent chat sessions

-- Add chat_session_id column
ALTER TABLE public.chat_history 
ADD COLUMN IF NOT EXISTS chat_session_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON public.chat_history(chat_session_id);

-- Update existing records to have a unique session ID (optional - for existing data)
-- This is only needed if you have existing chat history data
UPDATE public.chat_history 
SET chat_session_id = 'chat_' || user_id || '_' || EXTRACT(EPOCH FROM created_at)::bigint 
WHERE chat_session_id IS NULL;

-- Make the column NOT NULL after updating existing records
-- Uncomment the next line if you want to enforce NOT NULL constraint
-- ALTER TABLE public.chat_history ALTER COLUMN chat_session_id SET NOT NULL;
