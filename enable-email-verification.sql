-- تفعيل التحقق بالبريد الإلكتروني في Supabase
-- هذا الملف يحتوي على الإعدادات المطلوبة لتفعيل التحقق بالبريد الإلكتروني

-- 1. إضافة عمود email_verified إلى جدول user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- تحديث البيانات الموجودة
UPDATE public.user_profiles 
SET email_verified = true 
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL
);

-- 2. إنشاء دالة للتحقق من حالة التحقق بالبريد الإلكتروني
CREATE OR REPLACE FUNCTION check_email_verification_status(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إنشاء دالة لتحديث حالة التحقق بالبريد الإلكتروني
CREATE OR REPLACE FUNCTION update_email_verification_status(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = now()
  WHERE id = user_id 
  AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إنشاء trigger لتحديث الملف الشخصي عند تأكيد البريد الإلكتروني
CREATE OR REPLACE FUNCTION on_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث الملف الشخصي عند تأكيد البريد الإلكتروني
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles 
    SET 
      email_verified = true,
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger
DROP TRIGGER IF EXISTS on_email_confirmed_trigger ON auth.users;
CREATE TRIGGER on_email_confirmed_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION on_email_confirmed();

-- 5. إنشاء سياسة للتحقق من التحقق بالبريد الإلكتروني
CREATE POLICY "Users can only access verified accounts" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (
    email_verified = true 
    OR auth.uid() = id
  );

-- 6. إنشاء دالة لإرسال بريد التحقق
CREATE OR REPLACE FUNCTION send_verification_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- البحث عن المستخدم
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- التحقق من عدم تأكيد البريد الإلكتروني مسبقاً
  IF user_record.email_confirmed_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- إرسال بريد التحقق (سيتم التعامل معه من خلال Supabase Auth)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. إنشاء جدول لتتبع محاولات إرسال البريد الإلكتروني
CREATE TABLE IF NOT EXISTS public.email_send_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'verification', 'password_reset', etc.
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_email_send_logs_user_id ON public.email_send_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_email ON public.email_send_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_sent_at ON public.email_send_logs(sent_at);

-- 8. إنشاء دالة لتسجيل إرسال البريد الإلكتروني
CREATE OR REPLACE FUNCTION log_email_send(
  p_user_id UUID,
  p_email TEXT,
  p_type TEXT,
  p_status TEXT DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.email_send_logs (
    user_id, 
    email, 
    type, 
    status, 
    error_message
  ) VALUES (
    p_user_id,
    p_email,
    p_type,
    p_status,
    p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. إنشاء دالة للتحقق من معدل إرسال البريد الإلكتروني
CREATE OR REPLACE FUNCTION check_email_rate_limit(user_email TEXT, max_attempts INTEGER DEFAULT 5, time_window_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.email_send_logs
  WHERE email = user_email
  AND sent_at > now() - INTERVAL '1 minute' * time_window_minutes;
  
  RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. إنشاء سياسات RLS لجدول سجلات البريد الإلكتروني
ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs" ON public.email_send_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage email logs" ON public.email_send_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 11. إنشاء دالة للحصول على إحصائيات البريد الإلكتروني
CREATE OR REPLACE FUNCTION get_email_stats(user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_sent BIGINT,
  successful_sends BIGINT,
  failed_sends BIGINT,
  last_sent_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as successful_sends,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_sends,
    MAX(sent_at) as last_sent_at
  FROM public.email_send_logs
  WHERE (user_id IS NULL OR email_send_logs.user_id = get_email_stats.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. إنشاء دالة لتنظيف السجلات القديمة
CREATE OR REPLACE FUNCTION cleanup_old_email_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.email_send_logs
  WHERE sent_at < now() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. إنشاء دالة لإنشاء ملف شخصي جديد مع التحقق من البريد الإلكتروني
CREATE OR REPLACE FUNCTION create_user_profile_with_verification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    email_verified,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email_confirmed_at IS NOT NULL,
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لإنشاء الملف الشخصي مع التحقق
DROP TRIGGER IF EXISTS create_user_profile_with_verification_trigger ON auth.users;
CREATE TRIGGER create_user_profile_with_verification_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_with_verification();

-- 14. إنشاء دالة لتحديث حالة التحقق عند تأكيد البريد الإلكتروني
CREATE OR REPLACE FUNCTION update_verification_status_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث الملف الشخصي عند تأكيد البريد الإلكتروني
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles 
    SET 
      email_verified = true,
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتحديث حالة التحقق
DROP TRIGGER IF EXISTS update_verification_status_trigger ON auth.users;
CREATE TRIGGER update_verification_status_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_status_on_confirm();

-- رسالة نجاح
DO $$
BEGIN
  RAISE NOTICE 'تم تفعيل التحقق بالبريد الإلكتروني بنجاح!';
  RAISE NOTICE 'تأكد من تحديث إعدادات SMTP في Supabase Dashboard';
  RAISE NOTICE 'استخدم ملف EMAIL_SETUP_GUIDE.md للإعدادات المطلوبة';
END $$;
