-- إصلاح مشكلة رفع الملفات للمستخدمين المسجلين
-- المشكلة: جدول service_requests يشير إلى user_profiles بدلاً من auth.users

-- 1. إصلاح العلاقة الخارجية لجدول service_requests
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

-- إضافة العلاقة الخارجية الصحيحة لتشير إلى auth.users
ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id_auth 
ON service_requests(user_id);

-- 3. التأكد من أن user_profiles مرتبط بـ auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. إصلاح سياسات RLS لجدول service_requests
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can create own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON service_requests;

-- إنشاء سياسات جديدة تعمل مع auth.users
-- المستخدمون يمكنهم إنشاء طلبات جديدة
CREATE POLICY "Users can create own requests"
  ON service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم قراءة طلباتهم فقط
CREATE POLICY "Users can read own requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث طلباتهم فقط
CREATE POLICY "Users can update own requests"
  ON service_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف طلباتهم فقط
CREATE POLICY "Users can delete own requests"
  ON service_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- الأدمن يمكنهم قراءة جميع الطلبات (سيتم إضافتها لاحقاً بعد إضافة عمود role)
-- CREATE POLICY "Admins can read all requests"
--   ON service_requests
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_profiles.id = auth.uid() 
--       AND user_profiles.role = 'admin'
--     )
--   );

-- الأدمن يمكنهم تحديث جميع الطلبات (سيتم إضافتها لاحقاً بعد إضافة عمود role)
-- CREATE POLICY "Admins can update all requests"
--   ON service_requests
--   FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_profiles.id = auth.uid() 
--       AND user_profiles.role = 'admin'
--     )
--   );

-- الأدمن يمكنهم حذف جميع الطلبات (سيتم إضافتها لاحقاً بعد إضافة عمود role)
-- CREATE POLICY "Admins can delete all requests"
--   ON service_requests
--   FOR DELETE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_profiles.id = auth.uid() 
--       AND user_profiles.role = 'admin'
--     )
--   );

-- 5. إصلاح سياسات RLS لجدول file_attachments
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can insert their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can update their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can delete their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Admins can view all file attachments" ON file_attachments;

-- إنشاء سياسات جديدة
-- المستخدمون يمكنهم رؤية ملفاتهم فقط
CREATE POLICY "Users can view their own file attachments" ON file_attachments
    FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة ملفاتهم فقط
CREATE POLICY "Users can insert their own file attachments" ON file_attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث ملفاتهم فقط
CREATE POLICY "Users can update their own file attachments" ON file_attachments
    FOR UPDATE USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف ملفاتهم فقط
CREATE POLICY "Users can delete their own file attachments" ON file_attachments
    FOR DELETE USING (auth.uid() = user_id);

-- الأدمن يمكنهم رؤية جميع الملفات (سيتم إضافتها لاحقاً بعد إضافة عمود role)
-- CREATE POLICY "Admins can view all file attachments" ON file_attachments
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles 
--             WHERE user_profiles.id = auth.uid() 
--             AND user_profiles.role = 'admin'
--         )
--     );

-- الأدمن يمكنهم إدارة جميع الملفات (سيتم إضافتها لاحقاً بعد إضافة عمود role)
-- CREATE POLICY "Admins can manage all file attachments" ON file_attachments
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles 
--             WHERE user_profiles.id = auth.uid() 
--             AND user_profiles.role = 'admin'
--         )
--     );

-- 6. إنشاء دالة لضمان وجود ملف شخصي للمستخدم
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- التحقق من وجود ملف شخصي للمستخدم
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.user_id) THEN
        -- إنشاء ملف شخصي تلقائياً
        INSERT INTO user_profiles (
            id,
            email,
            full_name,
            phone,
            country_code,
            created_at,
            updated_at
        ) VALUES (
            NEW.user_id,
            (SELECT email FROM auth.users WHERE id = NEW.user_id),
            COALESCE((SELECT user_metadata->>'full_name' FROM auth.users WHERE id = NEW.user_id), 'مستخدم جديد'),
            (SELECT user_metadata->>'phone' FROM auth.users WHERE id = NEW.user_id),
            COALESCE((SELECT user_metadata->>'country_code' FROM auth.users WHERE id = NEW.user_id), '+90'),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لضمان وجود ملف شخصي
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON service_requests;
CREATE TRIGGER ensure_user_profile_trigger
    BEFORE INSERT ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();

-- 7. إنشاء trigger مماثل لجدول file_attachments
DROP TRIGGER IF EXISTS ensure_user_profile_file_trigger ON file_attachments;
CREATE TRIGGER ensure_user_profile_file_trigger
    BEFORE INSERT ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();
