-- Diagnostic and Fix Script for Database Tables
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Check what tables currently exist
SELECT '=== CURRENT TABLES ===' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: Check for any foreign key constraints that might reference user_profiles
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'user_profiles' OR tc.table_name = 'user_profiles');

-- Step 3: Check for any triggers that reference user_profiles
SELECT '=== TRIGGERS REFERENCING USER_PROFILES ===' as info;
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%user_profiles%';

-- Step 4: Check for any functions that reference user_profiles
SELECT '=== FUNCTIONS REFERENCING USER_PROFILES ===' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%user_profiles%';

-- Step 5: Drop any remaining user_profiles table if it exists
SELECT '=== DROPPING USER_PROFILES TABLE ===' as info;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 6: Create the missing tables
SELECT '=== CREATING MISSING TABLES ===' as info;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    country_code TEXT DEFAULT '+90',
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
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

-- Create file_attachments table
CREATE TABLE IF NOT EXISTS public.file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Enable RLS on all tables
SELECT '=== ENABLING RLS ===' as info;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- Step 8: Create policies (only if they don't exist)
SELECT '=== CREATING POLICIES ===' as info;

-- Profiles policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Service requests policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can view their own service requests') THEN
        CREATE POLICY "Users can view their own service requests" ON public.service_requests
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can insert their own service requests') THEN
        CREATE POLICY "Users can insert their own service requests" ON public.service_requests
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can update their own service requests') THEN
        CREATE POLICY "Users can update their own service requests" ON public.service_requests
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Admins can view all service requests') THEN
        CREATE POLICY "Admins can view all service requests" ON public.service_requests
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Admins can update all service requests') THEN
        CREATE POLICY "Admins can update all service requests" ON public.service_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
                )
            );
    END IF;
END $$;

-- File attachments policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_attachments' AND policyname = 'Users can view their own file attachments') THEN
        CREATE POLICY "Users can view their own file attachments" ON public.file_attachments
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_attachments' AND policyname = 'Users can insert their own file attachments') THEN
        CREATE POLICY "Users can insert their own file attachments" ON public.file_attachments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_attachments' AND policyname = 'Users can update their own file attachments') THEN
        CREATE POLICY "Users can update their own file attachments" ON public.file_attachments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_attachments' AND policyname = 'Admins can view all file attachments') THEN
        CREATE POLICY "Admins can view all file attachments" ON public.file_attachments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_attachments' AND policyname = 'Admins can update all file attachments') THEN
        CREATE POLICY "Admins can update all file attachments" ON public.file_attachments
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
                )
            );
    END IF;
END $$;

-- Step 9: Create functions and triggers
SELECT '=== CREATING FUNCTIONS AND TRIGGERS ===' as info;

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'مستخدم'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
            WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_profiles_updated') THEN
        CREATE TRIGGER on_profiles_updated
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_service_requests_updated') THEN
        CREATE TRIGGER on_service_requests_updated
            BEFORE UPDATE ON public.service_requests
            FOR EACH ROW EXECUTE FUNCTION public.handle_service_requests_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_file_attachments_updated') THEN
        CREATE TRIGGER on_file_attachments_updated
            BEFORE UPDATE ON public.file_attachments
            FOR EACH ROW EXECUTE FUNCTION public.handle_file_attachments_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Step 10: Create indexes
SELECT '=== CREATING INDEXES ===' as info;
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS service_requests_user_id_idx ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS service_requests_status_idx ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS service_requests_service_type_idx ON public.service_requests(service_type);
CREATE INDEX IF NOT EXISTS service_requests_created_at_idx ON public.service_requests(created_at);
CREATE INDEX IF NOT EXISTS file_attachments_user_id_idx ON public.file_attachments(user_id);
CREATE INDEX IF NOT EXISTS file_attachments_created_at_idx ON public.file_attachments(created_at);

-- Step 11: Insert existing users into profiles
SELECT '=== INSERTING EXISTING USERS ===' as info;
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'مستخدم'),
    CASE 
        WHEN au.email = 'admin@tevasul.group' THEN 'admin'
        WHEN au.email LIKE '%moderator%' THEN 'moderator'
        ELSE 'user'
    END,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Step 12: Grant permissions
SELECT '=== GRANTING PERMISSIONS ===' as info;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
GRANT ALL ON public.file_attachments TO authenticated;
GRANT ALL ON public.file_attachments TO service_role;

-- Step 13: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'service_requests', 'file_attachments')
ORDER BY table_name;
