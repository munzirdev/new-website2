-- Check and fix moderator access issues
-- This will help identify why moderators can't see the dashboard

-- Check 1: List all moderators
SELECT 
    'All Moderators' as check_type,
    au.id,
    au.email,
    up.full_name,
    up.role,
    au.created_at,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Moderator role'
        WHEN up.role = 'admin' THEN '✅ Admin role'
        ELSE '❌ Not moderator'
    END as role_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.role IN ('moderator', 'admin')
ORDER BY up.role, au.created_at DESC;

-- Check 2: Check moderator function
CREATE OR REPLACE FUNCTION is_moderator_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by email first
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

-- Check 3: Test moderator function
SELECT 
    'Moderator Function Test' as check_type,
    is_moderator_user() as is_moderator,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT role FROM user_profiles WHERE id = auth.uid()) as current_user_role;

-- Check 4: Check if moderators table exists and has data
SELECT 
    'Moderators Table Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderators') THEN '✅ Table exists'
        ELSE '❌ Table missing'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderators') 
        THEN (SELECT COUNT(*)::text FROM moderators)
        ELSE 'N/A'
    END as moderators_count;

-- Check 5: List moderators table data
SELECT 
    'Moderators Table Data' as check_type,
    id,
    user_id,
    created_at,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN '✅ User exists'
        ELSE '❌ User missing'
    END as user_status
FROM moderators
ORDER BY created_at DESC;

-- Check 6: Check RLS policies for moderators
SELECT 
    'Moderator Policies' as check_type,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN policyname LIKE '%moderator%' THEN '✅ Moderator policy'
        WHEN policyname LIKE '%admin%' THEN '✅ Admin policy'
        ELSE 'ℹ️ Other policy'
    END as policy_type
FROM pg_policies 
WHERE tablename = 'user_profiles'
AND (policyname LIKE '%moderator%' OR policyname LIKE '%admin%')
ORDER BY policyname;

-- Check 7: Create moderator access policy if missing
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

-- Check 8: Grant moderator permissions
GRANT EXECUTE ON FUNCTION is_moderator_user() TO authenticated;

-- Check 9: Verify moderator setup
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
    END as moderators_status;

-- Check 10: Test moderator access
SELECT 
    'Moderator Access Test' as check_type,
    'Testing moderator function' as test_description,
    is_moderator_user() as function_result,
    CASE 
        WHEN is_moderator_user() THEN '✅ Moderator access granted'
        ELSE '❌ Moderator access denied'
    END as access_status;
