-- Advanced diagnostic script for signup issues
-- This will help identify the exact problem

-- 1. Check if user_profiles table exists and its structure
SELECT 
    'Table Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN '✅ user_profiles table exists'
        ELSE '❌ user_profiles table missing'
    END as status;

-- 2. Check table structure
SELECT 
    'Column Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'full_name', 'email', 'phone', 'country_code', 'role') THEN '✅ Required'
        ELSE 'ℹ️ Optional'
    END as importance
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    'RLS Check' as check_type,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as status
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 4. Check policies
SELECT 
    'Policy Check' as check_type,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Policy exists'
        ELSE '❌ Policy missing'
    END as status
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Check trigger function
SELECT 
    'Trigger Function Check' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 6. Check trigger
SELECT 
    'Trigger Check' as check_type,
    trigger_name,
    event_manipulation,
    action_statement,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ Trigger exists'
        ELSE '❌ Trigger missing'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Check permissions
SELECT 
    'Permission Check' as check_type,
    grantee,
    privilege_type,
    CASE 
        WHEN privilege_type = 'ALL' THEN '✅ Full permissions'
        ELSE '⚠️ Limited permissions: ' || privilege_type
    END as status
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles' 
AND grantee = 'authenticated';

-- 8. Check if manual function exists
SELECT 
    'Manual Function Check' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'create_user_profile_manually' THEN '✅ Manual function exists'
        ELSE '❌ Manual function missing'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'create_user_profile_manually';

-- 9. Test insert permissions (simulation)
SELECT 
    'Insert Permission Test' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND cmd = 'INSERT' 
            AND permissive = true
        ) THEN '✅ Insert policy exists'
        ELSE '❌ Insert policy missing'
    END as status;

-- 10. Check for any existing user profiles
SELECT 
    'Existing Profiles Check' as check_type,
    COUNT(*) as profile_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Profiles exist'
        ELSE 'ℹ️ No profiles yet'
    END as status
FROM user_profiles;

-- 11. Check for any recent errors in logs (if available)
SELECT 
    'Error Log Check' as check_type,
    'Check Supabase logs for recent errors' as note,
    'Manual check required' as status;

-- 12. Summary and recommendations
SELECT 
    'SUMMARY' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
        AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true)
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
        AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND cmd = 'INSERT')
        THEN '✅ All components present - issue may be in application code'
        ELSE '❌ Missing components - run comprehensive fix'
    END as recommendation;
