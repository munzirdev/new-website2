# دليل إعداد SMTP في Supabase Dashboard

## 🎯 نظرة عامة
هذا الدليل يوضح كيفية إعداد SMTP في Supabase Dashboard لإرسال رسائل التحقق بالبريد الإلكتروني من نطاقك الخاص.

## 📋 المتطلبات الأساسية

### 1. معلومات SMTP للنطاق الخاص بك
تحتاج إلى المعلومات التالية من مزود البريد الإلكتروني:
- **SMTP Host**: عنوان خادم SMTP (مثل: `mail.tevasul.group`)
- **SMTP Port**: منفذ SMTP (عادة 587 أو 465)
- **SMTP User**: اسم المستخدم (مثل: `noreply@tevasul.group`)
- **SMTP Pass**: كلمة المرور
- **Encryption**: نوع التشفير (STARTTLS أو SSL)

### 2. إعدادات DNS للنطاق
- سجلات SPF
- سجلات DKIM (إذا كانت متاحة)
- سجلات DMARC

## 🚀 خطوات الإعداد

### الخطوة 1: الوصول إلى Supabase Dashboard
1. اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **Settings** > **Auth** > **General**

### الخطوة 2: تفعيل التحقق بالبريد الإلكتروني
1. في قسم **Email Auth**، فعّل **Enable email confirmations**
2. عيّن **Site URL** إلى: `https://tevasul.group`
3. أضف **Redirect URLs**:
   ```
   https://tevasul.group/auth/callback
   https://tevasul.group/auth/verify-email
   https://tevasul.group/auth/reset-password
   ```

### الخطوة 3: إعداد SMTP
1. اذهب إلى **Settings** > **Auth** > **Email Templates**
2. فعّل **Custom SMTP**
3. أدخل معلومات SMTP:

#### مثال لإعدادات Gmail:
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
Encryption: STARTTLS
```

#### مثال لإعدادات النطاق المخصص:
```
SMTP Host: mail.tevasul.group
SMTP Port: 587
SMTP User: noreply@tevasul.group
SMTP Pass: your-domain-password
Encryption: STARTTLS
```

### الخطوة 4: تخصيص قوالب البريد الإلكتروني

#### قالب التأكيد (Confirmation Email):
```html
<h2 style="color: #00b4d8; font-size: 24px; margin-bottom: 20px;">مرحباً بك في Tevasul!</h2>
<p style="color: #333; font-size: 16px; margin-bottom: 20px;">شكراً لك على التسجيل. يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:</p>
<a href="{{ .ConfirmationURL }}" style="background: #00b4d8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">تأكيد البريد الإلكتروني</a>
<p style="color: #666; font-size: 14px; margin-top: 20px;">إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذا البريد الإلكتروني.</p>
```

#### قالب إعادة تعيين كلمة المرور (Reset Password):
```html
<h2 style="color: #00b4d8; font-size: 24px; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h2>
<p style="color: #333; font-size: 16px; margin-bottom: 20px;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه:</p>
<a href="{{ .ConfirmationURL }}" style="background: #00b4d8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">إعادة تعيين كلمة المرور</a>
<p style="color: #666; font-size: 14px; margin-top: 20px;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.</p>
```

### الخطوة 5: تشغيل ملف SQL
1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. انسخ محتوى ملف `enable-email-verification.sql`
3. شغّل الكود

### الخطوة 6: نشر Edge Functions
```bash
# نشر Edge Functions
supabase functions deploy send-verification-email
supabase functions deploy resend-verification
```

## 🔧 إعدادات مزودي البريد الإلكتروني الشائعين

### Gmail
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
Encryption: STARTTLS
```

