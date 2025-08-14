-- Check database status and table structure
-- Run this first to see the current state

-- Check if user_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as table_exists;

-- Check table structure if it exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'update_updated_at_column');

-- Check current user permissions
SELECT current_user, current_database();
