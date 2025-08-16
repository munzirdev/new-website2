# دليل تحديث Telegram Webhook - حل مشكلة الإشعارات القديمة

## المشكلة
رسائل التيليجرام ما زالت تظهر بالصيغة القديمة بدلاً من التصنيف الجديد حسب نوع الخدمة.

## السبب
Edge Function لم يتم تحديثه في Supabase بعد التعديلات.

## الحلول

### 1. إعادة نشر Edge Function (الأهم)
```bash
# في مجلد المشروع
supabase functions deploy telegram-webhook
```

### 2. التحقق من التحديثات
```bash
# فحص حالة Edge Function
supabase functions list

# فحص سجلات Edge Function
supabase functions logs telegram-webhook
```

### 3. إعادة إنشاء Edge Function (إذا لم تعمل الطريقة الأولى)
```bash
# حذف Edge Function القديم
supabase functions delete telegram-webhook

# إنشاء Edge Function جديد
supabase functions new telegram-webhook

# نسخ الكود المحدث إلى الملف الجديد
# ثم إعادة النشر
supabase functions deploy telegram-webhook
```

## التحديثات المطلوبة في الكود

### 1. دالة `formatNotificationMessage` المحدثة
يجب أن تحتوي على:

```typescript
function formatNotificationMessage(data) {
  const { language, additionalData } = data
  
  const emoji = getRequestTypeEmoji(data.type)
  const priorityEmoji = getPriorityEmoji(data.priority)
  
  let message = `
${emoji} <b>${data.title}</b>

