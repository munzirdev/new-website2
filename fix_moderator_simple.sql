-- Simple Fix for Moderator Insert Issue
-- This script cleans up invalid foreign key references

-- Step 1: Check current moderators with invalid user_id references
SELECT 
    m.id,
    m.email,
    m.user_id,
    m.created_at,
    CASE 
        WHEN au.id IS NOT NULL THEN 'Valid'
        ELSE 'Invalid - will be fixed'
    END as status
FROM public.moderators m
LEFT JOIN auth.users au ON m.user_id = au.id
WHERE m.user_id IS NOT NULL;

-- Step 2: Fix invalid user_id references by setting them to NULL
UPDATE public.moderators 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = user_id
);

-- Step 3: Verify the fix
SELECT 
    COUNT(*) as total_moderators,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_valid_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as without_user_id
FROM public.moderators;

-- Step 4: Show final state
SELECT 
    m.id,
    m.email,
    m.full_name,
    m.user_id,
    m.created_at,
    CASE 
        WHEN m.user_id IS NULL THEN 'No user linked'
        WHEN au.id IS NOT NULL THEN 'Valid user linked'
        ELSE 'Invalid user linked'
    END as user_status
FROM public.moderators m
LEFT JOIN auth.users au ON m.user_id = au.id
ORDER BY m.created_at DESC;
