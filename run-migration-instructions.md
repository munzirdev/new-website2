# How to Run Your Migration

Since the Supabase CLI is having network connectivity issues, here's how to run your migration through the Supabase web interface:

## Step 1: Access Your Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `fctvityawavmuethxxix`

## Step 2: Open SQL Editor
1. In your project dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL query

## Step 3: Run the Migration
1. Copy the entire contents of the `run-migration.sql` file
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

## Step 4: Verify the Migration
After running the migration, you can verify it worked by running these queries:

```sql
-- Check if the role column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'role';

-- Check if the moderators table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'moderators';

-- Check if the admin user has the correct role
SELECT email, role FROM user_profiles WHERE email = 'admin@tevasul.group';
```

## Alternative: Use the Migration File Directly
If you prefer, you can also:
1. Open the `run-migration.sql` file in your code editor
2. Copy all the SQL commands
3. Paste them into the Supabase SQL Editor
4. Run them one by one or all at once

## What This Migration Does
This migration will:
- Add a `role` column to the `user_profiles` table
- Set the admin user role for `admin@tevasul.group`
- Create a `moderators` table for admin management
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically assign roles to new users
