-- Migration: Add start_date and end_date columns to campaigns table
-- Run this in Supabase SQL Editor

-- Add start_date and end_date columns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);
