# إعداد نطاق مخصص للمصادقة - الحل الأفضل 🚀

## المشكلة الحالية:
```
Sign in to fctvityawavmuethxxix.supabase.co
```

## الحل: نطاق مخصص للمصادقة

### 1. شراء نطاق فرعي
اشتري نطاق فرعي مثل:
- `auth.tevasul.group`
- `login.tevasul.group`
- `signin.tevasul.group`

### 2. إعداد DNS Records

#### أ. إذا كان لديك إدارة DNS:
أضف CNAME record:
```
Type: CNAME
Name: auth
Value: fctvityawavmuethxxix.supabase.co
TTL: 3600 (أو أقل)
```

#### ب. إذا كنت تستخدم Cloudflare:
1. اذهب إلى DNS Settings
2. أضف CNAME record:
   - Name: `auth`
   - Target: `fctvityawavmuethxxix.supabase.co`
   - Proxy status: DNS only (رمادي)

### 3. تحديث إعدادات Supabase

#### أ. في لوحة تحكم Supabase:
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `fctvityawavmuethxxix`
3. اذهب إلى **Settings** > **General**
4. ابحث عن **Custom Domains** أو **Custom Auth Domain**
5. أضف: `auth.tevasul.group`

#### ب. انتظار التحقق:
- قد يستغرق التحقق من DNS 24-48 ساعة
- ستظهر رسالة "Verified" عند اكتمال التحقق

### 4. تحديث إعدادات Google Cloud Console

#### أ. تحديث Authorized Domains:
```
tevasul.group
auth.tevasul.group
```

#### ب. تحديث Authorized Redirect URIs:
```
https://auth.tevasul.group/auth/callback
https://tevasul.group/auth/callback
http://localhost:5173/auth/callback
```

### 5. تحديث التطبيق

#### أ. تحديث GoogleSignInButton:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    // إضافة النطاق المخصص
    customDomain: 'auth.tevasul.group'
  },
});
```

#### ب. تحديث AuthCallback:
```typescript
// التأكد من أن النطاق المخصص يعمل
const customDomain = 'auth.tevasul.group';
```

## النتيجة المتوقعة:

بدلاً من:
```
Sign in to fctvityawavmuethxxix.supabase.co
```

ستظهر:
```
Sign in to auth.tevasul.group
```

## الخطوات السريعة:

### 1. فوري (بدون نطاق مخصص):
1. اذهب إلى Supabase Dashboard
2. Authentication > Settings
3. ابحث عن "Site Name" أو "Branding"
4. غيّر الاسم إلى "Tevasul Group"

### 2. متوسط المدى (مع نطاق مخصص):
1. اشتري `auth.tevasul.group`
2. أضف CNAME record
3. أضف النطاق في Supabase
4. انتظر التحقق من DNS

### 3. طويل المدى (تخصيص كامل):
1. أنشئ صفحة مصادقة مخصصة
2. استخدم Supabase Auth Helpers
3. تخصيص كامل للتجربة

## تكلفة النطاق المخصص:

- **النطاق الفرعي**: عادة مجاني مع النطاق الرئيسي
- **DNS Management**: عادة مجاني
- **Supabase Custom Domain**: قد يكون مدفوع في الخطط المتقدمة

## بدائل سريعة:

### 1. استخدام Supabase Auth Helpers:
```bash
npm install @supabase/auth-helpers-react
```

### 2. إنشاء صفحة مصادقة مخصصة:
```typescript
// CustomAuthPage.tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function CustomAuthPage() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={['google']}
      redirectTo="https://tevasul.group/auth/callback"
    />
  )
}
```

## ملاحظات مهمة:

1. **الأمان**: النطاق المخصص أكثر أماناً
2. **العلامة التجارية**: يحسن صورة الموقع
3. **الأداء**: قد يحسن الأداء قليلاً
4. **SEO**: لا يؤثر على SEO

## الدعم:

إذا واجهت مشاكل:
1. تحقق من DNS propagation
2. تأكد من صحة CNAME record
3. انتظر 24-48 ساعة للتحقق
4. راجع وثائق Supabase الرسمية
