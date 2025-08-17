# إصلاح مشكلة جدول user_profiles

## المشكلة
```
فشل في إضافة المشرف: relation "user_profiles" does not exist
```

## السبب
يوجد جدول قديم يسمى `user_profiles` في قاعدة البيانات، بينما الكود يستخدم جدول `profiles`. هذا يسبب تضارب في المراجع.

## الحل

### الخطوة 1: تشغيل ملف الإصلاح
1. اذهب إلى **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `fix_user_profiles_final.sql`
4. اضغط **Run** لتشغيل الكود

### الخطوة 2: التحقق من النتائج
بعد تشغيل الكود، يجب أن ترى:
- ✅ جدول `user_profiles` تم حذفه
- ✅ جدول `profiles` موجود ويعمل
- ✅ جدول `moderators` موجود ويعمل
- ✅ إدراج تجريبي ناجح

### الخطوة 3: اختبار إضافة المشرف
1. اذهب إلى صفحة إدارة المشرفين
2. حاول إضافة مشرف جديد
3. يجب أن تعمل بدون أخطاء

## إذا استمرت المشكلة

### تشغيل ملف إصلاح إضافي
إذا استمرت المشكلة، شغل ملف `fix_moderators_table_issues.sql` أيضاً:

1. اذهب إلى **Supabase Dashboard > SQL Editor**
2. انسخ محتوى `fix_moderators_table_issues.sql`
3. اضغط **Run**

### التحقق من RLS Policies
تأكد من أن سياسات RLS صحيحة:

```sql
-- التحقق من سياسات moderators
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'moderators' 
    AND schemaname = 'public';
```

## النتيجة المتوقعة
بعد الإصلاح:
- ✅ إضافة المشرفين تعمل بشكل طبيعي
- ✅ لا توجد أخطاء `user_profiles does not exist`
- ✅ جميع العمليات تعمل مع جدول `profiles` الصحيح

## ملاحظات مهمة
- هذا الإصلاح آمن ولا يؤثر على البيانات الموجودة
- جدول `user_profiles` القديم لم يعد مستخدماً
- جميع العمليات تستخدم جدول `profiles` الجديد
