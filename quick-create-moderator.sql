-- Quick create moderator user
-- This will create a new moderator for testing

-- Step 1: Create new moderator user
DO $$
DECLARE
    test_email TEXT := 'moderator@tevasul.group';
    test_user_id UUID;
BEGIN
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
END $$;

-- Step 2: Verify the moderator was created
SELECT 
    'Moderator Created Successfully' as check_type,
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

-- Step 3: Test instructions
SELECT 
    'Test Instructions' as check_type,
    'Login credentials:' as instruction,
    'Email: moderator@tevasul.group' as email,
    'Password: moderator123' as password,
    'After login, check for "لوحة الإشراف" button' as next_step;
