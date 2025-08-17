-- Complete reset for profiles RLS - Nuclear option
-- This script will completely disable RLS and create a simple admin profile

-- Step 1: Disable RLS completely on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies using dynamic SQL
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

-- Step 3: Create admin profile directly (no RLS restrictions)
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

-- Step 4: Verify admin profile exists
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'd45aacd1-ca2d-434f-8b43-623f2b34b76c';

-- Step 5: Show current table status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 6: Show any remaining policies (should be none)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'profiles';
