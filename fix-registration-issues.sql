-- Fix registration issues and clean up duplicate data
-- This will help resolve "email already registered" errors

-- Step 1: Clean up orphaned profiles (profiles without auth users)
DELETE FROM user_profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 2: Create profiles for orphaned auth users
INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    CASE 
        WHEN au.email = 'admin@tevasul.group' THEN 'admin'
        WHEN au.email LIKE '%moderator%' THEN 'moderator'
        ELSE 'user'
    END as role,
    au.created_at,
    au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 3: Update profiles with missing data
UPDATE user_profiles 
SET 
    email = COALESCE(user_profiles.email, auth_users.email),
    full_name = COALESCE(user_profiles.full_name, auth_users.raw_user_meta_data->>'full_name', auth_users.email),
    role = COALESCE(user_profiles.role, 
        CASE 
            WHEN auth_users.email = 'admin@tevasul.group' THEN 'admin'
            WHEN auth_users.email LIKE '%moderator%' THEN 'moderator'
            ELSE 'user'
        END
    ),
    updated_at = NOW()
FROM auth.users auth_users
WHERE user_profiles.id = auth_users.id
AND (
    user_profiles.email IS NULL 
    OR user_profiles.full_name IS NULL 
    OR user_profiles.role IS NULL
);

-- Step 4: Ensure unique constraints are working
-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_email_key' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Step 5: Clean up any remaining duplicate emails in profiles
-- Keep the most recent profile for each email
DELETE FROM user_profiles 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM user_profiles 
        WHERE email IS NOT NULL
    ) t 
    WHERE t.rn > 1
);

-- Step 6: Verify the cleanup
SELECT 
    'Cleanup Summary' as check_type,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM user_profiles) as profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN user_profiles up ON au.id = up.id WHERE up.id IS NULL) as orphaned_auth_users,
    (SELECT COUNT(*) FROM user_profiles up LEFT JOIN auth.users au ON up.id = au.id WHERE au.id IS NULL) as orphaned_profiles,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users au LEFT JOIN user_profiles up ON au.id = up.id WHERE up.id IS NULL) = 0 
        AND (SELECT COUNT(*) FROM user_profiles up LEFT JOIN auth.users au ON up.id = au.id WHERE au.id IS NULL) = 0
        THEN '✅ All users have profiles, all profiles have users'
        ELSE '⚠️ Some orphaned records remain'
    END as sync_status;

-- Step 7: Test registration flow
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

-- Step 8: List all users for verification
SELECT 
    'Final User List' as check_type,
    au.id,
    au.email,
    up.full_name,
    up.role,
    au.created_at,
    CASE 
        WHEN up.id IS NOT NULL THEN '✅ Complete'
        ELSE '❌ Missing profile'
    END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;
