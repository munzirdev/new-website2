# حل سريع لمشكلة نموذج العودة الطوعية

## المشكلة
```
POST https://fctvityawavmuethxxix.supabase.co/rest/v1/voluntary_return_forms?select=* 404 (Not Found)
Could not find the table 'public.voluntary_return_forms' in the schema cache
```

## الحل السريع (5 دقائق)

### الخطوة 1: اذهب إلى Supabase Dashboard
1. افتح: https://supabase.com/dashboard
2. سجل الدخول
3. اختر مشروع `fctvityawavmuethxxix`

### الخطوة 2: إنشاء الجدول
1. اذهب إلى **"SQL Editor"** (من القائمة الجانبية)
2. اضغط **"New query"**
3. انسخ والصق هذا الكود:

```sql
-- إنشاء جدول نماذج العودة الطوعية
CREATE TABLE IF NOT EXISTS public.voluntary_return_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_tr TEXT NOT NULL,
    full_name_ar TEXT NOT NULL,
    kimlik_no TEXT NOT NULL,
    sinir_kapisi TEXT NOT NULL,
    gsm TEXT,
    request_date DATE DEFAULT CURRENT_DATE,
    custom_date DATE,
    refakat_entries JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل الأمان
ALTER TABLE public.voluntary_return_forms ENABLE ROW LEVEL SECURITY;

-- إضافة السياسات
CREATE POLICY "Users can insert their own forms" ON public.voluntary_return_forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own forms" ON public.voluntary_return_forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all forms" ON public.voluntary_return_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@tevasul.group'
        )
    );

-- إعطاء الصلاحيات
GRANT ALL ON public.voluntary_return_forms TO authenticated;
GRANT ALL ON public.voluntary_return_forms TO anon;
```

4. اضغط **"Run"**

### الخطوة 3: التحقق
1. اذهب إلى **"Table Editor"**
2. تأكد من وجود جدول `voluntary_return_forms`

### الخطوة 4: اختبار التطبيق
1. أعد تشغيل التطبيق: `npm run dev`
2. اذهب إلى نموذج العودة الطوعية
3. اضغط "اختبار الاتصال"
4. جرب حفظ نموذج

## إذا لم تعمل الطريقة السابقة

### الطريقة البديلة:
1. اذهب إلى **"Table Editor"**
2. اضغط **"New table"**
3. اسم الجدول: `voluntary_return_forms`
4. أضف الأعمدة التالية:

| العمود | النوع | الخصائص |
|--------|-------|---------|
| id | uuid | Primary Key, Default: gen_random_uuid() |
| user_id | uuid | Foreign Key -> auth.users.id |
| full_name_tr | text | NOT NULL |
| full_name_ar | text | NOT NULL |
| kimlik_no | text | NOT NULL |
| sinir_kapisi | text | NOT NULL |
| gsm | text | |
| request_date | date | Default: CURRENT_DATE |
| custom_date | date | |
| refakat_entries | jsonb | Default: '[]' |
| created_at | timestamptz | Default: NOW() |
| updated_at | timestamptz | Default: NOW() |

5. فعّل **"Row Level Security (RLS)"**
6. أضف السياسات المطلوبة

## رسائل الخطأ المتوقعة وحلولها

### ❌ "الجدول غير موجود"
**الحل:** اتبع الخطوات أعلاه لإنشاء الجدول

### ❌ "خطأ في الصلاحيات"
**الحل:** تأكد من تفعيل RLS وإضافة السياسات

### ❌ "خطأ في المصادقة"
**الحل:** أعد تسجيل الدخول في التطبيق

## التحقق من الحل

### في Console (F12):
```
✅ الاتصال بقاعدة البيانات يعمل بشكل صحيح
✅ تم حفظ النموذج بنجاح
```

### في Supabase Dashboard:
- جدول `voluntary_return_forms` موجود
- RLS مفعل
- السياسات موجودة

## ملاحظات مهمة

- ✅ **يجب إنشاء الجدول مرة واحدة فقط**
- ✅ **السياسات ضرورية للأمان**
- ✅ **RLS يجب أن يكون مفعلاً**
- ✅ **أعد تشغيل التطبيق بعد إنشاء الجدول**

## إذا استمرت المشكلة

1. تحقق من اسم الجدول (بدون أخطاء إملائية)
2. تأكد من أن الجدول في schema `public`
3. تحقق من الصلاحيات
4. تواصل مع الدعم مع رسالة الخطأ الكاملة
