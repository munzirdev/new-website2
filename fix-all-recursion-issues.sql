-- Comprehensive fix for all recursion issues in user_profiles
-- This script removes ALL policies and recreates them safely

-- Step 1: Disable RLS temporarily to avoid any recursion
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;
DROP POLICY IF EXISTS "Service accounts can read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON user_profiles;

-- Step 3: Create a simple admin check function that only checks email
CREATE OR REPLACE FUNCTION is_admin_user_simple()
RETURNS BOOLEAN AS $$
BEGIN
  -- Only check email, no recursion possible
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@tevasul.group'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create minimal, safe policies
-- Basic user policy - users can only see their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple admin policy - only checks email, no recursion
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user_simple());

-- Service role can do everything (for system operations)
CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user_simple() TO authenticated;

-- Step 7: Verify the fix
SELECT 
    'Recursion Fix Complete' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN '✅'
        ELSE '❌'
    END || ' Admin policy created' as admin_policy,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin_user_simple') THEN '✅'
        ELSE '❌'
    END || ' Simple admin function' as admin_function,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN '✅'
        ELSE '❌'
    END || ' RLS enabled' as rls_status;

-- Step 8: Test the simple admin function
SELECT 
    'Simple Admin Function Test' as test_type,
    is_admin_user_simple() as is_admin,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- Step 9: List all policies to verify
SELECT 
    'Policy List' as info,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%is_admin_user_simple%' THEN '✅ Safe (simple function)'
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%user_profiles%' THEN '❌ DANGEROUS (recursion risk)'
        ELSE 'ℹ️ Standard policy'
    END as safety_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;
