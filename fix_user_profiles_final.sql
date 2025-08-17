-- Fix User Profiles Issue - Final Solution
-- This script completely removes the old user_profiles table and ensures only profiles table exists

-- Step 1: Check if user_profiles table exists and drop it
SELECT 'Checking for user_profiles table...' as step;

-- Check if user_profiles table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- Drop user_profiles table if it exists (this is the main issue)
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 2: Verify profiles table exists and has correct structure
SELECT 'Verifying profiles table...' as step;

-- Check if profiles table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- Show profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Verify moderators table exists and has correct structure
SELECT 'Verifying moderators table...' as step;

-- Check if moderators table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'moderators' 
AND table_schema = 'public';

-- Show moderators table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'moderators' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check for any remaining foreign key constraints referencing user_profiles
SELECT 'Checking for remaining user_profiles references...' as step;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'user_profiles' OR ccu.table_name = 'user_profiles');

-- Step 5: Check for any triggers or functions referencing user_profiles
SELECT 'Checking for triggers/functions referencing user_profiles...' as step;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND trigger_schema = 'public';

SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%user_profiles%'
AND routine_schema = 'public';

-- Step 6: Final verification - only profiles and moderators should exist
SELECT 'Final verification...' as step;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'moderators', 'user_profiles')
AND table_schema = 'public'
ORDER BY table_name;

-- Step 7: Test moderator insertion to verify fix
SELECT 'Testing moderator insertion...' as step;

-- This will only work if you're an admin
INSERT INTO public.moderators (email, full_name)
VALUES ('test-fix@example.com', 'Test Fix Moderator')
ON CONFLICT (email) DO NOTHING;

-- Show the test record
SELECT 
    id,
    email,
    full_name,
    created_at
FROM public.moderators
WHERE email = 'test-fix@example.com';

-- Clean up test record
DELETE FROM public.moderators WHERE email = 'test-fix@example.com';

SELECT 'Fix completed successfully!' as result;
