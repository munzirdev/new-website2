-- Fix Old user_profiles References
-- This script finds and fixes any remaining references to the old user_profiles table

-- First, let's check if there are any triggers or functions referencing user_profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user_profiles%' 
   OR action_statement LIKE '%user_profiles%';

-- Check for any functions that might reference user_profiles
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%user_profiles%'
   OR routine_name LIKE '%user_profiles%';

-- Check for any foreign key constraints that might reference user_profiles
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'user_profiles' OR tc.table_name = 'user_profiles');

-- Check if moderators table exists and has correct structure
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('moderators', 'profiles', 'user_profiles');

-- Show moderators table structure if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'moderators' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any RLS policies on moderators table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'moderators' 
    AND schemaname = 'public';

