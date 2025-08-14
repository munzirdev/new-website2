/*
  # إصلاح سياسات RLS لـ Storage

  1. حذف السياسات الموجودة
  2. إنشاء سياسات جديدة مبسطة
  3. السماح للمستخدمين المسجلين برفع الملفات
  4. السماح للجميع بقراءة الملفات
*/

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete all files" ON storage.objects;

-- إنشاء سياسة بسيطة للرفع - المستخدمون المسجلون فقط
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- إنشاء سياسة للقراءة - الجميع
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'uploads');

-- إنشاء سياسة للحذف - المستخدمون المسجلون فقط لملفاتهم
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- إنشاء سياسة للأدمن للحذف - جميع الملفات
CREATE POLICY "Allow admins to delete all files" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'uploads' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = (auth.jwt() ->> 'email')
  )
);

-- إنشاء جدول file_attachments لحفظ الملفات كـ Base64
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_data TEXT NOT NULL, -- Base64 encoded file data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_file_attachments_user_id ON file_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);

-- إنشاء RLS (Row Level Security)
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- سياسة الأمان: المستخدم يمكنه رؤية ملفاته فقط
CREATE POLICY "Users can view their own file attachments" ON file_attachments
    FOR SELECT USING (auth.uid() = user_id);

-- سياسة الأمان: المستخدم يمكنه إضافة ملفاته فقط
CREATE POLICY "Users can insert their own file attachments" ON file_attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسة الأمان: المستخدم يمكنه تحديث ملفاته فقط
CREATE POLICY "Users can update their own file attachments" ON file_attachments
    FOR UPDATE USING (auth.uid() = user_id);

-- سياسة الأمان: المستخدم يمكنه حذف ملفاته فقط
CREATE POLICY "Users can delete their own file attachments" ON file_attachments
    FOR DELETE USING (auth.uid() = user_id);

-- سياسة خاصة للإدارة: يمكنها رؤية جميع الملفات
CREATE POLICY "Admins can view all file attachments" ON file_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_attachments_updated_at();

-- إضافة حقل file_data إلى جدول service_requests لحفظ الملفات كـ Base64
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS file_data TEXT;
