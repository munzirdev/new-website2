# 🚀 دليل النشر على Netlify

## ❌ **المشكلة:**
Netlify يحاول استخدام `remix vite:build` بدلاً من `npm run build`

## ✅ **الحل:**

### **الخطوة 1: إضافة ملف netlify.toml**
تم إنشاء ملف `netlify.toml` في المشروع مع الإعدادات الصحيحة.

### **الخطوة 2: إعدادات Netlify**

#### **A. رفع الملفات:**
1. اذهب إلى [netlify.com](https://netlify.com)
2. سجل حساب جديد أو سجل دخول
3. اختر **"Deploy manually"**
4. اسحب مجلد `dist` إلى Netlify

#### **B. إعدادات الموقع:**
1. اذهب إلى **Site settings** → **Build & deploy**
2. تأكد من أن:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

#### **C. إضافة Environment Variables:**
1. اذهب إلى **Site settings** → **Environment variables**
2. أضف:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```

#### **D. إضافة Custom Domain (للـ Subdomain):**
1. اذهب إلى **Site settings** → **Domain management**
2. أضف Custom Domain: `app.yourdomain.com`
3. اتبع تعليمات DNS

## 🔧 **إعدادات DNS للـ Subdomain:**

### **لـ Netlify:**
```
Type    Name    Value
CNAME   app     your-site.netlify.app
```

### **مثال:**
إذا كان موقعك على Netlify هو `amazing-site-123.netlify.app`:
```
Type    Name    Value
CNAME   app     amazing-site-123.netlify.app
```

## 📋 **قائمة التحقق:**

### **قبل النشر:**
- ✅ ملف `netlify.toml` موجود
- ✅ شغلت `npm run build` محلياً
- ✅ مجلد `dist` موجود
- ✅ Environment Variables جاهزة

### **في Netlify:**
- ✅ رفعت مجلد `dist`
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ أضفت Environment Variables
- ✅ أضفت Custom Domain (إذا كان مطلوب)

### **بعد النشر:**
- ✅ الموقع يعمل
- ✅ HTTPS مفعل
- ✅ جميع الوظائف تعمل
- ✅ Subdomain يعمل (إذا كان مطلوب)

## 🚨 **مشاكل شائعة:**

### **1. خطأ في Build:**
- تأكد من أن `netlify.toml` موجود
- تأكد من أن Build command هو `npm run build`
- تأكد من أن Publish directory هو `dist`

### **2. خطأ في Environment Variables:**
- تأكد من إضافة `VITE_SUPABASE_URL`
- تأكد من إضافة `VITE_SUPABASE_ANON_KEY`
- تأكد من أن القيم صحيحة

### **3. خطأ في Subdomain:**
- تأكد من إعدادات DNS
- انتظر 24-48 ساعة لانتشار DNS
- تحقق من SSL certificate

## 🎯 **الخطوات السريعة:**

```bash
# 1. بناء التطبيق
npm run build

# 2. رفع مجلد dist إلى Netlify
# 3. إضافة Environment Variables
# 4. إضافة Custom Domain
# 5. انتظار انتشار DNS
# 6. اختبار التطبيق
```

## 📞 **الدعم:**

إذا واجهت أي مشاكل:
1. تحقق من Console errors
2. تحقق من Build logs في Netlify
3. تحقق من Environment Variables
4. تحقق من DNS settings

## 🎉 **النتيجة النهائية:**

بعد النشر الناجح:
- ✅ التطبيق يعمل على Netlify
- ✅ HTTPS مفعل
- ✅ جميع الوظائف تعمل
- ✅ Subdomain يعمل (إذا كان مطلوب)
- ✅ الأداء محسن
