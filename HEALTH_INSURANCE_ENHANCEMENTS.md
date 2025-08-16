# تحسينات صفحة إدارة التأمين الصحي
# Health Insurance Management Enhancements

## الميزات المضافة / Added Features

### 1. حذف طلبات التأمين الصحي / Delete Health Insurance Requests
- ✅ إضافة زر حذف لكل طلب في جدول الطلبات
- ✅ مودال تأكيد أنيق ومتناسق مع باقي المودلات
- ✅ تأكيد قبل الحذف لتجنب الحذف العرضي
- ✅ رسالة تأكيد بعد الحذف الناجح
- ✅ إمكانية حذف الشركات والفئات العمرية والأسعار
- ✅ رسائل مخصصة لكل نوع من العناصر

### 2. معلومات العميل المحسنة / Enhanced Customer Information
- ✅ **عمر العميل**: عرض عمر صاحب الطلب
- ✅ **تاريخ الميلاد**: عرض تاريخ الميلاد بالتقويم الميلادي
- ✅ **تاريخ التقديم**: عرض تاريخ تقديم الطلب بالتقويم الميلادي

### 3. تحسينات واجهة المستخدم / UI Improvements
- ✅ أعمدة جديدة في جدول الطلبات
- ✅ تنسيق التواريخ باللغة الإنجليزية
- ✅ أيقونات معبرة لكل نوع من البيانات
- ✅ رسائل واضحة للبيانات غير المتوفرة

## التحديثات التقنية / Technical Updates

### قاعدة البيانات / Database
```sql
-- الأعمدة الجديدة المضافة
ALTER TABLE health_insurance_requests 
ADD COLUMN customer_age INTEGER,
ADD COLUMN birth_date DATE,
ADD COLUMN submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### الواجهة الأمامية / Frontend
- تحديث واجهة `HealthInsuranceManagement.tsx`
- إضافة دوال جديدة:
  - `handleDeleteRequest()` - حذف الطلبات
  - `handleDeleteCompany()` - حذف الشركات
  - `handleDeleteAgeGroup()` - حذف الفئات العمرية
  - `handleDeletePricing()` - حذف الأسعار
  - `handleConfirmDelete()` - معالج الحذف العام
  - `formatDateEnglish()` - تنسيق التواريخ بالإنجليزية
  - `calculateAge()` - حساب العمر من تاريخ الميلاد
- استخدام مودال `ConfirmDeleteModal` للحذف الآمن

## كيفية الاستخدام / How to Use

### تشغيل التحديثات / Running Updates
1. قم بتشغيل ملف SQL التالي في محرر SQL الخاص بـ Supabase:
   ```bash
   # انسخ محتوى ملف add_age_and_dates_columns.sql
   # والصقه في محرر SQL في لوحة تحكم Supabase
   ```

2. أو قم بتشغيل الأمر التالي (إذا كان Supabase CLI مثبت):
   ```bash
   npx supabase db push
   ```

### استخدام الميزات الجديدة / Using New Features
1. **حذف طلب**: انقر على أيقونة سلة المهملات بجانب الطلب
2. **حذف شركة**: انقر على أيقونة سلة المهملات بجانب الشركة
3. **حذف فئة عمرية**: انقر على أيقونة سلة المهملات بجانب الفئة العمرية
4. **حذف سعر**: انقر على أيقونة سلة المهملات بجانب السعر
5. **تعديل معلومات العميل**: انقر على أيقونة التعديل وأضف العمر وتاريخ الميلاد
6. **عرض التواريخ**: ستظهر التواريخ باللغة الإنجليزية في الأعمدة الجديدة

## الملفات المحدثة / Updated Files
- `src/components/HealthInsuranceManagement.tsx` - الواجهة الرئيسية
- `supabase/migrations/20240118000000_add_age_and_dates_to_health_insurance.sql` - ملف الهجرة
- `add_age_and_dates_columns.sql` - ملف SQL للتشغيل اليدوي

## ملاحظات مهمة / Important Notes
- جميع التواريخ تعرض بالتقويم الميلادي (Gregorian Calendar)
- العمر يحسب تلقائياً من تاريخ الميلاد إذا لم يتم تحديده
- يمكن تعديل العمر وتاريخ الميلاد من نافذة تعديل الطلب
- جميع عمليات الحذف نهائية ولا يمكن التراجع عنها
- مودال الحذف يوفر تجربة مستخدم آمنة ومتناسقة
- رسائل تأكيد مخصصة لكل نوع من العناصر
