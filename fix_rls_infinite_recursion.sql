-- Fix RLS Infinite Recursion Issue
-- This script fixes the infinite recursion in profiles table RLS policies

-- First, let's disable RLS temporarily to fix the policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role to bypass RLS (for admin operations)
CREATE POLICY "Service role bypass" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Verify the policies
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
AND schemaname = 'public'
ORDER BY policyname;

-- Test the policies
SELECT 
    'Testing policies' as test,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';
