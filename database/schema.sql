-- EasyFox Database Schema (PostgreSQL)
-- Gộp các migration và schema cần thiết để chạy được hệ thống

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text,
  business_name text,
  business_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CHAT HISTORY
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  message_type text NOT NULL,
  content text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SCHEDULE (4-tier: pillar > category > angle > brief)
CREATE TABLE IF NOT EXISTS schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id),
  tier text NOT NULL, -- pillar/category/angle/brief
  parent_id uuid,
  name text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  preferences jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes & RLS policies (nên bổ sung khi triển khai thực tế)
