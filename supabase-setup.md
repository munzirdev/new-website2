# دليل إعداد Supabase 🔧

## الطريقة الثانية: استخدام Access Token

### 1. الحصول على Access Token:

1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard/project/fctvityawavmuethxxix

2. **اذهب إلى Settings > API:**
   - من القائمة الجانبية اختر **Settings**
   - ثم اختر **API**

3. **انسخ Access Token:**
   - ستجد **Access Token** في قسم **Project API keys**
   - انسخ **service_role** key

### 2. إنشاء ملف .env:

```bash
# Supabase Configuration
SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration
SUPABASE_DB_PASSWORD=your-database-password-here
```

### 3. ربط المشروع:

```bash
# ربط المشروع باستخدام Access Token
supabase link --project-ref fctvityawavmuethxxix --password "your-service-role-key"

# أو استخدام متغير البيئة
set SUPABASE_DB_PASSWORD=your-service-role-key
supabase link --project-ref fctvityawavmuethxxix
```

### 4. رفع الملفات:

```bash
# رفع جميع الملفات
supabase db push

# أو رفع ملف معين
supabase db push --include-all
```

## الطريقة البديلة: Supabase Dashboard

إذا لم تعمل الطريقة الثانية، استخدم Supabase Dashboard:

1. **اذهب إلى SQL Editor:**
   - https://supabase.com/dashboard/project/fctvityawavmuethxxix/sql

2. **انسخ والصق الكود:**
   - انسخ محتوى ملف `create_profiles_table.sql`
   - الصقه في SQL Editor
   - اضغط **Run**

## ملاحظات مهمة:

- تأكد من أن Access Token صحيح
- تأكد من أن المشروع مرتبط بشكل صحيح
- إذا فشل الاتصال، جرب استخدام VPN أو تغيير الشبكة
