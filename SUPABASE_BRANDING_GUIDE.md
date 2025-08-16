# دليل تخصيص علامة Supabase التجارية 🎨

## المشكلة:
عند تسجيل الدخول عبر Google، تظهر صفحة بـ "Sign in to fctvityawavmuethxxix.supabase.co"

## الحلول المتاحة:

### 1. تخصيص من لوحة تحكم Supabase (الأسهل)

#### أ. الذهاب إلى لوحة التحكم
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `fctvityawavmuethxxix`
3. اذهب إلى **Authentication** > **Settings**

#### ب. تخصيص العلامة التجارية
1. في قسم **Site URL**، تأكد من أن الرابط هو: `https://tevasul.group`
2. في قسم **Redirect URLs**، أضف:
   ```
   https://tevasul.group/auth/callback
   http://localhost:5173/auth/callback
   ```

#### ج. تخصيص الشعار والاسم
1. ابحث عن قسم **Branding** أو **Customization**
2. أضف شعار موقعك (PNG أو SVG)
3. غيّر اسم الموقع إلى "Tevasul Group"
4. أضف وصف الموقع: "مجموعة تواصل - خدمات شاملة"

### 2. استخدام Custom Domain (الأفضل للإنتاج)

#### أ. شراء نطاق مخصص
1. اشتري نطاق مثل: `auth.tevasul.group`
2. أضفه إلى إعدادات Supabase

#### ب. إعداد DNS
1. أضف CNAME record:
   ```
   auth.tevasul.group CNAME fctvityawavmuethxxix.supabase.co
   ```

#### ج. تحديث إعدادات Supabase
1. في لوحة التحكم، أضف النطاق المخصص
2. انتظر التحقق من DNS (قد يستغرق 24 ساعة)

### 3. تخصيص CSS (متقدم)

#### أ. إنشاء ملف CSS مخصص
```css
/* custom-auth.css */
.supabase-auth-ui {
  --brand-color: #1e40af;
  --brand-color-hover: #1d4ed8;
}

.supabase-auth-ui .supabase-auth-ui_ui-button {
  background-color: var(--brand-color);
}

.supabase-auth-ui .supabase-auth-ui_ui-button:hover {
  background-color: var(--brand-color-hover);
}
```

#### ب. تطبيق التخصيص
1. أضف الملف CSS إلى مشروعك
2. استيرده في مكونات المصادقة

## الخطوات الموصى بها:

### 1. فوري (من لوحة التحكم)
1. اذهب إلى Supabase Dashboard
2. Authentication > Settings
3. ابحث عن خيارات التخصيص
4. أضف شعار واسم "Tevasul Group"

### 2. متوسط المدى (نطاق مخصص)
1. اشتري `auth.tevasul.group`
2. أضفه إلى Supabase
3. انتظر التحقق من DNS

### 3. طويل المدى (تخصيص كامل)
1. استخدم Supabase Auth Helpers
2. أنشئ صفحات مصادقة مخصصة
3. تخصيص كامل للتجربة

## إعدادات Google Cloud Console المطلوبة:

### تحديث Authorized Domains:
```
tevasul.group
auth.tevasul.group (إذا استخدمت نطاق مخصص)
```

### تحديث Authorized Redirect URIs:
```
https://tevasul.group/auth/callback
https://auth.tevasul.group/auth/callback (إذا استخدمت نطاق مخصص)
http://localhost:5173/auth/callback (للتنمية)
```

## ملاحظات مهمة:

1. **الأمان**: لا تشارك Client Secret
2. **الاختبار**: اختبر في بيئة التطوير أولاً
3. **النسخ الاحتياطي**: احتفظ بنسخة من الإعدادات
4. **الأداء**: النطاق المخصص يحسن الأداء

## الدعم:

إذا لم تجد خيارات التخصيص في لوحة التحكم:
1. تحقق من إصدار Supabase
2. راجع الوثائق الرسمية
3. اتصل بدعم Supabase
