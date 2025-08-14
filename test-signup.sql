-- Test script to verify signup functionality
-- Run this after applying the fix to test if everything works

-- Test 1: Check if trigger function exists
SELECT 
    routine_name, 
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN '✅ Trigger function exists'
        WHEN routine_name = 'is_admin_user' THEN '✅ Admin check function exists'
        WHEN routine_name = 'update_updated_at_column' THEN '✅ Update function exists'
        ELSE '❌ Function missing'
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'is_admin_user', 'update_updated_at_column');

-- Test 2: Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ User creation trigger exists'
        ELSE '❌ User creation trigger missing'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test 3: Check RLS policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Policy exists'
        ELSE '❌ Policy missing'
    END as status,
    CASE 
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%is_admin_user%' THEN '✅ Safe (uses function)'
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%user_profiles%' THEN '⚠️ Risk of recursion'
        ELSE 'ℹ️ Standard policy'
    END as recursion_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test 4: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as status
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Test 5: Check permissions
SELECT 
    grantee,
    privilege_type,
    CASE 
        WHEN privilege_type = 'ALL' THEN '✅ Full permissions granted'
        ELSE '⚠️ Limited permissions'
    END as status
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles' 
AND grantee = 'authenticated';

-- Test 6: Verify table structure is complete
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'full_name', 'email', 'phone', 'country_code', 'role', 'created_at', 'updated_at') THEN '✅ Required column'
        ELSE 'ℹ️ Optional column'
    END as importance
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Test 7: Test admin function
SELECT 
    'Admin Function Test' as test_type,
    is_admin_user() as is_admin,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- Summary
SELECT 
    'Database Setup Summary' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin_user')
        AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
        AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true)
        THEN '✅ All systems ready for signup'
        ELSE '❌ Some components missing'
    END as status;
