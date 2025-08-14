# دليل استخدام المؤشر المخصص

## نظرة عامة
تم إنشاء نظام مؤشر مخصص يمكن تطبيقه على جميع الصفحات، بما في ذلك الصفحات الجديدة التي سيتم إنشاؤها لاحقاً.

## المكونات المتاحة

### 1. CustomCursor
مكون المؤشر المخصص الأساسي:
```tsx
import CustomCursor from './components/CustomCursor';

// استخدام مباشر
<CustomCursor />
```

### 2. CursorWrapper
مكون wrapper يطبق المؤشر المخصص على الصفحة بأكملها:
```tsx
import CursorWrapper from './components/CursorWrapper';

// تطبيق على صفحة كاملة
return (
  <CursorWrapper>
    <div className="min-h-screen">
      {/* محتوى الصفحة */}
    </div>
  </CursorWrapper>
);
```

### 3. useCustomCursor Hook
Hook لتطبيق المؤشر المخصص برمجياً:
```tsx
import { useCustomCursor } from './hooks/useCustomCursor';

const MyComponent = () => {
  useCustomCursor(); // يطبق المؤشر المخصص
  
  return (
    <div>
      {/* محتوى المكون */}
    </div>
  );
};
```

## كيفية تطبيق المؤشر المخصص على صفحة جديدة

### الطريقة الأولى (الأسهل): استخدام CursorWrapper
```tsx
import React from 'react';
import CursorWrapper from './components/CursorWrapper';

const NewPage: React.FC = () => {
  return (
    <CursorWrapper>
      <div className="min-h-screen bg-white dark:bg-jet-800">
        {/* محتوى الصفحة */}
        <h1>صفحة جديدة</h1>
      </div>
    </CursorWrapper>
  );
};

export default NewPage;
```

### الطريقة الثانية: استخدام Hook
```tsx
import React from 'react';
import { useCustomCursor } from './hooks/useCustomCursor';
import CustomCursor from './components/CustomCursor';

const NewPage: React.FC = () => {
  useCustomCursor();
  
  return (
    <div className="min-h-screen bg-white dark:bg-jet-800 cursor-none">
      {/* محتوى الصفحة */}
      <h1>صفحة جديدة</h1>
      
      {/* إضافة المؤشر المخصص */}
      <CustomCursor />
    </div>
  );
};

export default NewPage;
```

## الميزات

### ✅ المؤشر المخصص يعمل على:
- جميع الصفحات الحالية
- الصفحات الجديدة التي سيتم إنشاؤها
- أجهزة سطح المكتب فقط (يختفي على الأجهزة اللمسية)
- جميع العناصر القابلة للنقر

### 🎨 تصميم المؤشر:
- **المؤشر الرئيسي**: نقطة دائرية مع تأثير توهج
- **الحلقة الخارجية**: حلقة دائرية حول المؤشر
- **التأثير الخلفي**: تأثير توهج خلف المؤشر
- **التفاعل**: يتغير حجمه ولونه عند التمرير فوق العناصر القابلة للنقر

### 📱 التوافق:
- **سطح المكتب**: المؤشر المخصص يعمل بشكل كامل
- **الأجهزة اللمسية**: المؤشر العادي يعمل (المؤشر المخصص يختفي)
- **إمكانية الوصول**: دعم كامل للعناصر القابلة للنقر

## الصفحات المطبقة عليها المؤشر المخصص

### ✅ تم التطبيق:
- `AdminDashboard.tsx` ✅ (تم التطبيق بنجاح)
- `VoluntaryReturnPage.tsx`
- `UserAccount.tsx`
- `App.tsx` (الصفحة الرئيسية)
- `ServicePage.tsx`

### 🔄 للصفحات الجديدة:
استخدم `CursorWrapper` أو `useCustomCursor` hook كما هو موضح أعلاه.

## استكشاف الأخطاء

### المشكلة: المؤشر لا يظهر
**الحل**: تأكد من:
1. استيراد `CursorWrapper` أو `CustomCursor`
2. تطبيق `cursor-none` class على العنصر الرئيسي
3. إضافة CSS لإخفاء المؤشر الافتراضي
4. التأكد من أن الجهاز ليس لمسي

### المشكلة: المؤشر يظهر على الأجهزة اللمسية
**الحل**: المؤشر مصمم ليختفي تلقائياً على الأجهزة اللمسية. هذا سلوك طبيعي.

### المشكلة: المؤشر لا يتفاعل مع العناصر
**الحل**: تأكد من:
1. إضافة `cursor-element` class للمؤشر
2. تطبيق `z-index: 9999` للمؤشر
3. التأكد من أن العناصر القابلة للنقر تحتوي على `cursor: pointer`

## التحديثات الأخيرة

### ✅ تم التطبيق على AdminDashboard:
- إضافة state للمؤشر المخصص
- إضافة useEffect لإدارة حركة المؤشر
- إضافة CSS لإخفاء المؤشر الافتراضي
- إضافة مكونات المؤشر المخصص
- نفس التصميم والألوان المستخدمة في الصفحة الرئيسية

### 🎨 تصميم المؤشر في AdminDashboard:
- **اللون الأساسي**: أبيض مع حلقة بيضاء
- **اللون عند التمرير**: أخضر caribbean مع حلقة خضراء
- **التأثير الخلفي**: توهج خلفي بنفس الألوان
- **الانتقال**: تأثير سلس عند التغيير