**ملاحظة**: تحتاج لإنشاء كلمة مرور للتطبيق في Gmail:
1. اذهب إلى [myaccount.google.com](https://myaccount.google.com)
2. اختر **Security**
3. فعّل **2-Step Verification**
4. اذهب إلى **App passwords**
5. أنشئ كلمة مرور جديدة للتطبيق

### Outlook/Hotmail
```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587
SMTP User: your-email@outlook.com
SMTP Pass: your-password
Encryption: STARTTLS
```

### Yahoo
```
SMTP Host: smtp.mail.yahoo.com
SMTP Port: 587
SMTP User: your-email@yahoo.com
SMTP Pass: your-app-password
Encryption: STARTTLS
```

### النطاق المخصص (cPanel)
```
SMTP Host: mail.yourdomain.com
SMTP Port: 587
SMTP User: noreply@yourdomain.com
SMTP Pass: your-email-password
Encryption: STARTTLS
```

## 🔍 اختبار الإعدادات

### 1. اختبار الاتصال
1. في Supabase Dashboard، اذهب إلى **Auth** > **Users**
2. اختر مستخدم تجريبي
3. اضغط على **Send verification email**
4. تحقق من وصول البريد الإلكتروني

### 2. اختبار من التطبيق
1. اذهب إلى موقعك
2. أنشئ حساب جديد
3. تحقق من وصول بريد التحقق
4. اضغط على رابط التأكيد

### 3. اختبار إعادة الإرسال
1. اذهب إلى `/auth/verify-email`
2. اضغط على "إعادة إرسال بريد التأكيد"
3. تحقق من وصول البريد الإلكتروني

## 🛠️ استكشاف الأخطاء

### المشاكل الشائعة:

**❌ البريد الإلكتروني لا يصل**
- تحقق من إعدادات SMTP
- تأكد من صحة كلمة المرور
- راجع سجلات Supabase Dashboard

**❌ خطأ في الاتصال بـ SMTP**
- تحقق من المنفذ (587 أو 465)
- تأكد من تفعيل STARTTLS أو SSL
- تحقق من إعدادات الجدار الناري

**❌ البريد الإلكتروني في Spam**
- أضف سجلات SPF وDKIM وDMARC
- تحقق من إعدادات المرسل
- استخدم عنوان بريد إلكتروني موثوق

**❌ خطأ في المصادقة**
- تأكد من صحة اسم المستخدم وكلمة المرور
- تحقق من إعدادات المصادقة الثنائية
- استخدم كلمة مرور للتطبيق إذا كان متاحاً

## 📊 مراقبة الأداء

### 1. سجلات Supabase
- اذهب إلى **Logs** في Supabase Dashboard
- راقب سجلات المصادقة
- تحقق من أخطاء SMTP

### 2. إحصائيات البريد الإلكتروني
```sql
-- عرض إحصائيات البريد الإلكتروني
SELECT * FROM get_email_stats();

-- عرض سجلات البريد الإلكتروني للمستخدم
SELECT * FROM email_send_logs WHERE user_id = 'user-id-here';
```

### 3. تنظيف السجلات القديمة
```sql
-- تنظيف السجلات الأقدم من 30 يوماً
SELECT cleanup_old_email_logs(30);
```

## 🔒 الأمان

### أفضل الممارسات:
1. استخدم كلمات مرور قوية للتطبيق
2. فعّل المصادقة الثنائية
3. راجع سجلات البريد الإلكتروني بانتظام
4. استخدم نطاق فرعي للبريد الإلكتروني
5. أضف سجلات DNS للأمان

### إعدادات DNS المطلوبة:
```
SPF: v=spf1 include:_spf.google.com ~all
DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع سجلات Supabase Dashboard
2. تحقق من إعدادات SMTP
3. اختبر الاتصال يدوياً
4. راجع ملف `EMAIL_SETUP_GUIDE.md` للتفاصيل الكاملة
5. تواصل مع دعم مزود البريد الإلكتروني

## ✅ قائمة التحقق

بعد الإعداد، تأكد من:

- [ ] تفعيل التحقق بالبريد الإلكتروني في Supabase
- [ ] إعداد SMTP بشكل صحيح
- [ ] تخصيص قوالب البريد الإلكتروني
- [ ] تشغيل ملف SQL
- [ ] نشر Edge Functions
- [ ] اختبار إنشاء حساب جديد
- [ ] اختبار إعادة إرسال بريد التحقق
- [ ] إضافة سجلات DNS للأمان
- [ ] مراقبة سجلات البريد الإلكتروني

---

**ملاحظة**: تأكد من تحديث جميع المتغيرات المطلوبة في إعدادات Netlify وإعدادات Supabase قبل نشر التطبيق.
