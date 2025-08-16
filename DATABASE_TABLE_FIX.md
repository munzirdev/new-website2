# إصلاح مشكلة اسم الجدول في قاعدة البيانات 🔧

## المشكلة:
```
❌ خطأ في جلب الملف الشخصي: Error: Profile loading timeout
GET https://fctvityawavmuethxxix.supabase.co/rest/v1/user_profiles?select=*&id=eq.71d20cff-01a2-41c3-ae7d-250484b8ae47 406 (Not Acceptable)
```

## السبب:
الكود كان يحاول الوصول إلى جدول `user_profiles` بينما الجدول الصحيح في قاعدة البيانات هو `profiles`.

## الحل المطبق:

### ✅ **استبدال جميع المراجع من `user_profiles` إلى `profiles`**

#### الملفات المحدثة:

1. **`src/hooks/useAuth.ts`** (4 مواقع)
   ```typescript
   // قبل التحديث
   .from('user_profiles')
   
   // بعد التحديث
   .from('profiles')
   ```

2. **`src/lib/voluntaryReturnService.ts`** (6 مواقع)
   ```typescript
   // قبل التحديث
   .from('user_profiles')
   
   // بعد التحديث
   .from('profiles')
   ```

3. **`src/lib/healthInsuranceActivationService.ts`** (4 مواقع)
   ```typescript
   // قبل التحديث
   .from('user_profiles')
   
   // بعد التحديث
   .from('profiles')
   ```

4. **`src/services/webhookService.ts`** (2 مواقع)
   ```typescript
   // قبل التحديث
   .from('user_profiles')
   
   // بعد التحديث
   .from('profiles')
   ```

5. **`supabase/functions/create-moderator/index.ts`** (2 مواقع)
   ```typescript
   // قبل التحديث
   .from('user_profiles')
   
   // بعد التحديث
   .from('profiles')
   ```

## الأوامر المستخدمة:

```powershell
# استبدال في جميع الملفات
powershell -Command "(Get-Content src/hooks/useAuth.ts) -replace 'user_profiles', 'profiles' | Set-Content src/hooks/useAuth.ts"
powershell -Command "(Get-Content src/lib/voluntaryReturnService.ts) -replace 'user_profiles', 'profiles' | Set-Content src/lib/voluntaryReturnService.ts"
powershell -Command "(Get-Content src/lib/healthInsuranceActivationService.ts) -replace 'user_profiles', 'profiles' | Set-Content src/lib/healthInsuranceActivationService.ts"
powershell -Command "(Get-Content src/services/webhookService.ts) -replace 'user_profiles', 'profiles' | Set-Content src/services/webhookService.ts"
powershell -Command "(Get-Content supabase/functions/create-moderator/index.ts) -replace 'user_profiles', 'profiles' | Set-Content supabase/functions/create-moderator/index.ts"
```

## النتائج المتوقعة:

### ✅ **بعد الإصلاح:**
- ✅ **إزالة خطأ 406 (Not Acceptable)**
- ✅ **إزالة خطأ Profile loading timeout**
- ✅ **عمل جميع وظائف الملف الشخصي بشكل صحيح**
- ✅ **عمل تسجيل الدخول عبر Google بشكل صحيح**
- ✅ **عمل جميع الخدمات التي تعتمد على الملف الشخصي**

### ✅ **الوظائف التي ستعمل الآن:**
1. **تسجيل الدخول عبر Google** - إنشاء وتحديث الملف الشخصي
2. **عرض اسم المستخدم** - من Google أو من قاعدة البيانات
3. **عرض صورة المستخدم** - من Google أو fallback
4. **جميع الخدمات** - التأمين الصحي، العودة الطوعية، إلخ
5. **إدارة المشرفين** - إنشاء وتحديث المشرفين

## اختبار الإصلاح:

### 1. **تسجيل دخول جديد عبر Google:**
- يجب أن يتم إنشاء ملف شخصي بنجاح
- يجب أن يظهر الاسم الكامل من Google
- يجب أن تظهر الصورة الشخصية

### 2. **تسجيل دخول مستخدم موجود:**
- يجب أن يتم جلب الملف الشخصي بنجاح
- يجب أن يتم تحديث البيانات من Google

### 3. **فحص Console:**
- يجب ألا تظهر أخطاء 406
- يجب ألا تظهر أخطاء timeout
- يجب أن تظهر رسائل نجاح جلب الملف الشخصي

## ملاحظات مهمة:

1. **التوافق:** الإصلاح يحافظ على جميع الوظائف الموجودة
2. **الأمان:** لا يؤثر على أمان البيانات
3. **الأداء:** يحسن الأداء بإزالة الأخطاء
4. **البيانات:** لا يؤثر على البيانات الموجودة

---

## 🎯 **النتيجة النهائية:**

الآن جميع استعلامات قاعدة البيانات ستعمل بشكل صحيح:
- ✅ **جدول `profiles`** بدلاً من `user_profiles`
- ✅ **إزالة جميع أخطاء 406**
- ✅ **عمل جميع وظائف الملف الشخصي**
- ✅ **تجربة مستخدم محسنة**
