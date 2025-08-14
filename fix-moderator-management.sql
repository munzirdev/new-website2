-- Fix moderator management issues in admin dashboard
-- This will ensure the moderator management tab works correctly

-- Step 1: Check if moderators table exists and has proper structure
SELECT 
    'Moderators Table Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderators') THEN '✅ Table exists'
        ELSE '❌ Table missing'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderators') 
        THEN (SELECT COUNT(*)::text FROM moderators)
        ELSE 'N/A'
    END as moderators_count;

-- Step 2: Check moderators table structure
SELECT 
    'Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ Primary key'
        WHEN column_name = 'user_id' AND data_type = 'uuid' THEN '✅ User reference'
        WHEN column_name = 'email' AND data_type = 'character varying' THEN '✅ Email field'
        WHEN column_name = 'full_name' AND data_type = 'character varying' THEN '✅ Name field'
        WHEN column_name = 'created_by' AND data_type = 'uuid' THEN '✅ Created by field'
        WHEN column_name = 'is_active' AND data_type = 'boolean' THEN '✅ Active status'
        ELSE 'ℹ️ Other column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'moderators' 
ORDER BY ordinal_position;

-- Step 3: Check RLS policies for moderators table
SELECT 
    'RLS Policies' as check_type,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN policyname LIKE '%admin%' AND cmd = 'SELECT' THEN '✅ Admin can view'
        WHEN policyname LIKE '%admin%' AND cmd = 'INSERT' THEN '✅ Admin can insert'
        WHEN policyname LIKE '%admin%' AND cmd = 'UPDATE' THEN '✅ Admin can update'
        WHEN policyname LIKE '%admin%' AND cmd = 'DELETE' THEN '✅ Admin can delete'
        ELSE 'ℹ️ Other policy'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'moderators'
ORDER BY policyname;

-- Step 4: Create missing RLS policies if needed
DO $$
BEGIN
    -- Add admin view policy if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'moderators' 
        AND policyname = 'Admins can view all moderators'
    ) THEN
        CREATE POLICY "Admins can view all moderators" ON moderators
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );
        RAISE NOTICE 'Created admin view policy for moderators';
    END IF;

    -- Add admin insert policy if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'moderators' 
        AND policyname = 'Admins can insert moderators'
    ) THEN
        CREATE POLICY "Admins can insert moderators" ON moderators
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );
        RAISE NOTICE 'Created admin insert policy for moderators';
    END IF;

    -- Add admin update policy if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'moderators' 
        AND policyname = 'Admins can update moderators'
    ) THEN
        CREATE POLICY "Admins can update moderators" ON moderators
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );
        RAISE NOTICE 'Created admin update policy for moderators';
    END IF;

    -- Add admin delete policy if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'moderators' 
        AND policyname = 'Admins can delete moderators'
    ) THEN
        CREATE POLICY "Admins can delete moderators" ON moderators
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );
        RAISE NOTICE 'Created admin delete policy for moderators';
    END IF;
END $$;

-- Step 5: Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON moderators TO authenticated;

-- Step 6: Create function to sync moderators with user_profiles
CREATE OR REPLACE FUNCTION sync_moderator_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user is added to moderators table, update their role in user_profiles
    IF TG_OP = 'INSERT' THEN
        UPDATE user_profiles 
        SET role = 'moderator', updated_at = NOW()
        WHERE email = NEW.email;
        
        -- If user doesn't exist in user_profiles yet, create a placeholder
        IF NOT FOUND THEN
            INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                NEW.email,
                NEW.full_name,
                'moderator',
                NOW(),
                NOW()
            );
        END IF;
    END IF;
    
    -- When a moderator is deleted, update their role back to user
    IF TG_OP = 'DELETE' THEN
        UPDATE user_profiles 
        SET role = 'user', updated_at = NOW()
        WHERE email = OLD.email;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for moderator sync
DROP TRIGGER IF EXISTS sync_moderator_roles_trigger ON moderators;
CREATE TRIGGER sync_moderator_roles_trigger
    AFTER INSERT OR DELETE ON moderators
    FOR EACH ROW
    EXECUTE FUNCTION sync_moderator_roles();

-- Step 8: Verify moderator management setup
SELECT 
    'Moderator Management Setup' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderators') THEN '✅ Table exists'
        ELSE '❌ Table missing'
    END as table_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'moderators' 
            AND policyname = 'Admins can view all moderators'
        ) THEN '✅ View policy exists'
        ELSE '❌ View policy missing'
    END as view_policy,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'moderators' 
            AND policyname = 'Admins can insert moderators'
        ) THEN '✅ Insert policy exists'
        ELSE '❌ Insert policy missing'
    END as insert_policy,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'moderators' 
            AND policyname = 'Admins can delete moderators'
        ) THEN '✅ Delete policy exists'
        ELSE '❌ Delete policy missing'
    END as delete_policy,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'sync_moderator_roles_trigger'
        ) THEN '✅ Sync trigger exists'
        ELSE '❌ Sync trigger missing'
    END as sync_trigger;

-- Step 9: List current moderators
SELECT 
    'Current Moderators' as check_type,
    m.id,
    m.email,
    m.full_name,
    m.created_at,
    m.is_active,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ Role synced'
        WHEN up.role IS NULL THEN '⚠️ No profile'
        ELSE '❌ Role not synced'
    END as role_status
FROM moderators m
LEFT JOIN user_profiles up ON m.email = up.email
ORDER BY m.created_at DESC;

-- Step 10: Test moderator management access
SELECT 
    'Access Test' as check_type,
    'Testing moderator management access' as test_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        ) THEN '✅ Admin access granted'
        ELSE '❌ Admin access denied'
    END as admin_access,
    CASE 
        WHEN EXISTS (SELECT 1 FROM moderators LIMIT 1) THEN '✅ Can view moderators'
        ELSE '❌ Cannot view moderators'
    END as view_access;
