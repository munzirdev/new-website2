# Health Insurance Age and Birth Date Fix

## المشكلة (Problem)
في صفحة إدارة التأمين الصحي، لا تظهر عمر العميل وتاريخ ميلاده في جدول الطلبات.

In the health insurance management page, the customer's age and birth date are not showing in the requests table.

## السبب (Cause)
السبب هو أن أعمدة `customer_age` و `birth_date` غير موجودة في جدول قاعدة البيانات `health_insurance_requests`.

The issue is that the `customer_age` and `birth_date` columns are missing from the `health_insurance_requests` database table.

## الحل (Solution)

### الخطوة 1: إضافة الأعمدة المفقودة إلى قاعدة البيانات
### Step 1: Add the missing columns to the database

قم بتشغيل السكريبت التالي في محرر SQL الخاص بـ Supabase:

Run the following script in your Supabase SQL editor:

```sql
-- Add customer_age column (integer, nullable)
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS customer_age INTEGER;

-- Add birth_date column (date, nullable)
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN health_insurance_requests.customer_age IS 'Customer age calculated from birth date or entered manually';
COMMENT ON COLUMN health_insurance_requests.birth_date IS 'Customer birth date for age calculation and verification';
```

### الخطوة 2: التحقق من إضافة الأعمدة
### Step 2: Verify the columns were added

```sql
-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'health_insurance_requests' 
AND column_name IN ('customer_age', 'birth_date');
```

### الخطوة 3: اختبار الوظيفة
### Step 3: Test the functionality

1. اذهب إلى صفحة التأمين الصحي
   Go to the health insurance page

2. املأ النموذج مع تاريخ الميلاد
   Fill out the form with a birth date

3. أرسل الطلب
   Submit the request

4. اذهب إلى صفحة إدارة التأمين الصحي
   Go to the health insurance management page

5. تحقق من أن العمر وتاريخ الميلاد يظهران في جدول الطلبات
   Verify that age and birth date appear in the requests table

## التغييرات المطبقة (Applied Changes)

### 1. تحديث نموذج إرسال الطلب (HealthInsurancePage.tsx)
### 1. Updated request submission form (HealthInsurancePage.tsx)

- تم إضافة `customer_age` و `birth_date` إلى بيانات الطلب المرسلة إلى قاعدة البيانات
- Added `customer_age` and `birth_date` to the request data sent to the database
- تم إضافة معالجة الأخطاء في حالة عدم وجود الأعمدة في قاعدة البيانات
- Added error handling in case the columns don't exist in the database

### 2. إنشاء سكريبت SQL لإضافة الأعمدة
### 2. Created SQL script to add columns

- تم إنشاء ملف `database/add_age_columns.sql` مع الأوامر المطلوبة
- Created `database/add_age_columns.sql` file with the required commands

### 3. إنشاء ملف الهجرة (Migration)
### 3. Created migration file

- تم إنشاء ملف الهجرة `supabase/migrations/20240103000000_add_age_fields_to_health_insurance_requests.sql`
- Created migration file `supabase/migrations/20240103000000_add_age_fields_to_health_insurance_requests.sql`

## ملاحظات إضافية (Additional Notes)

- الكود الآن يتعامل مع الحالة التي قد لا تكون فيها الأعمدة موجودة في قاعدة البيانات
- The code now handles the case where the columns might not exist in the database
- سيتم إرسال الطلب بدون بيانات العمر إذا لم تكن الأعمدة موجودة
- The request will be sent without age data if the columns don't exist
- سيتم عرض رسالة تحذير في وحدة التحكم إذا حدث هذا
- A warning message will be shown in the console if this happens

## للتنفيذ (To Execute)

1. افتح Supabase Dashboard
   Open Supabase Dashboard

2. اذهب إلى SQL Editor
   Go to SQL Editor

3. انسخ والصق محتوى ملف `database/add_age_columns.sql`
   Copy and paste the content of `database/add_age_columns.sql`

4. اضغط على "Run" لتنفيذ الأوامر
   Click "Run" to execute the commands

5. تحقق من النتائج للتأكد من إضافة الأعمدة بنجاح
   Check the results to confirm the columns were added successfully
