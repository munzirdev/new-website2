-- إنشاء جدول إعدادات بوت التلقرام
CREATE TABLE IF NOT EXISTS telegram_config (
    id SERIAL PRIMARY KEY,
    bot_token TEXT NOT NULL,
    admin_chat_id TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_telegram_config_enabled ON telegram_config(is_enabled);

-- إدراج إعدادات افتراضية
INSERT INTO telegram_config (bot_token, admin_chat_id, is_enabled) 
VALUES ('', '', false)
ON CONFLICT DO NOTHING;

-- إنشاء دالة لتحديث timestamp
CREATE OR REPLACE FUNCTION update_telegram_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث timestamp تلقائياً
CREATE TRIGGER update_telegram_config_updated_at
    BEFORE UPDATE ON telegram_config
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_config_updated_at();

-- منح الصلاحيات للمستخدمين
GRANT SELECT, INSERT, UPDATE ON telegram_config TO authenticated;
GRANT USAGE ON SEQUENCE telegram_config_id_seq TO authenticated;
