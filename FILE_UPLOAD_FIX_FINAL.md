# حل مشكلة رفع الملفات - الحل النهائي
# File Upload Fix - Final Solution

## الوضع الحالي (Current Status)

✅ **تم إنشاء السياسات بنجاح** - Policies created successfully
❓ **تحتاج للتحقق من إعدادات bucket** - Need to verify bucket settings

## المشكلة الأصلية (Original Problem)
```
فشل في رفع الملف: mime type application/pdf is not supported
Failed to upload file: mime type application/pdf is not supported
```

## الحل النهائي (Final Solution)

### الخطوة 1: التحقق من إعدادات bucket
### Step 1: Verify bucket settings

قم بتشغيل سكريبت التحقق لمعرفة ما إذا كان PDF مدعوم:

Run the verification script to check if PDF is supported:

```sql
-- محتوى database/verify_bucket_settings.sql
-- Check the bucket configuration
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

-- Check if PDF is in the allowed_mime_types array
SELECT 
  id,
  name,
  'application/pdf' = ANY(allowed_mime_types) as pdf_supported,
  'application/msword' = ANY(allowed_mime_types) as doc_supported,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' = ANY(allowed_mime_types) as docx_supported,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'passport-images';
```

### الخطوة 2: تنظيف السياسات المكررة (إذا لزم الأمر)
### Step 2: Clean up duplicate policies (if needed)

إذا كانت هناك سياسات مكررة أو إذا لم يكن PDF مدعوم، قم بتشغيل سكريبت التنظيف:

If there are duplicate policies or if PDF is not supported, run the cleanup script:

```sql
-- محتوى database/cleanup_bucket_policies.sql
-- This will clean up all policies and ensure PDF support
```

### الخطوة 3: اختبار رفع الملفات
### Step 3: Test file uploads

1. اذهب إلى صفحة التأمين الصحي
   Go to the health insurance page

2. حاول رفع ملف PDF
   Try uploading a PDF file

3. تحقق من أن الملف يتم رفعه بنجاح
   Verify that the file uploads successfully

## التغييرات المطبقة (Applied Changes)

### 1. تحديث واجهة المستخدم (HealthInsurancePage.tsx)
### 1. Updated user interface (HealthInsurancePage.tsx)

✅ تم تحديث الأنواع المدعومة في النص
✅ Updated supported file types in text

✅ تم تحسين رسائل الخطأ لتشمل PDF
✅ Improved error messages to include PDF

✅ تم تحديث `accept` attribute في input الملف
✅ Updated `accept` attribute in file input

✅ تم تحسين التحقق من نوع الملف في drag & drop
✅ Improved file type validation in drag & drop

### 2. إنشاء سكريبتات SQL
### 2. Created SQL scripts

✅ `database/check_bucket_config.sql` - للتحقق من الإعدادات الحالية
✅ `database/check_bucket_config.sql` - to check current configuration

✅ `database/update_passport_images_bucket.sql` - لتحديث bucket
✅ `database/update_passport_images_bucket.sql` - to update bucket

✅ `database/verify_bucket_settings.sql` - للتحقق من دعم PDF
✅ `database/verify_bucket_settings.sql` - to verify PDF support

✅ `database/cleanup_bucket_policies.sql` - لتنظيف السياسات المكررة
✅ `database/cleanup_bucket_policies.sql` - to clean up duplicate policies

### 3. تحديث تكوين Supabase (supabase/config.toml)
### 3. Updated Supabase configuration (supabase/config.toml)

✅ تم إضافة تكوين bucket `passport-images` مع الأنواع المدعومة
✅ Added `passport-images` bucket configuration with supported file types

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

## للتنفيذ (To Execute)

### الطريقة الموصى بها (Recommended Method)

1. **تحقق من الإعدادات الحالية**:
   **Check current settings**:

```sql
-- Run database/verify_bucket_settings.sql
```

2. **إذا لم يكن PDF مدعوم، شغل سكريبت التنظيف**:
   **If PDF is not supported, run cleanup script**:

```sql
-- Run database/cleanup_bucket_policies.sql
```

3. **اختبر رفع ملف PDF**:
   **Test PDF file upload**:

   - اذهب إلى صفحة التأمين الصحي
   - Go to the health insurance page
   - حاول رفع ملف PDF
   - Try uploading a PDF file

## استكشاف الأخطاء (Troubleshooting)

### إذا استمرت المشكلة (If the problem persists)

1. **تحقق من إعدادات bucket**:
   **Check bucket settings**:

```sql
SELECT * FROM storage.buckets WHERE id = 'passport-images';
```

2. **تحقق من السياسات**:
   **Check policies**:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%';
```

3. **تحقق من أن المستخدم مسجل دخول**:
   **Check that the user is authenticated**

4. **تحقق من حجم الملف (يجب أن يكون أقل من 50MB)**:
   **Check file size (should be less than 50MB)**

5. **تحقق من نوع الملف في وحدة التحكم**:
   **Check file type in browser console**

### رسائل الخطأ الشائعة (Common Error Messages)

- `mime type not supported`: تأكد من تشغيل سكريبت التنظيف
- `mime type not supported`: Make sure to run the cleanup script
- `policy violation`: تحقق من السياسات
- `policy violation`: Check the policies
- `file too large`: حجم الملف أكبر من 50MB
- `file too large`: File size is larger than 50MB
- `bucket not found`: تأكد من إنشاء bucket
- `bucket not found`: Make sure the bucket is created

## ملاحظات إضافية (Additional Notes)

- الحد الأقصى لحجم الملف: 50MB
- Maximum file size: 50MB
- جميع الملفات ستكون متاحة للقراءة العامة
- All files will be publicly readable
- المستخدمون المسجلون فقط يمكنهم رفع الملفات
- Only authenticated users can upload files
- يمكن للمستخدمين تحديث وحذف ملفاتهم الخاصة
- Users can update and delete their own files

## الخطوات التالية (Next Steps)

1. شغل سكريبت التحقق `database/verify_bucket_settings.sql`
   Run the verification script `database/verify_bucket_settings.sql`

2. إذا لم يكن PDF مدعوم، شغل سكريبت التنظيف `database/cleanup_bucket_policies.sql`
   If PDF is not supported, run the cleanup script `database/cleanup_bucket_policies.sql`

3. اختبر رفع ملف PDF في التطبيق
   Test uploading a PDF file in the application

4. إذا استمرت المشكلة، تحقق من وحدة التحكم للحصول على رسائل خطأ مفصلة
   If the problem persists, check the console for detailed error messages
