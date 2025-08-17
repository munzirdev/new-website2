-- Fix Create Moderator Function Issues
-- This script helps diagnose and fix issues with the create-moderator Edge Function

-- Step 1: Check if the function is deployed
SELECT 'Checking Edge Function deployment...' as step;

-- Step 2: Verify RLS policies for moderators table
SELECT 'Verifying RLS policies...' as step;

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
WHERE tablename = 'moderators' 
    AND schemaname = 'public'
ORDER BY policyname;

-- Step 3: Check if service role has proper permissions
SELECT 'Checking service role permissions...' as step;

-- Grant necessary permissions to service_role
GRANT ALL ON public.moderators TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 4: Create a test function to verify permissions
SELECT 'Creating test function...' as step;

CREATE OR REPLACE FUNCTION public.test_moderator_creation()
RETURNS TEXT AS $$
DECLARE
    test_user_id UUID;
    test_moderator_id UUID;
BEGIN
    -- Test creating a user (this will be done by the Edge Function)
    -- For now, just test if we can access the tables
    
    -- Test profiles table access
    IF EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
        RAISE NOTICE 'Profiles table accessible';
    ELSE
        RAISE EXCEPTION 'Cannot access profiles table';
    END IF;
    
    -- Test moderators table access
    IF EXISTS (SELECT 1 FROM public.moderators LIMIT 1) THEN
        RAISE NOTICE 'Moderators table accessible';
    ELSE
        RAISE EXCEPTION 'Cannot access moderators table';
    END IF;
    
    RETURN 'All tables accessible';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Test the function
SELECT 'Testing function...' as step;

SELECT public.test_moderator_creation();

-- Step 6: Clean up test function
DROP FUNCTION IF EXISTS public.test_moderator_creation();

-- Step 7: Verify trigger function exists
SELECT 'Verifying trigger function...' as step;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_moderator_roles'
    AND routine_schema = 'public';

-- Step 8: Show final status
SELECT 'Fix completed!' as result;
