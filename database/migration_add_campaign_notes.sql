-- Migration: Add notes column to campaigns table
-- This allows AI to store collected information about campaigns

-- Add notes column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for better search performance on notes
CREATE INDEX IF NOT EXISTS idx_campaigns_notes ON public.campaigns USING gin(to_tsvector('english', notes))
WHERE notes IS NOT NULL;

-- Update the campaigns table comment
COMMENT ON COLUMN public.campaigns.notes IS 'AI-collected information and conversation history about the campaign';
