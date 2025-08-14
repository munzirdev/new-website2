-- حل سريع لمشكلة الصلاحيات في Supabase
-- انسخ هذا الكود والصقه في SQL Editor

-- 1. إعطاء الصلاحيات الأساسية
GRANT ALL ON public.voluntary_return_forms TO authenticated;
GRANT ALL ON public.voluntary_return_forms TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. إعطاء صلاحيات لجدول auth.users
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- 3. التأكد من تفعيل RLS
ALTER TABLE public.voluntary_return_forms ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات بسيطة (للتجربة)
DROP POLICY IF EXISTS "Allow read for all" ON public.voluntary_return_forms;
DROP POLICY IF EXISTS "Allow insert for all" ON public.voluntary_return_forms;
DROP POLICY IF EXISTS "Allow update for all" ON public.voluntary_return_forms;

CREATE POLICY "Allow read for all" ON public.voluntary_return_forms
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON public.voluntary_return_forms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all" ON public.voluntary_return_forms
    FOR UPDATE USING (true);

-- 5. التحقق من الصلاحيات
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'voluntary_return_forms';

-- 6. اختبار الاستعلام
SELECT COUNT(*) FROM public.voluntary_return_forms;
