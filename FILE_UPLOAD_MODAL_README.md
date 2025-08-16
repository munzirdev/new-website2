# File Upload Modal - مودال رفع الملفات

## الميزات - Features

### 🎨 التصميم - Design
- **زجاجي شفاف** - Glass morphism effect
- **تأثيرات بصرية** - Visual animations
- **ألوان متدرجة** - Gradient colors
- **ظلال متقدمة** - Advanced shadows

### ⚡ التأثيرات - Animations
- **انزلاق من الأسفل** - Slide in from bottom
- **نبض للأيقونات** - Pulse animation for icons
- **ارتداد للنجاح** - Bounce for success
- **شريط تقدم** - Progress bar with countdown
- **ظهور تدريجي** - Fade in effects

### 🌐 دعم اللغات - Language Support
- **العربية** - Arabic
- **الإنجليزية** - English
- **تلقائي حسب إعدادات التطبيق** - Automatic based on app settings

### ⏱️ التوقيت - Timing
- **3 ثواني** - 3 seconds display
- **إغلاق تلقائي** - Auto close
- **إغلاق يدوي** - Manual close button

## الاستخدام - Usage

### في HealthInsurancePage.tsx
```typescript
// State for modal
const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadModalData, setUploadModalData] = useState({
  isSuccess: false,
  message: ''
});

// Show success modal
setUploadModalData({
  isSuccess: true,
  message: isArabic ? 'تم رفع الملف بنجاح!' : 'File uploaded successfully!'
});
setShowUploadModal(true);

// Show error modal
setUploadModalData({
  isSuccess: false,
  message: isArabic ? 'فشل في رفع الملف' : 'Failed to upload file'
});
setShowUploadModal(true);

// Add to JSX
<FileUploadModal
  isVisible={showUploadModal}
  isSuccess={uploadModalData.isSuccess}
  message={uploadModalData.message}
  onClose={() => setShowUploadModal(false)}
/>
```

## الملفات - Files

### FileUploadModal.tsx
- المكون الرئيسي - Main component
- منطق العرض - Display logic
- إدارة الحالة - State management

### FileUploadModal.css
- التأثيرات البصرية - Visual effects
- الرسوم المتحركة - Animations
- التصميم الزجاجي - Glass morphism styles

## الألوان - Colors

### النجاح - Success
- **أخضر متدرج** - Green gradient
- **أيقونة خضراء** - Green icon
- **خلفية خضراء شفافة** - Transparent green background

### الفشل - Error
- **أحمر متدرج** - Red gradient
- **أيقونة حمراء** - Red icon
- **خلفية حمراء شفافة** - Transparent red background

## التأثيرات - Effects

### Backdrop
- **ضبابية خلفية** - Background blur
- **شفافية سوداء** - Black transparency
- **إغلاق عند النقر** - Close on click

### Modal
- **زجاجي شفاف** - Transparent glass
- **حدود بيضاء شفافة** - Transparent white border
- **ظلال متقدمة** - Advanced shadows
- **انزلاق من الأسفل** - Slide from bottom

### Icons
- **نجاح: ارتداد** - Success: bounce
- **فشل: نبض** - Error: pulse
- **خلفية دائرية** - Circular background

### Progress Bar
- **عد تنازلي 3 ثواني** - 3 second countdown
- **لون متدرج** - Gradient color
- **انكماش تدريجي** - Gradual shrinking
