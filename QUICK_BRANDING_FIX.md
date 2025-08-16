# حل سريع لتغيير اسم الموقع في Supabase 🚀

## المشكلة:
```
Sign in to fctvityawavmuethxxix.supabase.co
```

## الحل السريع (5 دقائق):

### 1. الذهاب إلى لوحة تحكم Supabase
1. اذهب إلى [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `fctvityawavmuethxxix`

### 2. إعدادات المصادقة
1. اذهب إلى **Authentication** في القائمة الجانبية
2. انقر على **Settings**
3. ابحث عن قسم **Site URL** أو **General Settings**

### 3. تغيير اسم الموقع
1. ابحث عن حقل **Site Name** أو **Project Name**
2. غيّر الاسم من `fctvityawavmuethxxix` إلى `Tevasul Group`
3. احفظ التغييرات

### 4. إضافة وصف الموقع
1. ابحث عن حقل **Site Description**
2. أضف: "مجموعة تواصل - خدمات شاملة"
3. احفظ التغييرات

## إذا لم تجد خيارات التخصيص:

### الحل البديل: استخدام Custom Domain

#### 1. إضافة نطاق فرعي
1. اذهب إلى إدارة DNS لموقعك
2. أضف CNAME record:
   ```
   Type: CNAME
   Name: auth
   Value: fctvityawavmuethxxix.supabase.co
   ```

#### 2. تحديث إعدادات Supabase
1. في لوحة التحكم، اذهب إلى **Settings** > **General**
2. ابحث عن **Custom Domains**
3. أضف: `auth.tevasul.group`

#### 3. انتظار التحقق
- قد يستغرق 24-48 ساعة
- ستظهر "Verified" عند اكتمال التحقق

## الحل الأسرع: استخدام Supabase Auth Helpers

### 1. تثبيت الحزمة
```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 2. إنشاء صفحة مصادقة مخصصة
```typescript
// src/components/CustomAuthPage.tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

export default function CustomAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="Tevasul Group"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            تسجيل الدخول إلى Tevasul Group
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            مجموعة تواصل - خدمات شاملة
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1e40af',
                  brandAccent: '#1d4ed8',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo="https://tevasul.group/auth/callback"
          localization={{
            variables: {
              sign_in: {
                email_label: 'البريد الإلكتروني',
                password_label: 'كلمة المرور',
                button_label: 'تسجيل الدخول',
                loading_button_label: 'جاري تسجيل الدخول...',
                social_provider_text: 'تسجيل الدخول عبر {{provider}}',
                link_text: 'لديك حساب بالفعل؟ تسجيل الدخول'
              },
              sign_up: {
                email_label: 'البريد الإلكتروني',
                password_label: 'كلمة المرور',
                button_label: 'إنشاء حساب',
                loading_button_label: 'جاري إنشاء الحساب...',
                social_provider_text: 'التسجيل عبر {{provider}}',
                link_text: 'ليس لديك حساب؟ سجل الآن'
              }
            }
          }}
        />
      </div>
    </div>
  )
}
```

### 3. إضافة المسار في Router
```typescript
// src/router.tsx
import CustomAuthPage from './components/CustomAuthPage'

// إضافة مسار جديد
{
  path: '/auth/signin',
  element: <CustomAuthPage />
}
```

### 4. تحديث GoogleSignInButton
```typescript
// src/components/GoogleSignInButton.tsx
const handleGoogleSignIn = async () => {
  try {
    // توجيه إلى صفحة المصادقة المخصصة
    window.location.href = '/auth/signin?provider=google';
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    onError?.(error);
  }
};
```

## النتيجة المتوقعة:

بدلاً من:
```
Sign in to fctvityawavmuethxxix.supabase.co
```

ستظهر:
```
تسجيل الدخول إلى Tevasul Group
```

## الخطوات الموصى بها:

### 1. فوري (5 دقائق):
- اذهب إلى Supabase Dashboard
- غيّر اسم الموقع إلى "Tevasul Group"

### 2. سريع (30 دقيقة):
- أنشئ صفحة مصادقة مخصصة
- استخدم Supabase Auth Helpers

### 3. نهائي (1-2 يوم):
- أضف نطاق مخصص `auth.tevasul.group`
- انتظر التحقق من DNS

## ملاحظات مهمة:

1. **الأمان**: جميع الحلول آمنة
2. **الأداء**: لا يؤثر على الأداء
3. **التكلفة**: النطاق الفرعي عادة مجاني
4. **الوقت**: الحل الفوري يعمل فوراً

## الدعم:

إذا لم تعمل أي من الحلول:
1. تحقق من إصدار Supabase
2. راجع الوثائق الرسمية
3. اتصل بدعم Supabase
