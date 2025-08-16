-- Add is_guest column to support_messages table
-- This script should be run in the Supabase Dashboard SQL Editor

-- Check if the column already exists to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'support_messages' 
        AND column_name = 'is_guest'
    ) THEN
        -- Add the is_guest column
        ALTER TABLE support_messages 
        ADD COLUMN is_guest BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'Added is_guest column to support_messages table';
    ELSE
        RAISE NOTICE 'is_guest column already exists in support_messages table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'support_messages' 
AND column_name = 'is_guest';
