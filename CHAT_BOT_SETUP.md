# دليل إعداد الشات بوت مع Qwen3 235B

## نظرة عامة
تم تحديث نظام الشات بوت لاستخدام نموذج Qwen3 235B من OpenRouter بدلاً من Llama 3.1. النظام يتضمن:
- شات بوت ذكي مع Qwen3 235B
- زر طلب ممثل خدمة العملاء
- لوحة تحكم متقدمة لإدارة المحادثات
- إشعارات التلقرام
- نظام إدارة الجلسات

## المتطلبات

### 1. مفاتيح API المطلوبة

#### OpenRouter API Key
1. قم بزيارة [OpenRouter](https://openrouter.ai/keys)
2. أنشئ حساب جديد أو سجل دخول
3. احصل على مفتاح API
4. أضف المفتاح إلى ملف `.env`:
```
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

#### Telegram Bot Token (اختياري)
1. ابحث عن @BotFather في التلقرام
2. أرسل `/newbot` واتبع التعليمات
3. احصل على token البوت
4. أضف الـ token إلى ملف `.env`:
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id-here
```

### 2. ملف .env
أنشئ ملف `.env` في المجلد الرئيسي مع المحتوى التالي:

```env
# Supabase Configuration
SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Telegram Bot Configuration (اختياري)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id-here

# Server Configuration
PORT=3001
ADMIN_URL=http://localhost:1234
```

## تشغيل النظام

### 1. تشغيل السيرفر
```bash
npm run server
```
السيرفر سيعمل على المنفذ 3001

### 2. تشغيل الواجهة الأمامية
```bash
npm run dev
```
الواجهة ستعمل على المنفذ 1234

### 3. فحص النظام
- افتح http://localhost:1234 في المتصفح
- ستجد زر الشات بوت في أسفل يمين الصفحة
- اضغط على الزر لفتح الشات بوت

## الميزات

### 1. الشات بوت الذكي
- يستخدم Qwen3 235B من OpenRouter
- يدعم اللغة العربية والإنجليزية
- إجابات ذكية ومفيدة
- حفظ تاريخ المحادثات

### 2. زر طلب ممثل خدمة العملاء
- زر برتقالي في أسفل الشات بوت
- عند الضغط عليه:
  - يرسل طلب إلى فريق خدمة العملاء
  - يظهر في لوحة التحكم
  - يرسل إشعار تلقرام (إذا كان مفعلاً)

### 3. لوحة التحكم المتقدمة
- الوصول: http://localhost:1234/admin/chat-support
- تتطلب صلاحيات أدمن أو مشرف
- ميزات متقدمة:
  - عرض جميع الجلسات
  - فلترة حسب الحالة والأولوية
  - إدارة الرسائل
  - إحصائيات مفصلة
  - تصدير البيانات

## اختبار النظام

### 1. اختبار الشات بوت
1. افتح الشات بوت
2. اكتب رسالة مثل: "مرحباً، كيف يمكنني مساعدتك؟"
3. تأكد من أن الرد يأتي من Qwen3 235B

### 2. اختبار زر طلب ممثل خدمة العملاء
1. في الشات بوت، اضغط على الزر البرتقالي
2. تأكد من ظهور رسالة التأكيد
3. تحقق من لوحة التحكم لرؤية الطلب

### 3. اختبار لوحة التحكم
1. سجل دخول كأدمن
2. اذهب إلى http://localhost:1234/admin/chat-support
3. ستجد البيانات التجريبية مع جلسة تطلب دعم

## استكشاف الأخطاء

### 1. مشاكل في الشات بوت
- تأكد من وجود مفتاح OpenRouter API صحيح
- تحقق من سجلات السيرفر للأخطاء
- تأكد من أن السيرفر يعمل على المنفذ 3001

### 2. مشاكل في التلقرام
- تأكد من صحة token البوت
- تحقق من صحة chat ID
- تأكد من أن البوت لديه صلاحيات إرسال الرسائل

### 3. مشاكل في لوحة التحكم
- تأكد من تسجيل الدخول كأدمن أو مشرف
- تحقق من اتصال Supabase
- تأكد من وجود الجداول المطلوبة في قاعدة البيانات

## الجداول المطلوبة في Supabase

### 1. جدول chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot', 'admin')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. جدول chat_sessions
```sql
CREATE TABLE chat_sessions (
  session_id TEXT PRIMARY KEY,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'ar',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'waiting_support', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ملاحظات مهمة

1. **الأمان**: لا تشارك مفاتيح API مع أي شخص
2. **التكلفة**: Qwen3 235B مجاني على OpenRouter مع حدود معينة
3. **الأداء**: النموذج قد يكون أبطأ من النماذج الأصغر
4. **النسخ الاحتياطي**: احتفظ بنسخة احتياطية من البيانات المهمة

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات السيرفر
2. تأكد من صحة جميع المفاتيح
3. تحقق من اتصال الإنترنت
4. راجع هذا الدليل مرة أخرى

