-- Fix Admin Profile Role
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's check the current state of the admin profile
SELECT id, email, full_name, role, created_at, updated_at 
FROM public.profiles 
WHERE email = 'admin@tevasul.group';

-- Update the admin profile to ensure it has the correct role
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = COALESCE(full_name, 'Admin User'),
    updated_at = NOW()
WHERE email = 'admin@tevasul.group';

-- If the admin profile doesn't exist, create it
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Admin User'),
    'admin',
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.email = 'admin@tevasul.group'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Verify the fix
SELECT id, email, full_name, role, created_at, updated_at 
FROM public.profiles 
WHERE email = 'admin@tevasul.group';

-- Also check if there are any profiles without roles
SELECT id, email, full_name, role, created_at, updated_at 
FROM public.profiles 
WHERE role IS NULL OR role = '';

-- Fix any profiles without roles
UPDATE public.profiles 
SET 
    role = CASE 
        WHEN email = 'admin@tevasul.group' THEN 'admin'
        WHEN email LIKE '%moderator%' THEN 'moderator'
        ELSE 'user'
    END,
    updated_at = NOW()
WHERE role IS NULL OR role = '';

-- Final verification
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN role IS NULL OR role = '' THEN 1 END) as null_role_count
FROM public.profiles;
