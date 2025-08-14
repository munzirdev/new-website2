-- Fix moderator role recognition issues
-- This will ensure moderators are properly recognized

-- Step 1: Check current moderator assignments
SELECT 
    'Current Moderator Status' as check_type,
    au.id,
    au.email,
    up.full_name,
    up.role,
    au.created_at,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Moderator role assigned'
        WHEN up.role = 'admin' THEN '✅ Admin role assigned'
        WHEN au.email LIKE '%moderator%' THEN '⚠️ Email contains moderator but role is user'
        ELSE '❌ Regular user'
    END as role_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.role IN ('moderator', 'admin') OR au.email LIKE '%moderator%'
ORDER BY up.role, au.created_at DESC;

-- Step 2: Update moderator roles based on email pattern
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

-- Step 3: Ensure admin role is correct
UPDATE user_profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@tevasul.group' 
AND role != 'admin';

-- Step 4: Create or update moderators table entries
INSERT INTO moderators (user_id, email, full_name, created_by, created_at, updated_at, is_active)
SELECT 
    up.id,
    up.email,
    up.full_name,
    (SELECT id FROM auth.users WHERE email = 'admin@tevasul.group' LIMIT 1) as created_by,
    up.created_at,
    NOW(),
    true
FROM user_profiles up
WHERE up.role = 'moderator'
AND NOT EXISTS (
    SELECT 1 FROM moderators m WHERE m.user_id = up.id
);

-- Step 5: Update existing moderator entries
UPDATE moderators 
SET 
    email = up.email,
    full_name = up.full_name,
    updated_at = NOW(),
    is_active = true
FROM user_profiles up
WHERE moderators.user_id = up.id 
AND up.role = 'moderator';

-- Step 6: Create moderator access function
CREATE OR REPLACE FUNCTION is_moderator_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by email first (most reliable)
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.email LIKE '%moderator%' 
      OR auth.users.email = 'admin@tevasul.group'
    )
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: check role in user_profiles
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('moderator', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create moderator policy if missing
DO $$
BEGIN
    -- Add moderator policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Moderators can view all profiles'
    ) THEN
        CREATE POLICY "Moderators can view all profiles"
          ON user_profiles
          FOR SELECT
          TO authenticated
          USING (is_moderator_user());
    END IF;
END $$;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION is_moderator_user() TO authenticated;

-- Step 9: Verify moderator setup
SELECT 
    'Moderator Setup Verification' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_moderator_user') THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as function_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND policyname = 'Moderators can view all profiles'
        ) THEN '✅ Policy exists'
        ELSE '❌ Policy missing'
    END as policy_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE role = 'moderator'
        ) THEN '✅ Moderators exist'
        ELSE '❌ No moderators found'
    END as moderators_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM moderators 
            WHERE is_active = true
        ) THEN '✅ Moderators table has active entries'
        ELSE '❌ No active moderators in table'
    END as moderators_table_status;

-- Step 10: List all moderators for verification
SELECT 
    'Final Moderator List' as check_type,
    au.id,
    au.email,
    up.full_name,
    up.role,
    up.created_at,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Moderator'
        WHEN up.role = 'admin' THEN '✅ Admin'
        ELSE '❌ Unknown role'
    END as role_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM moderators m WHERE m.user_id = au.id) THEN '✅ In moderators table'
        ELSE '❌ Not in moderators table'
    END as table_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.role IN ('moderator', 'admin')
ORDER BY up.role, au.created_at DESC;

-- Step 11: Test moderator function
SELECT 
    'Moderator Function Test' as check_type,
    'Testing moderator function' as test_description,
    is_moderator_user() as function_result,
    CASE 
        WHEN is_moderator_user() THEN '✅ Moderator access granted'
        ELSE '❌ Moderator access denied'
    END as access_status;
