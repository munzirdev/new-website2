-- Improve moderator linking and role assignment
-- This migration enhances the handle_new_user function to better link existing moderators

-- Step 1: Update handle_new_user function to better handle moderator linking
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is already a moderator
    IF EXISTS (SELECT 1 FROM moderators WHERE email = NEW.email) THEN
        -- User is a moderator, create profile with moderator role
        INSERT INTO user_profiles (id, full_name, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            'moderator'
        );
        
        -- Link the moderator record with the user
        UPDATE moderators 
        SET user_id = NEW.id, updated_at = NOW()
        WHERE email = NEW.email AND user_id IS NULL;
        
        RAISE NOTICE 'Created moderator profile for user: %', NEW.email;
    ELSE
        -- Regular user, create profile with default role
        INSERT INTO user_profiles (id, full_name, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            CASE 
                WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
                WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
                ELSE 'user'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create function to sync existing moderators with users
CREATE OR REPLACE FUNCTION sync_moderators_with_users()
RETURNS void AS $$
DECLARE
    moderator_record RECORD;
    found_user_id UUID;
BEGIN
    -- Loop through all moderators that don't have user_id set
    FOR moderator_record IN 
        SELECT id, email, full_name 
        FROM moderators 
        WHERE user_id IS NULL
    LOOP
        -- Find the user by email in auth.users
        SELECT id INTO found_user_id 
        FROM auth.users 
        WHERE email = moderator_record.email;
        
        -- If user exists, link them and update their role
        IF found_user_id IS NOT NULL THEN
            -- Link moderator record
            UPDATE moderators 
            SET user_id = found_user_id, updated_at = NOW()
            WHERE id = moderator_record.id;
            
            -- Update or create user profile with moderator role
            INSERT INTO user_profiles (id, full_name, role, created_at, updated_at)
            VALUES (
                found_user_id,
                moderator_record.full_name,
                'moderator',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                role = 'moderator',
                full_name = EXCLUDED.full_name,
                updated_at = NOW();
            
            RAISE NOTICE 'Linked moderator % with user % and updated role', moderator_record.email, found_user_id;
        ELSE
            RAISE NOTICE 'No user found for moderator email: %', moderator_record.email;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to check moderator status
CREATE OR REPLACE FUNCTION check_moderator_status()
RETURNS TABLE (
    moderator_id UUID,
    email VARCHAR(255),
    full_name VARCHAR(255),
    user_id UUID,
    is_active BOOLEAN,
    link_status TEXT,
    role_status TEXT,
    user_exists BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as moderator_id,
        m.email,
        m.full_name,
        m.user_id,
        m.is_active,
        CASE 
            WHEN m.user_id IS NOT NULL THEN '✅ User linked'
            ELSE '❌ No user linked'
        END as link_status,
        CASE 
            WHEN up.role = 'moderator' THEN '✅ Role correct'
            WHEN up.role IS NULL THEN '⚠️ No profile'
            ELSE '❌ Wrong role'
        END as role_status,
        CASE 
            WHEN au.id IS NOT NULL THEN true
            ELSE false
        END as user_exists
    FROM moderators m
    LEFT JOIN user_profiles up ON m.user_id = up.id
    LEFT JOIN auth.users au ON m.user_id = au.id
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Run the sync function to link existing moderators
SELECT sync_moderators_with_users();

-- Step 5: Verify the improvements
SELECT 
    'Moderator Status After Improvements' as check_type,
    COUNT(*) as total_moderators,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_moderators,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as unlinked_moderators
FROM moderators;

-- Step 6: Show detailed status
SELECT * FROM check_moderator_status();
