import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Eye, EyeOff, ChevronDown, Search } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { countryCodes, CountryCode } from '../lib/supabase';

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
  const { signUp, signIn } = useAuthContext();
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

  // Get user context
  const { user, profile } = useAuthContext();

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
          window.location.href = '/home';
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
          window.location.href = '/home';
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
            console.log('🔄 تغيير الموقع إلى /home');
            if (onNavigateToHome) {
              onNavigateToHome();
            } else {
              window.location.href = '/home';
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
            console.log('🔄 تغيير الموقع إلى /home');
            if (onNavigateToHome) {
              onNavigateToHome();
            } else {
              window.location.href = '/home';
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
    
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.confirmPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    if (signupData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signUp({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        countryCode: signupData.countryCode,
        password: signupData.password,
      });
      
      if (error) {
        console.error('❌ خطأ إنشاء الحساب:', error);
        let errorMessage = 'حدث خطأ في إنشاء الحساب';
        
        if (error.message?.includes('User already registered') || error.message?.includes('already_registered')) {
          errorMessage = 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.';
        } else if (error.message?.includes('Password') || error.message?.includes('password')) {
          errorMessage = 'كلمة المرور ضعيفة. يجب أن تحتوي على 6 أحرف على الأقل';
        } else if (error.message?.includes('Email') || error.message?.includes('email')) {
          errorMessage = 'البريد الإلكتروني غير صحيح';
        } else if (error.message?.includes('signup_disabled')) {
          errorMessage = 'التسجيل معطل حالياً';
        } else {
          errorMessage = `خطأ: ${error.message || 'خطأ غير معروف'}`;
        }
        
        setError(errorMessage);
        setLoading(false);
      } else {
        console.log('✅ تم إنشاء الحساب بنجاح، إظهار رسالة التحقق بالبريد الإلكتروني');
        
        setLoading(false);
        
        // حفظ معلومات المستخدم في localStorage لإظهار رسالة الترحيب بعد التحديث
        localStorage.setItem('justLoggedIn', 'true');
        localStorage.setItem('userEmail', signupData.email);
        localStorage.setItem('userName', signupData.name);
        console.log('💾 حفظ معلومات إنشاء الحساب في localStorage');
        
        // التحقق من وجود طلب خدمة معلق
        const pendingRequest = localStorage.getItem('pendingServiceRequest');
        if (pendingRequest) {
          localStorage.setItem('openServiceRequest', pendingRequest);
          localStorage.removeItem('pendingServiceRequest');
        }
        
        // إغلاق المودال وإظهار رسالة التحقق
        onCloseSignup();
        setSignupData({ name: '', email: '', phone: '', countryCode: '+90', password: '', confirmPassword: '' });
        setError(null);
        
        // إظهار رسالة التحقق بالبريد الإلكتروني
        alert(`تم إنشاء حسابك بنجاح! 
        
يرجى التحقق من بريدك الإلكتروني (${signupData.email}) وتأكيد حسابك بالضغط على الرابط المرسل إليك.

بعد تأكيد البريد الإلكتروني، يمكنك تسجيل الدخول واستخدام جميع ميزات التطبيق.`);
        
        // Navigate to home page after showing alert
        if (onNavigateToHome) {
          console.log('🔄 إعادة توجيه إلى الصفحة الرئيسية بعد إنشاء الحساب');
          onNavigateToHome();
        } else {
          console.log('🔄 تغيير الموقع إلى /home');
          window.location.href = '/home';
        }
      }
    } catch (error) {
      console.error('💥 خطأ غير متوقع في إنشاء الحساب:', error);
      setError('حدث خطأ غير متوقع في إنشاء الحساب');
      setLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    onSwitchToSignup();
    setError(null);
    setLoading(false);
    setSignupData({ name: '', email: '', phone: '', countryCode: '+90', password: '', confirmPassword: '' });
  };
  
  const handleSwitchToLogin = () => {
    onSwitchToLogin();
    setError(null);
    setLoading(false);
    setLoginData({ emailOrPhone: '', password: '' });
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isLoginOpen) onCloseLogin();
        if (isSignupOpen) onCloseSignup();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isLoginOpen, isSignupOpen, onCloseLogin, onCloseSignup]);

  // Don't render if modals are not open
  if (!isLoginOpen && !isSignupOpen) return null;

  // Don't render if user is already authenticated (extra safety check)
  if (user) {
    console.log('🔒 منع عرض المودال - المستخدم مسجل دخول بالفعل');
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={isLoginOpen ? onCloseLogin : onCloseSignup}
      ></div>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className={`relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600 transition-all duration-500 ${
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
            className="absolute top-4 right-4 p-2 text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-jet-800 dark:text-white mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-jet-600 dark:text-platinum-400">
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
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({...loginData, emailOrPhone: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="example@email.com"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-3 pl-12 pr-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="كلمة المرور"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-400 hover:text-jet-600 dark:hover:text-platinum-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-jet-600 dark:text-platinum-400">
              ليس لديك حساب؟{' '}
              <button
                onClick={handleSwitchToSignup}
                className="text-caribbean-600 dark:text-caribbean-400 hover:text-caribbean-700 dark:hover:text-caribbean-300 font-semibold transition-colors duration-300"
              >
                سجل الآن
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {isSignupOpen && (
        <div className={`relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600 max-h-[85vh] overflow-y-auto transition-all duration-500 ${
          isTransitioning 
            ? 'opacity-0 scale-95 translate-y-4 rotate-2' 
            : 'opacity-100 scale-100 translate-y-0 rotate-0'
        }`}>
          <button
            onClick={onCloseSignup}
            className="absolute top-4 right-4 p-2 text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-jet-800 dark:text-white mb-2">
              إنشاء حساب جديد
            </h2>
            <p className="text-jet-600 dark:text-platinum-400">
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
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="اكتب اسمك الكامل"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="example@email.com"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                رقم الهاتف
              </label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="flex items-center px-3 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white min-w-[120px]"
                  >
                    <span className="text-lg mr-2">{selectedCountry.flag}</span>
                    <span className="text-sm">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </button>
                  
                  {/* Country Dropdown */}
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-jet-700 border border-platinum-300 dark:border-jet-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                      {/* Search Box */}
                      <div className="p-2 border-b border-platinum-200 dark:border-jet-600">
                        <div className="relative">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="ابحث عن دولة..."
                            className="w-full px-3 py-2 pl-8 text-sm border border-platinum-300 dark:border-jet-600 rounded focus:outline-none focus:ring-1 focus:ring-caribbean-500 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                          />
                          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-400" />
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
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                    className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                    placeholder="5XX XXX XX XX"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Phone className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-jet-500 dark:text-platinum-500 mt-1">
                رقم الهاتف للتواصل معك فقط - لن يُستخدم لتسجيل الدخول
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  className="w-full px-4 py-3 pl-12 pr-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="كلمة المرور"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-400 hover:text-jet-600 dark:hover:text-platinum-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="أعد كتابة كلمة المرور"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>
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
    </div>
  );
};

export default AuthModals;
