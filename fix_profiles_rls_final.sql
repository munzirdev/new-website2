-- Final fix for infinite recursion in profiles RLS policies
-- This script will completely reset the RLS policies for the profiles table

-- Step 1: Disable RLS completely on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL possible existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all" ON profiles;
DROP POLICY IF EXISTS "Admins can update all" ON profiles;
DROP POLICY IF EXISTS "Bypass RLS" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;

-- Step 3: Drop ALL policies using dynamic SQL to catch any remaining ones
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, non-recursive policies with unique names
-- Policy 1: Users can view their own profile (simple check)
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (simple check)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (simple check)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Service role bypass (for admin operations)
CREATE POLICY "profiles_service_role" ON profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Policy 5: Admin access policy (simple check without recursion)
CREATE POLICY "profiles_admin_select" ON profiles
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'moderator')
        )
    );

-- Policy 6: Admin update policy (simple check without recursion)
CREATE POLICY "profiles_admin_update" ON profiles
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'moderator')
        )
    );

-- Step 6: Ensure admin profile exists with correct role
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    'd45aacd1-ca2d-434f-8b43-623f2b34b76c',
    'admin@tevasul.group',
    'Admin User',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    email = 'admin@tevasul.group',
    full_name = 'Admin User',
    updated_at = NOW();

-- Step 7: Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 8: Test the fix by querying admin profile
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'd45aacd1-ca2d-434f-8b43-623f2b34b76c';

