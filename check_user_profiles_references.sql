-- Check for any remaining references to user_profiles
-- Run this in Supabase Dashboard > SQL Editor

-- Check for any foreign key constraints that reference user_profiles
SELECT '=== FOREIGN KEY CONSTRAINTS REFERENCING USER_PROFILES ===' as info;
SELECT 
    tc.table_name, 
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

-- Check for any triggers that reference user_profiles
SELECT '=== TRIGGERS REFERENCING USER_PROFILES ===' as info;
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%user_profiles%';

-- Check for any functions that reference user_profiles
SELECT '=== FUNCTIONS REFERENCING USER_PROFILES ===' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%user_profiles%';

-- Check for any views that reference user_profiles
SELECT '=== VIEWS REFERENCING USER_PROFILES ===' as info;
SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition LIKE '%user_profiles%';

-- Check if user_profiles table still exists
SELECT '=== CHECKING IF USER_PROFILES TABLE EXISTS ===' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- Check service_requests table structure
SELECT '=== SERVICE_REQUESTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'service_requests'
ORDER BY ordinal_position;

-- Check service_requests table policies
SELECT '=== SERVICE_REQUESTS TABLE POLICIES ===' as info;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'service_requests';

-- Test inserting into service_requests
SELECT '=== TESTING SERVICE_REQUESTS INSERT ===' as info;
-- This will show if there are any foreign key constraints causing issues
SELECT 'Attempting to insert test record...' as test_step;
