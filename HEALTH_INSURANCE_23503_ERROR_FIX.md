# حل مشكلة خطأ 23503 في طلبات التأمين الصحي

## المشكلة
خطأ 23503 (Foreign Key Constraint Violation) عند محاولة حفظ طلب التأمين الصحي في قاعدة البيانات.

```
❌ خطأ في حفظ الطلب: {
  code: '23503', 
  details: 'Key is not present in table "user_profiles".', 
  hint: null, 
  message: 'insert or update on table "health_insurance_requests" violates foreign key constraint "health_insurance_requests_user_id_fkey"'
}
```

## السبب
المشكلة أن `user_id` المرسل لا يوجد في جدول `user_profiles`، مما يسبب انتهاك قيد العلاقة الخارجية.

## الحلول المطبقة

### 1. التحقق من وجود المستخدم قبل إضافة user_id
```javascript
// إضافة user_id فقط إذا كان المستخدم مسجل دخول وموجود في جدول user_profiles
if (user?.id) {
  try {
    // التحقق من وجود المستخدم في جدول user_profiles
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (userProfile && !userError) {
      cleanRequestData.user_id = user.id;
      console.log('✅ تم إضافة user_id:', user.id);
    } else {
      console.log('⚠️ المستخدم غير موجود في جدول user_profiles، سيتم حفظ الطلب بدون user_id');
    }
  } catch (error) {
    console.log('⚠️ خطأ في التحقق من المستخدم، سيتم حفظ الطلب بدون user_id');
  }
}
```

### 2. معالجة خاصة لخطأ 23503
```javascript
// معالجة أخطاء أخرى
if (error.code === '23503') {
  console.log('⚠️ خطأ 23503 - مشكلة في العلاقة الخارجية');
  console.log('🔍 محاولة إصلاح مشكلة user_id...');
  
  // محاولة إزالة user_id إذا كان يسبب المشكلة
  const fixedData = { ...cleanRequestData };
  delete fixedData.user_id;
  
  console.log('🔄 محاولة الحفظ بدون user_id:', fixedData);
  
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

## خطوات التشخيص

### 1. فحص سجلات المتصفح
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ابحث عن رسائل تبدأ بـ:
   - `✅ تم إضافة user_id:`
   - `⚠️ المستخدم غير موجود في جدول user_profiles`
   - `⚠️ خطأ 23503 - مشكلة في العلاقة الخارجية`

### 2. فحص قاعدة البيانات
```sql
-- فحص وجود المستخدم في جدول user_profiles
SELECT id, email, full_name FROM user_profiles WHERE id = 'user-id-here';

-- فحص قيود العلاقة الخارجية
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='health_insurance_requests';
```

## الإصلاحات المطلوبة

### 1. إصلاح جدول user_profiles
```sql
-- إنشاء جدول user_profiles إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة المستخدمين المفقودين
INSERT INTO user_profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'مستخدم')
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = au.id
);
```

### 2. إصلاح قيود العلاقة الخارجية
```sql
-- إزالة القيد المشكلة (إذا لزم الأمر)
ALTER TABLE health_insurance_requests 
DROP CONSTRAINT IF EXISTS health_insurance_requests_user_id_fkey;

-- إضافة قيد جديد مع CASCADE
ALTER TABLE health_insurance_requests 
ADD CONSTRAINT health_insurance_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) 
ON DELETE SET NULL;
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
  // بدون user_id
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

1. **خطأ 23503 عادة ما يكون بسبب مشكلة في العلاقات الخارجية**: تأكد من وجود البيانات المرتبطة
2. **المحاولة الثانية قد تنجح**: تم إضافة آلية إعادة المحاولة تلقائياً
3. **فحص البيانات مهم**: تأكد من أن جميع البيانات صحيحة ومكتملة
4. **السجلات مفيدة**: تحقق من سجلات Console لمعرفة السبب الدقيق

## إذا لم تعمل الحلول

### 1. فحص قاعدة البيانات مباشرة
```bash
# الاتصال بقاعدة البيانات
psql -h your-db-host -U your-username -d your-database

# فحص الجداول
\d user_profiles
\d health_insurance_requests
```

### 2. إعادة إنشاء العلاقات
```sql
-- نسخ احتياطي
CREATE TABLE health_insurance_requests_backup AS 
SELECT * FROM health_insurance_requests;

-- إعادة إنشاء الجدول
DROP TABLE health_insurance_requests;
CREATE TABLE health_insurance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES insurance_companies(id),
  age_group_id UUID REFERENCES age_groups(id),
  duration_months INTEGER NOT NULL,
  calculated_price DECIMAL(10,2) NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  additional_notes TEXT,
  passport_image_url TEXT,
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  customer_age INTEGER,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. التواصل مع الدعم
إذا لم تعمل جميع الحلول، قد تكون المشكلة في:
- إعدادات قاعدة البيانات
- قيود على مستوى النظام
- مشكلة في Supabase