👤 <b>${language === 'ar' ? 'معلومات العميل:' : 'Client Information:'}</b>
• ${language === 'ar' ? 'الاسم:' : 'Name:'} ${data.userInfo?.name || (language === 'ar' ? 'غير محدد' : 'Not specified')}
• ${language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'} ${data.userInfo?.email || (language === 'ar' ? 'غير محدد' : 'Not specified')}
• ${language === 'ar' ? 'رقم الهاتف:' : 'Phone:'} ${data.userInfo?.phone || (language === 'ar' ? 'غير محدد' : 'Not specified')}

📝 <b>${language === 'ar' ? 'تفاصيل الطلب:' : 'Request Details:'}</b>
${data.description}

📊 <b>${language === 'ar' ? 'معلومات إضافية:' : 'Additional Info:'}</b>
• ${language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'} ${getRequestTypeText(data.type, language)}
• ${language === 'ar' ? 'الأولوية:' : 'Priority:'} ${priorityEmoji} ${getPriorityText(data.priority, language)}
• ${language === 'ar' ? 'الحالة:' : 'Status:'} ${data.status || (language === 'ar' ? 'معلق' : 'Pending')}
`

  // إضافة معلومات خاصة بكل نوع خدمة
  if (additionalData) {
    switch (data.type) {
      case 'translation':
        message += `\n\n🌐 <b>${language === 'ar' ? 'تفاصيل الترجمة:' : 'Translation Details:'}</b>`
        if (additionalData.hasFile) {
          message += `\n• ${language === 'ar' ? 'ملف مرفق:' : 'File attached:'} ${additionalData.fileName || (language === 'ar' ? 'ملف' : 'File')}`
        }
        if (additionalData.serviceType) {
          message += `\n• ${language === 'ar' ? 'نوع الترجمة:' : 'Translation type:'} ${additionalData.serviceType}`
        }
        break;
        
      case 'service_request':
        message += `\n\n📋 <b>${language === 'ar' ? 'تفاصيل الخدمة:' : 'Service Details:'}</b>`
        if (additionalData.serviceType) {
          message += `\n• ${language === 'ar' ? 'نوع الخدمة:' : 'Service type:'} ${getServiceTypeText(additionalData.serviceType, language)}`
        }
        if (additionalData.hasFile) {
          message += `\n• ${language === 'ar' ? 'ملف مرفق:' : 'File attached:'} ${additionalData.fileName || (language === 'ar' ? 'ملف' : 'File')}`
        }
        break;
        
      case 'health_insurance':
        message += `\n\n🏥 <b>${language === 'ar' ? 'تفاصيل التأمين الصحي:' : 'Health Insurance Details:'}</b>`
        
        if (additionalData.ageGroup) {
          message += `\n• ${language === 'ar' ? 'الفئة العمرية:' : 'Age Group:'} ${additionalData.ageGroup}`
        }
        
        if (additionalData.calculatedAge) {
          message += `\n• ${language === 'ar' ? 'العمر المحسوب:' : 'Calculated Age:'} ${additionalData.calculatedAge} ${language === 'ar' ? 'سنة' : 'years'}`
        }
        
        if (additionalData.companyName) {
          message += `\n• ${language === 'ar' ? 'الشركة المطلوبة:' : 'Requested Company:'} ${additionalData.companyName}`
        }
        
        if (additionalData.durationMonths) {
          message += `\n• ${language === 'ar' ? 'المدة المطلوبة:' : 'Duration:'} ${additionalData.durationMonths} ${language === 'ar' ? 'شهر' : 'months'}`
        }
        
        if (additionalData.calculatedPrice) {
          message += `\n• ${language === 'ar' ? 'السعر المحسوب:' : 'Calculated Price:'} ${additionalData.calculatedPrice} ${language === 'ar' ? 'ليرة تركية' : 'TL'}`
        }
        
        if (additionalData.hasPassportImage) {
          message += `\n• ${language === 'ar' ? 'صورة جواز السفر:' : 'Passport Image:'} ${language === 'ar' ? 'مرفقة' : 'Attached'}`
        }
        break;
        
      // ... باقي الأنواع
    }
  }

  // Add request ID
  if (data.requestId) {
    message += `\n\n🆔 <b>${language === 'ar' ? 'معرف الطلب:' : 'Request ID:'}</b> ${data.requestId}`
  }

  return message
}
```

### 2. دالة `getServiceTypeText` الجديدة
```typescript
function getServiceTypeText(serviceType, language) {
  const serviceTypes = {
    translation: language === 'ar' ? 'ترجمة' : 'Translation',
    insurance: language === 'ar' ? 'تأمين' : 'Insurance',
    consultation: language === 'ar' ? 'استشارات' : 'Consultation',
    government_services: language === 'ar' ? 'خدمات حكومية' : 'Government Services',
    legal_services: language === 'ar' ? 'خدمات قانونية' : 'Legal Services',
    business_services: language === 'ar' ? 'خدمات تجارية' : 'Business Services',
    education_services: language === 'ar' ? 'خدمات تعليمية' : 'Education Services',
    health_services: language === 'ar' ? 'خدمات صحية' : 'Health Services',
    travel_services: language === 'ar' ? 'خدمات سفر' : 'Travel Services',
    support_message: language === 'ar' ? 'رسالة دعم' : 'Support Message',
    general_inquiry: language === 'ar' ? 'استفسار عام' : 'General Inquiry',
    other: language === 'ar' ? 'خدمات أخرى' : 'Other Services'
  }
  return serviceTypes[serviceType] || serviceType
}
```

## خطوات التحقق

### 1. فحص سجلات Supabase
1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. اذهب إلى Edge Functions
4. اختر `telegram-webhook`
5. اذهب إلى Logs
6. ابحث عن رسائل تبدأ بـ:
   - `🔔 Webhook request received:`
   - `📝 Formatting message with data:`

### 2. اختبار مباشر
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

supabase.functions.invoke('telegram-webhook', { body: testData })
  .then(({ data, error }) => {
    if (error) console.error('❌ خطأ:', error);
    else console.log('✅ نجح:', data);
  });
```

## الإشعارات المتوقعة بعد التحديث

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

## ملاحظات مهمة

1. **إعادة نشر Edge Function ضروري**: التحديثات لا تطبق تلقائياً
2. **فحص السجلات مهم**: لمعرفة ما يحدث بالضبط
3. **اختبار مباشر مفيد**: لتأكيد أن المشكلة في الكود وليس في البيانات
4. **مسح التخزين المؤقت**: قد يكون ضرورياً في بعض الحالات

## إذا لم تعمل الحلول

### 1. فحص إعدادات Supabase
```bash
# فحص حالة المشروع
supabase status

# فحص الإعدادات
supabase config list
```

### 2. إعادة تشغيل المشروع
```bash
# إيقاف المشروع
supabase stop

# تشغيل المشروع
supabase start

# إعادة نشر Edge Functions
supabase functions deploy
```

### 3. فحص قاعدة البيانات
```sql
-- فحص إعدادات التيليجرام
SELECT * FROM telegram_config WHERE id = 2;

-- فحص آخر الطلبات
SELECT * FROM service_requests ORDER BY created_at DESC LIMIT 5;
```
