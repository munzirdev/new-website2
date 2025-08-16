-- =====================================================
-- سياسات بكت passport-images (آمنة)
-- =====================================================
-- هذا الملف يتحقق من وجود السياسات قبل إنشائها

-- 1. السماح بالقراءة العامة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow public read access to passport images' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow public read access to passport images" ON storage.objects
        FOR SELECT USING (bucket_id = 'passport-images');
        RAISE NOTICE 'تم إنشاء سياسة القراءة العامة';
    ELSE
        RAISE NOTICE 'سياسة القراءة العامة موجودة بالفعل';
    END IF;
END $$;

-- 2. السماح للمستخدمين المسجلين برفع الملفات
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow authenticated uploads to passport images' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow authenticated uploads to passport images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'passport-images' 
            AND auth.role() = 'authenticated'
        );
        RAISE NOTICE 'تم إنشاء سياسة رفع المستخدمين المسجلين';
    ELSE
        RAISE NOTICE 'سياسة رفع المستخدمين المسجلين موجودة بالفعل';
    END IF;
END $$;

-- 3. السماح للمستخدمين المسجلين بتحديث ملفاتهم
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow authenticated updates to passport images' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow authenticated updates to passport images" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'passport-images' 
            AND auth.role() = 'authenticated'
        );
        RAISE NOTICE 'تم إنشاء سياسة تحديث المستخدمين المسجلين';
    ELSE
        RAISE NOTICE 'سياسة تحديث المستخدمين المسجلين موجودة بالفعل';
    END IF;
END $$;

-- 4. السماح للمستخدمين المسجلين بحذف ملفاتهم
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow authenticated deletes to passport images' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow authenticated deletes to passport images" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'passport-images' 
            AND auth.role() = 'authenticated'
        );
        RAISE NOTICE 'تم إنشاء سياسة حذف المستخدمين المسجلين';
    ELSE
        RAISE NOTICE 'سياسة حذف المستخدمين المسجلين موجودة بالفعل';
    END IF;
END $$;

-- 5. السماح للضيوف برفع الملفات (اختياري)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow anonymous uploads to passport images' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow anonymous uploads to passport images" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'passport-images');
        RAISE NOTICE 'تم إنشاء سياسة رفع الضيوف';
    ELSE
        RAISE NOTICE 'سياسة رفع الضيوف موجودة بالفعل';
    END IF;
END $$;

-- =====================================================
-- فحص السياسات المطبقة
-- =====================================================

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_qual,
    CASE 
        WHEN with_check IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%'
ORDER BY policyname;
