-- Debug moderator access issue
-- This will help identify why the moderator function returns false

-- Check 1: Current user information
SELECT 
    'Current User Info' as check_type,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT role FROM user_profiles WHERE id = auth.uid()) as current_user_role,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ Not authenticated'
        ELSE '✅ Authenticated'
    END as auth_status;

-- Check 2: Check if current user has moderator role
SELECT 
    'Current User Role Check' as check_type,
    up.id,
    up.email,
    up.full_name,
    up.role,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Moderator role found'
        WHEN up.role = 'admin' THEN '✅ Admin role found'
        WHEN up.role = 'user' THEN '❌ Regular user role'
        WHEN up.role IS NULL THEN '❌ No role assigned'
        ELSE '❌ Unknown role: ' || up.role
    END as role_status
FROM user_profiles up
WHERE up.id = auth.uid();

-- Check 3: Check if current user email contains 'moderator'
SELECT 
    'Email Pattern Check' as check_type,
    au.email,
    CASE 
        WHEN au.email LIKE '%moderator%' THEN '✅ Email contains moderator'
        WHEN au.email = 'admin@tevasul.group' THEN '✅ Admin email'
        ELSE '❌ Regular email'
    END as email_pattern
FROM auth.users au
WHERE au.id = auth.uid();

-- Check 4: Test the moderator function step by step
SELECT 
    'Moderator Function Debug' as check_type,
    'Step 1: Check email pattern' as step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.email LIKE '%moderator%' 
                OR auth.users.email = 'admin@tevasul.group'
            )
        ) THEN '✅ Email pattern matches'
        ELSE '❌ Email pattern does not match'
    END as email_check;

-- Check 5: Test role check in user_profiles
SELECT 
    'Moderator Function Debug' as check_type,
    'Step 2: Check role in user_profiles' as step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('moderator', 'admin')
        ) THEN '✅ Role found in user_profiles'
        ELSE '❌ Role not found in user_profiles'
    END as role_check;

-- Check 6: List all users with moderator-related emails
SELECT 
    'All Users with Moderator Pattern' as check_type,
    au.id,
    au.email,
    up.role,
    CASE 
        WHEN au.id = auth.uid() THEN '👤 Current User'
        ELSE '👥 Other User'
    END as user_type
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email LIKE '%moderator%' OR au.email = 'admin@tevasul.group'
ORDER BY au.id = auth.uid() DESC, au.created_at DESC;

-- Check 7: List all users with moderator role
SELECT 
    'All Users with Moderator Role' as check_type,
    au.id,
    au.email,
    up.full_name,
    up.role,
    up.created_at,
    CASE 
        WHEN au.id = auth.uid() THEN '👤 Current User'
        ELSE '👥 Other User'
    END as user_type
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.role IN ('moderator', 'admin')
ORDER BY au.id = auth.uid() DESC, up.created_at DESC;

-- Check 8: Create a test moderator user if none exists
DO $$
DECLARE
    test_email TEXT := 'test.moderator@tevasul.group';
    test_user_id UUID;
BEGIN
    -- Check if test moderator exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = test_email
    ) THEN
        -- Create test moderator user
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES (
            gen_random_uuid(),
            test_email,
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "Test Moderator"}'::jsonb
        )
        RETURNING id INTO test_user_id;
        
        -- Create profile for test moderator
        INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (
            test_user_id,
            test_email,
            'Test Moderator',
            'moderator',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created test moderator: %', test_email;
    ELSE
        RAISE NOTICE 'Test moderator already exists: %', test_email;
    END IF;
END $$;

-- Check 9: Update any user with 'moderator' in email to have moderator role
UPDATE user_profiles 
SET 
    role = 'moderator',
    updated_at = NOW()
WHERE id IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email LIKE '%moderator%' 
    AND au.id = user_profiles.id
    AND user_profiles.role != 'moderator'
);

-- Check 10: Final verification
SELECT 
    'Final Verification' as check_type,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT role FROM user_profiles WHERE id = auth.uid()) as current_user_role,
    is_moderator_user() as function_result,
    CASE 
        WHEN is_moderator_user() THEN '✅ Moderator access granted'
        ELSE '❌ Moderator access denied'
    END as final_status;

-- Check 11: Instructions for testing
SELECT 
    'Testing Instructions' as check_type,
    'To test moderator access:' as instruction,
    '1. Log in with a user that has email containing "moderator"' as step1,
    '2. Or log in with admin@tevasul.group' as step2,
    '3. Or manually update a user role to "moderator"' as step3,
    '4. Then run this script again' as step4;
