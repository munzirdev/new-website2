-- إنشاء جدول chat_messages لتخزين رسائل الشات بوت
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot', 'admin')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع حسب session_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- إنشاء فهرس للبحث السريع حسب created_at
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- إنشاء فهرس للبحث السريع حسب sender
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);

-- إعداد RLS (Row Level Security)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: يمكن للجميع قراءة الرسائل (للشات بوت العام)
CREATE POLICY "Anyone can read chat messages" ON chat_messages
  FOR SELECT USING (true);

-- سياسة للإدراج: يمكن للجميع إدراج رسائل جديدة
CREATE POLICY "Anyone can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- سياسة للتحديث: يمكن للجميع تحديث الرسائل
CREATE POLICY "Anyone can update chat messages" ON chat_messages
  FOR UPDATE USING (true);

-- سياسة للحذف: يمكن للجميع حذف الرسائل
CREATE POLICY "Anyone can delete chat messages" ON chat_messages
  FOR DELETE USING (true);

-- إضافة تعليقات للجدول
COMMENT ON TABLE chat_messages IS 'جدول لتخزين رسائل الشات بوت';
COMMENT ON COLUMN chat_messages.id IS 'معرف فريد للرسالة (UUID)';
COMMENT ON COLUMN chat_messages.content IS 'محتوى الرسالة';
COMMENT ON COLUMN chat_messages.sender IS 'مرسل الرسالة (user, bot, admin)';
COMMENT ON COLUMN chat_messages.session_id IS 'معرف جلسة المحادثة';
COMMENT ON COLUMN chat_messages.created_at IS 'تاريخ ووقت إنشاء الرسالة';
