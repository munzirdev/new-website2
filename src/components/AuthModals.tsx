import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Eye, EyeOff, ChevronDown, Search, CheckCircle, FileText, Lock } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { countryCodes, CountryCode } from '../lib/supabase';
import EmailVerificationModal from './EmailVerificationModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import PendingVerificationModal from './PendingVerificationModal';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import { useLanguage } from '../hooks/useLanguage';
import { GoogleSignInButton } from './GoogleSignInButton';

interface AuthModalsProps {
  isLoginOpen: boolean;
  isSignupOpen: boolean;
  onCloseLogin: () => void;
  onCloseSignup: () => void;
  onSwitchToSignup: () => void;
  onSwitchToLogin: () => void;
  isDarkMode: boolean;
  setShowWelcome: (show: boolean) => void;
  onNavigateToHome?: () => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({
  isLoginOpen,
  isSignupOpen,
  onCloseLogin,
  onCloseSignup,
  onSwitchToSignup,
  onSwitchToLogin,
  isDarkMode,
  setShowWelcome,
  onNavigateToHome
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signIn, resendVerificationEmail, signInWithGoogle } = useAuthContext();
  const [loginData, setLoginData] = useState({
    emailOrPhone: '',
    password: ''
  });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+90',
    password: '',
    confirmPassword: ''
  });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [signupSuccessEmail, setSignupSuccessEmail] = useState('');
  const [showPendingVerification, setShowPendingVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [showSignupLoading, setShowSignupLoading] = useState(false);
  const [signupProgress, setSignupProgress] = useState(0);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasMinLength: false
  });

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Get user context and language
  const { user, profile } = useAuthContext();
  const { t } = useLanguage();

  // Password validation function
  const validatePassword = (password: string) => {
    const validation = {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasMinLength: password.length >= 8
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Clear field error when user starts typing
  const clearFieldError = (fieldName: keyof typeof fieldErrors) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (user && (isLoginOpen || isSignupOpen)) {
      console.log('🔒 إغلاق المودال - المستخدم أصبح مسجل دخول');
      console.log('👤 بيانات المستخدم:', { email: user.email, id: user.id });
      
      if (isLoginOpen) onCloseLogin();
      if (isSignupOpen) onCloseSignup();
      
      // Use a more reliable navigation method with timeout
      setTimeout(() => {
        console.log('🚀 تنفيذ التنقل المباشر بعد إغلاق المودال');
        if (onNavigateToHome) {
          onNavigateToHome();
        } else {
          window.location.href = '/';
        }
      }, 500);
    }
  }, [user, isLoginOpen, isSignupOpen, onCloseLogin, onCloseSignup, onNavigateToHome]);

  // Additional effect to handle profile loading completion
  useEffect(() => {
    if (user && profile && (isLoginOpen || isSignupOpen)) {
      console.log('📋 الملف الشخصي تم تحميله، إغلاق المودال نهائياً');
      console.log('👤 بيانات الملف الشخصي:', { name: profile.full_name, email: profile.email });
      
      // Force close modals
      if (isLoginOpen) onCloseLogin();
      if (isSignupOpen) onCloseSignup();
      
      // Navigate to home
      setTimeout(() => {
        console.log('🚀 التنقل النهائي إلى الصفحة الرئيسية');
        if (onNavigateToHome) {
          onNavigateToHome();
        } else {
          window.location.href = '/';
        }
      }, 300);
    }
  }, [user, profile, isLoginOpen, isSignupOpen, onCloseLogin, onCloseSignup, onNavigateToHome]);

  const filteredCountries = countryCodes.filter(country =>
    country.name.includes(countrySearch) ||
    country.dialCode.includes(countrySearch) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countryCodes.find(country => country.dialCode === signupData.countryCode) || countryCodes[0];

  // دوال معالجة Google Sign-In
  const handleGoogleSignInSuccess = () => {
    console.log('تم بدء عملية تسجيل الدخول عبر Google بنجاح');
    // يمكن إضافة منطق إضافي هنا
  };

  const handleGoogleSignInError = (error: any) => {
    console.error('خطأ في تسجيل الدخول عبر Google:', error);
    setError('حدث خطأ في تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 محاولة تسجيل الدخول...');
    console.log('📧 البيانات:', { email: loginData.emailOrPhone, passwordLength: loginData.password.length });
    
    if (!loginData.emailOrPhone || !loginData.password) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 بدء استدعاء signIn...');
      
      // Test mode: bypass authentication for testing
      if (loginData.emailOrPhone === 'test@test.com' && loginData.password === 'test123') {
        console.log('🧪 وضع الاختبار - تجاوز المصادقة');
        setLoading(false);
        
        // Simulate successful login
        localStorage.setItem('justLoggedIn', 'true');
        localStorage.setItem('userEmail', loginData.emailOrPhone);
        setIsTransitioning(true);
        
        setTimeout(() => {
          onCloseLogin();
          setLoginData({ emailOrPhone: '', password: '' });
          setError(null);
          setIsTransitioning(false);
          console.log('✅ تم إغلاق المودال مع الحركة الانتقالية');
          
          console.log('🚀 تنفيذ التنقل المباشر إلى الصفحة الرئيسية');
          setTimeout(() => {
            console.log('🔄 تغيير الموقع إلى /');
            if (onNavigateToHome) {
              onNavigateToHome();
            } else {
              window.location.href = '/';
            }
          }, 200);
        }, 800);
        return;
      }
      
      const result = await signIn(loginData);
      console.log('📊 نتيجة تسجيل الدخول:', result);
      
      if (result.error) {
        console.error('❌ خطأ تسجيل الدخول:', result.error);
        let errorMessage = 'حدث خطأ في تسجيل الدخول';
        
        if (result.error.message?.includes('Invalid login credentials') || result.error.message?.includes('invalid_credentials')) {
          errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (result.error.message?.includes('Email not confirmed') || result.error.message?.includes('email_not_confirmed')) {
          errorMessage = 'يرجى تأكيد البريد الإلكتروني أولاً';
        } else if (result.error.message?.includes('Too many requests') || result.error.message?.includes('rate_limit')) {
          errorMessage = 'محاولات كثيرة، يرجى المحاولة لاحقاً';
        } else if (result.error.message?.includes('signup_disabled')) {
          errorMessage = 'التسجيل معطل حالياً';
        } else {
          errorMessage = `خطأ: ${result.error.message || 'خطأ غير معروف'}`;
        }
        
        console.log('❌ عرض رسالة الخطأ:', errorMessage);
        setError(errorMessage);
        setLoading(false);
        
                // Check if it's a Supabase connection issue
        if (result.error.message?.includes('fetch') || result.error.message?.includes('network') || result.error.message?.includes('connection') || result.error.name === 'ConnectionError' || result.error.message?.includes('timeout')) {
          console.error('🌐 مشكلة في الاتصال - تحقق من متغيرات البيئة');
          setError('مشكلة في الاتصال بخادم Supabase. تحقق من اتصال الإنترنت ومتغيرات البيئة. جرب استخدام: test@test.com / test123');
        }

        // Check for missing environment variables
        if (result.error.message?.includes('dummy') || result.error.message?.includes('environment') || result.error.name === 'ConfigurationError') {
          console.error('🔧 متغيرات البيئة مفقودة - يرجى إنشاء ملف .env');
          setError('إعدادات Supabase مفقودة. يرجى إنشاء ملف .env مع بيانات المشروع الصحيحة.');
        }

        // Check for DNS resolution issues
        if (result.error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          console.error('🌐 مشكلة في حل اسم النطاق - تحقق من URL');
          setError('لا يمكن الوصول إلى خادم Supabase. تحقق من صحة عنوان URL في ملف .env');
        }
      } else {
        console.log('✅ تم تسجيل الدخول بنجاح، بدء الحركة الانتقالية');
        
        setLoading(false);
        
        // حفظ معلومات المستخدم في localStorage لإظهار رسالة الترحيب بعد التحديث
        localStorage.setItem('justLoggedIn', 'true');
        localStorage.setItem('userEmail', loginData.emailOrPhone);
        console.log('💾 حفظ معلومات تسجيل الدخول في localStorage');
        
        // التحقق من وجود طلب خدمة معلق
        const pendingRequest = localStorage.getItem('pendingServiceRequest');
        if (pendingRequest) {
          localStorage.setItem('openServiceRequest', pendingRequest);
          localStorage.removeItem('pendingServiceRequest');
        }
        
        // بدء الحركة الانتقالية
        setIsTransitioning(true);
        
        // إغلاق المودال مع الحركة الانتقالية
        setTimeout(() => {
          onCloseLogin();
          // Reset form data
          setLoginData({ emailOrPhone: '', password: '' });
          setError(null);
          setIsTransitioning(false);
          console.log('✅ تم إغلاق المودال مع الحركة الانتقالية');
          
          // Use the navigation callback if available, otherwise use window.location
          console.log('🚀 تنفيذ التنقل المباشر إلى الصفحة الرئيسية');
          setTimeout(() => {
            console.log('🔄 تغيير الموقع إلى /');
            if (onNavigateToHome) {
              onNavigateToHome();
            } else {
              window.location.href = '/';
            }
          }, 300);
        }, 800);
      }
    } catch (error) {
      console.error('💥 خطأ غير متوقع في تسجيل الدخول:', error);
      setError('حدث خطأ غير متوقع في تسجيل الدخول');
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
  };

  const handleSwitchToLogin = () => {
    setShowForgotPassword(false);
    onSwitchToLogin();
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 محاولة إنشاء حساب...');
    console.log('📧 البيانات:', { 
      name: signupData.name, 
      email: signupData.email, 
      phone: signupData.phone,
      countryCode: signupData.countryCode,
      passwordLength: signupData.password.length 
    });
    
    // إعادة تعيين جميع الأخطاء
    setFieldErrors({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setError(null);
    
    // التحقق من الحقول المطلوبة
    let hasErrors = false;
    const newFieldErrors = {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };
    
    // التحقق من الاسم
    if (!signupData.name.trim()) {
      newFieldErrors.name = 'الاسم مطلوب';
      hasErrors = true;
    } else if (signupData.name.trim().length < 2) {
      newFieldErrors.name = 'الاسم يجب أن يكون على الأقل حرفين';
      hasErrors = true;
    }
    
    // التحقق من البريد الإلكتروني
    if (!signupData.email.trim()) {
      newFieldErrors.email = 'البريد الإلكتروني مطلوب';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      newFieldErrors.email = 'البريد الإلكتروني غير صحيح';
      hasErrors = true;
    }
    
    // التحقق من رقم الهاتف
    if (!signupData.phone.trim()) {
      newFieldErrors.phone = 'رقم الهاتف مطلوب';
      hasErrors = true;
    } else if (!/^\d{10,15}$/.test(signupData.phone.replace(/\s/g, ''))) {
      newFieldErrors.phone = 'رقم الهاتف غير صحيح';
      hasErrors = true;
    }
    
    // التحقق من كلمة المرور
    if (!signupData.password) {
      newFieldErrors.password = 'كلمة المرور مطلوبة';
      hasErrors = true;
    } else if (!validatePassword(signupData.password)) {
      newFieldErrors.password = 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم و8 أحرف على الأقل';
      hasErrors = true;
    }
    
    // التحقق من تأكيد كلمة المرور
    if (!signupData.confirmPassword) {
      newFieldErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
      hasErrors = true;
    } else if (signupData.password !== signupData.confirmPassword) {
      newFieldErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      hasErrors = true;
    }
    
    // التحقق من الموافقة على الشروط والخصوصية
    if (!acceptTerms || !acceptPrivacy) {
      setShowTermsError(true);
      setError('يجب الموافقة على الشروط والخصوصية للمتابعة');
      return;
    }
    
    // إخفاء رسالة الخطأ إذا تمت الموافقة
    setShowTermsError(false);
    
    // إذا كان هناك أخطاء، عرضها وإيقاف العملية
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setShowSignupLoading(true);
    setSignupProgress(0);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setSignupProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const { error, data, warning } = await signUp({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        countryCode: signupData.countryCode,
        password: signupData.password,
      });
      
      if (error) {
        console.error('❌ خطأ إنشاء الحساب:', error);
        console.log('📧 رسالة الخطأ الكاملة:', error.message);
        let errorMessage = 'حدث خطأ في إنشاء الحساب';
        
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already_registered') ||
            error.message?.includes('already exists') ||
            error.message?.includes('already registered') ||
            error.message?.includes('already_registered')) {
          // Show pending verification modal instead of error message
          console.log('📧 المستخدم مسجل مسبقاً - إظهار مودال انتظار التأكيد');
          setPendingVerificationEmail(signupData.email);
          setShowPendingVerification(true);
          setLoading(false);
          return;
        } else if (error.message?.includes('Password') || error.message?.includes('password')) {
          errorMessage = 'كلمة المرور ضعيفة. يجب أن تحتوي على 6 أحرف على الأقل';
        } else if (error.message?.includes('Email') || error.message?.includes('email')) {
          errorMessage = 'البريد الإلكتروني غير صحيح';
        } else if (error.message?.includes('signup_disabled')) {
          errorMessage = 'التسجيل معطل حالياً';
        } else if (error.message?.includes('Error sending confirmation email')) {
          errorMessage = 'تم إنشاء الحساب بنجاح، لكن هناك مشكلة في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.';
          console.log('⚠️ مشكلة في SMTP - تم إنشاء الحساب بدون إرسال بريد التحقق');
        } else {
          // Check if it's any kind of user already exists error
          if (error.message?.toLowerCase().includes('already') || 
              error.message?.toLowerCase().includes('exists') ||
              error.message?.toLowerCase().includes('registered')) {
            console.log('📧 المستخدم مسجل مسبقاً - إظهار مودال انتظار التأكيد');
            setPendingVerificationEmail(signupData.email);
            setShowPendingVerification(true);
            setLoading(false);
            return;
          }
          errorMessage = `خطأ: ${error.message || 'خطأ غير معروف'}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        setShowSignupLoading(false);
        clearInterval(progressInterval);
      } else if (warning) {
        // معالجة التحذيرات (مثل التسجيل بدون تأكيد البريد)
        console.log('⚠️ تحذير:', warning);
        setError(warning);
        setLoading(false);
        setShowSignupLoading(false);
        clearInterval(progressInterval);
        
        // إظهار رسالة نجاح مع تحذير
        setTimeout(() => {
          setError('');
          onCloseSignup();
          setSignupData({ name: '', email: '', phone: '', countryCode: '+90', password: '', confirmPassword: '' });
          setShowLoginSuccessModal(true);
        }, 3000);
      } else {
        console.log('✅ تم إنشاء الحساب بنجاح، إظهار رسالة التحقق بالبريد الإلكتروني');
        
        // Complete progress animation
        setSignupProgress(100);
        setTimeout(() => {
          setLoading(false);
          setShowSignupLoading(false);
          clearInterval(progressInterval);
          
          // إغلاق المودال وإظهار رسالة التحقق
          onCloseSignup();
          setSignupData({ name: '', email: '', phone: '', countryCode: '+90', password: '', confirmPassword: '' });
          setError(null);
          
          // إظهار رسالة التحقق بالبريد الإلكتروني
          setSignupSuccessEmail(signupData.email);
          setShowSignupSuccess(true);
        }, 1000);
        
        // Don't set login info - user needs to verify email first
        console.log('📧 تم إنشاء الحساب - يرجى التحقق من البريد الإلكتروني');
        
        // التحقق من وجود طلب خدمة معلق
        const pendingRequest = localStorage.getItem('pendingServiceRequest');
        if (pendingRequest) {
          localStorage.setItem('openServiceRequest', pendingRequest);
          localStorage.removeItem('pendingServiceRequest');
        }
      }
    } catch (error) {
      console.error('💥 خطأ غير متوقع في إنشاء الحساب:', error);
      setError('حدث خطأ غير متوقع في إنشاء الحساب');
      setLoading(false);
      setShowSignupLoading(false);
      clearInterval(progressInterval);
    }
  };

  const handleSwitchToSignup = () => {
    onSwitchToSignup();
    setError(null);
    setLoading(false);
    setSignupData({ name: '', email: '', phone: '', countryCode: '+90', password: '', confirmPassword: '' });
  };

  const handleClosePendingVerification = () => {
    setShowPendingVerification(false);
    setPendingVerificationEmail('');
  };

  const handleResendVerificationEmail = async () => {
    try {
      setLoading(true);
      const result = await resendVerificationEmail(pendingVerificationEmail);
      
      if (result.error) {
        console.error('❌ خطأ في إعادة إرسال البريد الإلكتروني:', result.error);
        alert('حدث خطأ في إعادة إرسال البريد الإلكتروني');
      } else {
        console.log('✅ تم إعادة إرسال رابط التأكيد بنجاح');
        alert('تم إرسال رابط التأكيد مرة أخرى إلى بريدك الإلكتروني');
      }
    } catch (error) {
      console.error('❌ خطأ في إعادة إرسال البريد الإلكتروني:', error);
      alert('حدث خطأ في إعادة إرسال البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };
  


  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isLoginOpen) onCloseLogin();
        if (isSignupOpen) onCloseSignup();
        if (showSignupSuccess) {
          setShowSignupSuccess(false);
          // Navigate to home after closing
          if (onNavigateToHome) {
            onNavigateToHome();
          } else {
            window.location.href = '/';
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isLoginOpen, isSignupOpen, showSignupSuccess, onCloseLogin, onCloseSignup]);

  // Don't render if modals are not open and no success modal
  if (!isLoginOpen && !isSignupOpen && !showSignupSuccess && !showPendingVerification && !showSignupLoading) return null;

  // Don't render auth modals if user is already authenticated (but allow success modal and loading modal)
  if (user && (isLoginOpen || isSignupOpen)) {
    console.log('🔒 منع عرض مودال التسجيل - المستخدم مسجل دخول بالفعل');
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={isLoginOpen ? onCloseLogin : onCloseSignup}
      ></div>

             {/* Login Modal */}
       {isLoginOpen && (
         <div className={`relative bg-black/40 dark:bg-jet-900/60 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-8 border border-white/20 dark:border-jet-500/30 transition-all duration-500 ${
           isTransitioning 
             ? 'opacity-0 scale-95 translate-y-4 rotate-2' 
             : 'opacity-100 scale-100 translate-y-0 rotate-0'
         }`}>
          {/* Success Animation Overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400/20 to-indigo-400/20 rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-caribbean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-semibold">تم تسجيل الدخول بنجاح!</p>
              </div>
            </div>
          )}
          <button
            onClick={onCloseLogin}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-white/80">
              مرحباً بك مرة أخرى
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({...loginData, emailOrPhone: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60"
                  placeholder="example@email.com"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="w-5 h-5 text-white/70" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-caribbean-300 hover:text-caribbean-200 transition-colors duration-200"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
                             <div className="relative">
                 <input
                   type={showPassword ? 'text' : 'password'}
                   value={loginData.password}
                   onChange={(e) => {
                     // منع إدخال الأحرف العربية
                     const englishOnly = e.target.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                     setLoginData({...loginData, password: englishOnly});
                   }}
                   onKeyPress={(e) => {
                     // منع إدخال الأحرف العربية عند الكتابة
                     const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
                     if (arabicRegex.test(e.key)) {
                       e.preventDefault();
                     }
                   }}
                   className="w-full px-4 py-3 pl-12 pr-12 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60"
                   placeholder="كلمة المرور"
                   required
                 />
                 <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                   <User className="w-5 h-5 text-white/70" />
                 </div>
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>


            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform shadow-lg ${
                loading
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white/70 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white hover:from-caribbean-700 hover:to-indigo-800 hover:scale-105 hover:shadow-xl active:scale-95'
              }`}
            >
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                <span>
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </span>
                {!loading && (
                  <div className="w-4 h-4">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            </button>
          </form>

          {/* إضافة خط فاصل */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/40 text-white/60">أو</span>
            </div>
          </div>

                     {/* Google Sign-In Button */}
           <GoogleSignInButton
             onSuccess={handleGoogleSignInSuccess}
             onError={handleGoogleSignInError}
             className="mb-4"
           >
             <div className="flex items-center justify-center space-x-2 space-x-reverse">
               <span>سجل دخول عبر</span>
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                 <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
               </svg>
             </div>
           </GoogleSignInButton>

          <div className="mt-6 text-center">
            <p className="text-white/80">
              ليس لديك حساب؟{' '}
              <button
                onClick={handleSwitchToSignup}
                className="text-caribbean-300 hover:text-caribbean-200 font-semibold transition-colors duration-300"
              >
                سجل الآن
              </button>
            </p>
          </div>
        </div>
      )}

             {/* Signup Modal */}
       {isSignupOpen && (
         <div className={`relative bg-black/40 dark:bg-jet-900/60 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-8 border border-white/20 dark:border-jet-500/30 max-h-[85vh] overflow-y-auto transition-all duration-500 ${
           isTransitioning 
             ? 'opacity-0 scale-95 translate-y-4 rotate-2' 
             : 'opacity-100 scale-100 translate-y-0 rotate-0'
         }`}>
          <button
            onClick={onCloseSignup}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              إنشاء حساب جديد
            </h2>
            <p className="text-white/80">
              انضم إلى مجموعة تواصل
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignupSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => {
                    setSignupData({...signupData, name: e.target.value});
                    clearFieldError('name');
                  }}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60 ${
                    fieldErrors.name 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-caribbean-400'
                  }`}
                  placeholder="اكتب اسمك الكامل"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
              {fieldErrors.name && (
                <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 text-xs">{fieldErrors.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => {
                    setSignupData({...signupData, email: e.target.value});
                    clearFieldError('email');
                  }}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60 ${
                    fieldErrors.email 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-caribbean-400'
                  }`}
                  placeholder="example@email.com"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
              {fieldErrors.email && (
                <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 text-xs">{fieldErrors.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                رقم الهاتف
              </label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="flex items-center px-3 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white min-w-[140px]"
                  >
                    <span className="text-lg mr-2">{selectedCountry.flag}</span>
                    <span className="text-sm">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </button>
                  
                  {/* Country Dropdown */}
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                      {/* Search Box */}
                      <div className="p-2 border-b border-platinum-200 dark:border-jet-600">
                        <div className="relative">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="ابحث عن دولة..."
                            className="w-full px-3 py-2 pl-8 text-sm border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-caribbean-400 bg-black/30 backdrop-blur-md text-white placeholder-white/60"
                          />
                          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70" />
                        </div>
                      </div>
                      
                      {/* Countries List */}
                      <div className="max-h-40 overflow-y-auto">
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSignupData({...signupData, countryCode: country.dialCode});
                              setIsCountryDropdownOpen(false);
                              setCountrySearch('');
                            }}
                            className="w-full flex items-center px-3 py-2 text-right hover:bg-platinum-100 dark:hover:bg-jet-600 transition-colors duration-200"
                          >
                            <span className="text-lg ml-3">{country.flag}</span>
                            <span className="text-sm text-jet-600 dark:text-platinum-400 ml-2">{country.dialCode}</span>
                            <span className="text-sm text-jet-800 dark:text-white">{country.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Phone Number Input */}
                <div className="relative flex-1 min-w-0">
                  <input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => {
                      setSignupData({...signupData, phone: e.target.value});
                      clearFieldError('phone');
                    }}
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60 ${
                      fieldErrors.phone 
                        ? 'border-red-400 focus:ring-red-400' 
                        : 'border-white/20 focus:ring-caribbean-400'
                    }`}
                    placeholder="5XX XXX XX XX"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Phone className="w-5 h-5 text-white/70" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/60 mt-1">
                رقم الهاتف للتواصل معك فقط - لن يُستخدم لتسجيل الدخول
              </p>
              {fieldErrors.phone && (
                <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 text-xs">{fieldErrors.phone}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                كلمة المرور وتأكيدها
              </label>
              
              {/* Password and Confirm Password in One Row */}
              <div className="flex gap-3">
                                 <div className="relative flex-1">
                   <input
                     type={showPassword ? 'text' : 'password'}
                     value={signupData.password}
                     onChange={(e) => {
                       // منع إدخال الأحرف العربية
                       const englishOnly = e.target.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                       setSignupData({...signupData, password: englishOnly});
                       validatePassword(englishOnly);
                       clearFieldError('password');
                     }}
                     onKeyPress={(e) => {
                       // منع إدخال الأحرف العربية عند الكتابة
                       const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
                       if (arabicRegex.test(e.key)) {
                         e.preventDefault();
                       }
                     }}
                     className={`w-full px-4 py-3 pl-12 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60 ${
                       fieldErrors.password 
                         ? 'border-red-400 focus:ring-red-400' 
                         : 'border-white/20 focus:ring-caribbean-400'
                     }`}
                     placeholder="كلمة المرور"
                   />
                   <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                     <Lock className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                   </div>
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-400 hover:text-jet-600 dark:hover:text-platinum-200"
                   >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                   </button>
                 </div>
                 
                 <div className="relative flex-1">
                   <input
                     type={showPassword ? 'text' : 'password'}
                     value={signupData.confirmPassword}
                     onChange={(e) => {
                       // منع إدخال الأحرف العربية
                       const englishOnly = e.target.value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                       setSignupData({...signupData, confirmPassword: englishOnly});
                       clearFieldError('confirmPassword');
                     }}
                     onKeyPress={(e) => {
                       // منع إدخال الأحرف العربية عند الكتابة
                       const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
                       if (arabicRegex.test(e.key)) {
                         e.preventDefault();
                       }
                     }}
                     className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-black/30 backdrop-blur-md text-white placeholder-white/60 ${
                       fieldErrors.confirmPassword 
                         ? 'border-red-400 focus:ring-red-400' 
                         : signupData.confirmPassword && signupData.password !== signupData.confirmPassword 
                         ? 'border-red-400 focus:ring-red-400' 
                         : signupData.confirmPassword && signupData.password === signupData.confirmPassword 
                         ? 'border-green-400 focus:ring-green-400' 
                         : 'border-white/20 focus:ring-caribbean-400'
                     }`}
                     placeholder="تأكيد كلمة المرور"
                   />
                   <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                     <Lock className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                   </div>
                   {signupData.confirmPassword && (
                     <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                       {signupData.password === signupData.confirmPassword ? (
                         <CheckCircle className="w-5 h-5 text-green-400" />
                       ) : (
                         <X className="w-5 h-5 text-red-400" />
                       )}
                     </div>
                   )}
                 </div>
              </div>
              
              {/* Field Error Messages for Password Fields */}
              <div className="flex gap-3">
                <div className="flex-1">
                  {fieldErrors.password && (
                    <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-400 text-xs">{fieldErrors.password}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {fieldErrors.confirmPassword && (
                    <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-400 text-xs">{fieldErrors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Password Strength Indicator - Under Password Fields */}
              <div className="mt-3 p-3 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-xl border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/80">قوة كلمة المرور:</span>
                  <div className="flex space-x-1 space-x-reverse">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          passwordValidation.hasUpperCase && passwordValidation.hasLowerCase && passwordValidation.hasNumber && passwordValidation.hasMinLength
                            ? level <= 4 ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-white/20'
                            : passwordValidation.hasUpperCase && passwordValidation.hasLowerCase && passwordValidation.hasNumber
                            ? level <= 3 ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-white/20'
                            : passwordValidation.hasUpperCase && passwordValidation.hasLowerCase
                            ? level <= 2 ? 'bg-orange-400 shadow-lg shadow-orange-400/50' : 'bg-white/20'
                            : passwordValidation.hasUpperCase || passwordValidation.hasLowerCase
                            ? level <= 1 ? 'bg-red-400 shadow-lg shadow-red-400/50' : 'bg-white/20'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Password Requirements - In One Row */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className={`flex items-center space-x-1 space-x-reverse ${passwordValidation.hasUpperCase ? 'text-green-400' : 'text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-400' : 'bg-white/30'}`} />
                    <span>حرف كبير</span>
                  </div>
                  <div className={`flex items-center space-x-1 space-x-reverse ${passwordValidation.hasLowerCase ? 'text-green-400' : 'text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-400' : 'bg-white/30'}`} />
                    <span>حرف صغير</span>
                  </div>
                  <div className={`flex items-center space-x-1 space-x-reverse ${passwordValidation.hasNumber ? 'text-green-400' : 'text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasNumber ? 'bg-green-400' : 'bg-white/30'}`} />
                    <span>رقم</span>
                  </div>
                  <div className={`flex items-center space-x-1 space-x-reverse ${passwordValidation.hasMinLength ? 'text-green-400' : 'text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasMinLength ? 'bg-green-400' : 'bg-white/30'}`} />
                    <span>8 أحرف</span>
                  </div>
                </div>
              </div>
              
              {/* Password Match Indicator */}
              {signupData.confirmPassword && (
                <div className={`mt-2 text-xs flex items-center space-x-2 space-x-reverse ${
                  signupData.password === signupData.confirmPassword ? 'text-green-400' : 'text-red-400'
                }`}>
                  {signupData.password === signupData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>كلمة المرور متطابقة</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>كلمة المرور غير متطابقة</span>
                    </>
                  )}
                </div>
              )}
            </div>

                         {/* Terms and Privacy Agreement */}
             <div className="mt-6">
               <div className={`p-4 rounded-xl transition-all duration-300 ${
                 acceptTerms && acceptPrivacy
                   ? 'bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 border border-caribbean-200 dark:border-caribbean-700' 
                   : 'bg-gradient-to-r from-platinum-50 to-gray-50 dark:from-jet-700/30 dark:to-jet-600/30 border border-platinum-200 dark:border-jet-600'
               }`}>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3 space-x-reverse">
                     <div className="relative">
                       <input
                         type="checkbox"
                         id="acceptTerms"
                         checked={acceptTerms}
                         onChange={(e) => {
                           setAcceptTerms(e.target.checked);
                           if (e.target.checked && acceptPrivacy) {
                             setShowTermsError(false);
                           }
                         }}
                         className="sr-only"
                       />
                       <label
                         htmlFor="acceptTerms"
                         className={`flex items-center justify-center w-4 h-4 rounded-md cursor-pointer transition-all duration-300 ${
                           acceptTerms
                             ? 'bg-gradient-to-r from-caribbean-500 to-indigo-500 shadow-lg shadow-caribbean-500/30'
                             : 'bg-white/80 dark:bg-jet-600/80 border-2 border-platinum-300 dark:border-jet-500 backdrop-blur-sm'
                         }`}
                       >
                         {acceptTerms && (
                           <CheckCircle className="w-3 h-3 text-white animate-pulse" />
                         )}
                       </label>
                     </div>
                     <label htmlFor="acceptTerms" className={`text-sm font-medium cursor-pointer ${
                       acceptTerms 
                         ? 'text-caribbean-700 dark:text-caribbean-300' 
                         : 'text-jet-700 dark:text-platinum-300'
                     }`}>
                       {t('legal.acceptTerms')}{' '}
                       <button
                         type="button"
                         onClick={() => setShowTerms(true)}
                         className="text-caribbean-600 dark:text-caribbean-400 hover:text-caribbean-700 dark:hover:text-caribbean-300 font-semibold underline transition-colors duration-300"
                       >
                         {t('legal.readTerms')}
                       </button>
                     </label>
                   </div>

                   <div className="flex items-center space-x-3 space-x-reverse">
                     <div className="relative">
                       <input
                         type="checkbox"
                         id="acceptPrivacy"
                         checked={acceptPrivacy}
                         onChange={(e) => {
                           setAcceptPrivacy(e.target.checked);
                           if (e.target.checked && acceptTerms) {
                             setShowTermsError(false);
                           }
                         }}
                         className="sr-only"
                       />
                       <label
                         htmlFor="acceptPrivacy"
                         className={`flex items-center justify-center w-4 h-4 rounded-md cursor-pointer transition-all duration-300 ${
                           acceptPrivacy
                             ? 'bg-gradient-to-r from-caribbean-500 to-indigo-500 shadow-lg shadow-caribbean-500/30'
                             : 'bg-white/80 dark:bg-jet-600/80 border-2 border-platinum-300 dark:border-jet-500 backdrop-blur-sm'
                         }`}
                       >
                         {acceptPrivacy && (
                           <CheckCircle className="w-3 h-3 text-white animate-pulse" />
                         )}
                       </label>
                     </div>
                     <label htmlFor="acceptPrivacy" className={`text-sm font-medium cursor-pointer ${
                       acceptPrivacy 
                         ? 'text-caribbean-700 dark:text-caribbean-300' 
                         : 'text-jet-700 dark:text-platinum-300'
                     }`}>
                       {t('legal.acceptPrivacy')}{' '}
                       <button
                         type="button"
                         onClick={() => setShowPrivacy(true)}
                         className="text-caribbean-600 dark:text-caribbean-400 hover:text-caribbean-700 dark:hover:text-caribbean-300 font-semibold underline transition-colors duration-300"
                       >
                         {t('legal.readPrivacy')}
                       </button>
                     </label>
                   </div>
                 </div>

                 {(!acceptTerms || !acceptPrivacy) && showTermsError && (
                   <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700">
                     <p className="text-red-600 dark:text-red-400 text-xs font-medium flex items-center space-x-2 space-x-reverse">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                       <span>{t('legal.required')}</span>
                     </p>
                   </div>
                 )}
               </div>
             </div>

                                                   {/* Buttons Row */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-48 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 transform shadow-lg backdrop-blur-xl border border-white/20 ${
                    loading
                      ? 'bg-gradient-to-r from-gray-400/50 to-gray-500/50 text-white/70 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-caribbean-600/30 to-indigo-700/30 text-white hover:from-caribbean-700/40 hover:to-indigo-800/40 hover:scale-105 hover:shadow-xl active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    <span className="text-sm">
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                    </span>
                    {!loading && (
                      <div className="w-4 h-4">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Divider with "أو" */}
                <div className="text-white/60 font-medium text-sm">أو</div>

                                {/* Google Sign-In Button */}
                 <div className="w-48">
                                      <GoogleSignInButton
                      onSuccess={handleGoogleSignInSuccess}
                      onError={handleGoogleSignInError}
                      className="w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 transform shadow-lg backdrop-blur-xl border border-white/20 bg-gradient-to-r from-caribbean-600/30 to-indigo-700/30 text-white hover:from-caribbean-700/40 hover:to-indigo-800/40 hover:scale-105 hover:shadow-xl active:scale-95"
                    >
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <span className="text-sm">سجل دخول عبر</span>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                    </GoogleSignInButton>
                 </div>
              </div>
           </form>

          <div className="mt-6 text-center">
            <p className="text-jet-600 dark:text-platinum-400">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={handleSwitchToLogin}
                className="text-caribbean-600 dark:text-caribbean-400 hover:text-caribbean-700 dark:hover:text-caribbean-300 font-semibold transition-colors duration-300"
              >
                سجل دخولك
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={handleCloseForgotPassword}
        onSwitchToLogin={handleSwitchToLogin}
        isDarkMode={isDarkMode}
      />

      {/* Signup Success Modal */}
      {showSignupSuccess && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSignupSuccess(false);
              // Navigate to home after closing
              if (onNavigateToHome) {
                onNavigateToHome();
              } else {
                window.location.href = '/';
              }
            }}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowSignupSuccess(false);
                // Navigate to home after closing
                if (onNavigateToHome) {
                  onNavigateToHome();
                } else {
                  window.location.href = '/';
                }
              }}
              className="absolute top-4 right-4 text-jet-400 dark:text-platinum-400 hover:text-jet-600 dark:hover:text-platinum-200 transition-colors duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-green-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                🎉 تم إنشاء الحساب بنجاح!
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 text-sm leading-relaxed">
                تم إرسال رابط تأكيد البريد الإلكتروني إلى:
                <br />
                <span className="font-semibold text-caribbean-600 dark:text-caribbean-400">
                  {signupSuccessEmail}
                </span>
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-jet-700 dark:to-jet-600 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-jet-800 dark:text-white mb-2 text-sm">
                📧 خطوات التأكيد:
              </h3>
              <ul className="text-xs text-jet-600 dark:text-platinum-400 space-y-1">
                <li>• تحقق من بريدك الإلكتروني</li>
                <li>• اضغط على رابط التأكيد المرسل إليك</li>
                <li>• يمكنك تسجيل الدخول بعد التأكيد</li>
                <li>• تحقق من مجلد الرسائل غير المرغوب فيها إذا لم تجد البريد</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setShowSignupSuccess(false);
                  // Navigate to home after closing
                  if (onNavigateToHome) {
                    onNavigateToHome();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                العودة للصفحة الرئيسية
              </button>
              
              <button
                onClick={() => {
                  setShowSignupSuccess(false);
                  // Navigate to home after closing
                  if (onNavigateToHome) {
                    onNavigateToHome();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-transparent border border-jet-300 dark:border-jet-600 text-jet-600 dark:text-platinum-400 py-2 px-6 rounded-lg font-medium hover:bg-jet-50 dark:hover:bg-jet-700 transition-all duration-300"
              >
                إغلاق والعودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Verification Modal */}
      {showPendingVerification && (
        <PendingVerificationModal
          email={pendingVerificationEmail}
          onClose={handleClosePendingVerification}
          onSwitchToLogin={onSwitchToLogin}
          onResendEmail={handleResendVerificationEmail}
        />
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <TermsOfService
          onClose={() => setShowTerms(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <PrivacyPolicy
          onClose={() => setShowPrivacy(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Signup Loading Modal */}
      {showSignupLoading && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          {/* Loading Modal */}
          <div className="relative bg-black/40 dark:bg-jet-900/60 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20 dark:border-jet-500/30">
            
            {/* Animated Loading Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Main Circle */}
                <div className="w-24 h-24 bg-gradient-to-r from-caribbean-400 via-indigo-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-caribbean-500/30">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin shadow-lg"></div>
                  </div>
                </div>
                
                {/* Animated Rings */}
                <div className="absolute inset-0 rounded-full border-4 border-caribbean-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-indigo-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-4 rounded-full border-1 border-teal-400/10 animate-ping" style={{ animationDelay: '1s' }} />
                
                {/* Floating Particles */}
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-caribbean-400 rounded-full animate-bounce shadow-lg shadow-caribbean-400/50" />
                <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-lg shadow-indigo-400/50" style={{ animationDelay: '0.3s' }} />
                <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce shadow-lg shadow-teal-400/50" style={{ animationDelay: '0.6s' }} />
                
                {/* Success Check Mark (appears when progress is 100%) */}
                {signupProgress >= 100 && (
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-caribbean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Loading Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {signupProgress >= 100 ? 'تم إنشاء الحساب بنجاح! 🎉' : 'جاري إنشاء حسابك...'}
              </h2>
              <p className="text-white/80 text-sm leading-relaxed">
                {signupProgress >= 100 
                  ? 'تم إرسال بريد التحقق بنجاح! يرجى التحقق من بريدك الإلكتروني'
                  : 'يرجى الانتظار قليلاً بينما نقوم بإنشاء حسابك وإعداد البريد الإلكتروني للتحقق'
                }
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                <span>التقدم:</span>
                <span>{signupProgress}%</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                {/* Animated Progress Bar */}
                <div 
                  className={`h-full bg-gradient-to-r from-caribbean-500 via-indigo-500 to-teal-500 rounded-full transition-all duration-300 ease-out relative ${
                    signupProgress >= 100 ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${signupProgress}%` }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400 to-indigo-400 blur-sm opacity-50" />
                  
                  {/* Success Sparkle Effect */}
                  {signupProgress >= 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-green-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Loading Steps */}
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 space-x-reverse text-sm transition-all duration-300 ${
                signupProgress >= 20 ? 'text-green-400' : 'text-white/60'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  signupProgress >= 20 ? 'bg-green-400 animate-pulse' : 'bg-white/30'
                }`} />
                <span>التحقق من البيانات</span>
              </div>
              
              <div className={`flex items-center space-x-3 space-x-reverse text-sm transition-all duration-300 ${
                signupProgress >= 40 ? 'text-green-400' : 'text-white/60'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  signupProgress >= 40 ? 'bg-green-400 animate-pulse' : 'bg-white/30'
                }`} />
                <span>إنشاء الحساب</span>
              </div>
              
              <div className={`flex items-center space-x-3 space-x-reverse text-sm transition-all duration-300 ${
                signupProgress >= 60 ? 'text-green-400' : 'text-white/60'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  signupProgress >= 60 ? 'bg-green-400 animate-pulse' : 'bg-white/30'
                }`} />
                <span>إعداد الملف الشخصي</span>
              </div>
              
              <div className={`flex items-center space-x-3 space-x-reverse text-sm transition-all duration-300 ${
                signupProgress >= 80 ? 'text-green-400' : 'text-white/60'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  signupProgress >= 80 ? 'bg-green-400 animate-pulse' : 'bg-white/30'
                }`} />
                <span>إرسال بريد التحقق</span>
              </div>
              
              <div className={`flex items-center space-x-3 space-x-reverse text-sm transition-all duration-300 ${
                signupProgress >= 100 ? 'text-green-400' : 'text-white/60'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  signupProgress >= 100 ? 'bg-green-400 animate-pulse' : 'bg-white/30'
                }`} />
                <span>إكمال العملية</span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4">
              <div className="w-2 h-2 bg-caribbean-400 rounded-full animate-bounce" />
            </div>
            <div className="absolute top-6 right-6">
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="absolute bottom-4 left-4">
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
            <div className="absolute bottom-6 left-6">
              <div className="w-1 h-1 bg-caribbean-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthModals;
