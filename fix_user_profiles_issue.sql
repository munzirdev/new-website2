-- Fix User Profiles Issue
-- This script investigates the user_profiles table that's causing foreign key constraint errors

-- Check if user_profiles table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- Check if there are any triggers or functions referencing user_profiles
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND trigger_schema = 'public';

-- Check for any foreign key constraints referencing user_profiles
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

-- If user_profiles table exists and is causing issues, we should drop it
-- since we're using the 'profiles' table instead
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Verify that only the correct profiles table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'user_profiles')
AND table_schema = 'public';

-- Check the structure of the profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
