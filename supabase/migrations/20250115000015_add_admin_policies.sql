-- إضافة سياسات الإدارة لجدول file_attachments بعد إضافة عمود role
-- سياسة خاصة للإدارة: يمكنها رؤية جميع الملفات
CREATE POLICY "Admins can view all file attachments" ON file_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- سياسة خاصة للإدارة: يمكنها إدارة جميع الملفات
CREATE POLICY "Admins can manage all file attachments" ON file_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );
