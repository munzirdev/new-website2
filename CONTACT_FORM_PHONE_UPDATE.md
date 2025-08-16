# تحديث نموذج الاتصال - إضافة حقل الهاتف

## التحديث المطبق

تم إضافة حقل رقم الهاتف إلى نموذج الاتصال وجعله إجبارياً، بينما أصبح حقل البريد الإلكتروني اختيارياً.

### التغييرات المطبقة:

#### 1. تحديث حالة النموذج (`src/App.tsx`)

**قبل التحديث:**
```javascript
const [contactForm, setContactForm] = useState({
  name: '',
  email: '',
  serviceType: '',
  message: ''
});
```

**بعد التحديث:**
```javascript
const [contactForm, setContactForm] = useState({
  name: '',
  email: '',
  phone: '',
  serviceType: '',
  message: ''
});
```

#### 2. إضافة ترجمات حقل الهاتف (`src/hooks/useLanguage.ts`)

**العربية:**
```javascript
'contact.form.phone': 'رقم الهاتف',
```

**التركية:**
```javascript
'contact.form.phone': 'Telefon Numarası',
```

**الإنجليزية:**
```javascript
'contact.form.phone': 'Phone Number',
```

#### 3. إضافة حقل الهاتف إلى النموذج

```jsx
<div>
  <label className={`block text-sm font-medium text-white/90 mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>
    {t('contact.form.phone')}
  </label>
  <input
    type="tel"
    value={contactForm.phone}
    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
    className="w-full px-4 py-3 glass-effect dark:glass-effect-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
    placeholder="+90 534 962 72 41"
    required
  />
</div>
```

#### 4. تحديث التحقق من صحة النموذج

**قبل التحديث:**
```javascript
if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
  setContactError('يرجى ملء جميع الحقول المطلوبة');
  return;
}
```

**بعد التحديث:**
```javascript
if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) {
  setContactError('يرجى ملء جميع الحقول المطلوبة (الاسم، رقم الهاتف، الرسالة)');
  return;
}
```

#### 5. تحديث بيانات الرسالة

**قبل التحديث:**
```javascript
const messageData = {
  user_id: user?.id || null,
  name: contactForm.name.trim(),
  email: contactForm.email.trim(),
  subject: contactForm.serviceType ? `${contactForm.serviceType} - طلب خدمة` : 'رسالة تواصل',
  message: contactForm.message.trim(),
  status: 'pending'
};
```

**بعد التحديث:**
```javascript
const messageData = {
  user_id: user?.id || null,
  name: contactForm.name.trim(),
  email: contactForm.email.trim() || null,
  phone: contactForm.phone.trim(),
  subject: contactForm.serviceType ? `${contactForm.serviceType} - طلب خدمة` : 'رسالة تواصل',
  message: contactForm.message.trim(),
  status: 'pending'
};
```

### الحقول المطلوبة والاختيارية:

#### الحقول المطلوبة (Required):
1. **الاسم الكامل** - مطلوب
2. **رقم الهاتف** - مطلوب (جديد)
3. **الرسالة** - مطلوبة

#### الحقول الاختيارية (Optional):
1. **البريد الإلكتروني** - اختياري (تم تغييره من مطلوب)
2. **نوع الخدمة** - اختياري

### المميزات الجديدة:

1. **حقل الهاتف إجباري**: يجب على المستخدم إدخال رقم هاتف صحيح
2. **البريد الإلكتروني اختياري**: يمكن للمستخدم إرسال الرسالة بدون بريد إلكتروني
3. **تحقق محسن**: رسائل خطأ أكثر وضوحاً تشير إلى الحقول المطلوبة
4. **تنسيق الهاتف**: حقل من نوع `tel` مع placeholder مناسب
5. **متعدد اللغات**: ترجمة حقل الهاتف بجميع اللغات المدعومة

### كيفية الاختبار:

1. اذهب إلى صفحة الاتصال في الموقع
2. جرب إرسال رسالة بدون رقم هاتف - يجب أن تظهر رسالة خطأ
3. جرب إرسال رسالة بدون بريد إلكتروني - يجب أن تعمل
4. جرب إرسال رسالة مع جميع البيانات - يجب أن تعمل
5. تحقق من أن رقم الهاتف يتم حفظه في قاعدة البيانات

### ملاحظات:

- رقم الهاتف أصبح إجبارياً لضمان التواصل مع العملاء
- البريد الإلكتروني أصبح اختياري لتسهيل عملية التواصل
- تم الحفاظ على جميع المميزات الأخرى للنموذج
- الرسائل في التيليجرام ستشمل رقم الهاتف الجديد
