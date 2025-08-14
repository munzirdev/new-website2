# دليل سريع لإعداد البريد الإلكتروني

## 🚀 الإعداد السريع

### 1. إعدادات Supabase Dashboard

1. **اذهب إلى Supabase Dashboard**
   - افتح [supabase.com/dashboard](https://supabase.com/dashboard)
   - اختر مشروعك

2. **إعدادات المصادقة**
   - اذهب إلى **Settings** > **Auth** > **General**
   - فعّل **Enable email confirmations**
   - عيّن **Site URL** إلى: `https://tevasul.group`

3. **إعدادات SMTP**
   - اذهب إلى **Settings** > **Auth** > **Email Templates**
   - فعّل **Custom SMTP**
   - أدخل المعلومات التالية:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
Encryption: STARTTLS
```

### 2. إعداد Gmail

1. **إنشاء كلمة مرور للتطبيق**
   - اذهب إلى [myaccount.google.com](https://myaccount.google.com)
   - اختر **Security**
   - فعّل **2-Step Verification** (إذا لم تكن مفعلة)
   - اذهب إلى **App passwords**
   - أنشئ كلمة مرور جديدة للتطبيق
   - استخدم هذه الكلمة في حقل **SMTP Pass**

### 3. تشغيل ملف SQL

1. **في Supabase Dashboard**
   - اذهب إلى **SQL Editor**
   - انسخ محتوى ملف `enable-email-verification.sql`
   - شغّل الكود
   - استبدل `your-email@gmail.com` و `your-app-password` بالقيم الصحيحة

### 4. نشر Edge Functions

```bash
# نشر Edge Functions
supabase functions deploy send-verification-email
supabase functions deploy resend-verification
```

### 5. اختبار النظام

1. **إنشاء حساب تجريبي**
   - اذهب إلى موقعك
   - أنشئ حساب جديد
   - تحقق من وصول بريد التحقق

2. **اختبار إعادة الإرسال**
   - اذهب إلى `/auth/verify-email`
   - اضغط على "إعادة إرسال بريد التأكيد"

## ⚙️ إعدادات إضافية

### تخصيص قوالب البريد الإلكتروني

في **Supabase Dashboard** > **Auth** > **Email Templates**:

**Confirmation Email:**
```html
<h2>مرحباً بك في Tevasul!</h2>
<p>شكراً لك على التسجيل. يرجى تأكيد بريدك الإلكتروني:</p>
<a href="{{ .ConfirmationURL }}" style="background: #00b4d8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">تأكيد البريد الإلكتروني</a>
<p>إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذا البريد الإلكتروني.</p>
```

### إعدادات النطاق المخصص

إذا كنت تريد استخدام `noreply@tevasul.group`:

1. **إعدادات DNS**
   ```
   SPF: v=spf1 include:_spf.google.com ~all
   DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@tevasul.group
   ```

2. **إعدادات SMTP**
   ```
   SMTP Host: mail.tevasul.group
   SMTP User: noreply@tevasul.group
   SMTP Pass: your-domain-password
   ```

## 🔧 استكشاف الأخطاء

### المشاكل الشائعة:

**❌ البريد الإلكتروني لا يصل**
- تحقق من إعدادات SMTP
- تأكد من صحة كلمة مرور التطبيق
- راجع سجلات Supabase

**❌ البريد الإلكتروني في Spam**
- أضف سجلات SPF وDKIM
- تحقق من إعدادات المرسل

**❌ خطأ في الاتصال**
- تحقق من المنفذ (587)
- تأكد من تفعيل STARTTLS

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع سجلات Supabase Dashboard
2. تحقق من إعدادات SMTP
3. اختبر الاتصال يدوياً
4. راجع ملف `EMAIL_SETUP_GUIDE.md` للتفاصيل الكاملة

## ✅ التحقق من الإعداد

بعد الإعداد، تأكد من:

- [ ] تفعيل التحقق بالبريد الإلكتروني في Supabase
- [ ] إعداد SMTP بشكل صحيح
- [ ] تشغيل ملف SQL
- [ ] نشر Edge Functions
- [ ] اختبار إنشاء حساب جديد
- [ ] اختبار إعادة إرسال بريد التحقق
