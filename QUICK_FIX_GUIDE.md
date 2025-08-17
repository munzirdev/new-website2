# إصلاح سريع لمشكلة user_profiles

## المشكلة
```
ERROR: 42P01: relation "user_profiles" does not exist
QUERY: UPDATE user_profiles SET role = 'moderator', updated_at = NOW() WHERE email = NEW.email
CONTEXT: PL/pgSQL function sync_moderator_roles() line 5 at SQL statement
```

## الحل السريع

### الخطوة 1: تشغيل الإصلاح
1. اذهب إلى **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `quick_fix_user_profiles.sql`
4. اضغط **Run**

### ما يفعله الإصلاح:
1. ✅ يحذف function `sync_moderator_roles()` القديم
2. ✅ يحذف جدول `user_profiles` القديم
3. ✅ ينشئ function جديد يستخدم جدول `profiles`
4. ✅ ينشئ trigger جديد للـ moderators
5. ✅ يختبر الإصلاح

### النتيجة:
- ✅ إضافة المشرفين تعمل بدون أخطاء
- ✅ لا توجد مراجع لجدول `user_profiles`
- ✅ جميع العمليات تستخدم جدول `profiles` الصحيح

## إذا استمرت المشكلة

### تشغيل الإصلاح الشامل
إذا استمرت المشكلة، شغل ملف `fix_user_profiles_triggers.sql`:

1. اذهب إلى **Supabase Dashboard > SQL Editor**
2. انسخ محتوى `fix_user_profiles_triggers.sql`
3. اضغط **Run**

هذا الملف يقوم بـ:
- البحث عن جميع المراجع لـ `user_profiles`
- حذف جميع triggers وfunctions المشكلة
- إنشاء نظام جديد يعمل مع جدول `profiles`

## اختبار الإصلاح
بعد تشغيل الإصلاح:
1. اذهب إلى صفحة إدارة المشرفين
2. حاول إضافة مشرف جديد
3. يجب أن تعمل بدون أخطاء

## ملاحظات مهمة
- هذا الإصلاح آمن ولا يؤثر على البيانات الموجودة
- يحل مشكلة trigger function التي كانت تسبب الخطأ
- يضمن أن جميع العمليات تستخدم الجداول الصحيحة
