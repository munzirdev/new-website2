-- Quick fix for moderator "pending registration" issue
-- This will immediately fix the problem where moderators show as pending

-- Step 1: Link all moderators with their auth.users
UPDATE moderators 
SET user_id = au.id, updated_at = NOW()
FROM auth.users au
WHERE moderators.email = au.email 
AND moderators.user_id IS NULL;

-- Step 2: Ensure all moderators have correct role in user_profiles
UPDATE user_profiles 
SET role = 'moderator', updated_at = NOW()
WHERE email IN (SELECT email FROM moderators)
AND role != 'moderator';

-- Step 3: Create user_profiles for moderators who don't have them
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

-- Step 4: Verify the fix
SELECT 
    'Quick Fix Results' as check_type,
    m.email,
    m.full_name,
    CASE 
        WHEN m.user_id IS NOT NULL THEN '✅ Linked'
        ELSE '❌ Not linked'
    END as user_linked,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Role correct'
        ELSE '❌ Role wrong'
    END as role_status,
    CASE 
        WHEN m.is_active THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status
FROM moderators m
LEFT JOIN user_profiles up ON m.user_id = up.id
ORDER BY m.created_at DESC;

-- Step 5: Show summary
SELECT 
    'Summary' as check_type,
    (SELECT COUNT(*)::text FROM moderators WHERE user_id IS NOT NULL) as linked_moderators,
    (SELECT COUNT(*)::text FROM user_profiles WHERE role = 'moderator') as moderator_profiles,
    (SELECT COUNT(*)::text FROM moderators WHERE is_active = true) as active_moderators;
