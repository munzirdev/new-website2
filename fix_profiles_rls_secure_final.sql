-- Secure RLS solution for profiles table
-- This script creates safe RLS policies without infinite recursion

-- Step 1: First, let's create a function to check admin status safely
CREATE OR REPLACE FUNCTION is_admin_or_moderator(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user email is admin@tevasul.group (hardcoded for safety)
    IF user_email = 'admin@tevasul.group' THEN
        RETURN TRUE;
    END IF;
    
    -- For other users, check their profile role (but only if they're not checking themselves)
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE email = user_email 
        AND role IN ('admin', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create secure policies
-- Policy 1: Users can view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
    FOR SELECT
    USING (auth.jwt() ->> 'email' = email);

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (auth.jwt() ->> 'email' = email);

-- Policy 3: Users can insert their own profile
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy 4: Admins can view all profiles (using email check)
CREATE POLICY "admins_view_all_profiles" ON profiles
    FOR SELECT
    USING (is_admin_or_moderator(auth.jwt() ->> 'email'));

-- Policy 5: Admins can update all profiles (using email check)
CREATE POLICY "admins_update_all_profiles" ON profiles
    FOR UPDATE
    USING (is_admin_or_moderator(auth.jwt() ->> 'email'));

-- Policy 6: Service role bypass
CREATE POLICY "service_role_bypass" ON profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Step 4: Verify admin profile exists
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

-- Step 5: Test the function
SELECT 
    'admin@tevasul.group' as email,
    is_admin_or_moderator('admin@tevasul.group') as is_admin;

-- Step 6: Show current policies
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
