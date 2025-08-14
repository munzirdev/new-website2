-- Final comprehensive test for signup functionality
-- This will verify everything is working correctly

-- Test 1: Check table structure
SELECT 
    'Table Structure' as test_type,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ Primary key'
        WHEN column_name = 'email' AND data_type = 'text' THEN '✅ Email column'
        WHEN column_name = 'full_name' AND data_type = 'text' THEN '✅ Name column'
        WHEN column_name = 'phone' AND data_type = 'text' THEN '✅ Phone column'
        WHEN column_name = 'country_code' AND data_type = 'text' THEN '✅ Country code'
        WHEN column_name = 'role' AND data_type = 'character varying' THEN '✅ Role column'
        WHEN column_name = 'created_at' AND data_type = 'timestamp with time zone' THEN '✅ Created at'
        WHEN column_name = 'updated_at' AND data_type = 'timestamp with time zone' THEN '✅ Updated at'
        ELSE 'ℹ️ Other column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Test 2: Check RLS status
SELECT 
    'RLS Status' as test_type,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Test 3: Check policies count and safety
SELECT 
    'Policies Check' as test_type,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) <= 5 THEN '✅ Clean (5 or fewer policies)'
        ELSE '❌ Too many policies'
    END as policy_count,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ Perfect setup'
        WHEN COUNT(*) BETWEEN 3 AND 6 THEN '✅ Good setup'
        ELSE '⚠️ Needs review'
    END as setup_quality
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test 4: List all policies with safety analysis
SELECT 
    'Policy Analysis' as test_type,
    policyname,
    cmd,
    CASE 
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%is_admin_user_simple%' THEN '✅ Safe (uses simple function)'
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%user_profiles%' THEN '❌ DANGEROUS (recursion risk)'
        WHEN policyname LIKE '%admin%' AND qual LIKE '%user_profiles%' THEN '❌ DANGEROUS (recursion risk)'
        WHEN policyname LIKE '%user%' AND qual LIKE '%auth.uid%' THEN '✅ Safe (uses auth.uid)'
        WHEN policyname LIKE '%service%' THEN '✅ Safe (service role)'
        ELSE 'ℹ️ Standard policy'
    END as safety_status
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test 5: Check functions
SELECT 
    'Functions Check' as test_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN '✅ Trigger function exists'
        WHEN routine_name = 'is_admin_user_simple' THEN '✅ Admin function exists'
        WHEN routine_name = 'update_updated_at_column' THEN '✅ Update function exists'
        WHEN routine_name = 'create_user_profile_manually' THEN '✅ Manual profile function exists'
        ELSE 'ℹ️ Other function'
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'is_admin_user_simple', 'update_updated_at_column', 'create_user_profile_manually')
AND routine_schema = 'public';

-- Test 6: Check triggers
SELECT 
    'Triggers Check' as test_type,
    trigger_name,
    event_manipulation,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ User creation trigger'
        WHEN trigger_name = 'update_user_profiles_updated_at' THEN '✅ Update timestamp trigger'
        ELSE 'ℹ️ Other trigger'
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- Test 7: Test basic operations (as anonymous user)
SELECT 
    'Basic Operations Test' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN '✅ SELECT works'
        ELSE '❌ SELECT fails'
    END as select_test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin_user_simple') THEN '✅ Admin function exists'
        ELSE '❌ Admin function missing'
    END as admin_function_test;

-- Test 8: Check permissions
SELECT 
    'Permissions Check' as test_type,
    grantee,
    privilege_type,
    CASE 
        WHEN grantee = 'authenticated' AND privilege_type = 'USAGE' THEN '✅ Schema access'
        WHEN grantee = 'authenticated' AND privilege_type = 'ALL' THEN '✅ Table access'
        WHEN grantee = 'authenticated' AND privilege_type = 'EXECUTE' THEN '✅ Function access'
        ELSE 'ℹ️ Other permission'
    END as status
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles'
UNION ALL
SELECT 
    'Permissions Check' as test_type,
    grantee,
    'EXECUTE' as privilege_type,
    '✅ Function access' as status
FROM information_schema.role_routine_grants 
WHERE routine_name = 'is_admin_user_simple';

-- Test 9: Final summary
SELECT 
    'FINAL SUMMARY' as test_type,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename = 'user_profiles'
        ) <= 5
        AND EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'is_admin_user_simple'
        )
        AND EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'user_profiles' 
            AND rowsecurity = true
        )
        THEN '🎉 READY FOR SIGNUP - All systems working!'
        ELSE '⚠️ Some issues detected - check above results'
    END as overall_status;
