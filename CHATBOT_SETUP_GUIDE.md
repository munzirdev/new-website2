# دليل إعداد الشات بوت مع OpenRouter

## نظرة عامة
تم تعديل الشات بوت ليعمل مباشرة مع OpenRouter API بدون الحاجة لسيرفر محلي. هذا يعني أنه يمكن تشغيل الشات بوت في الصفحة الرئيسية مباشرة.

## المتطلبات

### 1. الحصول على مفتاح OpenRouter API
1. اذهب إلى [OpenRouter](https://openrouter.ai/)
2. سجل حساب جديد
3. اذهب إلى صفحة API Keys
4. أنشئ مفتاح API جديد
5. انسخ المفتاح

### 2. إعداد ملف .env
أنشئ ملف `.env` في مجلد المشروع الرئيسي وأضف:

```env
# Supabase Configuration
SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_SUPABASE_URL=https://fctvityawavmuethxxix.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0

# OpenRouter API Configuration
VITE_OPENROUTER_API_KEY=your-openrouter-api-key-here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id-here

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key-here
SITE_URL=https://tevasul.group

# Google OAuth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id-here
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret-here
```

**مهم**: استبدل `your-openrouter-api-key-here` بمفتاح OpenRouter الحقيقي الخاص بك.

## التغييرات المطبقة

### 1. تحديث chatService.ts
- تم إزالة الاعتماد على Groq SDK
- تم إضافة دعم OpenRouter API مباشرة
- تم إضافة دعم Streaming للردود
- تم تحسين معالجة الأخطاء

### 2. تحديث ChatBot.tsx
- تم إزالة الاتصال بالسيرفر المحلي (localhost:3001)
- تم استخدام chatService الجديد
- تم تبسيط معالجة الردود

### 3. إضافة دعم Streaming
- الردود تظهر تدريجياً كما يكتبها الذكاء الاصطناعي
- تحسين تجربة المستخدم

## كيفية التشغيل

### 1. التطوير المحلي
```bash
npm run dev
```

### 2. الإنتاج
```bash
npm run build
```

## الميزات

### 1. دعم اللغات
- العربية والإنجليزية
- يغير النظام تلقائياً حسب لغة الموقع

### 2. ذاكرة المحادثة
- يحتفظ بسياق المحادثة
- يحد من عدد الرسائل لتوفير التكلفة

### 3. معالجة الأخطاء
- رسائل خطأ واضحة
- إعادة المحاولة التلقائية
- توجيه للدعم عند الحاجة

### 4. تكامل مع التيليجرام
- إرسال طلبات الدعم للتيليجرام
- إشعارات فورية للفريق

## النماذج المدعومة

حالياً يستخدم الشات بوت:
- `anthropic/claude-3.5-sonnet` (Claude 3.5 Sonnet)

يمكن تغيير النموذج في `chatService.ts`:

```typescript
model: 'anthropic/claude-3.5-sonnet'
```

## التكلفة

- OpenRouter يوفر رصيد مجاني شهري
- التكلفة تعتمد على عدد الرسائل وطولها
- يمكن مراقبة الاستخدام من لوحة تحكم OpenRouter

## استكشاف الأخطاء

### 1. خطأ "API key not found"
- تأكد من وجود `VITE_OPENROUTER_API_KEY` في ملف .env
- تأكد من صحة المفتاح

### 2. خطأ "OpenRouter API error"
- تحقق من رصيد OpenRouter
- تحقق من صحة المفتاح
- تحقق من إعدادات CORS

### 3. الشات بوت لا يظهر
- تأكد من تشغيل المشروع
- تحقق من console للأخطاء
- تأكد من وجود مفتاح API صحيح

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من console المتصفح للأخطاء
2. تأكد من صحة مفتاح OpenRouter
3. تحقق من رصيد OpenRouter
4. تواصل مع فريق الدعم

## ملاحظات مهمة

1. **الأمان**: لا تشارك مفتاح OpenRouter مع أي شخص
2. **التكلفة**: راقب استخدام API لتجنب التكاليف غير المتوقعة
3. **الأداء**: النموذج محسن للأداء السريع
4. **الخصوصية**: الرسائل لا تُخزن في OpenRouter، فقط في Supabase المحلي

