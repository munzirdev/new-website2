# حل مشكلة الإشعارات القديمة - Telegram Webhook

## المشكلة
الإشعارات ما زالت تظهر بالشكل القديم بدلاً من التصنيف الجديد حسب نوع الخدمة.

## الأسباب المحتملة

### 1. Edge Function لم يتم تحديثه
- التحديثات لم يتم نشرها في Supabase
- الكود القديم ما زال يعمل

### 2. مشكلة في البيانات المرسلة
- البيانات لا تحتوي على `additionalData`
- `serviceType` غير موجود أو خاطئ

### 3. مشكلة في التخزين المؤقت
- المتصفح يحتفظ بالكود القديم
- Supabase يحتفظ بالنسخة القديمة

## الحلول

### 1. إعادة نشر Edge Function
```bash
# في مجلد المشروع
supabase functions deploy telegram-webhook
```

### 2. فحص سجلات Edge Function
1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. اذهب إلى Edge Functions
4. اختر `telegram-webhook`
5. اذهب إلى Logs
6. تحقق من السجلات الجديدة

### 3. اختبار الويبهوك مباشرة
```bash
# تشغيل سكريبت الاختبار
node test-webhook.js
```

### 4. فحص البيانات المرسلة
تحقق من أن البيانات تحتوي على:
```javascript
{
  sessionId: 'unique-id',
  message: 'تفاصيل الطلب',
  language: 'ar',
  requestType: 'translation', // أو 'service_request'
  userInfo: {
    name: 'اسم العميل',
    email: 'email@example.com',
    phone: '+966501234567'
  },
  additionalData: {
    serviceType: 'translation', // نوع الخدمة
    hasFile: false,
    fileName: null
  },
  requestId: 'unique-request-id'
}
```

## خطوات التشخيص

### 1. فحص سجلات المتصفح
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ابحث عن رسائل تبدأ بـ:
   - `🔄 sendServiceRequestNotification called with:`
   - `🔄 بدء إرسال إشعار طلب مع ملف عبر Edge Function...`
   - `🔔 Webhook request received:`

### 2. فحص سجلات Supabase
1. اذهب إلى Supabase Dashboard
2. Edge Functions > telegram-webhook > Logs
3. ابحث عن رسائل تبدأ بـ:
   - `🔔 Webhook request received:`
   - `📝 Formatting message with data:`

### 3. اختبار مباشر
```javascript
// في console المتصفح
const testData = {
  sessionId: 'test-' + Date.now(),
  message: 'اختبار التصنيف الجديد',
  language: 'ar',
  requestType: 'service_request',
  userInfo: {
    name: 'مستخدم تجريبي',
    email: 'test@example.com',
    phone: '+966501234567'
  },
  additionalData: {
    serviceType: 'legal_services',
    hasFile: false,
    fileName: null
  },
  requestId: 'test-' + Date.now()
};

// استدعاء الويبهوك مباشرة
supabase.functions.invoke('telegram-webhook', { body: testData })
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ خطأ:', error);
    } else {
      console.log('✅ نجح:', data);
    }
  });
```

## التحقق من التحديثات

### 1. فحص Edge Function
```bash
# عرض محتوى الملف المحلي
cat supabase/functions/telegram-webhook/index.ts | grep -A 5 -B 5 "getServiceTypeText"
```

### 2. فحص الإصدار
```bash
# عرض آخر تحديث
git log --oneline -10
```

### 3. إعادة بناء المشروع
```bash
# إعادة بناء المشروع
npm run build
# أو
yarn build
```

## الإشعارات المتوقعة

### طلب ترجمة:
```
🌐 طلب ترجمة جديد

👤 معلومات العميل:
• الاسم: أحمد محمد
• البريد الإلكتروني: ahmed@example.com
• رقم الهاتف: +966501234567

📝 تفاصيل الطلب:
أحتاج ترجمة وثيقة من العربية إلى الإنجليزية

📊 معلومات إضافية:
• نوع الخدمة: ترجمة
• الأولوية: 🟡 متوسط
• الحالة: معلق

🌐 تفاصيل الترجمة:
• ملف مرفق: document.pdf

🆔 معرف الطلب: 1234567890
```

### طلب خدمة عامة:
```
📋 طلب خدمة جديد

👤 معلومات العميل:
• الاسم: فاطمة أحمد
• البريد الإلكتروني: fatima@example.com
• رقم الهاتف: +966509876543

📝 تفاصيل الطلب:
أحتاج استشارة قانونية

📊 معلومات إضافية:
• نوع الخدمة: خدمات قانونية
• الأولوية: 🟡 متوسط
• الحالة: معلق

📋 تفاصيل الخدمة:
• نوع الخدمة: خدمات قانونية

🆔 معرف الطلب: 1234567891
```

## إذا لم تعمل الحلول

### 1. إعادة إنشاء Edge Function
```bash
# حذف وإعادة إنشاء
supabase functions delete telegram-webhook
supabase functions new telegram-webhook
# ثم نسخ الكود الجديد
```

### 2. فحص إعدادات التيليجرام
1. تأكد من أن البوت مفعل
2. تأكد من صحة معرفات البوت والمحادثة
3. اختبر الاتصال من لوحة الإدارة

### 3. فحص قاعدة البيانات
```sql
-- فحص إعدادات التيليجرام
SELECT * FROM telegram_config WHERE id = 2;

-- فحص آخر الطلبات
SELECT * FROM service_requests ORDER BY created_at DESC LIMIT 5;
```

## ملاحظات مهمة

1. **إعادة نشر Edge Function ضروري**: التحديثات لا تطبق تلقائياً
2. **فحص السجلات مهم**: لمعرفة ما يحدث بالضبط
3. **اختبار مباشر مفيد**: لتأكيد أن المشكلة في الكود وليس في البيانات
4. **مسح التخزين المؤقت**: قد يكون ضرورياً في بعض الحالات
