-- ========================================
-- EASYFOX DATABASE RESET
-- ========================================
-- RUN THIS FILE IN SUPABASE SQL EDITOR TO RESET DATABASE
-- 
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA!
-- - Sử dụng file này khi cần reset database hoàn toàn
-- - Sau khi chạy file này, hãy chạy complete_schema.sql để tạo lại
-- - Backup data trước khi sử dụng nếu cần thiết
-- ========================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS handle_campaigns_updated_at ON public.campaigns;
DROP TRIGGER IF EXISTS handle_schedule_updated_at ON public.schedule;
DROP TRIGGER IF EXISTS handle_settings_updated_at ON public.settings;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can insert own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can update own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can manage own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.settings;

-- Drop all tables (in reverse order of dependencies)
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.chat_history CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔥 EasyFox Database Reset Complete!';
    RAISE NOTICE '📋 All tables, policies, triggers, and functions removed';
    RAISE NOTICE '🚀 Ready to run complete_schema.sql to recreate database';
END $$;
