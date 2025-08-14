-- Fix for infinite recursion in user_profiles policies
-- The issue is in the "Admins can view all profiles" policy

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Step 2: Create a safer admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is admin by email instead of role to avoid recursion
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@tevasul.group'
    )
  );

-- Step 3: Alternative approach - create a separate admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by email first (most reliable)
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@tevasul.group'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: check role in user_profiles (with safety check)
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a better admin policy using the function
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Step 5: Also fix any other policies that might cause recursion
-- Update the user policies to be more specific
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Step 6: Create a policy for service accounts or system access
CREATE POLICY "Service accounts can read profiles"
  ON user_profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Step 7: Verify the fix
SELECT 
    'Recursion Fix Complete' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN '✅'
        ELSE '❌'
    END || ' Admin policy fixed' as admin_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin_user') THEN '✅'
        ELSE '❌'
    END || ' Admin check function' as admin_function,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND cmd = 'SELECT') THEN '✅'
        ELSE '❌'
    END || ' Select policies exist' as select_policies;

-- Step 8: Test the admin function
SELECT 
    'Admin Function Test' as test_type,
    is_admin_user() as is_admin,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;
