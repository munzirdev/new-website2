-- Quick Fix for user_profiles Issue
-- Run this in Supabase SQL Editor

-- Step 1: Drop the problematic function
DROP FUNCTION IF EXISTS public.sync_moderator_roles() CASCADE;

-- Step 2: Drop user_profiles table
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 3: Create new function that uses profiles table
CREATE OR REPLACE FUNCTION public.sync_moderator_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profiles table instead of user_profiles
    UPDATE public.profiles 
    SET role = 'moderator', updated_at = NOW()
    WHERE email = NEW.email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for moderators table
DROP TRIGGER IF EXISTS sync_moderator_roles_trigger ON public.moderators;
CREATE TRIGGER sync_moderator_roles_trigger
    AFTER INSERT OR UPDATE ON public.moderators
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_moderator_roles();

-- Step 5: Test the fix
INSERT INTO public.moderators (email, full_name)
VALUES ('test-quick-fix@example.com', 'Test Quick Fix')
ON CONFLICT (email) DO NOTHING;

-- Clean up test
DELETE FROM public.moderators WHERE email = 'test-quick-fix@example.com';

SELECT 'Quick fix completed!' as result;
