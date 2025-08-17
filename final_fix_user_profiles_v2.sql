-- Final Fix for user_profiles references (Version 2)
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Drop any remaining user_profiles table
SELECT '=== STEP 1: DROPPING USER_PROFILES TABLE ===' as info;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 2: Find and drop any foreign key constraints referencing user_profiles
SELECT '=== STEP 2: DROPPING FOREIGN KEY CONSTRAINTS ===' as info;
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT 
            tc.table_name, 
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND (ccu.table_name = 'user_profiles' OR tc.table_name = 'user_profiles')
    LOOP
        EXECUTE 'ALTER TABLE public.' || constraint_record.table_name || ' DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint % from table %', constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
END $$;

-- Step 3: Drop any triggers that reference user_profiles
SELECT '=== STEP 3: DROPPING TRIGGERS ===' as info;
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE action_statement LIKE '%user_profiles%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON public.' || trigger_record.event_object_table;
        RAISE NOTICE 'Dropped trigger % from table %', trigger_record.trigger_name, trigger_record.event_object_table;
    END LOOP;
END $$;

-- Step 4: Drop any functions that reference user_profiles (handling overloaded functions)
SELECT '=== STEP 4: DROPPING FUNCTIONS ===' as info;
DO $$
DECLARE
    function_record RECORD;
BEGIN
    FOR function_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND pg_get_functiondef(p.oid) LIKE '%user_profiles%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || function_record.function_name || '(' || function_record.arguments || ') CASCADE';
        RAISE NOTICE 'Dropped function % with arguments %', function_record.function_name, function_record.arguments;
    END LOOP;
END $$;

-- Step 5: Drop any views that reference user_profiles
SELECT '=== STEP 5: DROPPING VIEWS ===' as info;
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT table_name
        FROM information_schema.views
        WHERE view_definition LIKE '%user_profiles%'
        AND table_schema = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || view_record.table_name || ' CASCADE';
        RAISE NOTICE 'Dropped view %', view_record.table_name;
    END LOOP;
END $$;

-- Step 6: Ensure service_requests table exists and is properly configured
SELECT '=== STEP 6: ENSURING SERVICE_REQUESTS TABLE ===' as info;

-- Drop and recreate service_requests table to ensure clean state
DROP TABLE IF EXISTS public.service_requests CASCADE;

CREATE TABLE public.service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('translation', 'consultation', 'legal', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    file_url TEXT,
    file_name TEXT,
    file_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Enable RLS and create policies
SELECT '=== STEP 7: SETTING UP RLS AND POLICIES ===' as info;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own service requests" ON public.service_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service requests" ON public.service_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests" ON public.service_requests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service requests" ON public.service_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update all service requests" ON public.service_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Step 8: Create indexes
SELECT '=== STEP 8: CREATING INDEXES ===' as info;
CREATE INDEX IF NOT EXISTS service_requests_user_id_idx ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS service_requests_status_idx ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS service_requests_service_type_idx ON public.service_requests(service_type);
CREATE INDEX IF NOT EXISTS service_requests_created_at_idx ON public.service_requests(created_at);

-- Step 9: Grant permissions
SELECT '=== STEP 9: GRANTING PERMISSIONS ===' as info;
GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;

-- Step 10: Test the table
SELECT '=== STEP 10: TESTING TABLE ===' as info;
-- This will show if the table is working correctly
SELECT 'service_requests table is ready for use' as status;
