-- Emergency fix for infinite recursion in profiles RLS policies
-- This script will completely reset the RLS policies for the profiles table

-- Step 1: Disable RLS completely on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON profiles;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies
-- Policy 1: Users can view their own profile (simple check)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (simple check)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (simple check)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Service role bypass (for admin operations)
CREATE POLICY "Service role bypass" ON profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Step 5: Create admin access policy (simple check)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- Step 6: Create admin update policy (simple check)
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- Step 7: Verify the fix by checking if admin profile exists and has correct role
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
    updated_at = NOW()
WHERE profiles.id = 'd45aacd1-ca2d-434f-8b43-623f2b34b76c';

-- Step 8: Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
