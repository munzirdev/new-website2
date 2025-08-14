# دليل إنشاء جدول voluntary_return_forms

## المشكلة
```
POST https://fctvityawavmuethxxix.supabase.co/rest/v1/voluntary_return_forms?select=* 404 (Not Found)
Could not find the table 'public.voluntary_return_forms' in the schema cache
```

## الحل: إنشاء الجدول في Supabase

### الطريقة 1: استخدام Supabase Dashboard (الأسهل)

#### الخطوات:
1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard
   - سجل الدخول بحسابك

2. **اختر مشروعك:**
   - ابحث عن مشروع `fctvityawavmuethxxix`
   - اضغط عليه

3. **اذهب إلى SQL Editor:**
   - من القائمة الجانبية، اضغط على **"SQL Editor"**
   - اضغط **"New query"**

4. **انسخ والصق الكود التالي:**
   ```sql
   -- Create voluntary_return_forms table
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

   -- Create index for better query performance
   CREATE INDEX IF NOT EXISTS idx_voluntary_return_forms_user_id ON public.voluntary_return_forms(user_id);
   CREATE INDEX IF NOT EXISTS idx_voluntary_return_forms_created_at ON public.voluntary_return_forms(created_at);

   -- Enable RLS (Row Level Security)
   ALTER TABLE public.voluntary_return_forms ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view their own forms" ON public.voluntary_return_forms
       FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own forms" ON public.voluntary_return_forms
       FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own forms" ON public.voluntary_return_forms
       FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own forms" ON public.voluntary_return_forms
       FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Admins can view all forms" ON public.voluntary_return_forms
       FOR SELECT USING (
           EXISTS (
               SELECT 1 FROM auth.users 
               WHERE auth.users.id = auth.uid() 
               AND auth.users.email = 'admin@tevasul.group'
           )
       );

   CREATE POLICY "Admins can insert forms" ON public.voluntary_return_forms
       FOR INSERT WITH CHECK (
           EXISTS (
               SELECT 1 FROM auth.users 
               WHERE auth.users.id = auth.uid() 
               AND auth.users.email = 'admin@tevasul.group'
           )
       );

   CREATE POLICY "Admins can update all forms" ON public.voluntary_return_forms
       FOR UPDATE USING (
           EXISTS (
               SELECT 1 FROM auth.users 
               WHERE auth.users.id = auth.uid() 
               AND auth.users.email = 'admin@tevasul.group'
           )
       );

   CREATE POLICY "Admins can delete all forms" ON public.voluntary_return_forms
       FOR DELETE USING (
           EXISTS (
               SELECT 1 FROM auth.users 
               WHERE auth.users.id = auth.uid() 
               AND auth.users.email = 'admin@tevasul.group'
           )
       );

   -- Create function to update updated_at timestamp
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql';

   -- Create trigger to automatically update updated_at
   DROP TRIGGER IF EXISTS update_voluntary_return_forms_updated_at ON public.voluntary_return_forms;
   CREATE TRIGGER update_voluntary_return_forms_updated_at 
       BEFORE UPDATE ON public.voluntary_return_forms 
       FOR EACH ROW 
       EXECUTE FUNCTION update_updated_at_column();

   -- Grant permissions to authenticated users
   GRANT ALL ON public.voluntary_return_forms TO authenticated;
   GRANT USAGE ON SCHEMA public TO authenticated;

   -- Grant permissions to anon users (for basic access)
   GRANT SELECT ON public.voluntary_return_forms TO anon;
   GRANT INSERT ON public.voluntary_return_forms TO anon;
   GRANT UPDATE ON public.voluntary_return_forms TO anon;
   GRANT DELETE ON public.voluntary_return_forms TO anon;
   GRANT USAGE ON SCHEMA public TO anon;
   ```

5. **اضغط "Run" لتنفيذ الكود**

6. **تحقق من إنشاء الجدول:**
   - اذهب إلى **"Table Editor"**
   - يجب أن ترى جدول `voluntary_return_forms`

### الطريقة 2: استخدام Table Editor

#### الخطوات:
1. **اذهب إلى Table Editor:**
   - من القائمة الجانبية، اضغط على **"Table Editor"**

2. **إنشاء جدول جديد:**
   - اضغط **"New table"**
   - اسم الجدول: `voluntary_return_forms`

3. **إضافة الأعمدة:**
   ```
   id: uuid (Primary Key, Default: gen_random_uuid())
   user_id: uuid (Foreign Key -> auth.users.id)
   full_name_tr: text (NOT NULL)
   full_name_ar: text (NOT NULL)
   kimlik_no: text (NOT NULL)
   sinir_kapisi: text (NOT NULL)
   gsm: text
   request_date: date (Default: CURRENT_DATE)
   custom_date: date
   refakat_entries: jsonb (Default: '[]')
   created_at: timestamptz (Default: NOW())
   updated_at: timestamptz (Default: NOW())
   ```

4. **تفعيل RLS:**
   - اضغط على الجدول
   - اذهب إلى **"Settings"**
   - فعّل **"Row Level Security (RLS)"**

5. **إضافة السياسات:**
   - اذهب إلى **"Policies"**
   - أضف السياسات المطلوبة

### الطريقة 3: استخدام Supabase CLI

#### الخطوات:
1. **تثبيت Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **تسجيل الدخول:**
   ```bash
   supabase login
   ```

3. **ربط المشروع:**
   ```bash
   supabase link --project-ref fctvityawavmuethxxix
   ```

4. **تنفيذ المايجريشن:**
   ```bash
   supabase db push
   ```

## التحقق من إنشاء الجدول

### في Supabase Dashboard:
1. اذهب إلى **"Table Editor"**
2. ابحث عن جدول `voluntary_return_forms`
3. تأكد من وجود جميع الأعمدة

### في SQL Editor:
```sql
-- التحقق من وجود الجدول
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'voluntary_return_forms'
);

-- عرض هيكل الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'voluntary_return_forms'
ORDER BY ordinal_position;

-- التحقق من السياسات
SELECT * FROM pg_policies 
WHERE tablename = 'voluntary_return_forms';
```

## اختبار الجدول

### بعد إنشاء الجدول:
1. **أعد تشغيل التطبيق:**
   ```bash
   npm run dev
   ```

2. **اختبر الاتصال:**
   - اذهب إلى نموذج العودة الطوعية
   - اضغط "اختبار الاتصال"

3. **جرب حفظ نموذج:**
   - املأ النموذج
   - اضغط "حفظ النموذج"

## ملاحظات مهمة

- ✅ **يجب إنشاء الجدول مرة واحدة فقط**
- ✅ **السياسات ضرورية للأمان**
- ✅ **RLS يجب أن يكون مفعلاً**
- ✅ **الصلاحيات يجب أن تكون صحيحة**

## إذا استمرت المشكلة

1. **تحقق من اسم الجدول:**
   - تأكد من أنه `voluntary_return_forms` (بدون أخطاء إملائية)

2. **تحقق من Schema:**
   - تأكد من أن الجدول في schema `public`

3. **تحقق من الصلاحيات:**
   - تأكد من أن المستخدم لديه صلاحيات كافية

4. **تحقق من RLS:**
   - تأكد من أن السياسات تعمل بشكل صحيح
