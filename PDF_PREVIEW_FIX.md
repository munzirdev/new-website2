# حل مشكلة معاينة ملفات PDF - PDF Preview Fix

## المشكلة (Problem)
عندما يكون الملف PDF، لا يظهر في معاينة الملف في لوحة التحكم. يظهر فقط رسالة "معاينة غير متاحة لهذا النوع من الملفات".

When the file is PDF, it doesn't appear in the file preview in the admin panel. It only shows "Preview not available for this file type".

## السبب (Cause)
الكود الحالي يحدد نوع الملف كـ 'image' دائماً، ولا يتحقق من امتداد الملف الفعلي. كما أن modal معاينة الملف لا يدعم ملفات PDF.

The current code always sets the file type as 'image' and doesn't check the actual file extension. Also, the file preview modal doesn't support PDF files.

## الحل (Solution)

### الخطوة 1: تحديث تحديد نوع الملف
### Step 1: Update file type detection

في ملف `src/components/HealthInsuranceManagement.tsx`، ابحث عن الكود التالي:

In the file `src/components/HealthInsuranceManagement.tsx`, find this code:

```tsx
onClick={() => {
  setSelectedFile({
    url: `https://fctvityawavmuethxxix.supabase.co/storage/v1/object/public/passport-images/${request.passport_image_url}`,
    name: `Passport_${request.contact_name}_${request.id}`,
    type: 'image'
  });
  setShowFilePreview(true);
}}
```

واستبدله بـ:

And replace it with:

```tsx
onClick={() => {
  // تحديد نوع الملف بناءً على امتداده
  const fileExtension = request.passport_image_url?.split('.').pop()?.toLowerCase();
  let fileType = 'image';
  if (fileExtension === 'pdf') {
    fileType = 'pdf';
  } else if (['doc', 'docx'].includes(fileExtension || '')) {
    fileType = 'document';
  }
  
  setSelectedFile({
    url: `https://fctvityawavmuethxxix.supabase.co/storage/v1/object/public/passport-images/${request.passport_image_url}`,
    name: `Passport_${request.contact_name}_${request.id}`,
    type: fileType
  });
  setShowFilePreview(true);
}}
```

### الخطوة 2: تحديث modal معاينة الملف
### Step 2: Update file preview modal

ابحث عن قسم "File Preview" في نفس الملف واستبدله بـ:

Find the "File Preview" section in the same file and replace it with:

```tsx
{/* File Preview */}
<div className="bg-gray-50 dark:bg-jet-700 rounded-lg p-4">
  {selectedFile.type === 'image' ? (
    <div className="text-center">
      <img
        src={selectedFile.url}
        alt={selectedFile.name}
        className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const errorDiv = document.createElement('div');
          errorDiv.className = 'text-red-500 dark:text-red-400 p-8 text-center';
          errorDiv.innerHTML = isArabic ? 'خطأ في تحميل الصورة' : 'Error loading image';
          target.parentNode?.appendChild(errorDiv);
        }}
      />
    </div>
  ) : selectedFile.type === 'pdf' ? (
    <div className="text-center">
      <iframe
        src={`${selectedFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-96 mx-auto rounded-lg shadow-lg border border-gray-300 dark:border-gray-600"
        title={selectedFile.name}
        onError={(e) => {
          const target = e.target as HTMLIFrameElement;
          target.style.display = 'none';
          const errorDiv = document.createElement('div');
          errorDiv.className = 'text-red-500 dark:text-red-400 p-8 text-center';
          errorDiv.innerHTML = isArabic ? 'خطأ في تحميل ملف PDF' : 'Error loading PDF file';
          target.parentNode?.appendChild(errorDiv);
        }}
      />
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {isArabic ? 'إذا لم يظهر الملف، اضغط على "فتح في نافذة جديدة"' : 'If the file doesn\'t appear, click "Open in New Tab"'}
      </p>
    </div>
  ) : (
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        {isArabic ? 'معاينة غير متاحة لهذا النوع من الملفات' : 'Preview not available for this file type'}
      </p>
    </div>
  )}
</div>
```

### الخطوة 3: تحديث معلومات الملف
### Step 3: Update file information

ابحث عن قسم "File Info" واستبدله بـ:

Find the "File Info" section and replace it with:

```tsx
{/* File Info */}
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
  <div className="flex items-center space-x-3 space-x-reverse">
    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
      {selectedFile.type === 'pdf' ? (
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ) : selectedFile.type === 'document' ? (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <div>
      <h4 className="font-semibold text-blue-800 dark:text-blue-200">
        {selectedFile.name}
      </h4>
      <p className="text-sm text-blue-600 dark:text-blue-400">
        {selectedFile.type === 'pdf' 
          ? (isArabic ? 'ملف PDF' : 'PDF Document')
          : selectedFile.type === 'document'
          ? (isArabic ? 'مستند Word' : 'Word Document')
          : (isArabic ? 'صورة جواز السفر أو الإقامة' : 'Passport or Residence Image')
        }
      </p>
    </div>
  </div>
</div>
```

## التغييرات المطبقة (Applied Changes)

### 1. تحديد نوع الملف ديناميكياً
### 1. Dynamic file type detection

- تم إضافة منطق لتحديد نوع الملف بناءً على امتداده
- Added logic to determine file type based on extension
- يدعم PDF, DOC, DOCX بالإضافة إلى الصور
- Supports PDF, DOC, DOCX in addition to images

### 2. معاينة ملفات PDF
### 2. PDF file preview

- تم إضافة iframe لعرض ملفات PDF
- Added iframe to display PDF files
- تم إضافة رسائل مساعدة للمستخدم
- Added helpful messages for users

### 3. أيقونات مختلفة لأنواع الملفات
### 3. Different icons for file types

- أيقونة حمراء لملفات PDF
- Red icon for PDF files
- أيقونة زرقاء لمستندات Word
- Blue icon for Word documents
- أيقونة صورة للصور
- Image icon for images

### 4. رسائل وصفية محسنة
### 4. Improved descriptive messages

- وصف مناسب لكل نوع ملف
- Appropriate description for each file type
- رسائل خطأ محسنة
- Improved error messages

## للتنفيذ (To Execute)

### الطريقة الأولى: التطبيق اليدوي (Manual Application)

1. افتح ملف `src/components/HealthInsuranceManagement.tsx`
   Open the file `src/components/HealthInsuranceManagement.tsx`

2. ابحث عن الكود المذكور أعلاه
   Find the code mentioned above

3. استبدل الأجزاء المطلوبة بالتحديثات
   Replace the required parts with the updates

4. احفظ الملف واختبر الوظيفة
   Save the file and test the functionality

### الطريقة الثانية: استخدام الملف المحدث (Using Updated File)

1. استخدم الملف `src/components/HealthInsuranceManagementUpdated.tsx` كمرجع
   Use the file `src/components/HealthInsuranceManagementUpdated.tsx` as reference

2. انسخ الأجزاء المطلوبة إلى الملف الأصلي
   Copy the required parts to the original file

## اختبار الوظيفة (Testing)

1. اذهب إلى صفحة إدارة التأمين الصحي
   Go to the health insurance management page

2. ابحث عن طلب يحتوي على ملف PDF
   Find a request that contains a PDF file

3. اضغط على زر "عرض" بجانب الملف
   Click the "View" button next to the file

4. تحقق من أن ملف PDF يظهر في المعاينة
   Verify that the PDF file appears in the preview

## ملاحظات إضافية (Additional Notes)

- معاينة PDF تعتمد على دعم المتصفح
- PDF preview depends on browser support
- إذا لم يظهر PDF، يمكن للمستخدم فتحه في نافذة جديدة
- If PDF doesn't appear, user can open it in a new tab
- تم إضافة رسائل مساعدة للمستخدم
- Helpful messages have been added for users
- يدعم جميع أنواع الملفات المدعومة
- Supports all supported file types

## استكشاف الأخطاء (Troubleshooting)

### إذا لم يظهر PDF في المعاينة (If PDF doesn't appear in preview)

1. تحقق من أن المتصفح يدعم معاينة PDF
   Check if the browser supports PDF preview

2. جرب فتح الملف في نافذة جديدة
   Try opening the file in a new tab

3. تحقق من أن الملف صالح وليس تالفاً
   Check if the file is valid and not corrupted

4. تحقق من وحدة التحكم للحصول على رسائل خطأ
   Check the console for error messages

### إذا لم يتم تحديد نوع الملف بشكل صحيح (If file type is not detected correctly)

1. تحقق من امتداد الملف في قاعدة البيانات
   Check the file extension in the database

2. تأكد من أن الكود يتحقق من امتداد الملف
   Make sure the code checks the file extension

3. أضف console.log للتحقق من القيم
   Add console.log to check the values
