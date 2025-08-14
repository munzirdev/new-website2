-- Fix moderator user link issue
-- This will link existing users with moderator entries and fix role assignment

-- Step 1: Check current moderator status
SELECT 
    'Current Moderator Status' as check_type,
    m.id as moderator_id,
    m.email,
    m.full_name,
    m.user_id,
    m.is_active,
    CASE 
        WHEN m.user_id IS NULL THEN '❌ No user linked'
        ELSE '✅ User linked'
    END as link_status,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Role correct'
        WHEN up.role IS NULL THEN '⚠️ No profile'
        ELSE '❌ Wrong role'
    END as role_status
FROM moderators m
LEFT JOIN user_profiles up ON m.email = up.email
ORDER BY m.created_at DESC;

-- Step 2: Check users who should be moderators but aren't linked
SELECT 
    'Unlinked Moderator Users' as check_type,
    au.id as user_id,
    au.email,
    up.full_name,
    up.role,
    CASE 
        WHEN EXISTS (SELECT 1 FROM moderators m WHERE m.email = au.email) THEN '✅ In moderators table'
        ELSE '❌ Not in moderators table'
    END as in_moderators,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Role set'
        ELSE '❌ Role not set'
    END as role_set
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email LIKE '%moderator%' 
   OR au.email IN (SELECT email FROM moderators)
ORDER BY au.created_at DESC;

-- Step 3: Link existing users with moderator entries
DO $$
DECLARE
    moderator_record RECORD;
    user_id UUID;
BEGIN
    -- Loop through all moderators that don't have user_id set
    FOR moderator_record IN 
        SELECT id, email, full_name 
        FROM moderators 
        WHERE user_id IS NULL
    LOOP
        -- Find the user by email
        SELECT id INTO user_id 
        FROM auth.users 
        WHERE email = moderator_record.email;
        
        -- If user exists, link them
        IF user_id IS NOT NULL THEN
            UPDATE moderators 
            SET user_id = user_id, updated_at = NOW()
            WHERE id = moderator_record.id;
            
            RAISE NOTICE 'Linked moderator % with user %', moderator_record.email, user_id;
        ELSE
            RAISE NOTICE 'No user found for moderator email: %', moderator_record.email;
        END IF;
    END LOOP;
END $$;

-- Step 4: Update user_profiles roles for all moderators
UPDATE user_profiles 
SET role = 'moderator', updated_at = NOW()
WHERE email IN (SELECT email FROM moderators)
AND role != 'moderator';

-- Step 5: Create user_profiles for moderators who don't have profiles
INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    m.user_id,
    m.email,
    m.full_name,
    'moderator',
    NOW(),
    NOW()
FROM moderators m
WHERE m.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = m.user_id
);

-- Step 6: Update handle_new_user function to check moderators table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM moderators WHERE email = NEW.email) THEN 'moderator'
            WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
            ELSE 'user'
        END
    );
    
    -- If this user is in moderators table, link them
    UPDATE moderators 
    SET user_id = NEW.id, updated_at = NOW()
    WHERE email = NEW.email AND user_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to sync existing moderators
CREATE OR REPLACE FUNCTION sync_existing_moderators()
RETURNS void AS $$
DECLARE
    moderator_record RECORD;
BEGIN
    -- Loop through all moderators
    FOR moderator_record IN 
        SELECT m.id, m.email, m.full_name, m.user_id, au.id as auth_user_id
        FROM moderators m
        LEFT JOIN auth.users au ON m.email = au.email
    LOOP
        -- If moderator has no user_id but user exists, link them
        IF moderator_record.user_id IS NULL AND moderator_record.auth_user_id IS NOT NULL THEN
            UPDATE moderators 
            SET user_id = moderator_record.auth_user_id, updated_at = NOW()
            WHERE id = moderator_record.id;
            
            RAISE NOTICE 'Linked moderator % with user %', moderator_record.email, moderator_record.auth_user_id;
        END IF;
        
        -- Ensure user profile exists and has correct role
        IF moderator_record.auth_user_id IS NOT NULL THEN
            INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
            VALUES (
                moderator_record.auth_user_id,
                moderator_record.email,
                moderator_record.full_name,
                'moderator',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                role = 'moderator',
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                updated_at = NOW();
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Run the sync function
SELECT sync_existing_moderators();

-- Step 9: Verify the fix
SELECT 
    'Fixed Moderator Status' as check_type,
    m.id as moderator_id,
    m.email,
    m.full_name,
    m.user_id,
    m.is_active,
    CASE 
        WHEN m.user_id IS NOT NULL THEN '✅ User linked'
        ELSE '❌ No user linked'
    END as link_status,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Role correct'
        WHEN up.role IS NULL THEN '⚠️ No profile'
        ELSE '❌ Wrong role'
    END as role_status,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ User exists'
        ELSE '❌ User not found'
    END as user_exists
FROM moderators m
LEFT JOIN user_profiles up ON m.user_id = up.id
LEFT JOIN auth.users au ON m.user_id = au.id
ORDER BY m.created_at DESC;

-- Step 10: Test moderator access
SELECT 
    'Moderator Access Test' as check_type,
    'Testing moderator access after fix' as test_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN moderators m ON up.id = m.user_id
            WHERE up.role = 'moderator'
        ) THEN '✅ Moderators have correct access'
        ELSE '❌ Moderator access issue'
    END as access_status,
    (SELECT COUNT(*)::text FROM moderators WHERE user_id IS NOT NULL) as linked_moderators,
    (SELECT COUNT(*)::text FROM user_profiles WHERE role = 'moderator') as moderator_profiles;

-- Step 11: Instructions for testing
SELECT 
    'Testing Instructions' as check_type,
    '1. Log in as a moderator user' as step1,
    '2. Check if dashboard shows moderator access' as step2,
    '3. In admin dashboard, check if moderator shows as "Active" instead of "Pending"' as step3,
    '4. Verify moderator can access their dashboard' as step4;
