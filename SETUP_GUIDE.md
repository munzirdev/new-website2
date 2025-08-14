# Setup Guide for Moderator System

## Step 1: Run Database Migration

### Option A: Using Supabase CLI
```bash
supabase db push
```

### Option B: Manual SQL Execution
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `run-migration.sql`
4. Click "Run" to execute the migration

## Step 2: Verify Migration Success

Run this query in SQL Editor to check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('moderators', 'user_profiles');
```

## Step 3: Check Admin User Role

Run this query to ensure admin user has correct role:
```sql
SELECT email, role FROM user_profiles WHERE email = 'admin@tevasul.group';
```

## Step 4: Test the Application

1. Start the development server:
   ```bash
   npm run dev -- --port 5173
   ```

2. Login as admin (`admin@tevasul.group`)
3. Go to Admin Dashboard → Moderators tab
4. Try adding a moderator

## Troubleshooting

### If you get "فشل في إضافة المشرف":

1. **Check Console Logs**: Open browser dev tools and check for error messages
2. **Verify Database Connection**: Make sure Supabase URL and keys are correct
3. **Check RLS Policies**: Ensure the moderators table has proper policies
4. **Verify Admin Role**: Make sure your user has admin role

### Common Issues:

1. **Table doesn't exist**: Run the migration manually
2. **Permission denied**: Check RLS policies
3. **Admin role missing**: Update user_profiles table manually

### Manual Admin Role Update:
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@tevasul.group';
```

## Next Steps

Once the basic moderator management is working, you can:

1. Deploy the Edge Function for automatic user creation
2. Add password functionality back
3. Implement moderator login flow

## Support

If you continue to have issues, check:
- Browser console for JavaScript errors
- Supabase logs for database errors
- Network tab for failed requests
