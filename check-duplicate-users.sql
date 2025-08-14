-- Check for duplicate users and registration issues
-- This will help identify why users can't register

-- Check 1: List all users in auth.users
SELECT 
    'Auth Users' as check_type,
    id,
    email,
    created_at,
    CASE 
        WHEN email = 'admin@tevasul.group' THEN '✅ Admin user'
        WHEN email LIKE '%moderator%' THEN '✅ Moderator user'
        ELSE 'ℹ️ Regular user'
    END as user_type
FROM auth.users 
ORDER BY created_at DESC;

-- Check 2: List all user profiles
SELECT 
    'User Profiles' as check_type,
    id,
    email,
    full_name,
    role,
    created_at,
    CASE 
        WHEN role = 'admin' THEN '✅ Admin profile'
        WHEN role = 'moderator' THEN '✅ Moderator profile'
        ELSE 'ℹ️ User profile'
    END as profile_type
FROM user_profiles 
ORDER BY created_at DESC;

-- Check 3: Find orphaned auth users (users without profiles)
SELECT 
    'Orphaned Auth Users' as check_type,
    au.id,
    au.email,
    au.created_at,
    CASE 
        WHEN up.id IS NULL THEN '❌ No profile found'
        ELSE '✅ Profile exists'
    END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Check 4: Find orphaned profiles (profiles without auth users)
SELECT 
    'Orphaned Profiles' as check_type,
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    CASE 
        WHEN au.id IS NULL THEN '❌ No auth user found'
        ELSE '✅ Auth user exists'
    END as auth_status
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL
ORDER BY up.created_at DESC;

-- Check 5: Check for duplicate emails
SELECT 
    'Duplicate Emails' as check_type,
    email,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN '❌ Duplicate found'
        ELSE '✅ Unique email'
    END as duplicate_status
FROM auth.users 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check 6: Check for duplicate emails in profiles
SELECT 
    'Duplicate Emails in Profiles' as check_type,
    email,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN '❌ Duplicate found'
        ELSE '✅ Unique email'
    END as duplicate_status
FROM user_profiles 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check 7: Test registration flow
SELECT 
    'Registration Test' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'test@example.com'
        ) THEN '❌ Test email already exists'
        ELSE '✅ Test email available'
    END as test_email_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE email = 'test@example.com'
        ) THEN '❌ Test profile already exists'
        ELSE '✅ Test profile available'
    END as test_profile_status;
