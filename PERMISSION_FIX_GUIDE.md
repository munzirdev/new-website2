# دليل حل مشكلة الصلاحيات في Supabase

## المشكلة
```
❌ خطأ في الاتصال: خطأ في الاتصال بقاعدة البيانات: permission denied for table users
```

## الحل: إصلاح الصلاحيات في Supabase

### الخطوة 1: التحقق من إعدادات RLS

#### في Supabase Dashboard:
1. **اذهب إلى Table Editor**
2. **اختر جدول `voluntary_return_forms`**
3. **اذهب إلى تبويب "Policies"**
4. **تأكد من وجود السياسات التالية:**

```sql
-- سياسة للمستخدمين العاديين
CREATE POLICY "Users can insert their own forms" ON public.voluntary_return_forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own forms" ON public.voluntary_return_forms
    FOR SELECT USING (auth.uid() = user_id);

-- سياسة للمديرين
CREATE POLICY "Admins can view all forms" ON public.voluntary_return_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@tevasul.group'
        )
    );
```

### الخطوة 2: إصلاح الصلاحيات الأساسية

#### في SQL Editor، نفذ هذا الكود:

```sql
-- إعطاء الصلاحيات للمستخدمين المصادق عليهم
GRANT ALL ON public.voluntary_return_forms TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- إعطاء الصلاحيات للمستخدمين المجهولين (إذا لزم الأمر)
GRANT SELECT ON public.voluntary_return_forms TO anon;
GRANT INSERT ON public.voluntary_return_forms TO anon;
GRANT UPDATE ON public.voluntary_return_forms TO anon;
GRANT DELETE ON public.voluntary_return_forms TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- إعطاء الصلاحيات لجدول auth.users (إذا كان مطلوباً)
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- التأكد من تفعيل RLS
ALTER TABLE public.voluntary_return_forms ENABLE ROW LEVEL SECURITY;
```

### الخطوة 3: إنشاء سياسات أكثر مرونة (إذا لزم الأمر)

#### إذا استمرت المشكلة، جرب هذه السياسات:

```sql
-- سياسة تسمح بالقراءة للجميع (للتجربة فقط)
CREATE POLICY "Allow read for all" ON public.voluntary_return_forms
    FOR SELECT USING (true);

-- سياسة تسمح بالإدراج للجميع (للتجربة فقط)
CREATE POLICY "Allow insert for all" ON public.voluntary_return_forms
    FOR INSERT WITH CHECK (true);

-- سياسة تسمح بالتحديث للجميع (للتجربة فقط)
CREATE POLICY "Allow update for all" ON public.voluntary_return_forms
    FOR UPDATE USING (true);
```

### الخطوة 4: التحقق من إعدادات المشروع

#### في Supabase Dashboard:
1. **اذهب إلى Settings > API**
2. **تحقق من:**
   - Project URL صحيح
   - Anon Key صحيح
   - Service Role Key (إذا كنت تستخدمه)

### الخطوة 5: اختبار الصلاحيات

#### في SQL Editor، نفذ هذا الاستعلام:

```sql
-- التحقق من الصلاحيات الحالية
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'voluntary_return_forms';

-- التحقق من السياسات
SELECT * FROM pg_policies 
WHERE tablename = 'voluntary_return_forms';

-- اختبار الاستعلام
SELECT * FROM public.voluntary_return_forms LIMIT 1;
```

### الخطوة 6: إصلاح مشكلة جدول users

#### إذا كانت المشكلة في جدول `users`:

```sql
-- إعطاء صلاحيات لجدول auth.users
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- إنشاء سياسة لجدول auth.users (إذا لزم الأمر)
CREATE POLICY "Users can view their own profile" ON auth.users
    FOR SELECT USING (auth.uid() = id);
```

## الحلول البديلة

### الحل 1: تعطيل RLS مؤقتاً (للتجربة فقط)

```sql
-- تعطيل RLS مؤقتاً
ALTER TABLE public.voluntary_return_forms DISABLE ROW LEVEL SECURITY;

-- إعطاء جميع الصلاحيات
GRANT ALL ON public.voluntary_return_forms TO authenticated;
GRANT ALL ON public.voluntary_return_forms TO anon;
```

### الحل 2: استخدام Service Role Key

#### في التطبيق، استخدم Service Role Key بدلاً من Anon Key:

```typescript
// في .env
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

// في الكود
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY! // استخدم Service Role Key
);
```

### الحل 3: إنشاء جدول جديد بدون RLS

```sql
-- إنشاء جدول بدون RLS للتجربة
CREATE TABLE IF NOT EXISTS public.voluntary_return_forms_test (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
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

-- إعطاء جميع الصلاحيات
GRANT ALL ON public.voluntary_return_forms_test TO authenticated;
GRANT ALL ON public.voluntary_return_forms_test TO anon;
```

## التحقق من الحل

### في التطبيق:
1. **أعد تشغيل التطبيق:** `npm run dev`
2. **اذهب إلى نموذج العودة الطوعية**
3. **اضغط "اختبار الاتصال"**
4. **تأكد من عدم ظهور أخطاء الصلاحيات**

### في Console (F12):
```
✅ الاتصال بقاعدة البيانات يعمل بشكل صحيح
✅ تم حفظ النموذج بنجاح
```

## ملاحظات مهمة

- ⚠️ **تعطيل RLS يقلل من الأمان** - استخدمه للتجربة فقط
- ✅ **Service Role Key** يتجاوز جميع قيود RLS
- ✅ **السياسات الصحيحة** ضرورية للأمان
- ✅ **الصلاحيات الأساسية** يجب أن تكون موجودة

## إذا استمرت المشكلة

1. **تحقق من إعدادات المشروع** في Supabase Dashboard
2. **راجع السياسات** وتأكد من صحتها
3. **جرب Service Role Key** للتأكد من أن المشكلة في الصلاحيات
4. **تواصل مع الدعم** مع رسالة الخطأ الكاملة
