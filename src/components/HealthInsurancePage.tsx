import React, { useState, useEffect } from 'react';
import { Shield, Calculator, Users, Clock, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Building, Calendar, DollarSign, Phone, Mail, Send, X } from 'lucide-react';
import CustomCursor from './CustomCursor';
import CustomDatePicker from './CustomDatePicker';
import FileUploadModal from './FileUploadModal';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';



interface HealthInsurancePageProps {
  onBack: () => void;
  isDarkMode: boolean;
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount: () => void;
  onOpenHelp: () => void;
  onToggleDarkMode: () => void;
  onNavigateToMainHome: () => void;
}

interface InsuranceCompany {
  id: string;
  name: string;
  name_ar: string;
  logo_url?: string;
}

interface AgeGroup {
  id: string;
  min_age: number;
  max_age: number;
  name: string;
  name_ar: string;
}

interface PricingData {
  company_id: string;
  company_name: string;
  company_name_ar: string;
  age_group_id: string;
  age_group_name: string;
  age_group_name_ar: string;
  min_age: number;
  max_age: number;
  duration_months: number;
  price_try: number;
}

const HealthInsurancePage: React.FC<HealthInsurancePageProps> = ({
  onBack,
  isDarkMode,
  onNavigateToContact,
  onOpenProfile,
  onOpenAccount,
  onOpenHelp,
  onToggleDarkMode,
  onNavigateToMainHome
}) => {
  const { user } = useAuthContext();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  // State for pricing data
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(12);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // State for request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    additionalNotes: '',
    passportImage: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fileUploadWarning, setFileUploadWarning] = useState<string | null>(null);
  
  // File upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalData, setUploadModalData] = useState({
    isSuccess: false,
    message: ''
  });

  // Load pricing data
  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (companiesError) {
        console.error('خطأ في جلب الشركات:', companiesError);
        throw companiesError;
      }
      setCompanies(companiesData || []);

      // Load age groups
      const { data: ageGroupsData, error: ageGroupsError } = await supabase
        .from('age_groups')
        .select('*')
        .eq('is_active', true)
        .order('min_age');

      if (ageGroupsError) {
        console.error('خطأ في جلب الفئات العمرية:', ageGroupsError);
        throw ageGroupsError;
      }
      setAgeGroups(ageGroupsData || []);

      // Load pricing data using direct query instead of RPC
      const { data: pricingData, error: pricingError } = await supabase
        .from('health_insurance_pricing')
        .select(`
          *,
          insurance_companies(name, name_ar),
          age_groups(name, name_ar, min_age, max_age)
        `)
        .eq('is_active', true)
        .order('company_id');

      if (pricingError) {
        console.error('خطأ في جلب بيانات الأسعار:', pricingError);
        throw pricingError;
      }
      
      // Format the pricing data
      const formattedPricing = pricingData?.map((p: any) => ({
        company_id: p.company_id,
        company_name: p.insurance_companies?.name || '',
        company_name_ar: p.insurance_companies?.name_ar || '',
        age_group_id: p.age_group_id,
        age_group_name: p.age_groups?.name || '',
        age_group_name_ar: p.age_groups?.name_ar || '',
        min_age: p.age_groups?.min_age || 0,
        max_age: p.age_groups?.max_age || 0,
        duration_months: p.duration_months,
        price_try: p.price_try
      })) || [];
      
      setPricingData(formattedPricing);

    } catch (error) {
      console.error('خطأ في تحميل بيانات التأمين الصحي:', error);
      // Show user-friendly error message
      alert(isArabic ? 'حدث خطأ في تحميل بيانات التأمين الصحي. يرجى المحاولة مرة أخرى.' : 'Error loading health insurance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from birth date
  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      const calculatedAgeValue = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
        ? age - 1 
        : age;
      
      console.log('🔍 حساب العمر:', {
        birthDate,
        today: today.toISOString(),
        birth: birth.toISOString(),
        age,
        monthDiff,
        calculatedAgeValue
      });
      
      setCalculatedAge(calculatedAgeValue);
      
      // Find matching age group
      const matchingAgeGroup = ageGroups.find(group => 
        calculatedAgeValue >= group.min_age && calculatedAgeValue <= group.max_age
      );
      
      console.log('🔍 البحث عن الفئة العمرية:', {
        calculatedAgeValue,
        ageGroups: ageGroups.map(g => ({ id: g.id, min: g.min_age, max: g.max_age })),
        matchingAgeGroup: matchingAgeGroup?.id
      });
      
      setSelectedAgeGroup(matchingAgeGroup?.id || '');
    } else {
      setCalculatedAge(null);
      setSelectedAgeGroup('');
    }
  }, [birthDate, ageGroups]);

  // Calculate price when selections change
  useEffect(() => {
    if (selectedCompany && selectedAgeGroup && selectedDuration) {
      const price = pricingData.find(
        item => 
          item.company_id === selectedCompany &&
          item.age_group_id === selectedAgeGroup &&
          item.duration_months === selectedDuration
      );
      
      setCalculatedPrice(price?.price_try || null);
    } else {
      setCalculatedPrice(null);
    }
  }, [selectedCompany, selectedAgeGroup, selectedDuration, pricingData]);

  // Monitor calculatedAge changes
  useEffect(() => {
    // Age calculation is working correctly
  }, [calculatedAge]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 بدء عملية إرسال الطلب...');
    console.log('📋 البيانات المدخلة:', {
      selectedCompany,
      birthDate,
      calculatedAge,
      selectedAgeGroup,
      calculatedPrice,
      requestForm
    });
    
    // السماح للضيوف برفع الطلبات

    if (!selectedCompany || !birthDate || !selectedAgeGroup || !calculatedPrice) {
      console.log('❌ بيانات غير مكتملة:', {
        selectedCompany: !!selectedCompany,
        birthDate: !!birthDate,
        calculatedAge: calculatedAge,
        selectedAgeGroup: !!selectedAgeGroup,
        calculatedPrice: calculatedPrice
      });
      setSubmitError(isArabic ? 'يرجى اختيار جميع الخيارات المطلوبة' : 'Please select all required options');
      return;
    }

    // Validate required fields
    if (!requestForm.contactName.trim()) {
      console.log('❌ اسم التواصل مفقود');
      setSubmitError(isArabic ? 'يجب إدخال اسم التواصل' : 'Contact name is required');
      return;
    }

    if (!requestForm.contactPhone.trim()) {
      console.log('❌ رقم الهاتف مفقود');
      setSubmitError(isArabic ? 'يجب إدخال رقم الهاتف' : 'Phone number is required');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      setFileUploadWarning(null);

      // Upload passport image if provided
      let passportImageUrl = null;
      console.log('🔍 فحص حالة الملف:', {
        hasPassportImage: !!requestForm.passportImage,
        passportImage: requestForm.passportImage,
        type: typeof requestForm.passportImage
      });
      
      if (requestForm.passportImage) {
        console.log('📁 بدء رفع الملف:', {
          fileName: requestForm.passportImage.name,
          fileSize: requestForm.passportImage.size,
          fileType: requestForm.passportImage.type
        });
        
        try {
          const fileExt = requestForm.passportImage.name.split('.').pop();
          const fileName = user?.id ? `${user.id}_${Date.now()}.${fileExt}` : `guest_${Date.now()}.${fileExt}`;
          
          // محاولة رفع الملف مباشرة
          console.log('🪣 محاولة رفع الملف إلى bucket: passport-images');
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('passport-images')
            .upload(fileName, requestForm.passportImage);

          if (uploadError) {
            console.error('❌ خطأ في رفع الملف:', uploadError);
            console.error('تفاصيل الخطأ:', {
              message: uploadError.message,
              statusCode: uploadError.statusCode,
              error: uploadError.error,
              details: uploadError.details,
              hint: uploadError.hint
            });
            
            // Handle different types of upload errors with more specific messages
            if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: لم يتم رفع الملف لأن bucket التخزين غير موجود. يرجى إنشاء bucket "passport-images" في Supabase. سيتم إرسال الطلب بدون الملف.' : 'Note: File was not uploaded because storage bucket does not exist. Please create "passport-images" bucket in Supabase. Request will be sent without the file.');
            } else if (uploadError.message.includes('policy') || uploadError.message.includes('permission') || uploadError.message.includes('403')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: لم يتم رفع الملف بسبب مشكلة في الصلاحيات. يرجى التحقق من سياسات bucket التخزين. سيتم إرسال الطلب بدون الملف.' : 'Note: File was not uploaded due to permission issues. Please check storage bucket policies. Request will be sent without the file.');
            } else if (uploadError.message.includes('413') || uploadError.message.includes('too large')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: حجم الملف كبير جداً. الحد الأقصى 50MB. سيتم إرسال الطلب بدون الملف.' : 'Note: File size is too large. Maximum 50MB. Request will be sent without the file.');
            } else if (uploadError.message.includes('415') || uploadError.message.includes('type')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: نوع الملف غير مدعوم. يرجى استخدام JPG, PNG, أو WEBP. سيتم إرسال الطلب بدون الملف.' : 'Note: File type not supported. Please use JPG, PNG, or WEBP. Request will be sent without the file.');
            } else {
              setFileUploadWarning(isArabic ? `ملاحظة: لم يتم رفع الملف. الخطأ: ${uploadError.message}. سيتم إرسال الطلب بدون الملف.` : `Note: File was not uploaded. Error: ${uploadError.message}. Request will be sent without the file.`);
            }
            passportImageUrl = null;
            
            // Show error modal
            setUploadModalData({
              isSuccess: false,
              message: isArabic 
                ? `فشل في رفع الملف: ${uploadError.message}`
                : `Failed to upload file: ${uploadError.message}`
            });
            setShowUploadModal(true);
          } else {
            passportImageUrl = uploadData?.path;
            console.log('✅ تم رفع الملف بنجاح:', {
              fileName: fileName,
              path: uploadData?.path,
              passportImageUrl: passportImageUrl,
              uploadData: uploadData
            });
            
            // Show success modal
            setUploadModalData({
              isSuccess: true,
              message: isArabic 
                ? 'تم رفع الملف بنجاح!'
                : 'File uploaded successfully!'
            });
            setShowUploadModal(true);
          }
        } catch (error) {
          console.error('Unexpected error during file upload:', error);
          setFileUploadWarning(isArabic ? 'ملاحظة: حدث خطأ غير متوقع أثناء رفع الملف. سيتم إرسال الطلب بدون الملف.' : 'Note: Unexpected error occurred during file upload. Request will be sent without the file.');
          passportImageUrl = null;
          
          // Show error modal
          setUploadModalData({
            isSuccess: false,
            message: isArabic 
              ? 'حدث خطأ غير متوقع أثناء رفع الملف'
              : 'Unexpected error occurred during file upload'
          });
          setShowUploadModal(true);
        }
      }

      const requestData: any = {
        company_id: selectedCompany,
        age_group_id: selectedAgeGroup,
        duration_months: selectedDuration,
        calculated_price: calculatedPrice,
        contact_name: requestForm.contactName,
        contact_email: requestForm.contactEmail,
        contact_phone: requestForm.contactPhone,
        additional_notes: requestForm.additionalNotes,
        passport_image_url: passportImageUrl,
        status: 'pending'
      };

      // إضافة user_id فقط إذا كان المستخدم مسجل دخول
      if (user?.id) {
        requestData.user_id = user.id;
      }

      // حساب العمر مرة أخرى للتأكد (للعرض فقط)
      let finalCalculatedAge = calculatedAge;
      if (birthDate && (!calculatedAge || calculatedAge === 0)) {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        finalCalculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
          ? age - 1 
          : age;
        
        console.log('🔧 إعادة حساب العمر:', {
          birthDate,
          calculatedAge,
          finalCalculatedAge
        });
      }

      console.log('📝 بيانات الطلب المراد حفظها:', requestData);
      console.log('🔗 محاولة الاتصال بقاعدة البيانات...');

      const { data, error } = await supabase
        .from('health_insurance_requests')
        .insert(requestData);

      if (error) {
        console.error('❌ خطأ في حفظ الطلب:', error);
        console.error('تفاصيل الخطأ:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ تم حفظ الطلب بنجاح:', data);

      setSubmitSuccess(true);
      setRequestForm({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        additionalNotes: '',
        passportImage: null
      });
      setFileUploadWarning(null);
      setShowRequestForm(false);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('❌ خطأ عام في إرسال الطلب:', error);
      console.error('نوع الخطأ:', typeof error);
      console.error('تفاصيل الخطأ:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      setSubmitError(isArabic ? 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'An error occurred while submitting the request. Please try again.');
      setFileUploadWarning(null);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getDurationText = (months: number) => {
    if (isArabic) {
      return months === 12 ? 'سنة واحدة' : 'سنتان';
    }
    return months === 12 ? '1 Year' : '2 Years';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria">
      <CustomCursor isDarkMode={isDarkMode} />
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-white/95 dark:bg-jet-800/95 backdrop-blur-md shadow-xl border-b border-platinum-300 dark:border-jet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 space-x-reverse bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium text-sm md:text-base">
                  {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                </span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              <button
                onClick={() => onNavigateToMainHome()}
                className="relative transition-colors duration-300 group font-medium text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400"
              >
                {t('nav.home')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 md:pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-caribbean-50/30 via-indigo-50/20 to-platinum-50 dark:from-caribbean-900/10 dark:via-indigo-900/5 dark:to-jet-700 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-caribbean-200/20 to-indigo-200/20 dark:from-caribbean-800/10 dark:to-indigo-800/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-caribbean-200/20 dark:from-indigo-800/10 dark:to-caribbean-800/10 rounded-full blur-3xl animate-float-reverse"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="mb-8 flex justify-center">
                <div className="p-4 bg-gradient-to-r from-caribbean-500 to-indigo-600 rounded-2xl">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-caribbean-700 via-indigo-700 to-caribbean-600 dark:from-caribbean-400 dark:via-indigo-400 dark:to-caribbean-300 bg-clip-text text-transparent mb-6">
                {t('services.healthInsurance.title')}
              </h1>
              <p className="text-xl text-jet-700 dark:text-platinum-300 max-w-3xl mx-auto leading-relaxed">
                {t('services.healthInsurance.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Enhanced Description Section */}
        <section className="py-16 bg-white dark:bg-jet-800 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400">
                  {isArabic ? 'لماذا التأمين الصحي للأجانب؟' : 'Why Health Insurance for Foreigners?'}
                </h2>
                <p className="text-lg text-jet-600 dark:text-platinum-400 leading-relaxed mb-8">
                  {t('services.healthInsurance.fullDescription')}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-caribbean-100 dark:border-caribbean-800">
                    <div className="w-12 h-12 bg-gradient-to-r from-caribbean-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-caribbean-700 dark:text-caribbean-300">
                      {isArabic ? 'تغطية شاملة' : 'Comprehensive Coverage'}
                    </h3>
                    <p className="text-jet-600 dark:text-platinum-400">
                      {isArabic ? 'جميع الخدمات الطبية والعلاجية' : 'All medical and treatment services'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-caribbean-50 dark:from-indigo-900/20 dark:to-caribbean-900/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-indigo-100 dark:border-indigo-800">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-caribbean-600 rounded-lg flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-indigo-700 dark:text-indigo-300">
                      {isArabic ? 'خدمة سريعة' : 'Fast Service'}
                    </h3>
                    <p className="text-jet-600 dark:text-platinum-400">
                      {isArabic ? 'إجراءات سريعة وبسيطة' : 'Fast and simple procedures'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-caribbean-100 to-indigo-100 dark:from-caribbean-900/20 dark:to-indigo-900/20 rounded-2xl p-8 hover:shadow-xl transition-all duration-500 transform hover:scale-105 border border-caribbean-200 dark:border-caribbean-700">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-caribbean-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-caribbean-700 dark:text-caribbean-300">
                      {isArabic ? 'مميزات التأمين الصحي' : 'Health Insurance Features'}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(t('services.healthInsurance.features') as string[]).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-white/50 dark:hover:bg-jet-700/50 transition-all duration-300">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-jet-700 dark:text-platinum-300 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Pricing Calculator Section */}
        <section className="py-16 bg-gradient-to-br from-caribbean-50/30 via-indigo-50/20 to-platinum-50 dark:from-caribbean-900/10 dark:via-indigo-900/5 dark:to-jet-700 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-caribbean-200/10 to-transparent rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-bl from-indigo-200/8 to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-platinum-200/5 to-caribbean-200/5 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '10s' }}></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-caribbean-700 dark:text-caribbean-400">
                {isArabic ? 'حاسبة أسعار التأمين الصحي' : 'Health Insurance Price Calculator'}
              </h2>
              <p className="text-lg text-jet-600 dark:text-platinum-400">
                {isArabic ? 'احسب سعر التأمين الصحي حسب الفئة العمرية وشركة التأمين والمدة' : 'Calculate health insurance price based on age group, insurance company, and duration'}
              </p>
            </div>



            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean-600 mx-auto"></div>
                <p className="mt-4 text-jet-600 dark:text-platinum-400">
                  {isArabic ? 'جاري تحميل البيانات...' : 'Loading data...'}
                </p>
              </div>
            ) : companies.length === 0 || ageGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
                  {isArabic ? 'لا توجد بيانات متاحة' : 'No data available'}
                </h3>
                <p className="text-jet-600 dark:text-platinum-400 mb-4">
                  {isArabic ? 'لم يتم العثور على بيانات التأمين الصحي. يرجى المحاولة مرة أخرى لاحقاً.' : 'Health insurance data not found. Please try again later.'}
                </p>
                <button
                  onClick={loadPricingData}
                  className="bg-caribbean-600 text-white px-6 py-2 rounded-lg hover:bg-caribbean-700 transition-colors"
                >
                  {isArabic ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Calculator Form */}
                <div className="bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-lg border border-platinum-300 dark:border-jet-600">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isArabic ? 'اختر الخيارات' : 'Select Options'}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Insurance Company */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                        {isArabic ? 'شركة التأمين' : 'Insurance Company'}
                      </label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      >
                        <option value="">
                          {isArabic ? 'اختر شركة التأمين' : 'Select Insurance Company'}
                        </option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {isArabic ? company.name_ar : company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                        {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}
                      </label>
                      <CustomDatePicker
                        value={birthDate}
                        onChange={setBirthDate}
                        maxDate={new Date().toISOString().split('T')[0]}
                        placeholder={isArabic ? 'اختر تاريخ الميلاد' : 'Select date of birth'}
                        isArabic={isArabic}
                        isDarkMode={isDarkMode}
                      />
                      
                      {/* Date format hint */}
                      <div className="mt-2 text-xs text-jet-500 dark:text-jet-400">
                        {isArabic ? 
                          '💡 تلميح: أدخل التاريخ بالصيغة يوم/شهر/سنة (مثال: 01/01/1990)' : 
                          '💡 Tip: Enter date as DD/MM/YYYY (e.g., 01/01/1990)'
                        }
                      </div>
                      
                      {calculatedAge !== null && (
                        <div className={`mt-2 p-3 rounded-lg border ${
                          selectedAgeGroup 
                            ? 'bg-caribbean-50 dark:bg-caribbean-900/20 border-caribbean-200 dark:border-caribbean-700'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              selectedAgeGroup 
                                ? 'text-caribbean-700 dark:text-caribbean-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {isArabic ? 'العمر المحسوب:' : 'Calculated Age:'}
                            </span>
                            <span className={`text-lg font-bold ${
                              selectedAgeGroup 
                                ? 'text-caribbean-800 dark:text-caribbean-200'
                                : 'text-red-800 dark:text-red-200'
                            }`}>
                              {calculatedAge} {isArabic ? 'سنة' : 'years'}
                            </span>
                          </div>
                          {selectedAgeGroup ? (
                            <div className="mt-1 text-xs text-caribbean-600 dark:text-caribbean-400">
                              {isArabic ? 'الفئة العمرية:' : 'Age Group:'} {
                                ageGroups.find(group => group.id === selectedAgeGroup)?.name_ar || 
                                ageGroups.find(group => group.id === selectedAgeGroup)?.name || 
                                (isArabic ? 'غير محدد' : 'Not specified')
                              }
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {isArabic ? 'العمر خارج النطاق المدعوم (0-69 سنة)' : 'Age is outside supported range (0-69 years)'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                        {isArabic ? 'مدة التأمين' : 'Insurance Duration'}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedDuration(12)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedDuration === 12
                              ? 'border-caribbean-500 bg-caribbean-50 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400'
                              : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-caribbean-300 dark:hover:border-caribbean-500'
                          }`}
                        >
                          <Calendar className="w-6 h-6 mx-auto mb-2" />
                          <span className="font-medium">{getDurationText(12)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDuration(24)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedDuration === 24
                              ? 'border-caribbean-500 bg-caribbean-50 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400'
                              : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-caribbean-300 dark:hover:border-caribbean-500'
                          }`}
                        >
                          <Calendar className="w-6 h-6 mx-auto mb-2" />
                          <span className="font-medium">{getDurationText(24)}</span>
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Calculate Button */}
                    <button
                      onClick={() => {
                        setShowRequestForm(true);
                      }}
                      disabled={(() => {
                        const isDisabled = !selectedCompany || !birthDate || calculatedAge === null || !selectedAgeGroup || calculatedPrice === null;
                        return isDisabled;
                      })()}
                      className="w-full bg-gradient-to-r from-caribbean-600 via-indigo-600 to-caribbean-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-caribbean-700 hover:via-indigo-700 hover:to-caribbean-800 hover:shadow-xl transform hover:scale-105 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center relative overflow-hidden group"
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-caribbean-500 via-indigo-500 to-caribbean-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      {/* Button content */}
                      <div className="relative z-10 flex items-center">
                        <Calculator className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                        <span className="group-hover:animate-pulse">
                          {isArabic ? 'احسب السعر واطلب التأمين' : 'Calculate Price & Request Insurance'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Enhanced Price Display */}
                <div className="bg-white/80 dark:bg-jet-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-platinum-300/50 dark:border-jet-600/50 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isArabic ? 'السعر المحسوب' : 'Calculated Price'}
                  </h3>
                  
                  {calculatedPrice ? (
                    <div className="text-center">
                      <div className="mb-6">
                        <DollarSign className="w-16 h-16 text-caribbean-500 mx-auto mb-4" />
                        <div className="text-4xl font-bold text-caribbean-700 dark:text-caribbean-400 mb-2">
                          {formatPrice(calculatedPrice)}
                        </div>
                        <p className="text-jet-600 dark:text-platinum-400 mb-4">
                          {isArabic ? 'للمدة المحددة' : 'for the selected duration'}
                        </p>
                        
                        {/* Age and Company Info */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl mb-6">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                {isArabic ? 'العمر:' : 'Age:'}
                              </span>
                              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                {calculatedAge} {isArabic ? 'سنة' : 'years'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-indigo-700 dark:text-indigo-300">
                                {isArabic ? 'الشركة:' : 'Company:'}
                              </span>
                              <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200">
                                {companies.find(c => c.id === selectedCompany)?.name_ar || 
                                 companies.find(c => c.id === selectedCompany)?.name || 
                                 (isArabic ? 'غير محدد' : 'Not specified')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                        <h4 className="font-semibold mb-4 text-green-700 dark:text-green-400">
                          {isArabic ? 'ما يشمل السعر:' : 'Price includes:'}
                        </h4>
                        <ul className="text-left space-y-2 text-jet-700 dark:text-platinum-300">
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'تغطية طبية شاملة' : 'Comprehensive medical coverage'}
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'شبكة مستشفيات واسعة' : 'Wide hospital network'}
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'خدمة عملاء 24/7' : '24/7 customer service'}
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'إجراءات سريعة' : 'Fast procedures'}
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calculator className="w-16 h-16 text-jet-400 dark:text-jet-600 mx-auto mb-4" />
                      <p className="text-jet-600 dark:text-platinum-400">
                        {isArabic ? 'اختر الخيارات لحساب السعر' : 'Select options to calculate price'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Success Message Toast */}
        {submitSuccess && !showRequestForm && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-green-800 dark:text-green-200 font-semibold text-sm">
                    {isArabic ? 'تم إرسال الطلب بنجاح!' : 'Request Submitted Successfully!'}
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                    {isArabic ? 'سنتواصل معك قريباً' : 'We will contact you soon'}
                  </p>
                </div>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

                {/* Error Message Toast */}
        {submitError && !showRequestForm && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-800 dark:text-red-200 font-semibold text-sm">
                    {isArabic ? 'فشل في إرسال الطلب' : 'Request Submission Failed'}
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                    {submitError}
                  </p>
                </div>
                <button
                  onClick={() => setSubmitError(null)}
                  className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-jet-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {isArabic ? 'طلب التأمين الصحي' : 'Health Insurance Request'}
                </h3>
                <button
                  onClick={() => {
                    setShowRequestForm(false);
                    setFileUploadWarning(null);
                  }}
                  className="text-jet-400 hover:text-jet-600 dark:text-jet-500 dark:hover:text-jet-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
                    {isArabic ? 'تم إرسال طلب التأمين الصحي بنجاح!' : 'Health Insurance Request Submitted Successfully!'}
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                    <div className="space-y-3 text-left">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          {isArabic ? 'تم حفظ طلبك في قاعدة البيانات' : 'Your request has been saved to our database'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          {isArabic ? 'سيتم مراجعة طلبك من قبل فريقنا المختص' : 'Your request will be reviewed by our specialized team'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          {isArabic ? 'سنتواصل معك خلال 24-48 ساعة' : 'We will contact you within 24-48 hours'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      {isArabic ? 'رقم الطلب: ' : 'Request ID: '}
                      <span className="font-mono font-bold">{user?.id ? user.id.substring(0, 8) : 'GUEST'}-{Date.now().toString().slice(-6)}</span>
                    </p>
                    {!user?.id && (
                      <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                        {isArabic ? 'ملاحظة: كضيف، لن تتمكن من تتبع طلبك. يرجى تسجيل الدخول للمتابعة.' : 'Note: As a guest, you won\'t be able to track your request. Please log in to follow up.'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-6">
                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-red-800 dark:text-red-200 font-semibold mb-2">
                            {isArabic ? 'فشل في إرسال الطلب' : 'Request Submission Failed'}
                          </h4>
                          <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                            {submitError}
                          </p>
                          <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                            <p className="text-red-700 dark:text-red-300 text-xs">
                              {isArabic ? 'اقتراحات لحل المشكلة:' : 'Suggestions to resolve the issue:'}
                            </p>
                            <ul className="text-red-600 dark:text-red-400 text-xs mt-2 space-y-1">
                              <li>• {isArabic ? 'تأكد من اتصالك بالإنترنت' : 'Check your internet connection'}</li>
                              <li>• {isArabic ? 'تأكد من ملء جميع الحقول المطلوبة' : 'Make sure all required fields are filled'}</li>
                              <li>• {isArabic ? 'حاول مرة أخرى بعد بضع دقائق' : 'Try again after a few minutes'}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {fileUploadWarning && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">{fileUploadWarning}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={requestForm.contactName}
                      onChange={(e) => setRequestForm({ ...requestForm, contactName: e.target.value })}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={requestForm.contactEmail}
                      onChange={(e) => setRequestForm({ ...requestForm, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'رقم الهاتف *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      value={requestForm.contactPhone}
                      onChange={(e) => setRequestForm({ ...requestForm, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder={isArabic ? '+90 534 962 72 41' : '+90 534 962 72 41'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'صورة جواز السفر أو الإقامة (اختياري)' : 'Passport or Residence Image (Optional)'}
                    </label>
                    <div className="relative">
                      <div
                        className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer hover:border-caribbean-400 dark:hover:border-caribbean-500 ${
                          requestForm.passportImage
                            ? 'border-caribbean-500 bg-caribbean-50 dark:bg-caribbean-900/20'
                            : 'border-platinum-300 dark:border-jet-600 bg-platinum-50 dark:bg-jet-700/50'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-caribbean-500', 'bg-caribbean-50', 'dark:bg-caribbean-900/20');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          if (!requestForm.passportImage) {
                            e.currentTarget.classList.remove('border-caribbean-500', 'bg-caribbean-50', 'dark:bg-caribbean-900/20');
                            e.currentTarget.classList.add('border-platinum-300', 'dark:border-jet-600', 'bg-platinum-50', 'dark:bg-jet-700/50');
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            const file = files[0];
                            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                              setRequestForm({ ...requestForm, passportImage: file });
                            }
                          }
                        }}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        {requestForm.passportImage ? (
                          <div className="space-y-2">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                {isArabic ? 'تم اختيار الملف بنجاح' : 'File selected successfully'}
                              </p>
                              <p className="text-xs text-jet-600 dark:text-jet-400 mt-1">
                                {requestForm.passportImage.name}
                              </p>
                              <p className="text-xs text-jet-500 dark:text-jet-400">
                                {(requestForm.passportImage.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRequestForm({ ...requestForm, passportImage: null });
                              }}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                            >
                              {isArabic ? 'إزالة الملف' : 'Remove file'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-platinum-200 dark:bg-jet-600 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-6 h-6 text-jet-600 dark:text-jet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-jet-700 dark:text-platinum-300">
                                {isArabic ? 'اسحب وأفلت الملف هنا' : 'Drag and drop file here'}
                              </p>
                              <p className="text-xs text-jet-500 dark:text-jet-400 mt-1">
                                {isArabic ? 'أو انقر لاختيار ملف' : 'or click to select file'}
                              </p>
                            </div>
                            <p className="text-xs text-jet-500 dark:text-jet-400">
                              {isArabic ? 'الصيغ المدعومة: JPG, PNG, PDF' : 'Accepted formats: JPG, PNG, PDF'}
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setRequestForm({ ...requestForm, passportImage: e.target.files?.[0] || null })}
                        className="hidden"
                      />
                    </div>
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}
                    </label>
                    <textarea
                      value={requestForm.additionalNotes}
                      onChange={(e) => setRequestForm({ ...requestForm, additionalNotes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder={isArabic ? 'أي معلومات إضافية تريد إضافتها...' : 'Any additional information you want to add...'}
                    />
                  </div>

                  <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {isArabic ? 'تفاصيل الطلب:' : 'Request Details:'}
                    </h4>
                    <div className="space-y-1 text-sm text-jet-600 dark:text-platinum-400">
                      <p>
                        <span className="font-medium">{isArabic ? 'الشركة:' : 'Company:'}</span> {companies.find(c => c.id === selectedCompany)?.name || ''}
                      </p>
                      <p>
                        <span className="font-medium">{isArabic ? 'الفئة العمرية:' : 'Age Group:'}</span> {ageGroups.find(g => g.id === selectedAgeGroup)?.name || ''}
                      </p>
                      <p>
                        <span className="font-medium">{isArabic ? 'المدة:' : 'Duration:'}</span> {getDurationText(selectedDuration)}
                      </p>
                      <p>
                        <span className="font-medium">{isArabic ? 'السعر:' : 'Price:'}</span> {calculatedPrice ? formatPrice(calculatedPrice) : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestForm(false);
                        setFileUploadWarning(null);
                      }}
                      className="flex-1 px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg text-jet-700 dark:text-platinum-300 hover:bg-platinum-50 dark:hover:bg-jet-700 transition-all duration-300"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {isArabic ? 'إرسال الطلب' : 'Submit Request'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <section className="py-16 bg-white dark:bg-jet-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-caribbean-700 dark:text-caribbean-400">
                {isArabic ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
              </h2>
              <p className="text-lg text-jet-600 dark:text-platinum-400">
                {isArabic ? 'تواصل معنا للحصول على استشارة مجانية' : 'Contact us for a free consultation'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <Phone className="w-12 h-12 text-caribbean-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isArabic ? 'اتصل بنا' : 'Call Us'}
                </h3>
                <p className="text-jet-600 dark:text-platinum-400 ">
                  +90 534 962 72 41
                </p>
              </div>
              <div className="text-center">
                <Mail className=" w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isArabic ? 'راسلنا' : 'Email Us'}
                </h3>
                <p className="text-jet-600 dark:text-platinum-400">
                  info@tevasul.group
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* File Upload Modal */}
      <FileUploadModal
        isVisible={showUploadModal}
        isSuccess={uploadModalData.isSuccess}
        message={uploadModalData.message}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
};

export default HealthInsurancePage;
