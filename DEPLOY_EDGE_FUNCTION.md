# Deploying the Moderator Creation Edge Function

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

## Deployment Steps

1. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy create-moderator
   ```

2. **Set Environment Variables (if needed):**
   ```bash
   supabase secrets set SUPABASE_URL=your_supabase_url
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Verify Deployment:**
   ```bash
   supabase functions list
   ```

## Testing the Function

You can test the function using curl:

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/create-moderator' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "moderator@example.com",
    "password": "password123",
    "full_name": "Test Moderator"
  }'
```

## Troubleshooting

1. **Function not found:** Make sure the function is deployed correctly
2. **Permission denied:** Check that the user has admin role
3. **Database errors:** Verify the database schema is up to date

## Security Notes

- The function uses the service role key for admin operations
- Only users with admin role can create moderators
- Passwords are handled securely through Supabase Auth
