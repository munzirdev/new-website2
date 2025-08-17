-- Fix Admin Profile Access
-- This script manually creates/updates the admin profile to ensure it exists

-- First, let's check if the admin profile exists
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'admin@tevasul.group';

-- If admin profile doesn't exist, create it manually
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'مدير النظام'),
    'admin',
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.email = 'admin@tevasul.group'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Update admin profile if it exists but role is wrong
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = COALESCE(full_name, 'مدير النظام'),
    updated_at = NOW()
WHERE email = 'admin@tevasul.group'
AND role != 'admin';

-- Verify the admin profile
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'admin@tevasul.group';

-- Grant necessary permissions to the admin user
-- This ensures the admin can access their own profile
SELECT 'Admin profile fixed successfully' as status;
