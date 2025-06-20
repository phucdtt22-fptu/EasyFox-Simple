-- Migration: Allow null question in chat_history table
-- This allows welcome messages from AI without displaying user question

ALTER TABLE public.chat_history 
ALTER COLUMN question DROP NOT NULL;

-- Add comment to explain this column
COMMENT ON COLUMN public.chat_history.question IS 'User question. Can be null for AI-initiated messages (like welcome messages)';
