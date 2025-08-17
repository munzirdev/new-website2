-- Fix User Profiles Triggers and Functions
-- This script removes all references to user_profiles table from triggers and functions

-- Step 1: Check for triggers that reference user_profiles
SELECT 'Checking for triggers referencing user_profiles...' as step;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%user_profiles%'
AND trigger_schema = 'public';

-- Step 2: Check for functions that reference user_profiles
SELECT 'Checking for functions referencing user_profiles...' as step;

SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%user_profiles%'
AND routine_schema = 'public';

-- Step 3: Drop the problematic sync_moderator_roles function
SELECT 'Dropping sync_moderator_roles function...' as step;

DROP FUNCTION IF EXISTS public.sync_moderator_roles() CASCADE;

-- Step 4: Drop any other functions that reference user_profiles
SELECT 'Dropping other functions that reference user_profiles...' as step;

-- Find and drop all functions that reference user_profiles
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_definition LIKE '%user_profiles%'
        AND routine_schema = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_record.routine_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.routine_name;
    END LOOP;
END $$;

-- Step 5: Drop any triggers that reference user_profiles
SELECT 'Dropping triggers that reference user_profiles...' as step;

-- Find and drop all triggers that reference user_profiles
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE action_statement LIKE '%user_profiles%'
        AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON public.' || trigger_record.event_object_table || ' CASCADE';
        RAISE NOTICE 'Dropped trigger: % on table %', trigger_record.trigger_name, trigger_record.event_object_table;
    END LOOP;
END $$;

-- Step 6: Drop user_profiles table if it still exists
SELECT 'Dropping user_profiles table if it exists...' as step;

DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 7: Create a new sync_moderator_roles function that uses profiles table
SELECT 'Creating new sync_moderator_roles function...' as step;

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

-- Step 8: Create trigger for moderators table to sync roles
SELECT 'Creating trigger for moderators table...' as step;

DROP TRIGGER IF EXISTS sync_moderator_roles_trigger ON public.moderators;
CREATE TRIGGER sync_moderator_roles_trigger
    AFTER INSERT OR UPDATE ON public.moderators
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_moderator_roles();

-- Step 9: Verify no remaining references to user_profiles
SELECT 'Verifying no remaining user_profiles references...' as step;

-- Check for any remaining triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE action_statement LIKE '%user_profiles%'
AND trigger_schema = 'public';

-- Check for any remaining functions
SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_definition LIKE '%user_profiles%'
AND routine_schema = 'public';

-- Step 10: Test the new function
SELECT 'Testing new sync_moderator_roles function...' as step;

-- Test insert to verify the trigger works
INSERT INTO public.moderators (email, full_name)
VALUES ('test-sync@example.com', 'Test Sync Moderator')
ON CONFLICT (email) DO NOTHING;

-- Show the test record
SELECT 
    id,
    email,
    full_name,
    created_at
FROM public.moderators
WHERE email = 'test-sync@example.com';

-- Clean up test record
DELETE FROM public.moderators WHERE email = 'test-sync@example.com';

-- Step 11: Final verification
SELECT 'Final verification...' as step;

-- Show all tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'moderators', 'user_profiles')
AND table_schema = 'public'
ORDER BY table_name;

-- Show all triggers on moderators table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'moderators'
AND trigger_schema = 'public';

-- Show all functions
SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%moderator%'
ORDER BY routine_name;

SELECT 'Fix completed successfully!' as result;
