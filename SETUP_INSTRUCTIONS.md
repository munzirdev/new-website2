# إعداد المشروع - Project Setup

## المشكلة - The Issue
إذا كنت تواجه رسالة "جاري تحميل لوحة التحكم..." ولا تختفي، فهذا يعني أن متغيرات البيئة الخاصة بـ Supabase مفقودة.

If you're seeing "Loading dashboard..." message that doesn't disappear, this means the Supabase environment variables are missing.

## الحل - Solution

### 1. إنشاء ملف .env
Create a `.env` file in the root directory of your project:

```bash
# في مجلد المشروع الرئيسي
# In the project root directory
touch .env
```

### 2. إضافة متغيرات البيئة
Add the following environment variables to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. الحصول على بيانات Supabase
To get your Supabase credentials:

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك أو أنشئ مشروعاً جديداً
3. اذهب إلى Settings > API
4. انسخ Project URL و anon public key

### 4. إعادة تشغيل الخادم
After adding the `.env` file:

```bash
# إيقاف الخادم الحالي (Ctrl+C)
# Stop the current server (Ctrl+C)

# إعادة تشغيل الخادم
# Restart the server
npm run dev
```

## التحقق من الإعداد
To verify the setup:

1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. يجب أن ترى رسائل مثل:
   - "✅ تم إنشاء عميل Supabase بنجاح"
   - "✅ الاتصال مع Supabase يعمل بنجاح"

## استكشاف الأخطاء
Troubleshooting:

- تأكد من أن ملف `.env` في المجلد الصحيح
- تأكد من صحة بيانات Supabase
- تأكد من أن المشروع يعمل في Supabase
- تحقق من Console للأخطاء

## ملاحظات مهمة
Important Notes:

- لا تشارك ملف `.env` مع أي شخص
- لا ترفع ملف `.env` إلى Git
- احتفظ بنسخة احتياطية من بيانات Supabase
