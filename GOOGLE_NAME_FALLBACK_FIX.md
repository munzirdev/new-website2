# إصلاح مشكلة fallback الاسم من Google 🔧

## المشكلة:
بعد إصلاح مشكلة قاعدة البيانات، أصبح يظهر البريد الإلكتروني كاملاً بدلاً من الاسم من Google.

## السبب:
الكود كان يستخدم `user.email?.split('@')[0]` كـ fallback بدلاً من محاولة استخراج الاسم من `user_metadata`.

## الحل المطبق:

### ✅ **استبدال جميع fallback الاسم في `useAuth.ts`**

#### قبل التحديث:
```typescript
full_name: user.email?.split('@')[0] || 'مستخدم'
```

#### بعد التحديث:
```typescript
// محاولة استخراج الاسم من user_metadata
const googleData = user.user_metadata;
let fallbackName = 'مستخدم';

if (googleData?.full_name) {
  fallbackName = googleData.full_name;
} else if (googleData?.name) {
  fallbackName = googleData.name;
} else if (googleData?.display_name) {
  fallbackName = googleData.display_name;
} else if (googleData?.given_name && googleData?.family_name) {
  fallbackName = `${googleData.given_name} ${googleData.family_name}`;
} else if (googleData?.given_name) {
  fallbackName = googleData.given_name;
}

full_name: fallbackName
```

## المواقع المحدثة في `useAuth.ts`:

### 1. **getInitialSession** (السطر ~134)
```typescript
// محاولة استخراج الاسم من user_metadata
const googleData = session.user.user_metadata;
let fallbackName = 'مستخدم';

if (googleData?.full_name) {
  fallbackName = googleData.full_name;
} else if (googleData?.name) {
  fallbackName = googleData.name;
} else if (googleData?.display_name) {
  fallbackName = googleData.display_name;
} else if (googleData?.given_name && googleData?.family_name) {
  fallbackName = `${googleData.given_name} ${googleData.family_name}`;
} else if (googleData?.given_name) {
  fallbackName = googleData.given_name;
}

const fallbackProfile = {
  id: session.user.id,
  email: session.user.email || '',
  full_name: fallbackName, // ✅ تم التحديث
  // ...
};
```

### 2. **onAuthStateChange fallback** (السطر ~264)
```typescript
// محاولة استخراج الاسم من user_metadata
const googleData = session.user.user_metadata;
let fallbackName = 'مستخدم';

if (googleData?.full_name) {
  fallbackName = googleData.full_name;
} else if (googleData?.name) {
  fallbackName = googleData.name;
} else if (googleData?.display_name) {
  fallbackName = googleData.display_name;
} else if (googleData?.given_name && googleData?.family_name) {
  fallbackName = `${googleData.given_name} ${googleData.family_name}`;
} else if (googleData?.given_name) {
  fallbackName = googleData.given_name;
}

const fallbackState = {
  user: session.user,
  profile: {
    id: session.user.id,
    email: session.user.email || '',
    full_name: fallbackName, // ✅ تم التحديث
    // ...
  },
  // ...
};
```

### 3. **getUserProfile fallback** (السطر ~467)
```typescript
// محاولة استخراج الاسم من user_metadata
const googleData = user.user_metadata;
let fallbackName = 'مستخدم';

if (googleData?.full_name) {
  fallbackName = googleData.full_name;
} else if (googleData?.name) {
  fallbackName = googleData.name;
} else if (googleData?.display_name) {
  fallbackName = googleData.display_name;
} else if (googleData?.given_name && googleData?.family_name) {
  fallbackName = `${googleData.given_name} ${googleData.family_name}`;
} else if (googleData?.given_name) {
  fallbackName = googleData.given_name;
}

return {
  id: userId,
  email: user.email || '',
  full_name: fallbackName, // ✅ تم التحديث
  // ...
};
```

### 4. **getUserProfile timeout fallback** (السطر ~489)
```typescript
// محاولة استخراج الاسم من user_metadata
const googleData = user.user_metadata;
let fallbackName = 'مستخدم';

if (googleData?.full_name) {
  fallbackName = googleData.full_name;
} else if (googleData?.name) {
  fallbackName = googleData.name;
} else if (googleData?.display_name) {
  fallbackName = googleData.display_name;
} else if (googleData?.given_name && googleData?.family_name) {
  fallbackName = `${googleData.given_name} ${googleData.family_name}`;
} else if (googleData?.given_name) {
  fallbackName = googleData.given_name;
}

return {
  id: userId,
  email: user.email || '',
  full_name: fallbackName, // ✅ تم التحديث
  // ...
};
```

### 5. **signIn immediate auth state** (السطر ~800)
```typescript
// محاولة استخراج الاسم من user_metadata
const googleData = data.user.user_metadata;
let fallbackName = 'مستخدم';

if (googleData?.full_name) {
  fallbackName = googleData.full_name;
} else if (googleData?.name) {
  fallbackName = googleData.name;
} else if (googleData?.display_name) {
  fallbackName = googleData.display_name;
} else if (googleData?.given_name && googleData?.family_name) {
  fallbackName = `${googleData.given_name} ${googleData.family_name}`;
} else if (googleData?.given_name) {
  fallbackName = googleData.given_name;
}

const immediateAuthState = {
  user: data.user,
  profile: {
    id: data.user.id,
    email: data.user.email || '',
    full_name: fallbackName, // ✅ تم التحديث
    // ...
  },
  // ...
};
```

## النتائج المتوقعة:

### ✅ **بعد الإصلاح:**
- ✅ **عرض الاسم الكامل من Google** بدلاً من البريد الإلكتروني
- ✅ **دعم عدة تنسيقات للاسم** من `user_metadata`
- ✅ **fallback ذكي** إلى "مستخدم" إذا لم يكن الاسم متوفر
- ✅ **عمل في جميع حالات تسجيل الدخول**

### ✅ **تسلسل استخراج الاسم:**
1. **`full_name`** - الاسم الكامل من Google
2. **`name`** - الاسم من Google
3. **`display_name`** - اسم العرض من Google
4. **`given_name + family_name`** - الاسم الأول + اسم العائلة
5. **`given_name`** - الاسم الأول فقط
6. **`مستخدم`** - fallback نهائي

## اختبار الإصلاح:

### 1. **تسجيل دخول جديد عبر Google:**
- يجب أن يظهر الاسم الكامل من Google
- يجب ألا يظهر البريد الإلكتروني

### 2. **تسجيل دخول مستخدم موجود:**
- يجب أن يظهر الاسم المحفوظ في قاعدة البيانات
- يجب أن يتم تحديث الاسم من Google إذا كان مختلفاً

### 3. **في حالة عدم توفر الاسم:**
- يجب أن يظهر "مستخدم" بدلاً من البريد الإلكتروني

## ملاحظات مهمة:

1. **التوافق:** الإصلاح يحافظ على جميع الوظائف الموجودة
2. **الأمان:** لا يؤثر على أمان البيانات
3. **الأداء:** يحسن تجربة المستخدم
4. **المرونة:** يدعم عدة تنسيقات لأسماء Google

---

## 🎯 **النتيجة النهائية:**

الآن عندما يسجل المستخدم دخول عبر Google:
- ✅ **سيظهر اسمه الكامل** من Google
- ✅ **لن يظهر البريد الإلكتروني** كاسم
- ✅ **fallback ذكي** إلى "مستخدم" إذا لم يكن الاسم متوفر
- ✅ **تجربة مستخدم محسنة** ومتسقة
