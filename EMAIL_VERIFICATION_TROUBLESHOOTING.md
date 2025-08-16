# دليل استكشاف أخطاء التحقق من البريد الإلكتروني

## المشكلة
عندما يسجل المستخدم دخوله وينقر على رابط التحقق في البريد الإلكتروني، يظهر له خطأ "رابط غير صحيح".

## الأسباب المحتملة والحلول

### 1. إعدادات Supabase

#### أ. إعدادات SMTP
تأكد من أن إعدادات SMTP صحيحة في `supabase/config.toml`:

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

#### ب. إعدادات التأكيد
تأكد من تفعيل تأكيد البريد الإلكتروني:

```toml
[auth.email]
enable_signup = true
enable_confirmations = true
```

#### ج. روابط إعادة التوجيه
تأكد من إضافة الروابط الصحيحة:

```toml
additional_redirect_urls = [
  "http://127.0.0.1:1234", 
  "http://localhost:1234", 
  "https://tevasul.group/auth/verify-email", 
  "http://localhost:5173/auth/verify-email"
]
```

### 2. إعدادات التطبيق

#### أ. متغيرات البيئة
تأكد من وجود المتغيرات الصحيحة في `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SENDGRID_API_KEY=your-sendgrid-key
SITE_URL=https://tevasul.group
```

#### ب. إعدادات التسجيل
في `src/hooks/useAuth.ts`، تأكد من:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: signUpData.email,
  password: signUpData.password,
  options: {
    data: {
      full_name: signUpData.name,
      phone: signUpData.phone,
      country_code: signUpData.countryCode,
    },
    emailRedirectTo: `${window.location.origin}/auth/verify-email`,
    emailConfirm: true
  }
});
```

### 3. معالجة الرابط

#### أ. في `src/components/EmailVerification.tsx`
تم تحسين معالجة الرابط ليدعم:

1. **معاملات OTP**: `token` و `type`
2. **معاملات الجلسة**: `access_token` و `refresh_token`
3. **معاملات الخطأ**: `error` و `error_description`

#### ب. أنواع الروابط المدعومة:
- `https://tevasul.group/auth/verify-email?token=xxx&type=signup`
- `https://tevasul.group/auth/verify-email?access_token=xxx&refresh_token=xxx`
- `https://tevasul.group/auth/verify-email?error=xxx&error_description=xxx`

### 4. Edge Functions

#### أ. إعادة إرسال البريد الإلكتروني
تم إنشاء edge function في `supabase/functions/resend-verification/index.ts`:

```typescript
const { error } = await supabaseClient.auth.resend({
  type: 'signup',
  email: email,
  options: {
    emailRedirectTo: `${Deno.env.get('SITE_URL') || 'https://tevasul.group'}/auth/verify-email`
  }
})
```

#### ب. إرسال البريد الإلكتروني
تم إنشاء edge function في `supabase/functions/send-verification-email/index.ts`:

```typescript
const { error: emailError } = await supabaseClient.auth.admin.resend({
  type: 'signup',
  email: email,
  options: {
    emailRedirectTo: `${Deno.env.get('SITE_URL') || 'https://tevasul.group'}/auth/verify-email`
  }
})
```

### 5. قالب البريد الإلكتروني

تم إنشاء قالب مخصص في `supabase/templates/confirm_signup.html` مع:
- تصميم جميل ومتجاوب
- دعم اللغة العربية
- معلومات الشركة والخدمات
- روابط التواصل

### 6. اختبار النظام

#### أ. تشغيل الاختبار:
```bash
node test-email-verification.js
```

#### ب. فحص السجلات:
```bash
supabase logs --follow
```

### 7. خطوات التشخيص

1. **فحص إعدادات SMTP**:
   ```bash
   supabase status
   ```

2. **فحص Edge Functions**:
   ```bash
   supabase functions list
   ```

3. **فحص قاعدة البيانات**:
   ```sql
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

4. **فحص السجلات**:
   ```bash
   supabase logs --follow --function resend-verification
   ```

### 8. الحلول السريعة

#### أ. إذا كان الرابط لا يعمل:
1. تأكد من أن المستخدم لم يفتح الرابط من قبل
2. تحقق من أن الرابط لم ينتهي صلاحيته (24 ساعة)
3. جرب إعادة إرسال البريد الإلكتروني

#### ب. إذا لم يصل البريد الإلكتروني:
1. تحقق من مجلد الرسائل غير المرغوب فيها
2. تأكد من صحة عنوان البريد الإلكتروني
3. تحقق من إعدادات SMTP

#### ج. إذا ظهر خطأ "رابط غير صحيح":
1. تحقق من إعدادات `additional_redirect_urls`
2. تأكد من أن الرابط يبدأ بـ `https://tevasul.group/auth/verify-email`
3. تحقق من معاملات الرابط في console

### 9. التحسينات المضافة

1. **معالجة أفضل للأخطاء**: رسائل خطأ أكثر وضوحاً
2. **دعم متعدد اللغات**: رسائل بالعربية والإنجليزية
3. **واجهة محسنة**: تصميم أفضل وأزرار إضافية
4. **معالجة الجلسات**: دعم أفضل للجلسات المختلفة
5. **إعادة الإرسال الذكية**: استخدام edge function مع fallback

### 10. المراقبة والصيانة

#### أ. مراقبة الأخطاء:
- فحص سجلات Supabase بانتظام
- مراقبة معدل نجاح التحقق
- تتبع الأخطاء الشائعة

#### ب. الصيانة الدورية:
- تحديث قوالب البريد الإلكتروني
- فحص إعدادات SMTP
- تحديث روابط إعادة التوجيه

## الخلاصة

تم إصلاح مشكلة التحقق من البريد الإلكتروني من خلال:

1. ✅ تحسين معالجة الروابط في `EmailVerification.tsx`
2. ✅ إصلاح edge functions لإرسال البريد الإلكتروني
3. ✅ تحديث إعدادات Supabase
4. ✅ إضافة معالجة أفضل للأخطاء
5. ✅ تحسين واجهة المستخدم
6. ✅ إضافة اختبارات وتشخيص شامل

الآن يجب أن يعمل نظام التحقق من البريد الإلكتروني بشكل صحيح.
