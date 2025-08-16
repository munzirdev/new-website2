# دليل إعداد Google OAuth لتطبيق Tevasul

## الخطوات المطلوبة لإعداد Google OAuth

### 1. إعداد Google Cloud Console

#### أ. إنشاء مشروع جديد
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. انقر على "Select a project" في الأعلى
3. انقر على "New Project"
4. أدخل اسم المشروع: `tevasul-oauth`
5. انقر على "Create"

#### ب. تفعيل Google+ API
1. في القائمة الجانبية، اذهب إلى "APIs & Services" > "Library"
2. ابحث عن "Google+ API" أو "Google Identity"
3. انقر على "Enable"

#### ج. إنشاء OAuth 2.0 Client ID
1. اذهب إلى "APIs & Services" > "Credentials"
2. انقر على "Create Credentials" > "OAuth client ID"
3. إذا طُلب منك تكوين شاشة الموافقة:
   - اختر "External"
   - أدخل اسم التطبيق: `Tevasul Group`
   - أدخل بريد إلكتروني للدعم
   - احفظ

#### د. إعداد OAuth Client ID
1. اختر نوع التطبيق: "Web application"
2. أدخل اسم التطبيق: `Tevasul Web App`
3. في "Authorized JavaScript origins" أضف:
   ```
   https://tevasul.group
   http://localhost:5173
   ```
4. في "Authorized redirect URIs" أضف:
   ```
   https://tevasul.group/auth/callback
   http://localhost:5173/auth/callback
   ```
5. انقر على "Create"

### 2. الحصول على Credentials

بعد إنشاء OAuth Client ID، ستحصل على:
- **Client ID**: يبدأ بـ `your-project-id.apps.googleusercontent.com`
- **Client Secret**: سلسلة طويلة من الأحرف

### 3. تحديث متغيرات البيئة

أضف المتغيرات التالية إلى ملف `.env`:

```env
# Google OAuth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id-here
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret-here
```

### 4. تحديث إعدادات Supabase

تم تحديث ملف `supabase/config.toml` بالفعل مع إعدادات Google OAuth.

### 5. تطبيق التغييرات

```bash
# تحديث إعدادات Supabase
supabase db push

# إعادة تشغيل Supabase (اختياري)
supabase stop
supabase start
```

### 6. اختبار الميزة

1. تأكد من أن التطبيق يعمل
2. اذهب إلى صفحة تسجيل الدخول
3. انقر على زر "تسجيل الدخول عبر Google"
4. يجب أن يتم توجيهك إلى Google للمصادقة
5. بعد المصادقة، يجب أن تعود إلى التطبيق وتسجل دخولك تلقائياً

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ "redirect_uri_mismatch"**
   - تأكد من أن URIs في Google Cloud Console تطابق URIs في التطبيق
   - تأكد من إضافة `https://tevasul.group/auth/callback` و `http://localhost:5173/auth/callback`

2. **خطأ "invalid_client"**
   - تأكد من صحة Client ID و Client Secret
   - تأكد من أن متغيرات البيئة محدثة

3. **خطأ "access_denied"**
   - تأكد من تفعيل Google+ API
   - تأكد من إعداد شاشة الموافقة بشكل صحيح

4. **لا يتم إنشاء الملف الشخصي**
   - تحقق من سجلات الأخطاء في Supabase
   - تأكد من أن جدول `profiles` موجود وصحيح

### سجلات التصحيح:

افتح Developer Tools في المتصفح وابحث عن:
- `🔐 بدء تسجيل الدخول عبر Google...`
- `✅ تم بدء عملية تسجيل الدخول عبر Google`
- `تم تسجيل الدخول بنجاح:`

## ملاحظات مهمة:

1. **الأمان**: لا تشارك Client Secret مع أي شخص
2. **الإنتاج**: تأكد من استخدام HTTPS في الإنتاج
3. **الاختبار**: اختبر الميزة في بيئة التطوير أولاً
4. **النسخ الاحتياطي**: احتفظ بنسخة من الإعدادات

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات الأخطاء
2. تأكد من صحة جميع الإعدادات
3. راجع دليل Google OAuth الرسمي
4. اتصل بالدعم الفني إذا لزم الأمر
