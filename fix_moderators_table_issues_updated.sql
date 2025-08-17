-- Fix Moderators Table Issues (Updated)
-- This script ensures the moderators table exists with proper structure and policies

-- First, let's check if moderators table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'moderators'
) as moderators_table_exists;

-- If moderators table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.moderators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS on moderators table
ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all moderators" ON public.moderators;
DROP POLICY IF EXISTS "Admins can insert moderators" ON public.moderators;
DROP POLICY IF EXISTS "Admins can update moderators" ON public.moderators;
DROP POLICY IF EXISTS "Admins can delete moderators" ON public.moderators;
DROP POLICY IF EXISTS "Admins can manage moderators" ON public.moderators;
DROP POLICY IF EXISTS "Service role bypass" ON public.moderators;
DROP POLICY IF EXISTS "Users can view own moderator" ON public.moderators;
DROP POLICY IF EXISTS "Users can update own moderator" ON public.moderators;

-- Create RLS policies for moderators table
-- Policy 1: Admins can view all moderators
CREATE POLICY "Admins can view all moderators" ON public.moderators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 2: Admins can insert moderators
CREATE POLICY "Admins can insert moderators" ON public.moderators
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 3: Admins can update moderators
CREATE POLICY "Admins can update moderators" ON public.moderators
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 4: Admins can delete moderators
CREATE POLICY "Admins can delete moderators" ON public.moderators
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 5: Service role bypass for admin operations
CREATE POLICY "Service role bypass" ON public.moderators
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for moderators table
DROP TRIGGER IF EXISTS update_moderators_updated_at ON public.moderators;
CREATE TRIGGER update_moderators_updated_at
    BEFORE UPDATE ON public.moderators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'moderators' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

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
WHERE tablename = 'moderators' 
    AND schemaname = 'public'
ORDER BY policyname;

-- Show current moderators
SELECT 
    id,
    email,
    full_name,
    created_at,
    is_active
FROM public.moderators
ORDER BY created_at DESC;

