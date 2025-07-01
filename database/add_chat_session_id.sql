-- Migration: Add chat_session_id to chat_history table
-- Run this in Supabase SQL Editor

-- Add chat_session_id column to chat_history table
ALTER TABLE public.chat_history 
ADD COLUMN IF NOT EXISTS chat_session_id TEXT;

-- Create index for better performance when querying by session
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id 
ON public.chat_history(chat_session_id);

-- Create index for querying by user and session together
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session 
ON public.chat_history(user_id, chat_session_id);

-- Update the chat_history table description
COMMENT ON COLUMN public.chat_history.chat_session_id IS 'Unique identifier for a chat conversation session';
