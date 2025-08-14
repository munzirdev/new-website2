-- Create a test moderator for testing purposes
-- This will help test the moderator functionality

-- Step 1: Create or update test moderator
DO $$
DECLARE
    test_email TEXT := 'moderator@tevasul.group';
    test_user_id UUID;
BEGIN
    -- Check if test moderator already exists
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = test_email
    ) THEN
        -- Get existing user ID
        SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
        RAISE NOTICE 'Test moderator already exists: % (ID: %)', test_email, test_user_id;
        
        -- Update or create profile
        INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (
            test_user_id,
            test_email,
            'Test Moderator',
            'moderator',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'moderator',
            updated_at = NOW();
        
        RAISE NOTICE 'Updated test moderator profile';
        
        -- Add to moderators table if not exists
        INSERT INTO moderators (user_id, email, full_name, created_by, created_at, updated_at, is_active)
        VALUES (
            test_user_id,
            test_email,
            'Test Moderator',
            (SELECT id FROM auth.users WHERE email = 'admin@tevasul.group' LIMIT 1),
            NOW(),
            NOW(),
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = test_email,
            full_name = 'Test Moderator',
            updated_at = NOW(),
            is_active = true;
        
        RAISE NOTICE 'Updated moderators table';
    ELSE
        -- Create new test moderator user
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES (
            gen_random_uuid(),
            test_email,
            crypt('moderator123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "Test Moderator"}'::jsonb
        )
        RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Created test moderator user: % (ID: %)', test_email, test_user_id;
        
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
        
        RAISE NOTICE 'Created test moderator profile';
        
        -- Add to moderators table
        INSERT INTO moderators (user_id, email, full_name, created_by, created_at, updated_at, is_active)
        VALUES (
            test_user_id,
            test_email,
            'Test Moderator',
            (SELECT id FROM auth.users WHERE email = 'admin@tevasul.group' LIMIT 1),
            NOW(),
            NOW(),
            true
        );
        
        RAISE NOTICE 'Added to moderators table';
    END IF;
END $$;

-- Step 2: Verify the test moderator was created
SELECT 
    'Test Moderator Verification' as check_type,
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

-- Step 3: Test the moderator function with the test user
SELECT 
    'Test Moderator Function' as check_type,
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

-- Step 4: Instructions for testing
SELECT 
    'Testing Instructions' as check_type,
    'To test moderator access:' as instruction,
    '1. Log in with: moderator@tevasul.group' as step1,
    '2. Password: moderator123' as step2,
    '3. Check if "لوحة الإشراف" button appears' as step3,
    '4. Try accessing /admin route' as step4;

-- Step 5: Alternative - Update existing user to moderator
SELECT 
    'Alternative: Update Existing User' as check_type,
    'If you want to make an existing user a moderator:' as instruction,
    'Run this SQL:' as sql_instruction,
    'UPDATE user_profiles SET role = ''moderator'' WHERE email = ''your-email@example.com'';' as sql_example;
