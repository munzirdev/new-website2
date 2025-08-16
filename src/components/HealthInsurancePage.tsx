import React, { useState, useEffect } from 'react';
import { Shield, Calculator, Users, Clock, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Building, Calendar, DollarSign, Phone, Mail, Send, X } from 'lucide-react';
import CustomCursor from './CustomCursor';
import CustomDatePicker from './CustomDatePicker';
import FileUploadModal from './FileUploadModal';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';
import { webhookService } from '../services/webhookService';

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

  // Handle hash navigation to calculator section
  useEffect(() => {
    if (window.location.hash === '#calculator') {
      // Wait for the page to fully load and then scroll to calculator
      setTimeout(() => {
        const calculatorSection = document.getElementById('calculator');
        if (calculatorSection) {
          calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1000);
    }
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      
      // Load pricing data first to get companies that have pricing
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

      // Get unique company IDs that have pricing data
      const companiesWithPricing = [...new Set(formattedPricing.map((p: PricingData) => p.company_id))];
      

      
      // Load only companies that have pricing data
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .in('id', companiesWithPricing)
        .order('name');

      if (companiesError) {
        console.error('خطأ في جلب الشركات:', companiesError);
        throw companiesError;
      }
      
      // Check if we have any companies with pricing data
      if (companiesWithPricing.length === 0) {
        setCompanies([]);
      } else {
        setCompanies(companiesData || []);
      }

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

    } catch (error) {
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
      

      
      setCalculatedAge(calculatedAgeValue);
      
      // Find matching age group
      const matchingAgeGroup = ageGroups.find(group => 
        calculatedAgeValue >= group.min_age && calculatedAgeValue <= group.max_age
      );
      

      
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



  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    

    
    // السماح للضيوف برفع الطلبات

    if (!selectedCompany || !birthDate || !selectedAgeGroup || !calculatedPrice) {
      setSubmitError(isArabic ? 'يرجى اختيار جميع الخيارات المطلوبة' : 'Please select all required options');
      return;
    }

    // Validate required fields
    if (!requestForm.contactName.trim()) {
      setSubmitError(isArabic ? 'يجب إدخال اسم التواصل' : 'Contact name is required');
      return;
    }

    if (!requestForm.contactPhone.trim()) {
      setSubmitError(isArabic ? 'يجب إدخال رقم الهاتف' : 'Phone number is required');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      setFileUploadWarning(null);

      // Upload passport image if provided
      let passportImageUrl = null;
      
              if (requestForm.passportImage) {
        
        try {
          const fileExt = requestForm.passportImage.name.split('.').pop();
          const fileName = user?.id ? `${user.id}_${Date.now()}.${fileExt}` : `guest_${Date.now()}.${fileExt}`;
          
          // محاولة رفع الملف مباشرة
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('passport-images')
            .upload(fileName, requestForm.passportImage);

          if (uploadError) {
            
            // Handle different types of upload errors with more specific messages
            if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: لم يتم رفع الملف لأن bucket التخزين غير موجود. يرجى إنشاء bucket "passport-images" في Supabase. سيتم إرسال الطلب بدون الملف.' : 'Note: File was not uploaded because storage bucket does not exist. Please create "passport-images" bucket in Supabase. Request will be sent without the file.');
            } else if (uploadError.message.includes('policy') || uploadError.message.includes('permission') || uploadError.message.includes('403')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: لم يتم رفع الملف بسبب مشكلة في الصلاحيات. يرجى التحقق من سياسات bucket التخزين. سيتم إرسال الطلب بدون الملف.' : 'Note: File was not uploaded due to permission issues. Please check storage bucket policies. Request will be sent without the file.');
            } else if (uploadError.message.includes('413') || uploadError.message.includes('too large')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: حجم الملف كبير جداً. الحد الأقصى 50MB. سيتم إرسال الطلب بدون الملف.' : 'Note: File size is too large. Maximum 50MB. Request will be sent without the file.');
            } else if (uploadError.message.includes('415') || uploadError.message.includes('type') || uploadError.message.includes('mime type')) {
              setFileUploadWarning(isArabic ? 'ملاحظة: نوع الملف غير مدعوم. يرجى استخدام JPG, PNG, PDF, أو DOC. سيتم إرسال الطلب بدون الملف.' : 'Note: File type not supported. Please use JPG, PNG, PDF, or DOC. Request will be sent without the file.');
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

      // حساب العمر مرة أخرى للتأكد
      let finalCalculatedAge = calculatedAge;
      if (birthDate && (!calculatedAge || calculatedAge === 0)) {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        finalCalculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
          ? age - 1 
          : age;
      }

      // تنظيف البيانات قبل الإرسال
      const cleanRequestData: any = {
        company_id: selectedCompany,
        age_group_id: selectedAgeGroup,
        duration_months: selectedDuration,
        calculated_price: calculatedPrice,
        contact_name: requestForm.contactName?.trim() || '',
        contact_email: requestForm.contactEmail?.trim() || '',
        contact_phone: requestForm.contactPhone?.trim() || '',
        additional_notes: requestForm.additionalNotes?.trim() || null,
        passport_image_url: passportImageUrl || null,
        status: 'pending'
      };

      // إضافة البيانات العمرية فقط إذا كانت صحيحة
      if (finalCalculatedAge && finalCalculatedAge > 0) {
        cleanRequestData.customer_age = finalCalculatedAge;
      }
      
      if (birthDate) {
        cleanRequestData.birth_date = birthDate;
      }

      // إضافة user_id فقط إذا كان المستخدم مسجل دخول وموجود في جدول user_profiles
      if (user?.id) {
        try {
          // التحقق من وجود المستخدم في جدول user_profiles
          const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (userProfile && !userError) {
            cleanRequestData.user_id = user.id;
            console.log('✅ تم إضافة user_id:', user.id);
          } else {
            console.log('⚠️ المستخدم غير موجود في جدول user_profiles، سيتم حفظ الطلب بدون user_id');
          }
        } catch (error) {
          console.log('⚠️ خطأ في التحقق من المستخدم، سيتم حفظ الطلب بدون user_id');
        }
      }

      // التحقق من صحة البيانات المطلوبة
      if (!cleanRequestData.company_id || !cleanRequestData.age_group_id || !cleanRequestData.duration_months) {
        console.error('❌ بيانات غير مكتملة:', cleanRequestData);
        setSubmitError(isArabic ? 'بيانات غير مكتملة. يرجى التحقق من جميع الحقول المطلوبة.' : 'Incomplete data. Please check all required fields.');
        return;
      }



      // Try to insert with age and birth date fields
      let { data, error } = await supabase
        .from('health_insurance_requests')
        .insert(cleanRequestData);

      // If the insert fails due to missing columns, try without age and birth date
      if (error && (error.message.includes('customer_age') || error.message.includes('birth_date'))) {
        
        const requestDataWithoutAge = { ...cleanRequestData };
        delete requestDataWithoutAge.customer_age;
        delete requestDataWithoutAge.birth_date;
        
        const result = await supabase
          .from('health_insurance_requests')
          .insert(requestDataWithoutAge);
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        
        // معالجة خاصة لخطأ 409 (Conflict)
        if (error.code === '409') {
          
          // محاولة إزالة البيانات التي قد تسبب المشكلة
          const fixedData = { ...cleanRequestData };
          delete fixedData.customer_age;
          delete fixedData.birth_date;
          delete fixedData.passport_image_url;
          
          const retryResult = await supabase
            .from('health_insurance_requests')
            .insert(fixedData);
          
          if (retryResult.error) {
            console.error('❌ فشل في المحاولة الثانية:', retryResult.error);
            setSubmitError(isArabic ? 'مشكلة في حفظ البيانات. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.' : 'There is an issue saving the data. Please try again or contact support.');
            return;
          } else {
            console.log('✅ نجح الحفظ في المحاولة الثانية:', retryResult.data);
            data = retryResult.data;
            error = null;
          }
        }
        
        // معالجة أخطاء أخرى
        if (error.code === '23503') {
          
          // محاولة إزالة user_id إذا كان يسبب المشكلة
          const fixedData = { ...cleanRequestData };
          delete fixedData.user_id;
          
          const retryResult = await supabase
            .from('health_insurance_requests')
            .insert(fixedData);
          
          if (retryResult.error) {
            console.error('❌ فشل في المحاولة الثانية:', retryResult.error);
            setSubmitError(isArabic ? 'مشكلة في حفظ البيانات. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.' : 'There is an issue saving the data. Please try again or contact support.');
            return;
          } else {
            console.log('✅ نجح الحفظ في المحاولة الثانية:', retryResult.data);
            data = retryResult.data;
            error = null;
          }
        }
        
        if (error.code === '23505') {
          setSubmitError(isArabic ? 'هذا الطلب موجود مسبقاً. يرجى التحقق من البيانات.' : 'This request already exists. Please check the data.');
          return;
        }
        
        throw error;
      }
      

      // إرسال إشعار التيليجرام
      try {
        
        // جلب معلومات الشركة والفئة العمرية للعرض
        const selectedCompanyData = companies.find(c => c.id === selectedCompany);
        const selectedAgeGroupData = ageGroups.find(g => g.id === selectedAgeGroup);
        
        await webhookService.sendHealthInsuranceRequestNotification({
          type: 'health_insurance',
          title: isArabic ? 'طلب تأمين صحي للأجانب جديد' : 'New Health Insurance Request for Foreigners',
          description: requestForm.additionalNotes || (isArabic ? 'طلب تأمين صحي للأجانب' : 'Health insurance request for foreigners'),
          userInfo: {
            name: requestForm.contactName,
            email: requestForm.contactEmail,
            phone: requestForm.contactPhone
          },
          requestId: data?.[0]?.id || 'unknown',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          additionalData: {
            companyName: selectedCompanyData?.name || selectedCompanyData?.name_ar || 'غير محدد',
            ageGroup: selectedAgeGroupData?.name || selectedAgeGroupData?.name_ar || 'غير محدد',
            calculatedAge: finalCalculatedAge,
            birthDate: birthDate,
            durationMonths: selectedDuration,
            calculatedPrice: calculatedPrice,
            hasPassportImage: !!passportImageUrl,
            passportImageUrl: passportImageUrl
          }
        });
        
      } catch (webhookError) {
        // لا نوقف العملية إذا فشل إرسال الإشعار
      }

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
      
      {/* Custom CSS for dropdown styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Custom dropdown styling - More specific selectors */
          select option,
          .dropdown-option,
          option,
          .bg-jet-800 option,
          .bg-white\\/20 option {
            background-color: rgba(26, 26, 26, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            color: #ffffff !important;
            padding: 12px 16px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
          }
          
          select option:hover {
            background-color: rgba(0, 123, 255, 0.1) !important;
            color: #1a1a1a !important;
          }
          
          select option:checked,
          .dropdown-option:checked {
            background-color: rgba(0, 123, 255, 0.8) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            border: 1px solid rgba(0, 123, 255, 0.3) !important;
          }
          
          select option:hover,
          .dropdown-option:hover {
            background-color: rgba(0, 123, 255, 0.3) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            color: #ffffff !important;
            border: 1px solid rgba(0, 123, 255, 0.2) !important;
          }
          
          /* For Webkit browsers (Chrome, Safari) */
          select::-webkit-listbox {
            background-color: rgba(26, 26, 26, 0.95) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
          }
          
          /* For Firefox */
          select {
            scrollbar-width: thin !important;
            scrollbar-color: rgba(0, 0, 0, 0.3) rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Force override for all dropdown options */
          * option {
            background-color: rgba(26, 26, 26, 0.95) !important;
            color: #ffffff !important;
          }
          
          /* Specific override for our dropdown */
          .bg-white\\/20 option,
          .bg-jet-800 option,
          select option {
            background-color: rgba(26, 26, 26, 0.95) !important;
            color: #ffffff !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
          }
          
          /* Custom scrollbar for Webkit browsers */
          select::-webkit-scrollbar {
            width: 8px !important;
          }
          
          select::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 4px !important;
            backdrop-filter: blur(5px) !important;
          }
          
          select::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3) !important;
            border-radius: 4px !important;
            backdrop-filter: blur(5px) !important;
          }
          
          select::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5) !important;
          }
          
          /* Additional glass effect for dropdown */
          select {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 100%) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
          }
          
          /* Glass effect for dropdown container */
          select:focus {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 100%) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
          }
        `
      }} />
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-white/95 dark:bg-jet-800/95 backdrop-blur-md shadow-xl border-b border-platinum-300 dark:border-jet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 md:py-3">
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

      {/* Header */}
      <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-16 mt-0 pt-24 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center mb-6">
            <div className="p-4 bg-white/20 rounded-2xl mb-4 md:mb-0 md:ml-6">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('services.healthInsurance.title')}</h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl">{t('services.healthInsurance.description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Background Animation Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-caribbean-200/20 dark:bg-caribbean-800/20 rounded-full animate-float-slow"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-platinum-300/30 dark:bg-jet-600/30 rounded-full animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-caribbean-300/25 dark:bg-caribbean-700/25 rounded-full animate-float-reverse"></div>
        </div>
        
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Main Description */}
          <div className="lg:col-span-3 relative z-10">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400">
                {isArabic ? 'لماذا التأمين الصحي للأجانب؟' : 'Why Health Insurance for Foreigners?'}
              </h2>
              <p className="text-lg text-jet-600 dark:text-platinum-400 leading-relaxed mb-8 animate-fade-in-delay-1">
                {t('services.healthInsurance.fullDescription')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8 animate-fade-in-delay-2">
                <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-6 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <Users className="w-8 h-8 text-caribbean-600 dark:text-caribbean-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {isArabic ? 'تغطية شاملة' : 'Comprehensive Coverage'}
                  </h3>
                  <p className="text-jet-600 dark:text-platinum-400">
                    {isArabic ? 'جميع الخدمات الطبية والعلاجية' : 'All medical and treatment services'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-caribbean-50 dark:from-indigo-900/20 dark:to-caribbean-900/20 p-6 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {isArabic ? 'خدمة سريعة' : 'Fast Service'}
                  </h3>
                  <p className="text-jet-600 dark:text-platinum-400">
                    {isArabic ? 'إجراءات سريعة وبسيطة' : 'Fast and simple procedures'}
                  </p>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400 animate-fade-in-delay-1">
                {isArabic ? 'مميزات التأمين الصحي' : 'Health Insurance Features'}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(t('services.healthInsurance.features') as string[]).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center p-4 bg-white dark:bg-jet-700 rounded-lg shadow-md">
                    <CheckCircle className="w-6 h-6 text-green-500 ml-3 flex-shrink-0" />
                    <span className="text-jet-700 dark:text-platinum-300">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Process */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400 animate-fade-in-delay-2">
                {isArabic ? 'كيفية الحصول على التأمين الصحي' : 'How to Get Health Insurance'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-gradient-to-r from-platinum-50 to-caribbean-50 dark:from-jet-700 dark:to-caribbean-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-caribbean-600 text-white rounded-full flex items-center justify-center font-bold ml-4">
                    1
                  </div>
                  <p className="text-jet-700 dark:text-platinum-300 pt-1">
                    {isArabic ? 'اختر شركة التأمين والفئة العمرية والمدة المناسبة' : 'Choose insurance company, age group, and suitable duration'}
                  </p>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-r from-platinum-50 to-caribbean-50 dark:from-jet-700 dark:to-caribbean-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-caribbean-600 text-white rounded-full flex items-center justify-center font-bold ml-4">
                    2
                  </div>
                  <p className="text-jet-700 dark:text-platinum-300 pt-1">
                    {isArabic ? 'احسب السعر باستخدام الحاسبة التفاعلية' : 'Calculate price using the interactive calculator'}
                  </p>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-r from-platinum-50 to-caribbean-50 dark:from-jet-700 dark:to-caribbean-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-caribbean-600 text-white rounded-full flex items-center justify-center font-bold ml-4">
                    3
                  </div>
                  <p className="text-jet-700 dark:text-platinum-300 pt-1">
                    {isArabic ? 'املأ نموذج الطلب وأرسل المستندات المطلوبة' : 'Fill out the request form and submit required documents'}
                  </p>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-r from-platinum-50 to-caribbean-50 dark:from-jet-700 dark:to-caribbean-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-caribbean-600 text-white rounded-full flex items-center justify-center font-bold ml-4">
                    4
                  </div>
                  <p className="text-jet-700 dark:text-platinum-300 pt-1">
                    {isArabic ? 'سنتواصل معك لإتمام الإجراءات' : 'We will contact you to complete the procedures'}
                  </p>
                </div>
              </div>
            </section>
                    </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 relative z-10">
            {/* Calculator Card */}
            <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white p-10 rounded-2xl shadow-xl mb-8 sticky top-8 transform hover:scale-105 transition-all duration-300 animate-fade-in-delay-3 min-w-[400px]">
              <h3 className="text-2xl font-bold mb-6">
                {isArabic ? 'حاسبة أسعار التأمين الصحي' : 'Health Insurance Price Calculator'}
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-4 text-white/80">
                    {isArabic ? 'جاري تحميل البيانات...' : 'Loading data...'}
                  </p>
                </div>
              ) : companies.length === 0 || ageGroups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-white/80 mb-4">
                    {companies.length === 0 
                      ? (isArabic ? 'لا توجد شركات تأمين لديها أسعار متاحة حالياً' : 'No insurance companies with available pricing at the moment')
                      : (isArabic ? 'لا توجد بيانات متاحة' : 'No data available')
                    }
                  </p>
                  <button
                    onClick={loadPricingData}
                    className="bg-white text-caribbean-700 px-4 py-2 rounded-lg hover:bg-platinum-100 transition-colors text-sm"
                  >
                    {isArabic ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Insurance Company */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {isArabic ? 'شركة التأمين' : 'Insurance Company'}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full px-4 py-3 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 bg-white/20 backdrop-blur-md text-white placeholder-white/70 shadow-lg hover:bg-white/25 hover:border-white/50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.25) 100%)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)'
                        }}
                      >
                        <option value="" style={{
                          backgroundColor: 'rgba(26, 26, 26, 0.95)',
                          color: '#ffffff',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)'
                        }}>
                          {isArabic ? 'اختر شركة التأمين' : 'Select Insurance Company'}
                        </option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id} style={{
                            backgroundColor: 'rgba(26, 26, 26, 0.95)',
                            color: '#ffffff',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                          }}>
                            {isArabic 
                              ? `${company.name_ar || company.name} ${company.name_ar ? `(${company.name})` : ''}`
                              : `${company.name} ${company.name_ar ? `(${company.name_ar})` : ''}`
                            }
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-white/20 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}
                    </label>
                    <div className="relative">
                      <CustomDatePicker
                        value={birthDate}
                        onChange={setBirthDate}
                        maxDate={new Date().toISOString().split('T')[0]}
                        placeholder={isArabic ? 'اختر تاريخ الميلاد' : 'Select date of birth'}
                        isArabic={isArabic}
                        isDarkMode={isDarkMode}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-white/10 pointer-events-none"></div>
                    </div>
                    
                                          {calculatedAge !== null && (
                        <div className={`mt-2 p-3 rounded-xl border backdrop-blur-md shadow-lg ${
                          selectedAgeGroup 
                            ? 'bg-green-500/20 border-green-300/30'
                            : 'bg-red-500/20 border-red-300/30'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white/90">
                            {isArabic ? 'العمر المحسوب:' : 'Calculated Age:'}
                          </span>
                          <span className="text-lg font-bold text-white">
                            {calculatedAge} {isArabic ? 'سنة' : 'years'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {isArabic ? 'مدة التأمين' : 'Insurance Duration'}
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                      <button
                        type="button"
                        onClick={() => setSelectedDuration(12)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-md shadow-lg ${
                          selectedDuration === 12
                            ? 'border-white bg-white/20 text-white'
                            : 'border-white/30 bg-white/10 text-white/80 hover:border-white/50 hover:bg-white/15'
                        }`}
                      >
                        <Calendar className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-base font-medium">{getDurationText(12)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDuration(24)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-md shadow-lg ${
                          selectedDuration === 24
                            ? 'border-white bg-white/20 text-white'
                            : 'border-white/30 bg-white/10 text-white/80 hover:border-white/50 hover:bg-white/15'
                        }`}
                      >
                        <Calendar className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-base font-medium">{getDurationText(24)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Price Display */}
                  {calculatedPrice ? (
                    <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md shadow-lg">
                      <DollarSign className="w-10 h-10 text-white mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white mb-2">
                        {formatPrice(calculatedPrice)}
                      </div>
                      <p className="text-white/80 text-base">
                        {isArabic ? 'للمدة المحددة' : 'for the selected duration'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md shadow-lg">
                      <Calculator className="w-10 h-10 text-white/60 mx-auto mb-3" />
                      <p className="text-white/60 text-base">
                        {isArabic ? 'اختر الخيارات لحساب السعر' : 'Select options to calculate price'}
                      </p>
                    </div>
                  )}

                  {/* Calculate Button */}
                  <button
                    onClick={() => {
                      setShowRequestForm(true);
                    }}
                    disabled={(() => {
                      const isDisabled = !selectedCompany || !birthDate || calculatedAge === null || !selectedAgeGroup || calculatedPrice === null;
                      return isDisabled;
                    })()}
                    className="w-full bg-white/90 backdrop-blur-md text-caribbean-700 py-4 px-8 rounded-xl font-semibold hover:bg-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg text-lg"
                  >
                    <Calculator className="w-6 h-6 mr-3" />
                    {isArabic ? 'احسب السعر واطلب التأمين' : 'Calculate Price & Request Insurance'}
                  </button>
                </div>
              )}
            </div>

            {/* Contact Card */}
            <div className="bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-xl border border-platinum-300 dark:border-jet-600">
              <h3 className="text-2xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400">
                {isArabic ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
              </h3>
              <p className="mb-6 text-jet-600 dark:text-platinum-400">
                {isArabic ? 'تواصل معنا للحصول على استشارة مجانية' : 'Contact us for a free consultation'}
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-caribbean-600 dark:text-caribbean-400 ml-3" />
                  <span className="text-jet-700 dark:text-platinum-300">+90 534 962 72 41</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400 ml-3" />
                  <span className="text-jet-700 dark:text-platinum-300">info@tevasul.group</span>
                </div>
              </div>
              
              <button 
                onClick={onNavigateToContact}
                className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300"
              >
                {isArabic ? 'تواصل معنا الآن' : 'Contact Us Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-16 relative overflow-hidden">
        {/* Background Animation Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-20 w-40 h-40 bg-white/10 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full animate-float-slow"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/8 rounded-full animate-bounce-slow"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
            {isArabic ? 'هل أنت مستعد لبدء رحلة التأمين الصحي؟' : 'Ready to Start Your Health Insurance Journey?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 animate-fade-in-delay-1">
            {isArabic ? 'انضم إلى آلاف العملاء الراضين الذين حصلوا على التأمين الصحي من خلالنا' : 'Join thousands of satisfied customers who got health insurance through us'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
            <button 
              onClick={() => setShowRequestForm(true)}
              className="bg-white text-caribbean-700 px-8 py-4 rounded-full font-semibold hover:bg-platinum-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isArabic ? 'اطلب التأمين الصحي الآن' : 'Request Health Insurance Now'}
            </button>
            <button 
              onClick={onNavigateToContact}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              {isArabic ? 'تحدث مع خبير' : 'Talk to Expert'}
            </button>
          </div>
        </div>
      </div>

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
                            if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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
                              {isArabic ? 'الصيغ المدعومة: JPG, PNG, PDF, DOC, DOCX' : 'Accepted formats: JPG, PNG, PDF, DOC, DOCX'}
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
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
