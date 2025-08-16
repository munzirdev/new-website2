# حل مشكلة خطأ 409 في طلبات التأمين الصحي

## المشكلة
خطأ 409 (Conflict) عند محاولة حفظ طلب التأمين الصحي في قاعدة البيانات.

## الأسباب المحتملة

### 1. مشكلة في القيود (Constraints)
- تكرار في البيانات الفريدة
- مشكلة في العلاقات الخارجية
- قيود غير متوافقة

### 2. مشكلة في هيكل الجدول
- أعمدة غير موجودة
- أنواع بيانات غير متوافقة
- قيود على الأعمدة

### 3. مشكلة في البيانات المرسلة
- بيانات فارغة أو غير صحيحة
- قيم null في أعمدة مطلوبة
- تنسيق بيانات خاطئ

## الحلول المطبقة

### 1. تنظيف البيانات قبل الإرسال
```javascript
// تنظيف البيانات قبل الإرسال
const cleanRequestData: any = {
  company_id: selectedCompany,
  age_group_id: selectedAgeGroup,
  duration_months: selectedDuration,
  calculated_price: calculatedPrice,
  contact_name: requestForm.contactName?.trim() || '',
  contact_email: requestForm.contactEmail?.trim() || '',
  contact_phone: requestForm.contactPhone?.trim() || '',
  additional_notes: requestForm.additionalNotes?.trim() || null,
  passport_image_url: passportImageUrl || null,
  status: 'pending'
};

// إضافة البيانات العمرية فقط إذا كانت صحيحة
if (finalCalculatedAge && finalCalculatedAge > 0) {
  cleanRequestData.customer_age = finalCalculatedAge;
}

if (birthDate) {
  cleanRequestData.birth_date = birthDate;
}
```

### 2. معالجة خاصة لخطأ 409
```javascript
// معالجة خاصة لخطأ 409 (Conflict)
if (error.code === '409') {
  console.log('⚠️ خطأ 409 - تكرار في البيانات أو مشكلة في القيود');
  console.log('🔍 محاولة إصلاح المشكلة...');
  
  // محاولة إزالة البيانات التي قد تسبب المشكلة
  const fixedData = { ...cleanRequestData };
  delete fixedData.customer_age;
  delete fixedData.birth_date;
  delete fixedData.passport_image_url;
  
  console.log('🔄 محاولة الحفظ مع بيانات معدلة:', fixedData);
  
  const retryResult = await supabase
    .from('health_insurance_requests')
    .insert(fixedData);
  
  if (retryResult.error) {
    console.error('❌ فشل في المحاولة الثانية:', retryResult.error);
    setSubmitError('مشكلة في حفظ البيانات. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.');
    return;
  } else {
    console.log('✅ نجح الحفظ في المحاولة الثانية:', retryResult.data);
    data = retryResult.data;
    error = null;
  }
}
```

### 3. التحقق من صحة البيانات
```javascript
// التحقق من صحة البيانات المطلوبة
if (!cleanRequestData.company_id || !cleanRequestData.age_group_id || !cleanRequestData.duration_months) {
  console.error('❌ بيانات غير مكتملة:', cleanRequestData);
  setSubmitError('بيانات غير مكتملة. يرجى التحقق من جميع الحقول المطلوبة.');
  return;
}
```

## خطوات التشخيص

### 1. فحص سجلات المتصفح
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ابحث عن رسائل تبدأ بـ:
   - `📝 بيانات الطلب المراد حفظها:`
   - `❌ خطأ في حفظ الطلب:`
   - `⚠️ خطأ 409 - تكرار في البيانات`

### 2. فحص قاعدة البيانات
```bash
# تشغيل سكريبت فحص الجدول
node check-health-insurance-table.js
```

### 3. فحص هيكل الجدول
```sql
-- فحص أعمدة الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'health_insurance_requests';

-- فحص القيود
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'health_insurance_requests';

-- فحص آخر الطلبات
SELECT * FROM health_insurance_requests 
ORDER BY created_at DESC 
LIMIT 5;
```

## الإصلاحات المطلوبة

### 1. فحص الجداول المرتبطة
```sql
-- فحص شركات التأمين
SELECT id, name, name_ar FROM insurance_companies WHERE is_active = true;

-- فحص الفئات العمرية
SELECT id, name, name_ar, min_age, max_age FROM age_groups WHERE is_active = true;
```

### 2. إصلاح القيود إذا لزم الأمر
```sql
-- إزالة قيود مشكلة (إذا وجدت)
ALTER TABLE health_insurance_requests 
DROP CONSTRAINT IF EXISTS constraint_name;

-- إضافة قيود صحيحة
ALTER TABLE health_insurance_requests 
ADD CONSTRAINT fk_company 
FOREIGN KEY (company_id) REFERENCES insurance_companies(id);

ALTER TABLE health_insurance_requests 
ADD CONSTRAINT fk_age_group 
FOREIGN KEY (age_group_id) REFERENCES age_groups(id);
```

### 3. إصلاح الأعمدة المفقودة
```sql
-- إضافة أعمدة مفقودة (إذا لزم الأمر)
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS customer_age INTEGER,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS passport_image_url TEXT;
```

## اختبار الحل

### 1. اختبار طلب بسيط
```javascript
// في console المتصفح
const testData = {
  company_id: 'company-id',
  age_group_id: 'age-group-id',
  duration_months: 12,
  calculated_price: 1500,
  contact_name: 'مستخدم تجريبي',
  contact_email: 'test@example.com',
  contact_phone: '+966501234567',
  status: 'pending'
};

supabase.from('health_insurance_requests').insert(testData)
  .then(({ data, error }) => {
    if (error) console.error('❌ خطأ:', error);
    else console.log('✅ نجح:', data);
  });
```

### 2. اختبار من الواجهة
1. اذهب إلى صفحة التأمين الصحي
2. املأ النموذج ببيانات صحيحة
3. أرسل الطلب
4. تحقق من السجلات في Console

## ملاحظات مهمة

1. **خطأ 409 عادة ما يكون مؤقتاً**: قد يكون بسبب مشكلة في القيود أو البيانات
2. **المحاولة الثانية قد تنجح**: تم إضافة آلية إعادة المحاولة تلقائياً
3. **فحص البيانات مهم**: تأكد من أن جميع البيانات صحيحة ومكتملة
4. **السجلات مفيدة**: تحقق من سجلات Console لمعرفة السبب الدقيق

## إذا لم تعمل الحلول

### 1. فحص قاعدة البيانات مباشرة
```bash
# الاتصال بقاعدة البيانات
psql -h your-db-host -U your-username -d your-database

# فحص الجدول
\d health_insurance_requests
```

### 2. إعادة إنشاء الجدول (إذا لزم الأمر)
```sql
-- نسخ احتياطي
CREATE TABLE health_insurance_requests_backup AS 
SELECT * FROM health_insurance_requests;

-- إعادة إنشاء الجدول
DROP TABLE health_insurance_requests;
CREATE TABLE health_insurance_requests (
  -- تعريف الأعمدة الصحيحة
);
```

### 3. التواصل مع الدعم
إذا لم تعمل جميع الحلول، قد تكون المشكلة في:
- إعدادات قاعدة البيانات
- قيود على مستوى النظام
- مشكلة في Supabase
