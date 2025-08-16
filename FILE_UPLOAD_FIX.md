# حل مشكلة رفع الملفات - File Upload Fix

## المشكلة (Problem)
```
فشل في رفع الملف: mime type application/pdf is not supported
Failed to upload file: mime type application/pdf is not supported
```

## السبب (Cause)
المشكلة هي أن bucket التخزين `passport-images` في Supabase لا يدعم نوع الملف PDF أو لم يتم تكوينه بشكل صحيح.

The issue is that the `passport-images` storage bucket in Supabase doesn't support PDF file types or isn't configured properly.

## الحل (Solution)

### الخطوة 1: التحقق من الإعدادات الحالية
### Step 1: Check current configuration

أولاً، قم بتشغيل سكريبت التحقق لمعرفة الإعدادات الحالية:

First, run the check script to see the current configuration:

```sql
-- Check if the bucket exists and its current configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'passport-images';
```

### الخطوة 2: تحديث bucket التخزين
### Step 2: Update storage bucket

إذا كان bucket موجود ولكن لا يدعم PDF، قم بتشغيل سكريبت التحديث:

If the bucket exists but doesn't support PDF, run the update script:

```sql
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload passport images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to passport images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own passport images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own passport images" ON storage.objects;

-- Update the passport-images bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'passport-images',
  'passport-images',
  true,
  52428800, -- 50MB in bytes
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload passport images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'passport-images');

-- Create storage policy to allow public read access to passport images
CREATE POLICY "Allow public read access to passport images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'passport-images');

-- Create storage policy to allow users to update their own files
CREATE POLICY "Allow users to update their own passport images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'passport-images')
WITH CHECK (bucket_id = 'passport-images');

-- Create storage policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own passport images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'passport-images');
```

### الخطوة 3: التحقق من التحديث
### Step 3: Verify the update

بعد التحديث، تحقق من أن الإعدادات تم تطبيقها بشكل صحيح:

After the update, verify that the settings were applied correctly:

```sql
-- Verify the bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'passport-images';
```

### الخطوة 4: اختبار رفع الملفات
### Step 4: Test file uploads

1. اذهب إلى صفحة التأمين الصحي
   Go to the health insurance page

2. حاول رفع ملف PDF أو صورة
   Try uploading a PDF file or image

3. تحقق من أن الملف يتم رفعه بنجاح
   Verify that the file uploads successfully

## التغييرات المطبقة (Applied Changes)

### 1. تحديث تكوين Supabase (supabase/config.toml)
### 1. Updated Supabase configuration (supabase/config.toml)

- تم إضافة تكوين bucket `passport-images` مع الأنواع المدعومة
- Added `passport-images` bucket configuration with supported file types
- تم تعيين الحد الأقصى لحجم الملف إلى 50MB
- Set maximum file size to 50MB
- تم إضافة دعم لـ PDF, DOC, DOCX بالإضافة إلى الصور
- Added support for PDF, DOC, DOCX in addition to images

### 2. إنشاء سكريبتات SQL محدثة
### 2. Created updated SQL scripts

- `database/check_bucket_config.sql` - للتحقق من الإعدادات الحالية
- `database/check_bucket_config.sql` - to check current configuration
- `database/update_passport_images_bucket.sql` - لتحديث bucket مع معالجة السياسات الموجودة
- `database/update_passport_images_bucket.sql` - to update bucket handling existing policies

### 3. تحديث واجهة المستخدم (HealthInsurancePage.tsx)
### 3. Updated user interface (HealthInsurancePage.tsx)

- تم تحديث الأنواع المدعومة في النص
- Updated supported file types in text
- تم تحسين رسائل الخطأ لتشمل PDF
- Improved error messages to include PDF
- تم تحديث `accept` attribute في input الملف
- Updated `accept` attribute in file input
- تم تحسين التحقق من نوع الملف في drag & drop
- Improved file type validation in drag & drop

## الأنواع المدعومة (Supported File Types)

### الصور (Images)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### المستندات (Documents)
- PDF (.pdf)
- Microsoft Word (.doc)
- Microsoft Word (.docx)

## ملاحظات إضافية (Additional Notes)

- الحد الأقصى لحجم الملف: 50MB
- Maximum file size: 50MB
- جميع الملفات ستكون متاحة للقراءة العامة
- All files will be publicly readable
- المستخدمون المسجلون فقط يمكنهم رفع الملفات
- Only authenticated users can upload files
- يمكن للمستخدمين تحديث وحذف ملفاتهم الخاصة
- Users can update and delete their own files

## للتنفيذ (To Execute)

### الطريقة الأولى: استخدام السكريبت المحدث (Recommended)
### Method 1: Use the updated script (Recommended)

1. افتح Supabase Dashboard
   Open Supabase Dashboard

2. اذهب إلى SQL Editor
   Go to SQL Editor

3. انسخ والصق محتوى ملف `database/update_passport_images_bucket.sql`
   Copy and paste the content of `database/update_passport_images_bucket.sql`

4. اضغط على "Run" لتنفيذ الأوامر
   Click "Run" to execute the commands

5. تحقق من النتائج للتأكد من تحديث bucket بنجاح
   Check the results to confirm bucket update was successful

### الطريقة الثانية: التحقق أولاً ثم التحديث
### Method 2: Check first then update

1. شغل سكريبت التحقق أولاً:
   Run the check script first:

```sql
-- محتوى database/check_bucket_config.sql
```

2. إذا كان bucket موجود ولكن لا يدعم PDF، شغل سكريبت التحديث
   If the bucket exists but doesn't support PDF, run the update script

3. اختبر رفع ملف PDF في التطبيق
   Test uploading a PDF file in the application

## استكشاف الأخطاء (Troubleshooting)

### رسائل الخطأ الشائعة (Common Error Messages)

- `policy already exists`: استخدم السكريبت المحدث الذي يحذف السياسات أولاً
- `policy already exists`: Use the updated script that drops policies first
- `bucket not found`: تأكد من إنشاء bucket
- `bucket not found`: Make sure the bucket is created
- `policy violation`: تحقق من سياسات الأمان
- `policy violation`: Check security policies
- `file too large`: حجم الملف أكبر من 50MB
- `file too large`: File size is larger than 50MB
- `mime type not supported`: تأكد من نوع الملف المدعوم
- `mime type not supported`: Make sure file type is supported

### إذا استمرت المشكلة (If the problem persists)

1. تحقق من أن bucket تم تحديثه بنجاح:
   Check that the bucket was updated successfully:

```sql
SELECT * FROM storage.buckets WHERE id = 'passport-images';
```

2. تحقق من السياسات:
   Check the policies:

```sql
SELECT * FROM storage.policies WHERE bucket_id = 'passport-images';
```

3. تحقق من أن المستخدم مسجل دخول:
   Check that the user is authenticated

4. تحقق من حجم الملف (يجب أن يكون أقل من 50MB):
   Check file size (should be less than 50MB)

5. تحقق من نوع الملف في وحدة التحكم:
   Check file type in browser console
