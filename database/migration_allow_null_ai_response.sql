-- Migration: Allow NULL values in ai_response column
-- This allows for partial message saving during processing

-- Remove NOT NULL constraint from ai_response
ALTER TABLE public.chat_history 
ALTER COLUMN ai_response DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN public.chat_history.ai_response IS 'AI response text. Can be NULL during message processing.';
