# حل سريع لمشكلة الاتصال بـ Supabase

## المشكلة
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
TypeError: Failed to fetch
```

## الحلول السريعة

### 1. تحقق من ملف .env
تأكد من وجود ملف `.env` في مجلد المشروع الرئيسي مع المحتوى التالي:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. تحقق من صحة البيانات
- تأكد من أن URL يحتوي على `supabase.co`
- تأكد من أن المفتاح صحيح وغير منتهي الصلاحية

### 3. إعادة تشغيل الخادم
```bash
# إيقاف الخادم (Ctrl+C)
# ثم إعادة تشغيله
npm run dev
```

### 4. تحقق من اتصال الإنترنت
- تأكد من أن الإنترنت يعمل
- جرب فتح https://supabase.com في المتصفح

### 5. تحقق من حالة مشروع Supabase
- اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
- تأكد من أن المشروع نشط
- تحقق من إعدادات API

## رسائل الخطأ الشائعة

### "ERR_NAME_NOT_RESOLVED"
- **السبب**: URL غير صحيح أو مشكلة في DNS
- **الحل**: تحقق من صحة URL في ملف .env

### "Failed to fetch"
- **السبب**: مشكلة في الاتصال بالخادم
- **الحل**: تحقق من اتصال الإنترنت وإعدادات Supabase

### "ConfigurationError"
- **السبب**: متغيرات البيئة مفقودة
- **الحل**: أنشئ ملف .env مع البيانات الصحيحة

## للتواصل مع الدعم
إذا استمرت المشكلة، يرجى:
1. فتح Developer Tools (F12)
2. الذهاب إلى Console
3. نسخ جميع رسائل الخطأ
4. إرسالها مع تفاصيل المشكلة
