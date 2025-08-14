-- Remove duplicate and problematic policies
-- This script will clean up all policies and keep only the safe ones

-- Step 1: Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start completely fresh
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;
DROP POLICY IF EXISTS "Service accounts can read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON user_profiles;

-- Step 3: Create the simple admin function (if not exists)
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

-- Step 5: Create ONLY the essential, safe policies
-- Users can read their own profile
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

-- Admins can view all profiles (using simple function)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user_simple());

-- Service role can do everything
CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user_simple() TO authenticated;

-- Step 7: Verify the cleanup
SELECT 
    'Policy Cleanup Complete' as status,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) <= 5 THEN '✅ Clean (5 or fewer policies)'
        ELSE '❌ Too many policies'
    END as policy_count_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Step 8: List all remaining policies
SELECT 
    'Remaining Policies' as info,
    policyname,
    cmd,
    CASE 
        WHEN policyname = 'Admins can view all profiles' AND qual LIKE '%is_admin_user_simple%' THEN '✅ Safe'
        WHEN policyname LIKE '%admin%' AND qual LIKE '%user_profiles%' THEN '❌ DANGEROUS'
        ELSE '✅ Safe'
    END as safety_status
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Step 9: Test the setup
SELECT 
    'Setup Test' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN '✅ SELECT works'
        ELSE '❌ SELECT fails'
    END as select_test,
    is_admin_user_simple() as admin_function_test;
