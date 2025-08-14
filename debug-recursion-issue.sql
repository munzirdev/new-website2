-- Debug script to identify recursion issues
-- This will help pinpoint the exact problem

-- 1. Check all policies on user_profiles table
SELECT 
    'All Policies Check' as check_type,
    policyname,
    cmd,
    permissive,
    qual,
    with_check,
    CASE 
        WHEN qual LIKE '%user_profiles%' THEN '❌ RECURSION RISK - references user_profiles'
        WHEN qual LIKE '%is_admin_user%' THEN '✅ SAFE - uses admin function'
        WHEN qual LIKE '%auth.uid%' THEN '✅ SAFE - uses auth.uid()'
        ELSE '⚠️ UNKNOWN - needs review'
    END as recursion_analysis
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 2. Check if there are any functions that might cause recursion
SELECT 
    'Function Analysis' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_definition LIKE '%user_profiles%' AND routine_name != 'handle_new_user' THEN '❌ RECURSION RISK'
        WHEN routine_name = 'is_admin_user' OR routine_name = 'is_admin_user_simple' THEN '✅ SAFE'
        WHEN routine_name = 'handle_new_user' THEN '✅ SAFE (trigger function)'
        ELSE '⚠️ NEEDS REVIEW'
    END as function_safety
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%user_profiles%';

-- 3. Check for any triggers that might cause issues
SELECT 
    'Trigger Analysis' as check_type,
    trigger_name,
    event_manipulation,
    action_statement,
    CASE 
        WHEN action_statement LIKE '%user_profiles%' THEN '⚠️ TRIGGER REFERENCES TABLE'
        ELSE '✅ SAFE'
    END as trigger_safety
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- 4. Test each policy individually to see which one fails
-- This will help identify the problematic policy

-- Test 1: Try to select from user_profiles as regular user
SELECT 
    'Policy Test 1' as test_type,
    'Testing basic SELECT' as test_description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN '✅ SELECT works'
        ELSE '❌ SELECT fails'
    END as result;

-- Test 2: Check if admin function works
SELECT 
    'Policy Test 2' as test_type,
    'Testing admin function' as test_description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin_user_simple') THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as result;

-- Test 3: Test admin function execution
SELECT 
    'Policy Test 3' as test_type,
    'Testing admin function execution' as test_description,
    is_admin_user_simple() as function_result;

-- 5. Check for any circular references in the schema
SELECT 
    'Schema Analysis' as check_type,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN table_name = 'user_profiles' AND column_name = 'id' THEN '✅ Primary key'
        WHEN table_name = 'user_profiles' AND column_name LIKE '%role%' THEN '⚠️ Role column (potential recursion source)'
        ELSE 'ℹ️ Standard column'
    END as column_analysis
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 6. Summary and recommendations
SELECT 
    'RECOMMENDATIONS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND qual LIKE '%user_profiles%'
        ) THEN '❌ Found policies with recursion risk - run fix-all-recursion-issues.sql'
        ELSE '✅ No obvious recursion risks found'
    END as recommendation;
