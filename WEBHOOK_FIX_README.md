# إصلاح مشكلة الويبهوك - Telegram Notifications

## المشكلة
كان الويبهوك يعمل فقط مع طلبات التأمين الصحي ولا يرسل باقي الطلبات إلى التيليجرام.

## الأسباب المحتملة
1. **استخدام localhost بدلاً من webhookService**: بعض الملفات كانت تستخدم `http://localhost:3001/api/telegram/webhook` بدلاً من `webhookService`
2. **عدم إرسال إشعارات لجميع أنواع الطلبات**: بعض الملفات لم تكن ترسل إشعارات التيليجرام
3. **مشكلة في إعدادات التيليجرام**: عدم تطابق معرفات السجلات في قاعدة البيانات

## الحلول المطبقة

### 1. إصلاح ServiceRequestForm.tsx
- **المشكلة**: كان يستخدم `fetch('http://localhost:3001/api/telegram/webhook')`
- **الحل**: تم استبداله بـ `webhookService.sendServiceRequestWebhook(requestData)`

### 2. إصلاح ChatBot.tsx
- **المشكلة**: كان يستخدم `fetch('http://localhost:3001/api/telegram/notify-support')`
- **الحل**: تم استبداله بـ `webhookService.sendChatSupportWebhook(sessionData)`

### 3. إضافة إشعارات التيليجرام في HelpSupport.tsx
- **المشكلة**: لم يكن يرسل إشعارات عند إرسال رسائل الدعم
- **الحل**: تم إضافة `webhookService.sendServiceRequestWebhook(messageData)`

### 4. إضافة إشعارات التيليجرام في App.tsx
- **المشكلة**: لم يكن يرسل إشعارات عند إرسال رسائل التواصل العام
- **الحل**: تم إضافة `webhookService.sendServiceRequestWebhook(webhookData)`

### 5. إصلاح إعدادات التيليجرام
- **المشكلة**: عدم تطابق معرفات السجلات بين الملفات
- **الحل**: تم توحيد استخدام `id = 2` في جميع الملفات

## الملفات المحدثة

### الملفات التي تم إصلاحها:
1. `src/components/ServiceRequestForm.tsx`
2. `src/components/ChatBot.tsx`
3. `src/components/HelpSupport.tsx`
4. `src/App.tsx`
5. `src/services/telegramService.ts`
6. `supabase/functions/telegram-webhook/index.ts`

### الملفات التي كانت تعمل بشكل صحيح:
1. `src/components/VoluntaryReturnForm.tsx`
2. `src/components/HealthInsuranceActivationForm.tsx`
3. `src/components/HealthInsurancePage.tsx`

## كيفية الاختبار

### 1. اختبار طلبات الخدمات
1. اذهب إلى أي خدمة (ترجمة، تأمين، إلخ)
2. أرسل طلب جديد
3. تحقق من وصول الإشعار في التيليجرام

### 2. اختبار رسائل الدعم
1. اذهب إلى مركز المساعدة
2. أرسل رسالة دعم جديدة
3. تحقق من وصول الإشعار في التيليجرام

### 3. اختبار التواصل العام
1. اذهب إلى صفحة التواصل
2. أرسل رسالة جديدة
3. تحقق من وصول الإشعار في التيليجرام

### 4. اختبار الدعم الفني (المحادثة)
1. افتح الشات بوت
2. اطلب التحدث مع ممثل حقيقي
3. تحقق من وصول الإشعار في التيليجرام

## إعدادات التيليجرام

### فحص الإعدادات
```bash
node check-telegram-config.js
```

### إعدادات مطلوبة في قاعدة البيانات:
```sql
-- جدول telegram_config
INSERT INTO telegram_config (id, bot_token, admin_chat_id, is_enabled) 
VALUES (2, 'YOUR_BOT_TOKEN', 'YOUR_CHAT_ID', true);
```

### إعدادات لوحة الإدارة:
1. اذهب إلى `/admin/webhooks`
2. أدخل معرف البوت (`bot_token`)
3. أدخل معرف المحادثة (`admin_chat_id`)
4. فعّل الويبهوك
5. اختبر الاتصال

## ملاحظات مهمة

1. **جميع الطلبات الآن تستخدم webhookService**: تم توحيد طريقة إرسال الإشعارات
2. **إعدادات التيليجرام موحدة**: جميع الملفات تستخدم `id = 2`
3. **معالجة الأخطاء**: تم إضافة try-catch لجميع استدعاءات الويبهوك
4. **عدم إيقاف العملية**: إذا فشل إرسال الإشعار، لا يتم إيقاف العملية الرئيسية

## استكشاف الأخطاء

### إذا لم تصل الإشعارات:
1. تحقق من إعدادات التيليجرام في لوحة الإدارة
2. تحقق من سجلات Edge Function في Supabase
3. تحقق من معرفات البوت والمحادثة
4. تأكد من تفعيل الويبهوك

### إذا وصلت بعض الإشعارات فقط:
1. تحقق من نوع الطلب في سجلات Edge Function
2. تأكد من أن جميع الملفات تستخدم webhookService
3. تحقق من معالجة الأخطاء في كل ملف

## التحديثات المستقبلية

1. إضافة إشعارات لطلبات جديدة
2. تحسين تنسيق الرسائل
3. إضافة أزرار تفاعلية أكثر
4. إضافة إحصائيات الويبهوك
