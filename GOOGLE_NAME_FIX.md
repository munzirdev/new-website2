# إصلاح مشكلة عرض اسم المستخدم من Google 🔧

## المشكلة:
عند تسجيل الدخول عبر Google، يظهر الجزء الأول من البريد الإلكتروني بدلاً من اسم المستخدم الحقيقي.

## السبب:
الكود كان يستخدم `user.email?.split('@')[0]` كـ fallback بدلاً من استخراج الاسم الصحيح من بيانات Google.

## الحلول المطبقة:

### 1. ✅ **تحسين استخراج الاسم في AuthCallback.tsx**

#### قبل التحديث:
```typescript
const fullName = googleData?.full_name || 
               googleData?.name || 
               googleData?.display_name || 
               data.session.user.email?.split('@')[0] || // ❌ المشكلة هنا
               'مستخدم جديد';
```

#### بعد التحديث:
```typescript
// محاولة استخراج الاسم بطرق مختلفة
let fullName = '';

// 1. محاولة من user_metadata
if (googleData?.full_name) {
  fullName = googleData.full_name;
  console.log('✅ تم العثور على الاسم من full_name:', fullName);
} else if (googleData?.name) {
  fullName = googleData.name;
  console.log('✅ تم العثور على الاسم من name:', fullName);
} else if (googleData?.display_name) {
  fullName = googleData.display_name;
  console.log('✅ تم العثور على الاسم من display_name:', fullName);
} else if (googleData?.given_name && googleData?.family_name) {
  fullName = `${googleData.given_name} ${googleData.family_name}`;
  console.log('✅ تم العثور على الاسم من given_name + family_name:', fullName);
} else if (googleData?.given_name) {
  fullName = googleData.given_name;
  console.log('✅ تم العثور على الاسم من given_name فقط:', fullName);
} else {
  // إذا لم نجد أي اسم، استخدم "مستخدم جديد" بدلاً من البريد الإلكتروني
  fullName = 'مستخدم جديد';
  console.log('⚠️ لم يتم العثور على اسم، استخدام "مستخدم جديد"');
}
```

### 2. ✅ **تحسين UserAvatar.tsx**

#### إضافة دالة ذكية لاستخراج الاسم:
```typescript
const getUserName = () => {
  // أولاً: استخدم الاسم من الملف الشخصي
  if (profile?.full_name && profile.full_name !== 'مستخدم جديد') {
    return profile.full_name;
  }
  
  // ثانياً: استخدم الاسم من user_metadata
  const googleData = user?.user_metadata;
  if (googleData?.full_name) {
    return googleData.full_name;
  } else if (googleData?.name) {
    return googleData.name;
  } else if (googleData?.display_name) {
    return googleData.display_name;
  } else if (googleData?.given_name && googleData?.family_name) {
    return `${googleData.given_name} ${googleData.family_name}`;
  } else if (googleData?.given_name) {
    return googleData.given_name;
  }
  
  // ثالثاً: إذا كان الاسم في الملف الشخصي هو "مستخدم جديد"، استخدم "مستخدم"
  if (profile?.full_name === 'مستخدم جديد') {
    return 'مستخدم';
  }
  
  // رابعاً: استخدم "مستخدم" بدلاً من البريد الإلكتروني
  return 'مستخدم';
};
```

### 3. ✅ **تحديث الملف الشخصي الموجود**

#### إضافة تحديث للاسم عند تسجيل الدخول:
```typescript
// تحديث الاسم إذا كان متوفراً
let updatedName = profile.full_name;
if (googleData?.full_name && profile.full_name !== googleData.full_name) {
  updatedName = googleData.full_name;
  console.log('✅ تحديث الاسم من Google:', updatedName);
} else if (googleData?.name && profile.full_name !== googleData.name) {
  updatedName = googleData.name;
  console.log('✅ تحديث الاسم من Google:', updatedName);
} else if (googleData?.given_name && googleData?.family_name) {
  const newName = `${googleData.given_name} ${googleData.family_name}`;
  if (profile.full_name !== newName) {
    updatedName = newName;
    console.log('✅ تحديث الاسم من Google:', updatedName);
  }
}
```

### 4. ✅ **إضافة سجلات تشخيص مفصلة**

#### طباعة جميع البيانات المتوفرة:
```typescript
console.log('🔍 جميع بيانات user_metadata:', googleData);
console.log('🔍 بيانات المستخدم الكاملة:', data.session.user);
console.log('🔍 جميع المفاتيح المتوفرة في user_metadata:', Object.keys(googleData || {}));
```

## الملفات المحدثة:

1. **`src/components/AuthCallback.tsx`**
   - تحسين استخراج الاسم من Google
   - إضافة سجلات تشخيص مفصلة
   - تحديث الملف الشخصي الموجود

2. **`src/components/UserAvatar.tsx`**
   - إضافة دالة ذكية لاستخراج الاسم
   - تحسين fallback logic
   - دعم أسماء متعددة من Google

3. **`test-google-data.js`** (جديد)
   - ملف اختبار لمعرفة البيانات الفعلية من Google
   - تشخيص شامل لبيانات user_metadata

## خطوات الاختبار:

### 1. **اختبار البيانات الفعلية:**
```bash
node test-google-data.js
```

### 2. **تسجيل دخول جديد عبر Google:**
- يجب أن يظهر الاسم الكامل من Google
- يجب أن تظهر سجلات مفصلة في Console
- يجب أن يتم إنشاء ملف شخصي بالاسم الصحيح

### 3. **تسجيل دخول مستخدم موجود:**
- يجب أن يتم تحديث الاسم إذا كان مختلفاً
- يجب أن تظهر سجلات التحديث

## النتائج المتوقعة:

### ✅ **للمستخدمين الجدد:**
- الاسم الكامل من Google يظهر في جميع أنحاء الموقع
- لا يظهر الجزء الأول من البريد الإلكتروني

### ✅ **للمستخدمين الحاليين:**
- تحديث الاسم تلقائياً من Google
- الحفاظ على البيانات الأخرى

### ✅ **في حالة عدم توفر الاسم:**
- عرض "مستخدم جديد" بدلاً من البريد الإلكتروني
- عرض "مستخدم" في الواجهة

## ملاحظات مهمة:

1. **التشخيص:** السجلات المفصلة ستساعد في معرفة البيانات المتوفرة
2. **المرونة:** الكود يدعم عدة تنسيقات لأسماء Google
3. **الأمان:** لا يتم استخدام البريد الإلكتروني كاسم افتراضي
4. **التحديث:** الملفات الشخصية الموجودة يتم تحديثها تلقائياً

---

## 🎯 **النتيجة النهائية:**

الآن عندما يسجل المستخدم دخول عبر Google:
- ✅ **سيظهر اسمه الكامل** من Google
- ✅ **لن يظهر الجزء الأول من البريد الإلكتروني**
- ✅ **سيتم تحديث الملف الشخصي تلقائياً**
- ✅ **سجلات مفصلة للتشخيص**
