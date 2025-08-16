# 📧 دليل إعداد البريد الإلكتروني - Tevasul Group

## 🔍 **المشاكل التي تم حلها**

### **1. مشكلة SMTP غير مُعدة**
- ✅ تم تفعيل إعدادات SMTP في `supabase/config.toml`
- ✅ تم إعداد SendGrid كخدمة بريد إلكتروني

### **2. مشكلة تعطيل التحقق بالبريد الإلكتروني**
- ✅ تم إزالة `emailConfirm: false` من `src/hooks/useAuth.ts`
- ✅ تم إعادة تفعيل التحقق بالبريد الإلكتروني

### **3. مشكلة في Supabase Functions**
- ✅ تم إصلاح `send-verification-email` function
- ✅ تم تغيير `generateLink` إلى `resend`

## 🛠️ **خطوات الإعداد**

### **الخطوة 1: إنشاء حساب SendGrid**

1. اذهب إلى [SendGrid](https://sendgrid.com/)
2. أنشئ حساب مجاني
3. احصل على API Key من لوحة التحكم
4. أضف نطاقك `tevasul.group` إلى إعدادات Sender Authentication

### **الخطوة 2: إعداد متغيرات البيئة**

أنشئ ملف `.env` في مجلد المشروع الرئيسي:

```env
# Supabase Configuration
SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id-here

# Server Configuration
PORT=3001
ADMIN_URL=http://localhost:1234

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key-here
SITE_URL=https://tevasul.group
```

### **الخطوة 3: تحديث Supabase**

1. اذهب إلى لوحة تحكم Supabase
2. اذهب إلى Settings > Auth > Email Templates
3. تأكد من أن SMTP مفعل
4. اختبر إرسال بريد إلكتروني

### **الخطوة 4: نشر Supabase Functions**

```bash
# نشر دالة إرسال البريد الإلكتروني
supabase functions deploy send-verification-email

# نشر دالة إعادة إرسال البريد الإلكتروني
supabase functions deploy resend-verification
```

## 🔧 **الملفات التي تم تعديلها**

### **1. `supabase/config.toml`**
```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "noreply@tevasul.group"
sender_name = "Tevasul Group"
```

### **2. `supabase/functions/send-verification-email/index.ts`**
```typescript
const { error: emailError } = await supabaseClient.auth.resend({
  type: 'signup',
  email: email,
  options: {
    emailRedirectTo: `${Deno.env.get('SITE_URL') || 'https://tevasul.group'}/auth/verify-email`
  }
})
```

### **3. `src/hooks/useAuth.ts`**
```typescript
// تم إزالة emailConfirm: false
emailRedirectTo: `${window.location.origin}/auth/verify-email`
```

## 🧪 **اختبار النظام**

### **اختبار إنشاء الحساب**
1. اذهب إلى صفحة التسجيل
2. أدخل بيانات صحيحة
3. تأكد من استلام بريد التأكيد
4. اضغط على رابط التأكيد
5. تأكد من تسجيل الدخول بنجاح

### **اختبار إعادة إرسال البريد**
1. اذهب إلى صفحة التحقق من البريد
2. اضغط على "إعادة إرسال البريد"
3. تأكد من استلام البريد الجديد

## 🚨 **استكشاف الأخطاء**

### **مشكلة: لا يتم إرسال البريد الإلكتروني**
1. تحقق من صحة `SENDGRID_API_KEY`
2. تحقق من إعدادات SMTP في Supabase
3. تحقق من سجلات الأخطاء في Supabase Functions

### **مشكلة: رابط التأكيد لا يعمل**
1. تحقق من صحة `SITE_URL` في متغيرات البيئة
2. تأكد من أن الصفحة `/auth/verify-email` موجودة
3. تحقق من إعدادات CORS

### **مشكلة: المستخدم لا يمكنه تسجيل الدخول بعد التأكيد**
1. تحقق من إعدادات `emailConfirm` في Supabase
2. تحقق من سجلات المصادقة
3. تأكد من أن المستخدم تم إنشاؤه بنجاح

## 📞 **الدعم الفني**

إذا واجهت أي مشاكل:
1. تحقق من سجلات الأخطاء في Console
2. تحقق من سجلات Supabase Functions
3. تأكد من صحة جميع متغيرات البيئة
4. اتصل بالدعم الفني مع تفاصيل المشكلة

---

**تم إنشاء هذا الدليل بواسطة فريق Tevasul Group**
**آخر تحديث: ديسمبر 2024**

