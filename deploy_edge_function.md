# Deploy Edge Function Fix

## 🔧 **Fix CORS Issues in search-user Edge Function**

The Edge Function has been updated with proper CORS headers. You need to deploy it to Supabase.

### **Step 1: Deploy the Edge Function**

Run this command in your terminal:

```bash
supabase functions deploy search-user
```

### **Step 2: Verify Deployment**

After deployment, test the function:

```bash
curl -X POST https://fctvityawavmuethxxix.supabase.co/functions/v1/search-user \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### **Step 3: Check Function Status**

```bash
supabase functions list
```

## 🚀 **Next Steps**

After deploying the Edge Function:

1. **Run the SQL scripts** in this order:
   - `fix_user_profiles_old_references.sql`
   - `fix_moderators_table_issues.sql`
   - `fix_profiles_rls_final.sql`

2. **Test the moderator addition** again

3. **Check the console** for any remaining errors

## 📋 **What Was Fixed**

- ✅ **CORS Headers**: Added proper CORS configuration
- ✅ **Error Handling**: Improved error responses
- ✅ **Service Role**: Using correct service role key
- ✅ **Response Status**: Proper HTTP status codes
