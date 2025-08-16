# دليل النشر على Netlify - Tevasul Group

## 🚀 نظرة عامة

هذا الدليل يوضح كيفية نشر موقع Tevasul Group على Netlify بشكل صحيح وآمن.

## 📋 المتطلبات المسبقة

- حساب Netlify (مجاني)
- حساب GitHub/GitLab (للمستودع)
- حساب Supabase (مُعد مسبقاً)
- متغيرات البيئة جاهزة

## 🔧 إعداد المشروع للنشر

### 1. تحضير الكود

```bash
# تأكد من أن الكود محدث
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. بناء المشروع محلياً (اختياري)

```bash
npm run build:no-lint
```

## 🌐 النشر على Netlify

### الطريقة الأولى: النشر التلقائي من Git (مُوصى بها)

#### الخطوة 1: رفع الكود إلى Git

1. اذهب إلى [GitHub](https://github.com) أو [GitLab](https://gitlab.com)
2. أنشئ مستودع جديد
3. ارفع الكود:

```bash
git remote add origin https://github.com/username/tevasul-group.git
git push -u origin main
```

#### الخطوة 2: ربط Netlify بالمستودع

1. اذهب إلى [Netlify Dashboard](https://app.netlify.com)
2. اضغط على "New site from Git"
3. اختر مزود Git (GitHub/GitLab)
4. اختر المستودع `tevasul-group`
5. اضبط إعدادات البناء:

```
Build command: npm run build:no-lint
Publish directory: dist
```

#### الخطوة 3: إعداد متغيرات البيئة

في Netlify Dashboard، اذهب إلى:
`Site settings > Environment variables`

أضف المتغيرات التالية:

```env
VITE_SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0
SITE_URL=https://your-domain.netlify.app
```

### الطريقة الثانية: النشر اليدوي

#### الخطوة 1: بناء المشروع

```bash
npm run build:no-lint
```

#### الخطوة 2: رفع مجلد dist

1. اذهب إلى [Netlify Drop](https://app.netlify.com/drop)
2. اسحب مجلد `dist` إلى المنطقة المخصصة
3. انتظر حتى يتم النشر

## 🔧 إعدادات إضافية

### 1. إعداد النطاق المخصص

1. في Netlify Dashboard، اذهب إلى `Domain settings`
2. اضغط على `Add custom domain`
3. أدخل النطاق: `tevasul.group`
4. اتبع تعليمات DNS

### 2. إعداد SSL

- SSL مفعل تلقائياً على Netlify
- تأكد من أن النطاق المخصص يدعم HTTPS

### 3. إعداد Redirects

ملف `_redirects` موجود في `public/` ويحتوي على:

```
/*    /index.html   200
```

### 4. إعداد Headers

ملف `netlify.toml` يحتوي على إعدادات الأمان والأداء.

## 📊 مراقبة الأداء

### 1. Analytics

- اذهب إلى `Site analytics` في Netlify Dashboard
- راقب الزيارات والأداء

### 2. Functions Logs

- اذهب إلى `Functions` في Netlify Dashboard
- راقب سجلات Edge Functions

### 3. Build Logs

- اذهب إلى `Deploys` في Netlify Dashboard
- راقب سجلات البناء

## 🔍 اختبار الموقع

### 1. اختبار الوظائف الأساسية

- [ ] تسجيل الدخول بـ Google
- [ ] رفع الملفات
- [ ] إرسال النماذج
- [ ] نظام الإشعارات
- [ ] الترجمة

### 2. اختبار الأداء

- استخدم [PageSpeed Insights](https://pagespeed.web.dev/)
- استخدم [GTmetrix](https://gtmetrix.com/)

### 3. اختبار الأمان

- استخدم [Security Headers](https://securityheaders.com/)
- تحقق من SSL

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ في البناء

```bash
# تحقق من الأخطاء محلياً
npm run build
```

#### 2. خطأ في متغيرات البيئة

- تأكد من صحة المتغيرات في Netlify
- تحقق من أسماء المتغيرات

#### 3. خطأ في API

- تحقق من إعدادات CORS في Supabase
- تأكد من صحة API Keys

#### 4. خطأ في التوجيه

- تحقق من ملف `_redirects`
- تأكد من إعدادات React Router

## 📈 تحسين الأداء

### 1. تحسين الصور

- استخدم WebP format
- اضبط أحجام الصور
- استخدم lazy loading

### 2. تحسين JavaScript

- استخدم code splitting
- اضبط chunk sizes
- استخدم tree shaking

### 3. تحسين CSS

- استخدم PurgeCSS
- اضبط critical CSS
- استخدم CSS minification

## 🔄 التحديثات المستقبلية

### 1. النشر التلقائي

- كل push إلى `main` سيؤدي إلى نشر تلقائي
- يمكن إعداد branches مختلفة للاختبار

### 2. Rollback

- يمكن العودة إلى إصدار سابق من Netlify Dashboard
- كل deploy يحتفظ بتاريخ

### 3. Preview Deploys

- يمكن إعداد preview deploys للـ pull requests
- مفيد للاختبار قبل النشر

## 📞 الدعم

إذا واجهت أي مشاكل:

1. راجع سجلات البناء في Netlify
2. تحقق من إعدادات المتغيرات
3. اختبر الموقع محلياً
4. تواصل مع فريق الدعم

---

**تم إعداد المشروع للنشر بنجاح! 🚀**
