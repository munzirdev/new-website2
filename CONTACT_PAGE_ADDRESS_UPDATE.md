# تحديث صفحة معلومات الاتصال - إضافة عنوان المكتب

## التحديث المطبق

تم إضافة عنوان المكتب من الفوتر إلى صفحة معلومات الاتصال في الموقع.

### التغييرات المطبقة:

#### 1. تحديث ملف الترجمة (`src/hooks/useLanguage.ts`)

**العربية:**
```javascript
'contact.info.address': 'CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin',
```

**التركية:**
```javascript
'contact.info.address': 'CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin',
```

**الإنجليزية:**
```javascript
'contact.info.address': 'CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin',
```

#### 2. تحديث صفحة الاتصال (`src/App.tsx`)

تم تحويل العنوان من نص عادي إلى رابط قابل للنقر:

```jsx
<div className="flex items-center glass-effect dark:glass-effect-dark p-3 rounded-lg">
  <MapPin className="w-6 h-6 text-green-300 ml-3" />
  <a 
    href="https://maps.app.goo.gl/39YFtk8fcES8p1JA8?g_st=awb" 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-white/90 hover:text-green-300 transition-colors duration-300 cursor-pointer"
  >
    {t('contact.info.address')}
  </a>
</div>
```

### المميزات الجديدة:

1. **عنوان المكتب واضح**: يظهر العنوان الكامل للمكتب في صفحة الاتصال
2. **رابط خريطة Google**: عند النقر على العنوان، يفتح خريطة Google في نافذة جديدة
3. **تأثيرات بصرية**: تغيير لون النص عند التمرير عليه
4. **متعدد اللغات**: العنوان متاح بجميع اللغات المدعومة

### العنوان المحدث:

**CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin**

### رابط الخريطة:

**https://maps.app.goo.gl/39YFtk8fcES8p1JA8?g_st=awb**

### كيفية الاختبار:

1. اذهب إلى صفحة الاتصال في الموقع
2. ابحث عن قسم "معلومات الاتصال"
3. ستجد العنوان مع أيقونة الموقع
4. انقر على العنوان لفتح خريطة Google
5. تحقق من أن الرابط يفتح في نافذة جديدة

### ملاحظات:

- العنوان متطابق مع العنوان الموجود في الفوتر
- الرابط يفتح في نافذة جديدة لعدم فقدان المستخدم للموقع
- تم إضافة تأثيرات بصرية لتحسين تجربة المستخدم
- العنوان متاح بجميع اللغات المدعومة (العربية، التركية، الإنجليزية)
