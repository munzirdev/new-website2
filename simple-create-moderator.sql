-- Simple and safe way to create a test moderator
-- This script will handle existing users properly

-- Step 1: Check if moderator already exists
SELECT 
    'Checking Existing Moderator' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'moderator@tevasul.group') THEN '✅ User exists'
        ELSE '❌ User does not exist'
    END as user_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE email = 'moderator@tevasul.group' AND role = 'moderator'
        ) THEN '✅ Moderator role assigned'
        ELSE '❌ Moderator role not assigned'
    END as role_status;

-- Step 2: Update existing user to moderator (if exists)
UPDATE user_profiles 
SET 
    role = 'moderator',
    full_name = 'Test Moderator',
    updated_at = NOW()
WHERE email = 'moderator@tevasul.group';

-- Step 3: Add to moderators table (if not exists)
INSERT INTO moderators (user_id, email, full_name, created_by, created_at, updated_at, is_active)
SELECT 
    up.id,
    up.email,
    up.full_name,
    (SELECT id FROM auth.users WHERE email = 'admin@tevasul.group' LIMIT 1),
    NOW(),
    NOW(),
    true
FROM user_profiles up
WHERE up.email = 'moderator@tevasul.group'
AND up.role = 'moderator'
AND NOT EXISTS (
    SELECT 1 FROM moderators m WHERE m.user_id = up.id
);

-- Step 4: Verify the moderator setup
SELECT 
    'Moderator Verification' as check_type,
    au.id,
    au.email,
    up.full_name,
    up.role,
    up.created_at,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Moderator role assigned'
        ELSE '❌ Role not assigned correctly'
    END as role_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM moderators m WHERE m.user_id = au.id) THEN '✅ In moderators table'
        ELSE '❌ Not in moderators table'
    END as table_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'moderator@tevasul.group';

-- Step 5: Test the moderator function
SELECT 
    'Moderator Function Test' as check_type,
    'Testing is_moderator_user() function' as test_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'moderator@tevasul.group'
        ) THEN '✅ Test moderator exists'
        ELSE '❌ Test moderator not found'
    END as moderator_exists,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE email = 'moderator@tevasul.group' 
            AND role = 'moderator'
        ) THEN '✅ Moderator role assigned'
        ELSE '❌ Moderator role not assigned'
    END as role_assigned;

-- Step 6: Instructions for testing
SELECT 
    'Testing Instructions' as check_type,
    'To test moderator access:' as instruction,
    '1. Log in with: moderator@tevasul.group' as step1,
    '2. Password: moderator123' as step2,
    '3. Check if "لوحة الإشراف" button appears' as step3,
    '4. Try accessing /admin route' as step4;

-- Step 7: Alternative - Make any existing user a moderator
SELECT 
    'Alternative: Make Existing User Moderator' as check_type,
    'If you want to make an existing user a moderator:' as instruction,
    'Run this SQL (replace with actual email):' as sql_instruction,
    'UPDATE user_profiles SET role = ''moderator'' WHERE email = ''your-email@example.com'';' as sql_example;
