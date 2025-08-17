-- Fix Moderator Insert Issue
-- This script helps fix the foreign key constraint issue when adding moderators

-- First, let's check the current state of the moderators table
SELECT 
    m.id,
    m.email,
    m.full_name,
    m.user_id,
    m.created_by,
    m.created_at,
    CASE 
        WHEN au.id IS NOT NULL THEN 'User exists in auth.users'
        ELSE 'User NOT found in auth.users'
    END as user_status
FROM public.moderators m
LEFT JOIN auth.users au ON m.user_id = au.id
ORDER BY m.created_at DESC;

-- Check if there are any moderators with invalid user_id references
SELECT 
    m.id,
    m.email,
    m.user_id,
    m.created_at
FROM public.moderators m
WHERE m.user_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = m.user_id
);

-- If there are invalid references, we can either:
-- 1. Remove the user_id (set to NULL) for non-existent users
-- 2. Or create the user in auth.users if needed

-- Option 1: Remove invalid user_id references
UPDATE public.moderators 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = user_id
);

-- Check the moderators table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'moderators' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify the foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='moderators';

-- Final verification
SELECT 
    COUNT(*) as total_moderators,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as without_user_id,
    COUNT(CASE WHEN user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = user_id) THEN 1 END) as valid_user_references
FROM public.moderators;
