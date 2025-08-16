# 🚀 دليل البدء السريع - بوت التلقرام

## ⚡ الوصول لإعدادات التلقرام

### الطريقة الأولى: عبر الرابط المباشر
```
http://localhost:1234/admin/telegram-settings
```

### الطريقة الثانية: عبر لوحة التحكم
1. اذهب إلى `http://localhost:1234/admin/dashboard`
2. اختر "إدارة الشات"
3. اضغط على زر التلقرام (أيقونة البوت)

## 🔧 الإعداد السريع

### 1. إنشاء بوت تلقرام
1. اذهب إلى @BotFather في تلقرام
2. اكتب `/newbot`
3. اتبع التعليمات
4. احفظ رمز البوت

### 2. الحصول على معرف المحادثة
1. ابدأ محادثة مع البوت الجديد
2. اذهب إلى @userinfobot
3. اكتب أي رسالة
4. احفظ معرف المحادثة

### 3. إعداد قاعدة البيانات
```sql
-- نسخ هذا الكود وتشغيله في Supabase SQL Editor
CREATE TABLE IF NOT EXISTS telegram_config (
    id SERIAL PRIMARY KEY,
    bot_token TEXT NOT NULL DEFAULT '',
    admin_chat_id TEXT NOT NULL DEFAULT '',
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO telegram_config (bot_token, admin_chat_id, is_enabled) 
VALUES ('', '', false)
ON CONFLICT DO NOTHING;
```

### 4. إعداد البوت
1. اذهب إلى إعدادات التلقرام
2. أدخل رمز البوت ومعرف المحادثة
3. فعّل البوت
4. اختبر الاتصال

## 🎯 المميزات المتاحة

### ✅ إشعارات فورية
- طلب ممثل خدمة عملاء
- رسائل جديدة
- رسائل مستعجلة

### ✅ أزرار تفاعلية
- الرد السريع
- عرض التفاصيل
- الاتصال بالعميل

### ✅ واجهة إدارة
- إعدادات شاملة
- اختبار الاتصال
- مراقبة الحالة

## 🆘 استكشاف الأخطاء

### الصفحة لا تفتح
- تأكد من تشغيل التطبيق: `npm run dev`
- تحقق من الرابط: `http://localhost:1234/admin/telegram-settings`

### البوت لا يعمل
- تحقق من صحة رمز البوت
- تأكد من معرف المحادثة
- اختبر الاتصال من الإعدادات

### الإشعارات لا تصل
- تأكد من تفعيل البوت
- تحقق من بدء محادثة مع البوت
- راجع سجلات الأخطاء

## 📞 الدعم

للمساعدة:
- راجع `TELEGRAM_SETUP_GUIDE.md`
- تحقق من سجلات الأخطاء
- اتصل بفريق الدعم

---

**🎉 البوت جاهز للعمل!**
