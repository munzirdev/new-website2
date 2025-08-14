-- Verify moderator fix status
-- Check if moderators are properly linked and have correct access

-- Step 1: Check moderator status in admin dashboard
SELECT 
    'Admin Dashboard Status' as check_type,
    m.email,
    m.full_name,
    CASE 
        WHEN m.user_id IS NOT NULL THEN '✅ Active (Linked)'
        ELSE '❌ Pending (Not Linked)'
    END as dashboard_status,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Moderator Role'
        ELSE '❌ Wrong Role'
    END as user_role,
    CASE 
        WHEN m.is_active THEN '✅ Active'
        ELSE '❌ Inactive'
    END as moderator_status
FROM moderators m
LEFT JOIN user_profiles up ON m.user_id = up.id
ORDER BY m.created_at DESC;

-- Step 2: Check if moderators can access their dashboard
SELECT 
    'Moderator Access Test' as check_type,
    'Testing moderator dashboard access' as test_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN moderators m ON up.id = m.user_id
            WHERE up.role = 'moderator' AND m.is_active = true
        ) THEN '✅ Moderators can access dashboard'
        ELSE '❌ Moderator access issue'
    END as access_status;

-- Step 3: Check moderator login simulation
SELECT 
    'Moderator Login Simulation' as check_type,
    m.email,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ User exists in auth.users'
        ELSE '❌ User not found'
    END as auth_status,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Will appear as moderator'
        ELSE '❌ Will appear as regular user'
    END as login_appearance,
    CASE 
        WHEN m.user_id IS NOT NULL THEN '✅ Will show as "Active" in admin dashboard'
        ELSE '❌ Will show as "Pending" in admin dashboard'
    END as admin_dashboard_status
FROM moderators m
LEFT JOIN auth.users au ON m.user_id = au.id
LEFT JOIN user_profiles up ON m.user_id = up.id
WHERE m.is_active = true
ORDER BY m.created_at DESC;

-- Step 4: Final verification summary
SELECT 
    'Final Verification' as check_type,
    (SELECT COUNT(*)::text FROM moderators WHERE user_id IS NOT NULL) as linked_moderators,
    (SELECT COUNT(*)::text FROM user_profiles WHERE role = 'moderator') as moderator_profiles,
    (SELECT COUNT(*)::text FROM moderators WHERE is_active = true) as active_moderators,
    CASE 
        WHEN (SELECT COUNT(*) FROM moderators WHERE user_id IS NOT NULL) = 
             (SELECT COUNT(*) FROM moderators WHERE is_active = true)
        THEN '✅ All active moderators are linked'
        ELSE '❌ Some active moderators are not linked'
    END as link_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'moderator') = 
             (SELECT COUNT(*) FROM moderators WHERE is_active = true)
        THEN '✅ All moderators have correct profiles'
        ELSE '❌ Some moderators missing profiles'
    END as profile_status;

-- Step 5: Instructions for testing
SELECT 
    'Testing Instructions' as check_type,
    '1. Log in as moderator user' as step1,
    '2. Check if user appears as moderator (not regular user)' as step2,
    '3. Go to admin dashboard and check moderator status' as step3,
    '4. Verify moderator can access their dashboard' as step4,
    '5. Test moderator functionality' as step5;
