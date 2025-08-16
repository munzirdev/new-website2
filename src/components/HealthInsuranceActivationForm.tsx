import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Printer, 
  Download, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Heart
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { webhookService } from '../services/webhookService';
import { formatDisplayDate } from '../lib/utils';

interface HealthInsuranceFormData {
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
  address: string;
}

const HealthInsuranceActivationForm: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const { isArabic, language } = useLanguage();
  // Force Arabic language for this form
  const forceArabic = true;
  const { user } = useAuthContext();
  const [formData, setFormData] = useState<HealthInsuranceFormData>({
    fullName: '',
    identityNumber: '',
    phoneNumber: '',
    address: ''
  });
  const [showPrintView, setShowPrintView] = useState(false);
  const [errors, setErrors] = useState<Partial<HealthInsuranceFormData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Partial<HealthInsuranceFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = forceArabic ? 'الاسم مطلوب' : 'Full name is required';
    }

    if (!formData.identityNumber.trim()) {
      newErrors.identityNumber = forceArabic ? 'رقم الهوية مطلوب' : 'Identity number is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = forceArabic ? 'رقم الجوال مطلوب' : 'Mobile number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = forceArabic ? 'العنوان مطلوب' : 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveFormToDatabase = async () => {
    console.log('🔍 بدء عملية حفظ نموذج التأمين الصحي...');
    
    if (!user) {
      const message = forceArabic ? 'يجب تسجيل الدخول لحفظ النموذج' : 'Lütfen formu kaydetmek için giriş yapın';
      console.error('❌', message);
      alert(message);
      return;
    }

    const { fullName, identityNumber, phoneNumber, address } = formData;

    console.log('📊 بيانات النموذج:', formData);

    if (!fullName || !identityNumber || !phoneNumber || !address) {
      const message = forceArabic ? 'الرجاء تعبئة جميع الحقول المطلوبة' : 'Lütfen tüm zorunlu alanları doldurunuz';
      console.error('❌', message);
      alert(message);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const formDataToSave = {
        full_name: fullName,
        kimlik_no: identityNumber,
        phone: phoneNumber,
        address: address,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      console.log('💾 بيانات الحفظ:', formDataToSave);

      const { data, error } = await supabase
        .from('health_insurance_activation_forms')
        .insert([formDataToSave]);

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        throw error;
      }

      console.log('✅ تم الحفظ بنجاح:', data);
      const successMessage = forceArabic ? 'تم حفظ النموذج بنجاح!' : 'Form başarıyla kaydedildi!';
      setSaveMessage(successMessage);
      setTimeout(() => setSaveMessage(''), 5000);
      
      // إرسال إشعار التيليجرام
      try {
        const savedFormData = {
          id: Date.now().toString(), // معرف مؤقت
          full_name: fullName,
          kimlik_no: identityNumber,
          phone: phoneNumber,
          address: address,
          user_id: user.id,
          created_at: new Date().toISOString()
        };
        
        await webhookService.sendHealthInsuranceActivationWebhook(savedFormData);
      } catch (webhookError) {
        console.error('Error sending webhook notification:', webhookError);
      }
      
      // إعادة تعيين النموذج بعد الحفظ الناجح
      setFormData({
        fullName: '',
        identityNumber: '',
        phoneNumber: '',
        address: ''
      });
      
    } catch (error: any) {
      console.error('💥 خطأ في حفظ النموذج:', error);
      
      let errorMessage = isArabic ? 'خطأ في حفظ النموذج' : 'Form kaydedilirken hata oluştu';
      
      if (error?.message) {
        if (error.message.includes('المصادقة')) {
          errorMessage = isArabic ? 'خطأ في المصادقة - يرجى إعادة تسجيل الدخول' : 'Authentication error - please login again';
        } else if (error.message.includes('مكتملة')) {
          errorMessage = isArabic ? 'جميع الحقول المطلوبة يجب أن تكون مملوءة' : 'All required fields must be filled';
        } else if (error.message.includes('غير متوقع')) {
          errorMessage = isArabic ? 'خطأ غير متوقع - يرجى المحاولة مرة أخرى' : 'Unexpected error - please try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSaveMessage(errorMessage);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Auto-save form before showing print view
      if (user) {
        await saveFormToDatabase();
      }
      setShowPrintView(true);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${isArabic ? 'طلب تفعيل التأمين الصحي' : 'Health Insurance Activation Request'}</title>
              <style>
                body { 
                  font-family: ${isArabic ? 'Arial, Tahoma, sans-serif' : 'Arial, sans-serif'}; 
                  margin: 40px; 
                  direction: ${isArabic ? 'rtl' : 'ltr'};
                  text-align: ${isArabic ? 'right' : 'left'};
                }
                .header { text-align: center; margin-bottom: 30px; }
                .content { line-height: 1.6; }
                .form-field { margin: 15px 0; }
                .signature { margin-top: 40px; }
                .text-center { text-align: center !important; }
                .text-lg { font-size: 18px !important; }
                .text-base { font-size: 16px !important; }
                .font-bold { font-weight: bold !important; }
                .mb-2 { margin-bottom: 8px !important; }
                .mb-8 { margin-bottom: 32px !important; }
                @media print { body { margin: 20px; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    const printContent = document.getElementById('print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${isArabic ? 'طلب تفعيل التأمين الصحي' : 'Health Insurance Activation Request'}</title>
              <style>
                body { 
                  font-family: ${isArabic ? 'Arial, Tahoma, sans-serif' : 'Arial, sans-serif'}; 
                  margin: 40px; 
                  direction: ${isArabic ? 'rtl' : 'ltr'};
                  text-align: ${isArabic ? 'right' : 'left'};
                }
                .header { text-align: center; margin-bottom: 30px; }
                .content { line-height: 1.6; }
                .form-field { margin: 15px 0; }
                .signature { margin-top: 40px; }
                .text-center { text-align: center !important; }
                .text-lg { font-size: 18px !important; }
                .text-base { font-size: 16px !important; }
                .font-bold { font-weight: bold !important; }
                .mb-2 { margin-bottom: 8px !important; }
                .mb-8 { margin-bottom: 32px !important; }
                @media print { body { margin: 20px; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatDate = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (showPrintView) {
    return (
      <div className="min-h-screen bg-white">
        {/* Print Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-700 text-white p-4 print:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowPrintView(false)}
              className="flex items-center space-x-2 space-x-reverse bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isArabic ? 'العودة للتعديل' : 'Back to Edit'}</span>
            </button>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 space-x-reverse bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors duration-200"
              >
                <Printer className="w-4 h-4" />
                <span>{isArabic ? 'طباعة' : 'Print'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 space-x-reverse bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>{isArabic ? 'تحميل PDF' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Print Content */}
        <div id="print-content" className="p-8 max-w-4xl mx-auto">
          <div className={isArabic ? "text-right" : "text-left"} dir={isArabic ? "rtl" : "ltr"}>
            <div className="mb-8 text-center">
              <h1 className="text-lg font-bold mb-2">T.C.</h1>
              <h2 className="text-base font-bold mb-2">MERSİN İL GÖÇ İDARESİ MÜDÜRLÜĞÜ'NE</h2>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">Konu: Geçici Koruma Kapsamındaki Sağlık Sigortamın Aktifleştirilmesi Talebi</h3>
            </div>

            <div className="mb-8">
              <p className="mb-4">
                Aşağıda bilgileri bulunan şahsım, geçici koruma kimlik belgesine (kimlik kartı) sahip olup, 
                sağlık hizmetlerinden yararlanabilmem için sağlık sigortamın aktifleştirilmesini arz ederim.
              </p>
            </div>

            <div className="mb-8">
              <p className="mb-4">Gereğini arz ederim.</p>
            </div>

            <div className="mb-8">
              <div className="space-y-4">
                <div className="form-field">
                  <span className="font-semibold">Adı Soyadı:</span>
                  <span className={`${isArabic ? 'mr-4' : 'ml-4'} px-2 py-1 min-w-[300px] inline-block`}>
                    {formData.fullName}
                  </span>
                </div>
                <div className="form-field">
                  <span className="font-semibold">Yabancı Kimlik No:</span>
                  <span className={`${isArabic ? 'mr-4' : 'ml-4'} px-2 py-1 min-w-[200px] inline-block`}>
                    {formData.identityNumber}
                  </span>
                </div>
                <div className="form-field">
                  <span className="font-semibold">Adres:</span>
                  <span className={`${isArabic ? 'mr-4' : 'ml-4'} px-2 py-1 min-w-[400px] inline-block`}>
                    {formData.address}
                  </span>
                </div>
                <div className="form-field">
                  <span className="font-semibold">Gsm:</span>
                  <span className={`${isArabic ? 'mr-4' : 'ml-4'} px-2 py-1 min-w-[200px] inline-block`}>
                    {formData.phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="signature">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="font-semibold">Tarih:</span>
                  <span className={`${isArabic ? 'mr-4' : 'ml-4'} px-2 py-1 min-w-[100px] inline-block`}>
                    {formatDate()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">İmza:</span>
                  <span className={`${isArabic ? 'mr-4' : 'ml-4'} px-2 py-1 min-w-[150px] inline-block`}>
                    .....................
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
            {forceArabic ? 'طلب تفعيل التأمين الصحي' : 'Health Insurance Activation Request'}
          </h2>
          <p className="text-jet-600 dark:text-jet-400">
            {forceArabic 
              ? 'أدخل بياناتك لإنشاء طلب تفعيل التأمين الصحي' 
              : 'Enter your information to create a health insurance activation request'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
              {forceArabic ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-jet-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 ${
                  errors.fullName 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-jet-300 dark:border-jet-600 bg-white dark:bg-jet-700 text-jet-900 dark:text-white'
                }`}
                placeholder={forceArabic ? 'أدخل الاسم الكامل' : 'Enter full name'}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 ml-1" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Identity Number */}
          <div>
            <label className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
              {forceArabic ? 'رقم الهوية الأجنبية' : 'Foreign Identity Number'}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-jet-400" />
              <input
                type="text"
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 ${
                  errors.identityNumber 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-jet-300 dark:border-jet-600 bg-white dark:bg-jet-700 text-jet-900 dark:text-white'
                }`}
                placeholder={forceArabic ? 'أدخل رقم الهوية' : 'Enter identity number'}
              />
            </div>
            {errors.identityNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 ml-1" />
                {errors.identityNumber}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
              {forceArabic ? 'رقم الجوال (GSM)' : 'Mobile Number (GSM)'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-jet-400" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 ${
                  errors.phoneNumber 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-jet-300 dark:border-jet-600 bg-white dark:bg-jet-700 text-jet-900 dark:text-white'
                }`}
                placeholder={forceArabic ? 'أدخل رقم الجوال' : 'Enter mobile number'}
              />
            </div>
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 ml-1" />
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
              {forceArabic ? 'العنوان' : 'Address'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-jet-400" />
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 resize-none ${
                  errors.address 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-jet-300 dark:border-jet-600 bg-white dark:bg-jet-700 text-jet-900 dark:text-white'
                }`}
                placeholder={forceArabic ? 'أدخل العنوان الكامل' : 'Enter complete address'}
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 ml-1" />
                {errors.address}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-pink-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-700 hover:to-pink-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{forceArabic ? 'إنشاء الطلب' : 'Create Request'}</span>
            </button>
          </div>
        </form>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mt-4 p-3 rounded-lg text-center font-medium ${
            saveMessage.includes('نجاح') || saveMessage.includes('başarıyla') || saveMessage.includes('success') 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                {forceArabic ? 'معلومات مهمة' : 'Important Information'}
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                <li>• {forceArabic ? 'سيتم إنشاء طلب قابل للطباعة' : 'A printable request will be generated'}</li>
                <li>• {forceArabic ? 'يمكنك طباعة الطلب أو تحميله كملف PDF' : 'You can print the request or download it as PDF'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthInsuranceActivationForm;
