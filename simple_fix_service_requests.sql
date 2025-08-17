-- Simple Fix for service_requests table
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Drop any remaining user_profiles table
SELECT '=== STEP 1: DROPPING USER_PROFILES TABLE ===' as info;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 2: Drop and recreate service_requests table
SELECT '=== STEP 2: RECREATING SERVICE_REQUESTS TABLE ===' as info;
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

-- Step 3: Enable RLS
SELECT '=== STEP 3: ENABLING RLS ===' as info;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
SELECT '=== STEP 4: CREATING POLICIES ===' as info;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can insert their own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can update their own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can view all service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can update all service requests" ON public.service_requests;

-- Create new policies
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

-- Step 5: Create indexes
SELECT '=== STEP 5: CREATING INDEXES ===' as info;
CREATE INDEX IF NOT EXISTS service_requests_user_id_idx ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS service_requests_status_idx ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS service_requests_service_type_idx ON public.service_requests(service_type);
CREATE INDEX IF NOT EXISTS service_requests_created_at_idx ON public.service_requests(created_at);

-- Step 6: Grant permissions
SELECT '=== STEP 6: GRANTING PERMISSIONS ===' as info;
GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;

-- Step 7: Create trigger function for updated_at
SELECT '=== STEP 7: CREATING TRIGGER FUNCTION ===' as info;
CREATE OR REPLACE FUNCTION public.handle_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
SELECT '=== STEP 8: CREATING TRIGGER ===' as info;
DROP TRIGGER IF EXISTS on_service_requests_updated ON public.service_requests;
CREATE TRIGGER on_service_requests_updated
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_service_requests_updated_at();

-- Step 9: Final verification
SELECT '=== STEP 9: FINAL VERIFICATION ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'service_requests';

SELECT 'service_requests table is ready for use' as status;
