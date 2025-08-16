import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Menu, X, ArrowRight, Star, Users, Zap, Heart, Mail, Phone, MapPin, Sun, Moon, Globe, FileText, Building, ChevronDown, CheckCircle, Shield, Clock, LogIn, UserPlus, User, Settings, HelpCircle, LogOut, Send, MessageCircle } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from './components/AuthProvider';
import { useLanguage } from './hooks/useLanguage';
import ServicePage from './components/ServicePage';
import HealthInsurancePage from './components/HealthInsurancePage';
import AuthModals from './components/AuthModals';
import WelcomeMessage from './components/WelcomeMessage';
import AdminDashboard from './components/AdminDashboard';
import ServiceRequestForm from './components/ServiceRequestForm';
import UserAccount from './components/UserAccount';
import ProfileEdit from './components/ProfileEdit';
import HelpSupport from './components/HelpSupport';
import VoluntaryReturnPage from './components/VoluntaryReturnPage';
import EmailVerification from './components/EmailVerification';
import LoginSuccessModal from './components/LoginSuccessModal';
import ChatBot from './components/ChatBot';


import { supabase } from './lib/supabase';

import { servicesData } from './data/services';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  const [currentService, setCurrentService] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showUserAccount, setShowUserAccount] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loginSuccessData, setLoginSuccessData] = useState<{
    userRole: 'admin' | 'moderator' | 'user';
    userName: string;
  } | null>(null);
  
  // Chat bot state
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [isChatBotMinimized, setIsChatBotMinimized] = useState(false);
  const [serviceRequestForm, setServiceRequestForm] = useState<{
    isOpen: boolean;
    serviceType: string;
    serviceTitle: string;
  }>({
    isOpen: false,
    serviceType: '',
    serviceTitle: ''
  });
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    serviceType: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const { user, profile, loading: authLoading, signOut, hasNotifications, clearNotifications } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();

  // Handle login success redirect
  const handleLoginSuccessRedirect = useCallback(() => {
    if (!loginSuccessData) return;
    
    const { userRole } = loginSuccessData;
    const isAdmin = userRole === 'admin';
    const isModerator = userRole === 'moderator';
    
    if (isAdmin || isModerator) {
      console.log('🔧 إعادة توجيه الأدمن/المشرف إلى لوحة التحكم');
      navigate('/admin', { replace: true });
    } else {
      console.log('👤 إعادة توجيه المستخدم العادي إلى الصفحة الرئيسية');
      navigate('/home', { replace: true });
    }
    
    // Close the success modal
    setShowLoginSuccess(false);
    setLoginSuccessData(null);
  }, [loginSuccessData, navigate]);





  // Navigation definition
  const navigation = [
    { name: t('nav.home'), href: '/home', isSection: false },
    { name: t('nav.services'), href: '#services', isSection: true },
    { name: t('nav.about'), href: '#about', isSection: true },
    { name: t('nav.contact'), href: '#contact', isSection: true }
  ];

  // Language change effect
  const handleLanguageChange = (newLanguage: 'ar' | 'tr' | 'en') => {
    setIsLanguageChanging(true);
    setLanguage(newLanguage);
    
    // Remove blur effect after animation completes
    setTimeout(() => {
      setIsLanguageChanging(false);
    }, 800);
  };

  // Language helper functions
  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'ar': return '/6211558.png';
      case 'tr': return '/pngtree-turkey-flag-icon-template-picture-image_8141270.png';
      case 'en': return '/pngtree-united-kingdom-flag-icon-template-png-image_5098880.png';
      default: return '/6211558.png';
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'ar': return 'العربية';
      case 'tr': return 'Türkçe';
      case 'en': return 'English';
      default: return 'العربية';
    }
  };

  // تحسين الأداء: استخدام useMemo للخدمات
  const services = useMemo(() => servicesData.map(service => ({
    id: service.id,
    icon: (() => {
      switch (service.id) {
        case 'health-insurance': return <Shield className="w-8 h-8 text-caribbean-500" />;
        case 'translation': return <Users className="w-8 h-8 text-caribbean-500" />;
        case 'travel': return <Globe className="w-8 h-8 text-caribbean-500" />;
        case 'legal': return <Star className="w-8 h-8 text-caribbean-500" />;
        case 'government': return <FileText className="w-8 h-8 text-caribbean-500" />;
        case 'insurance': return <Heart className="w-8 h-8 text-caribbean-500" />;
        default: return <Users className="w-8 h-8 text-caribbean-500" />;
      }
    })(),
    title: t(service.titleKey) as string,
    description: t(service.descriptionKey) as string,
  })), [t]);



  // تحسين الأداء
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // الاستماع لحدث فتح تسجيل الدخول من ServicePage
    const handleOpenLogin = () => {
      setIsLoginOpen(true);
    };
    
    window.addEventListener('openLogin', handleOpenLogin);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('openLogin', handleOpenLogin);
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    const path = location.pathname;
    console.log('📍 Current route:', path);
    console.log('🔍 Route debugging - path:', path, 'type:', typeof path);
    
    // Handle service routes
    if (path.startsWith('/services/')) {
      const serviceId = path.split('/services/')[1];
      setCurrentService(serviceId);
    } else {
      setCurrentService(null);
    }
    
    // Handle authentication routes
    if (path === '/login') {
      console.log('🔍 Route handler - /login:', { user: !!user, authLoading, userEmail: user?.email });
      
      // Only show login modal if user is not authenticated
      if (!user || authLoading) {
        console.log('🔍 Showing login modal - user not authenticated or still loading');
        setIsLoginOpen(true);
        setIsSignupOpen(false);
      } else {
        // User is already authenticated, close modal and redirect
        console.log('🔍 User already authenticated, redirecting to home');
        setIsLoginOpen(false);
        setIsSignupOpen(false);
        navigate('/home', { replace: true });
      }
    } else if (path === '/signup') {
      console.log('🔍 Route handler - /signup:', { user: !!user, authLoading, userEmail: user?.email });
      
      // Only show signup modal if user is not authenticated
      if (!user || authLoading) {
        console.log('🔍 Showing signup modal - user not authenticated or still loading');
        setIsSignupOpen(true);
        setIsLoginOpen(false);
      } else {
        // User is already authenticated, close modal and redirect
        console.log('🔍 User already authenticated, redirecting to home');
        setIsLoginOpen(false);
        setIsSignupOpen(false);
        navigate('/home', { replace: true });
      }
    } else {
      // إغلاق المودال عند الانتقال لمسارات أخرى
      if (isLoginOpen || isSignupOpen) {
        console.log('🔄 إغلاق المودال - الانتقال لمسار آخر');
        setIsLoginOpen(false);
        setIsSignupOpen(false);
      }
    }
    
    // Handle user account routes
    if (path === '/account') {
      setShowUserAccount(true);
    } else {
      setShowUserAccount(false);
    }
    
    // Handle profile routes
    if (path === '/profile') {
      setShowProfileEdit(true);
    } else {
      setShowProfileEdit(false);
    }
    
    // Handle help routes
    if (path === '/help') {
      setShowHelpSupport(true);
    } else {
      setShowHelpSupport(false);
    }
    
    // Handle admin routes
    if (path.startsWith('/admin')) {
      console.log('🔧 Admin route detected:', path);
      console.log('🔧 تم اكتشاف مسار الأدمن، فتح لوحة التحكم');
      setShowAdminDashboard(true);
    } else {
      console.log('🔧 Non-admin route, hiding admin components');
      setShowAdminDashboard(false);
    }
  }, [location.pathname]);

  // Debug logging for auth state (reduced frequency)
  useEffect(() => {
    // Only log when there are significant changes to reduce spam
    const logKey = `${user?.email}-${authLoading}-${showWelcome}`;
    if (!(window as any).authDebugLogs) (window as any).authDebugLogs = new Set();
    
    if (!(window as any).authDebugLogs.has(logKey)) {
      console.log('🔍 Auth State Debug:', {
        user: user?.email || 'null',
        profile: profile?.full_name || 'null',
        loading: authLoading,
        showWelcome,
        userExists: !!user,
        profileExists: !!profile
      });
      (window as any).authDebugLogs.add(logKey);
    }
  }, [user, profile, authLoading, showWelcome]);

  // Show login success modal after successful authentication
  useEffect(() => {
    if (!authLoading && user && profile) {
      const currentPath = location.pathname;
      
      // If user is authenticated and on login/signup routes, show success modal
      if (currentPath === '/login' || currentPath === '/signup') {
        console.log('🔄 المستخدم مسجل دخول، عرض رسالة النجاح');
        console.log('👤 بيانات الملف الشخصي:', { role: profile.role, email: profile.email });
        
        // Close auth modals first
        setIsLoginOpen(false);
        setIsSignupOpen(false);
        
        // Show success modal with user data
        setLoginSuccessData({
          userRole: profile.role as 'admin' | 'moderator' | 'user',
          userName: profile.full_name || user.email || 'مستخدم'
        });
        setShowLoginSuccess(true);
      }
    }
  }, [user, authLoading, profile, location.pathname]);

  // Force close modals if user is authenticated
  useEffect(() => {
    if (!authLoading && user && profile && (isLoginOpen || isSignupOpen)) {
      console.log('🔒 إغلاق قسري للمودال - المستخدم مسجل دخول بالفعل');
      setIsLoginOpen(false);
      setIsSignupOpen(false);
      
      // Show success modal if on login/signup routes
      if (location.pathname === '/login' || location.pathname === '/signup') {
        console.log('🔄 عرض رسالة النجاح من صفحة تسجيل الدخول');
        setLoginSuccessData({
          userRole: profile.role as 'admin' | 'moderator' | 'user',
          userName: profile.full_name || user.email || 'مستخدم'
        });
        setShowLoginSuccess(true);
      }
    }
  }, [user, authLoading, profile, isLoginOpen, isSignupOpen, location.pathname]);



  // Show welcome message when user logs in
  useEffect(() => {
    // فحص localStorage لمعرفة ما إذا كان المستخدم قد سجل دخوله للتو
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    const openServiceRequest = localStorage.getItem('openServiceRequest');
    
    if (!authLoading && user && justLoggedIn === 'true') {
      console.log('🎉 المستخدم سجل دخوله للتو، عرض رسالة الترحيب');
      console.log('👤 بيانات المستخدم:', { email: user.email, name: profile?.full_name || user.email });
      
      // Check if user is admin or moderator
      const isAdmin = profile?.role === 'admin';
      const isModerator = profile?.role === 'moderator';
      
      // تنظيف localStorage
      localStorage.removeItem('justLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      
      // عرض رسالة الترحيب فقط للمستخدمين العاديين
      if (!isAdmin && !isModerator) {
        setShowWelcome(true);
      }
      
      // فتح نموذج طلب الخدمة إذا كان هناك طلب معلق (فقط للمستخدمين العاديين، ليس للأدمن)
      if (openServiceRequest && !isAdmin) {
        try {
          const serviceData = JSON.parse(openServiceRequest);
          setTimeout(() => {
            setServiceRequestForm({
              isOpen: true,
              serviceType: serviceData.serviceType,
              serviceTitle: serviceData.serviceTitle
            });
          }, 2000); // انتظار حتى تختفي رسالة الترحيب
          localStorage.removeItem('openServiceRequest');
        } catch (error) {
          console.error('خطأ في تحليل بيانات طلب الخدمة:', error);
          localStorage.removeItem('openServiceRequest');
        }
      } else if (openServiceRequest && isAdmin) {
        // إذا كان المستخدم أدمن، نحذف طلب الخدمة المعلق بدون فتحه
        console.log('🔧 الأدمن سجل دخول، حذف طلب الخدمة المعلق');
        localStorage.removeItem('openServiceRequest');
      }
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        console.log('⏰ إخفاء رسالة الترحيب تلقائياً');
        setShowWelcome(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [user, profile, authLoading]);

  // First login admin redirection effect (only redirect on first login)
  useEffect(() => {
    if (!authLoading && user) {
      const isAdmin = profile?.role === 'admin';
      const isModerator = profile?.role === 'moderator';
      const currentPath = location.pathname;
      
      // Only redirect on first login (check if user has visited before)
      const hasVisitedBefore = sessionStorage.getItem(`user-visited-${user.email}`);
      
      if ((isAdmin || isModerator) && !hasVisitedBefore && (currentPath === '/home' || currentPath === '/')) {
        console.log('🔧 أول تسجيل دخول للأدمن/المشرف، إعادة توجيه إلى لوحة التحكم');
        sessionStorage.setItem(`user-visited-${user.email}`, 'true');
        navigate('/admin', { replace: true });
      }
    }
  }, [user, authLoading, location.pathname, navigate]);

  // Cleanup on logout
  useEffect(() => {
    if (!user) {
      console.log('🧹 تنظيف البيانات عند تسجيل الخروج...');
      
      // Clear admin redirect flags when user logs out
      const adminKeys = Object.keys(sessionStorage);
      adminKeys.forEach(key => {
        if (key.startsWith('admin-redirect-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear admin dashboard logged flag
      (window as any).adminDashboardLogged = false;
      (window as any).adminRedirectLogs = new Set();
      (window as any).authDebugLogs = new Set();
      
      // Clear profile loading flags
      const profileKeys = Object.keys(sessionStorage);
      profileKeys.forEach(key => {
        if (key.startsWith('profile-loading-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear user visit flags
      const userVisitKeys = Object.keys(sessionStorage);
      userVisitKeys.forEach(key => {
        if (key.startsWith('user-visited-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear localStorage items
      localStorage.removeItem('justLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('openServiceRequest');
      localStorage.removeItem('pendingServiceRequest');
      
      console.log('✅ تم تنظيف جميع البيانات بنجاح');
    }
  }, [user]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    if (isDarkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const navigateToMainHome = () => {
    console.log('🚀 تنفيذ navigateToMainHome');
    console.log('📍 المسار الحالي:', location.pathname);
    
    // Force navigation to home page
    if (location.pathname === '/login' || location.pathname === '/signup') {
      console.log('🔄 إعادة توجيه من صفحة تسجيل الدخول إلى الصفحة الرئيسية');
      // Use replace to prevent back button issues
      navigate('/home', { replace: true });
    } else {
      console.log('🔄 الانتقال إلى الصفحة الرئيسية');
      navigate('/home');
    }
  };

  const openLogin = () => {
    navigate('/login');
  };

  const openSignup = () => {
    navigate('/signup');
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    // إعادة توجيه للصفحة الرئيسية عند إغلاق مودال تسجيل الدخول
    if (location.pathname === '/login') {
      console.log('🔄 إغلاق مودال تسجيل الدخول - إعادة توجيه للصفحة الرئيسية');
      navigate('/home', { replace: true });
    }
  };
  
  const closeSignup = () => {
    setIsSignupOpen(false);
    // إعادة توجيه للصفحة الرئيسية عند إغلاق مودال تسجيل الحساب
    if (location.pathname === '/signup') {
      console.log('🔄 إغلاق مودال تسجيل الحساب - إعادة توجيه للصفحة الرئيسية');
      navigate('/home', { replace: true });
    }
  };

  const switchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const switchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const handleSignOut = async () => {
    console.log('🔄 بدء عملية تسجيل الخروج...');
    setShowWelcome(false); // إخفاء رسالة الترحيب
    const { error } = await signOut();
    if (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
    } else {
      console.log('✅ تم تسجيل الخروج بنجاح من التطبيق');
    }
  };

  const handleUserAccountClick = () => {
    navigate('/account');
    setShowUserDropdown(false);
    console.log('👤 فتح حساب المستخدم - تنظيف الإشعارات');
    if (hasNotifications) {
      clearNotifications();
    }
  };

  // Check if user is admin or moderator based on profile role and email
  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@tevasul.group';
  const isModerator = profile?.role === 'moderator' || user?.email?.includes('moderator') || user?.email?.includes('moderator@');
  const isAdminOrModerator = isAdmin || isModerator;

  const openServiceRequestForm = (serviceType: string, serviceTitle: string) => {
    if (!user) {
      // حفظ معلومات الخدمة المطلوبة في localStorage
      localStorage.setItem('pendingServiceRequest', JSON.stringify({
        serviceType,
        serviceTitle
      }));
      openLogin();
      return;
    }
    setServiceRequestForm({
      isOpen: true,
      serviceType,
      serviceTitle
    });
  };

  const closeServiceRequestForm = () => {
    setServiceRequestForm({
      isOpen: false,
      serviceType: '',
      serviceTitle: ''
    });
  };

  // Contact form submission handler
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (contactLoading) {
      console.log('⚠️ منع الإرسال المزدوج');
      return;
    }
    
    console.log('🔍 بدء إرسال رسالة التواصل...');
    console.log('👤 المستخدم:', user?.email);
    console.log('📝 بيانات النموذج:', contactForm);
    
    if (!user) {
      console.log('❌ المستخدم غير مسجل دخول');
      setContactError(language === 'ar' ? 'يجب تسجيل الدخول أولاً لإرسال الرسالة' : 'Mesaj göndermek için önce giriş yapmalısınız');
      return;
    }

    // Validate form
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      console.log('❌ النموذج غير مكتمل');
      setContactError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Lütfen tüm gerekli alanları doldurun');
      return;
    }

    setContactLoading(true);
    setContactError(null);
    setContactSuccess(false);
    console.log('⏳ بدء عملية الإرسال...');

    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 seconds timeout
      });

      // Check if Supabase is properly configured
      if (!supabase || !supabase.from) {
        console.error('❌ Supabase غير مُعد بشكل صحيح');
        setContactError(language === 'ar' ? 'مشكلة في إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى لاحقاً.' : 'Veritabanı yapılandırmasında sorun. Lütfen daha sonra tekrar deneyin.');
        setContactLoading(false);
        return;
      }

      // First, test the connection
      console.log('🔍 اختبار الاتصال مع Supabase...');
      const testPromise = supabase
        .from('support_messages')
        .select('count')
        .limit(1);
      
      const { data: testData, error: testError } = await Promise.race([testPromise, timeoutPromise]) as any;
      console.log('🔍 نتيجة اختبار الاتصال:', { testData, testError });
      
      if (testError) {
        console.error('❌ فشل في اختبار الاتصال:', testError);
        setContactError(language === 'ar' ? 'فشل في الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.' : 'Veritabanına bağlantı başarısız. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
        setContactLoading(false);
        return;
      }
      
      const messageData = {
        user_id: user.id,
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.serviceType ? `${contactForm.serviceType} - ${language === 'ar' ? 'طلب خدمة' : 'Service Request'}` : (language === 'ar' ? 'رسالة تواصل' : 'Contact Message'),
        message: contactForm.message.trim(),
        status: 'pending'
      };
      
      console.log('📤 إرسال البيانات:', messageData);
      
      const insertPromise = supabase
        .from('support_messages')
        .insert(messageData)
        .select();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      console.log('📥 استجابة قاعدة البيانات:', { data, error });

      if (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        setContactError(language === 'ar' ? 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'Mesaj gönderilirken hata oluştu. Lütfen tekrar deneyin.');
        setContactLoading(false);
        return;
      }

      console.log('✅ تم إرسال الرسالة بنجاح:', data);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', serviceType: '', message: '' });
      setContactLoading(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setContactSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('💥 خطأ غير متوقع:', error);
      
      if (error instanceof Error && error.message === 'Request timeout') {
        setContactError(language === 'ar' ? 'انتهت مهلة الطلب. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.' : 'İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
      } else {
        setContactError(language === 'ar' ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      console.log('🏁 إنهاء عملية الإرسال');
      setContactLoading(false);
    }
  };

  // If a service is selected, show the service page without the main navbar
  if (currentService) {
    const service = servicesData.find(s => s.id === currentService);
    if (service) {
      // Special handling for health insurance service
      if (service.id === 'health-insurance') {
        return (
          <div className={`min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria ${isLanguageChanging ? 'language-change-blur language-change-animation' : ''}`}>
            <CustomCursor isDarkMode={isDarkMode} />
            
            <HealthInsurancePage 
              onBack={handleBackToHome} 
              isDarkMode={isDarkMode}
              onNavigateToContact={scrollToContact}
              onOpenProfile={() => setShowProfileEdit(true)}
              onOpenAccount={() => {
                console.log('onOpenAccount تم استدعاؤه من HealthInsurancePage');
                setShowUserAccount(true);
              }}
              onOpenHelp={() => setShowHelpSupport(true)}
              onToggleDarkMode={toggleDarkMode}
              onNavigateToMainHome={navigateToMainHome}
            />
          </div>
        );
      }

      // Regular service page for other services
      const serviceWithIcon = {
        ...service,
        icon: <service.icon className="w-8 h-8 text-white" />,
        titleKey: service.titleKey,
        descriptionKey: service.descriptionKey,
        fullDescriptionKey: service.fullDescriptionKey,
        featuresKey: service.featuresKey,
        benefitsKey: service.benefitsKey,
        processKey: service.processKey
      };
      return (
        <div className={`min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria ${isLanguageChanging ? 'language-change-blur language-change-animation' : ''}`}>
          <CustomCursor isDarkMode={isDarkMode} />
          
          <ServicePage 
            service={serviceWithIcon} 
            onBack={handleBackToHome} 
            isDarkMode={isDarkMode}
            onNavigateToContact={scrollToContact}
            onOpenProfile={() => setShowProfileEdit(true)}
            onOpenAccount={() => {
              console.log('onOpenAccount تم استدعاؤه من ServicePage');
              setShowUserAccount(true);
            }}
            onOpenHelp={() => setShowHelpSupport(true)}
            onToggleDarkMode={toggleDarkMode}
            onNavigateToMainHome={navigateToMainHome}
          />

          {/* Auth Modals */}
          <AuthModals
            isLoginOpen={isLoginOpen}
            isSignupOpen={isSignupOpen}
            onCloseLogin={closeLogin}
            onCloseSignup={closeSignup}
            onSwitchToSignup={switchToSignup}
            onSwitchToLogin={switchToLogin}
            isDarkMode={isDarkMode}
            setShowWelcome={setShowWelcome}
            onNavigateToHome={navigateToMainHome}
          />

          {/* Welcome Message */}
          {showWelcome && user && profile && (
            <WelcomeMessage
              userName={profile.full_name || user.email || 'مستخدم'}
              userRole={profile.role}
              onClose={() => setShowWelcome(false)}
            />
          )}

          {/* Service Request Form */}
          <ServiceRequestForm
            isOpen={serviceRequestForm.isOpen}
            onClose={closeServiceRequestForm}
            serviceType={serviceRequestForm.serviceType}
            serviceTitle={serviceRequestForm.serviceTitle}
            isDarkMode={isDarkMode}
          />
        </div>
      );
    }
  }

  // If admin dashboard is open, show it
  if (showAdminDashboard) {
    // Only log once to prevent spam
    if (!(window as any).adminDashboardLogged) {
      console.log('🔧 عرض لوحة تحكم الأدمن');
      (window as any).adminDashboardLogged = true;
    }
    return <AdminDashboard onBack={() => navigate('/home')} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
  }

  // If user account is open, show it
  if (showUserAccount) {
    return <UserAccount 
      onBack={() => setShowUserAccount(false)} 
      isDarkMode={isDarkMode}
    />;
  }

  // If profile edit is open, show it
  if (showProfileEdit) {
    return <ProfileEdit 
      onBack={() => setShowProfileEdit(false)} 
      isDarkMode={isDarkMode}
    />;
  }

  // If help support is open, show it
  if (showHelpSupport) {
    return <HelpSupport 
      onBack={() => setShowHelpSupport(false)} 
      isDarkMode={isDarkMode}
    />;
  }

  // If voluntary return page is requested, show it
  if (location.pathname === '/voluntary-return') {
    return (
      <div className={`min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria ${isLanguageChanging ? 'language-change-blur language-change-animation' : ''}`}>
        <CustomCursor isDarkMode={isDarkMode} />
        
        <VoluntaryReturnPage 
          onBack={() => navigate('/home')} 
          isDarkMode={isDarkMode}
        />

        {/* Auth Modals */}
        <AuthModals
          isLoginOpen={isLoginOpen}
          isSignupOpen={isSignupOpen}
          onCloseLogin={closeLogin}
          onCloseSignup={closeSignup}
          onSwitchToSignup={switchToSignup}
          onSwitchToLogin={switchToLogin}
          isDarkMode={isDarkMode}
          setShowWelcome={setShowWelcome}
          onNavigateToHome={navigateToMainHome}
        />

        {/* Welcome Message */}
        {showWelcome && user && (
          <WelcomeMessage
            userName={profile?.full_name || user.email || 'مستخدم'}
            userRole={profile?.role}
            onClose={() => setShowWelcome(false)}
          />
        )}

        {/* Service Request Form */}
        <ServiceRequestForm
          isOpen={serviceRequestForm.isOpen}
          onClose={closeServiceRequestForm}
          serviceType={serviceRequestForm.serviceType}
          serviceTitle={serviceRequestForm.serviceTitle}
          isDarkMode={isDarkMode}
        />


      </div>
    );
  }

  // Check if we're on the email verification page
  if (location.pathname === '/auth/verify-email') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} transition-colors duration-500`}>
        <CustomCursor isDarkMode={isDarkMode} />
        <EmailVerification isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria ${isLanguageChanging ? 'language-change-blur language-change-animation' : ''}`}>
      <CustomCursor isDarkMode={isDarkMode} />
      <style dangerouslySetInnerHTML={{
        __html: `
          /* تحسين الأداء: تقليل الأنيميشن على الأجهزة المحمولة */
          @media (max-width: 768px) {
            .animate-float,
            .animate-float-slow,
            .animate-float-reverse,
            .animate-float-wide-slower {
              animation: none !important;
            }
            
            .animate-spin-slow,
            .animate-spin-slow-reverse,
            .animate-orbit,
            .animate-orbit-reverse {
              animation: none !important;
            }
            
            .animate-speed-line,
            .animate-speed-line-delayed,
            .animate-speed-line-delayed-2 {
              animation: none !important;
            }
          }
        `
      }} />
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 dark:bg-jet-800/95 backdrop-blur-md shadow-xl border-b border-platinum-300 dark:border-jet-700' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <img 
                src={language === 'ar' ? '/logo-text.png' : '/logo-text-en.png'} 
                className={`h-8 md:h-10 w-auto max-w-none rounded-lg object-contain transition-all duration-300 ${isLanguageChanging ? 'language-change-logo' : ''} ${
                  scrollY > 50 
                    ? 'brightness-0 dark:brightness-100' 
                    : 'brightness-0 invert dark:brightness-100 dark:invert-0'
                }`}
                alt={language === 'ar' ? 'مجموعة تواصل' : language === 'tr' ? 'Tevasul Grubu' : 'Tevasul Group'}
              />
              <span className={`text-lg md:text-xl font-bold transition-colors duration-300 ${
                scrollY > 50 
                  ? 'text-caribbean-700 dark:text-caribbean-400' 
                  : 'text-white drop-shadow-lg'
              }`}>
              
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              {navigation.map((item) => {
                if (item.isSection) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        const sectionId = item.href.replace('#', '');
                        const section = document.getElementById(sectionId);
                        if (section) {
                          section.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }
                      }}
                      className={`relative transition-colors duration-300 group font-medium ${isLanguageChanging ? 'language-change-text' : ''} ${
                        scrollY > 50 
                          ? 'text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400' 
                          : 'text-white/90 hover:text-white drop-shadow-md'
                      }`}
                    >
                      {item.name}
                      <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                        scrollY > 50 
                          ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600' 
                          : 'bg-white'
                      }`}></span>
                    </button>
                  );
                } else {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`relative transition-colors duration-300 group font-medium ${isLanguageChanging ? 'language-change-text' : ''} ${
                        scrollY > 50 
                          ? 'text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400' 
                          : 'text-white/90 hover:text-white drop-shadow-md'
                      }`}
                    >
                      {item.name}
                      <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                        scrollY > 50 
                          ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600' 
                          : 'bg-white'
                      }`}></span>
                    </Link>
                  );
                }
              })}
              
              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center space-x-4 space-x-reverse">
                  {/* Admin Dashboard Button - Show even if profile is null */}
                  {(isAdminOrModerator || user.email === 'admin@tevasul.group' || user.email?.includes('moderator')) && (
                    <button
                      onClick={() => navigate('/admin')}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        scrollY > 50 
                          ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                          : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                      }`}
                    >
                      <Settings className="w-4 h-4 ml-1" />
                      <span className="hidden sm:inline">
                        {(user.email === 'admin@tevasul.group' || isAdmin) ? 'لوحة التحكم' : 'لوحة الإشراف'}
                      </span>
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        scrollY > 50 
                          ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                          : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                      }`}
                    >
                      {hasNotifications && (
                        <div className="relative ml-2">
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                        </div>
                      )}
                      <User className="w-4 h-4 ml-2" />
                      <span className="hidden sm:inline">{t('navbar.account')}</span>
                      <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 dark:bg-jet-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-platinum-300 dark:border-jet-600 py-2 z-50">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-platinum-200 dark:border-jet-700">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-caribbean-500 to-indigo-500 rounded-full flex items-center justify-center ml-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-jet-800 dark:text-white text-sm">
                                {profile?.full_name || user.email}
                              </p>
                              <p className="text-xs text-jet-600 dark:text-platinum-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Admin Dashboard Button */}
                          {(isAdminOrModerator || user.email === 'admin@tevasul.group' || user.email?.includes('moderator')) && (
                            <button
                              onClick={() => {
                                navigate('/admin');
                                setShowUserDropdown(false);
                              }}
                              className="w-full flex items-center px-4 py-2 text-right text-jet-700 dark:text-platinum-300 hover:bg-platinum-100 dark:hover:bg-jet-700 transition-colors duration-200"
                            >
                              <Settings className="w-4 h-4 ml-3" />
                              {(user.email === 'admin@tevasul.group' || isAdmin) ? 'لوحة التحكم' : 'لوحة الإشراف'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setShowProfileEdit(true);
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-right text-jet-700 dark:text-platinum-300 hover:bg-platinum-100 dark:hover:bg-jet-700 transition-colors duration-200"
                          >
                            <Settings className="w-4 h-4 ml-3" />
                            {t('user.profile')}
                          </button>

                          <button
                            onClick={handleUserAccountClick}
                            className="w-full flex items-center px-4 py-2 text-right text-jet-700 dark:text-platinum-300 hover:bg-platinum-100 dark:hover:bg-jet-700 transition-colors duration-200"
                          >
                            <FileText className="w-4 h-4 ml-3" />
                            {t('user.transactions')}
                            {hasNotifications && (
                              <div className="relative mr-2">
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                              </div>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setShowHelpSupport(true);
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-right text-jet-700 dark:text-platinum-300 hover:bg-platinum-100 dark:hover:bg-jet-700 transition-colors duration-200"
                          >
                            <HelpCircle className="w-4 h-4 ml-3" />
                            {t('user.help')}
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-platinum-200 dark:border-jet-700 my-2"></div>

                        {/* Logout */}
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-right text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4 ml-3" />
                          {t('user.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={openLogin}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      scrollY > 50 
                        ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    <LogIn className="w-4 h-4 ml-2" />
                    <span className="hidden sm:inline">{t('auth.login')}</span>
                  </button>
                  
                  <button
                    onClick={openSignup}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      scrollY > 50 
                        ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 ml-2" />
                    <span className="hidden sm:inline">{t('auth.signup')}</span>
                  </button>
                </>
              )}
              
              {/* Language Selector */}
              <div className="relative group">
                <button
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    scrollY > 50 
                      ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                  }`}
                  title="تغيير اللغة"
                >
                  <Globe className="w-4 h-4 ml-2" />
                  <img 
                    src={getLanguageFlag(language)} 
                    alt={`${getLanguageName(language)} flag`}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="hidden sm:inline mr-2">{t(`language.${language === 'ar' ? 'arabic' : language === 'tr' ? 'turkish' : 'english'}`)}</span>
                </button>
                
                {/* Language Dropdown */}
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-[140px]">
                  {(['ar', 'tr', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200 ${
                        language === lang ? 'bg-caribbean-100 dark:bg-caribbean-900/30 text-caribbean-700 dark:text-caribbean-400' : 'text-jet-600 dark:text-platinum-400'
                      } ${lang === 'ar' ? 'first:rounded-t-lg' : ''} ${lang === 'en' ? 'last:rounded-b-lg' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flag-shadow flag-gloss transition-all duration-200 ${
                        language === lang 
                          ? 'ring-2 ring-caribbean-400 ring-offset-2 ring-offset-white dark:ring-offset-jet-800' 
                          : 'hover:ring-2 hover:ring-caribbean-200 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-jet-800'
                      }`}>
                        <img 
                          src={getLanguageFlag(lang)} 
                          alt={`${getLanguageName(lang)} flag`}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                      <span className="text-sm mr-3">{t(`language.${lang === 'ar' ? 'arabic' : lang === 'tr' ? 'turkish' : 'english'}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  scrollY > 50 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-caribbean-500 to-indigo-500 shadow-lg' 
                      : 'bg-gray-300 dark:bg-gray-600 shadow-md'
                    : isDarkMode 
                      ? 'bg-gradient-to-r from-caribbean-400/80 to-indigo-400/80 backdrop-blur-sm border border-caribbean-300/50' 
                      : 'bg-gray-200/80 backdrop-blur-sm border border-gray-300/50'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isDarkMode 
                    ? 'left-7 bg-white shadow-xl transform scale-105' 
                    : 'left-1 bg-white shadow-lg'
                }`}>
                  {isDarkMode ? (
                    <Sun className="w-3 h-3 text-sky-400" />
                  ) : (
                    <Moon className="w-3 h-3 text-gray-600" />
                  )}
                </div>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2 space-x-reverse">
              {/* Mobile Language Selector */}
              <div className="relative group">
                <button
                  className={`flex items-center px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                    scrollY > 50 
                      ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                  }`}
                  title="تغيير اللغة"
                >
                  <Globe className="w-3 h-3 ml-1" />
                  <img 
                    src={getLanguageFlag(language)} 
                    alt={`${getLanguageName(language)} flag`}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                </button>
                
                {/* Mobile Language Dropdown */}
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-[140px]">
                  {(['ar', 'tr', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200 ${
                        language === lang ? 'bg-caribbean-100 dark:bg-caribbean-900/30 text-caribbean-700 dark:text-caribbean-400' : 'text-jet-600 dark:text-platinum-400'
                      } ${lang === 'ar' ? 'first:rounded-t-lg' : ''} ${lang === 'en' ? 'last:rounded-b-lg' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flag-shadow flag-gloss transition-all duration-200 ${
                        language === lang 
                          ? 'ring-2 ring-caribbean-400 ring-offset-2 ring-offset-white dark:ring-offset-jet-800' 
                          : 'hover:ring-2 hover:ring-caribbean-200 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-jet-800'
                      }`}>
                        <img 
                          src={getLanguageFlag(lang)} 
                          alt={`${getLanguageName(lang)} flag`}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                      <span className="text-sm mr-3">{t(`language.${lang === 'ar' ? 'arabic' : lang === 'tr' ? 'turkish' : 'english'}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleDarkMode}
                className={`relative w-10 h-6 rounded-full transition-all duration-300 ${
                  scrollY > 50 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-caribbean-500 to-indigo-500 shadow-lg' 
                      : 'bg-gray-300 dark:bg-gray-600 shadow-md'
                    : isDarkMode 
                      ? 'bg-gradient-to-r from-caribbean-400/80 to-indigo-400/80 backdrop-blur-sm border border-caribbean-300/50' 
                      : 'bg-gray-200/80 backdrop-blur-sm border border-gray-300/50'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isDarkMode 
                    ? 'left-5 bg-white shadow-xl transform scale-105' 
                    : 'left-0.5 bg-white shadow-lg'
                }`}>
                  {isDarkMode ? (
                    <Sun className="w-2 h-2 text-sky-400" />
                  ) : (
                    <Moon className="w-2 h-2 text-gray-600" />
                  )}
                </div>
              </button>
              <button
                className={`p-2 transition-colors duration-300 ${
                  scrollY > 50 
                    ? 'text-jet-800 dark:text-platinum-200' 
                    : 'text-white drop-shadow-md'
                }`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {showUserDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUserDropdown(false)}
          ></div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-jet-800/95 backdrop-blur-md border-t dark:border-jet-700 max-h-[80vh] overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                if (item.isSection) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        const sectionId = item.href.replace('#', '');
                        const section = document.getElementById(sectionId);
                        if (section) {
                          section.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm ${isLanguageChanging ? 'language-change-text' : ''}`}
                    >
                      {item.name}
                    </button>
                  );
                } else {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm ${isLanguageChanging ? 'language-change-text' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                }
              })}
              
              {/* Mobile Language Selector */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between p-3 bg-platinum-100 dark:bg-jet-700 rounded-lg">
                  <span className={`text-jet-800 dark:text-platinum-200 font-medium text-sm ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('language.change')}</span>
                  <div className="flex space-x-2 space-x-reverse">
                    {(['ar', 'tr', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flag-shadow flag-gloss transition-all duration-200 ${
                          language === lang 
                            ? 'ring-2 ring-caribbean-400 ring-offset-1 ring-offset-white dark:ring-offset-jet-700' 
                            : 'bg-white dark:bg-jet-600 hover:ring-2 hover:ring-caribbean-200 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-jet-700'
                        }`}
                        title={t(`language.${lang === 'ar' ? 'arabic' : lang === 'tr' ? 'turkish' : 'english'}`)}
                      >
                        <img 
                          src={getLanguageFlag(lang)} 
                          alt={`${getLanguageName(lang)} flag`}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="px-3 py-2 space-y-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-center">
                      <span className={`text-jet-800 dark:text-platinum-200 font-medium text-sm ${isLanguageChanging ? 'language-change-text' : ''}`}>
                        {t('user.welcome')} {profile?.full_name || user.email}
                      </span>
                    </div>
                    
                    {/* Admin/Moderator Control Panel Button - Mobile */}
                    {(isAdmin || isModerator) && (
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                      >
                        <Settings className="w-4 h-4 ml-2" />
                        {isAdmin ? 'لوحة التحكم' : 'لوحة الإشراف'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleUserAccountClick();
                        setIsMenuOpen(false);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                    >
                      {hasNotifications && (
                        <div className="relative ml-2">
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping"></div>
                        </div>
                      )}
                      {t('user.transactions')}
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileEdit(true);
                        setIsMenuOpen(false);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                    >
                      {t('user.profile')}
                    </button>
                    <button
                      onClick={() => {
                        setShowHelpSupport(true);
                        setIsMenuOpen(false);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                    >
                      {t('user.help')}
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                    >
                      {t('user.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        openLogin();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                    >
                      <LogIn className="w-4 h-4 ml-2" />
                      {t('auth.login')}
                    </button>
                    <button
                      onClick={() => {
                        openSignup();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white rounded-md hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 text-sm"
                    >
                      <UserPlus className="w-4 h-4 ml-2" />
                      {t('auth.signup')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close dropdown */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserDropdown(false)}
        ></div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-jet-900 dark:via-indigo-900 dark:to-jet-800">
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'grid-move 20s linear infinite'
            }}></div>
          </div>
        </div>
        
        {/* Animated Background Elements - Reduced for mobile */}
        <div className="absolute inset-0">

          {/* Floating Elements - Reduced for mobile */}
          {/* Desktop only floating elements */}
          <div className="hidden md:block">
            {/* Floating Documents */}
            <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full shadow-lg animate-float-slow transform rotate-12 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Speed Lines */}
            <div className="absolute top-1/4 right-20 w-32 h-1 bg-gradient-to-r from-transparent via-caribbean-400/50 to-transparent animate-speed-line"></div>
            <div className="absolute top-1/3 right-16 w-24 h-1 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent animate-speed-line-delayed"></div>
            <div className="absolute top-2/5 right-24 w-20 h-1 bg-gradient-to-r from-transparent via-caribbean-300/30 to-transparent animate-speed-line-delayed-2"></div>
            
            {/* Floating Service Icons - Reduced count */}
            <div className="absolute bottom-20 left-10 w-16 h-16 bg-caribbean-500/40 rounded-full flex items-center justify-center animate-float-wide-slower shadow-lg">
              <FileText className="w-8 h-8 text-caribbean-300" />
            </div>
            <div className="absolute top-20 right-10 w-16 h-16 bg-indigo-500/40 rounded-full flex items-center justify-center animate-pulse-wide-slower shadow-lg">
              <Users className="w-8 h-8 text-indigo-300" />
            </div>
            <div className="absolute bottom-1/3 left-1/6 w-16 h-16 bg-caribbean-600/40 rounded-full flex items-center justify-center animate-bounce-wide-slower shadow-lg">
              <Zap className="w-8 h-8 text-caribbean-300" />
            </div>
            
            {/* Translation Service */}
            <div className="absolute top-1/3 left-1/6 w-16 h-16 bg-purple-500/40 rounded-full flex items-center justify-center animate-float-wide-slower delay-1000 shadow-lg">
              <Globe className="w-8 h-8 text-purple-300" />
            </div>
            
            {/* Travel Service */}
            <div className="absolute bottom-1/3 right-1/6 w-16 h-16 bg-blue-500/40 rounded-full flex items-center justify-center animate-pulse-wide-slow delay-2000 shadow-lg">
              <MapPin className="w-8 h-8 text-blue-300" />
            </div>
            
            {/* Legal Service */}
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-500/40 rounded-full flex items-center justify-center animate-bounce-wide-slower delay-1500 shadow-lg">
              <Shield className="w-8 h-8 text-green-300" />
            </div>
            
            {/* Government Service */}
            <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-blue-500/40 rounded-full flex items-center justify-center animate-float-wide-slower delay-3000 shadow-lg">
              <Building className="w-8 h-8 text-blue-300" />
            </div>
            
            {/* Insurance Service */}
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-red-500/40 rounded-full flex items-center justify-center animate-pulse-wide-slower delay-2500 shadow-lg">
              <Heart className="w-8 h-8 text-red-300" />
            </div>
            
            {/* Additional Animated Elements */}
            <div className="absolute top-1/6 right-1/6 w-24 h-24 bg-gradient-to-r from-caribbean-400/20 to-indigo-400/20 rounded-full animate-spin-slow"></div>
            <div className="absolute bottom-1/6 left-1/6 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-spin-slow-reverse"></div>
            <div className="absolute top-1/2 left-1/6 w-16 h-16 bg-gradient-to-r from-sky-400/20 to-blue-400/20 rounded-full animate-bounce-slow"></div>
            <div className="absolute top-1/2 right-1/6 w-18 h-18 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full animate-pulse-slow delay-500"></div>
            
            {/* Animated Lines */}
            <div className="absolute top-1/4 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-caribbean-400/30 to-transparent animate-pulse-slow"></div>
            <div className="absolute bottom-1/3 right-1/3 w-24 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-pulse-slow delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse-slow delay-2000"></div>
            
            {/* Orbiting Elements */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-96 h-96">
                <div className="absolute inset-0 border border-white/10 rounded-full animate-spin-slow"></div>
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-caribbean-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit"></div>
                <div className="absolute bottom-0 right-1/2 w-2 h-2 bg-indigo-400 rounded-full transform translate-x-1/2 translate-y-1/2 animate-orbit-reverse"></div>
              </div>
            </div>
          </div>

          {/* Mobile-only minimal floating elements */}
          <div className="md:hidden">
            {/* Only 2-3 simple floating elements for mobile */}
            <div className="absolute top-20 left-10 w-12 h-12 bg-white/10 rounded-full shadow-lg animate-float-slow flex items-center justify-center">
              <FileText className="w-6 h-6 text-white/60" />
            </div>
            <div className="absolute bottom-20 right-10 w-12 h-12 bg-caribbean-500/40 rounded-full flex items-center justify-center animate-float-slow delay-1000 shadow-lg">
              <Users className="w-6 h-6 text-caribbean-300" />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-caribbean-400/20 to-indigo-400/20 rounded-full animate-pulse-slow"></div>
          </div>
        </div>

        <div className="relative text-center px-4 max-w-6xl mx-auto">
          {/* Logo Section - Adjusted for mobile */}
          <div className="flex items-center justify-center mb-6 md:mb-8 animate-fade-in">
            <img 
              src="/logo-fınal.png" 
              alt="مجموعة تواصل" 
              className={`w-32 h-32 md:w-40 md:h-40 lg:w-56 lg:h-56 xl:w-64 xl:h-64 object-contain animate-float brightness-0 invert ${isLanguageChanging ? 'language-change-logo' : ''}`}
            />
          </div>
          
          <h1 className={`text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 animate-fade-in-up text-white drop-shadow-lg leading-relaxed ${isLanguageChanging ? 'language-change-text' : ''}`}>
            <span className="inline-block animate-text-shimmer bg-gradient-to-r from-white via-caribbean-200 to-white bg-clip-text text-transparent bg-[length:200%_100%] leading-relaxed">
              {t('hero.mainTitle')}
            </span>
          </h1>
          
          <div className={`text-lg md:text-2xl lg:text-3xl xl:text-4xl font-semibold mb-6 md:mb-8 text-white/95 drop-shadow-md animate-fade-in-delay-1 ${isLanguageChanging ? 'language-change-text' : ''}`}>
            <span className="relative">
              {t('hero.withUs')}
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-caribbean-400 to-indigo-400 rounded-full animate-expand-width"></div>
            </span>
          </div>
          
          <div className={`text-base md:text-lg lg:text-xl text-white/85 mb-8 md:mb-10 leading-relaxed animate-fade-in-delay-2 max-w-3xl mx-auto drop-shadow-sm px-4 ${isLanguageChanging ? 'language-change-text' : ''}`}>
            <span className="inline-block animate-fade-in-up relative">
              {t('hero.description')}
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-caribbean-400 to-indigo-400 animate-expand-width-delayed"></div>
            </span>
          </div>
          
          {/* Stats Counter - Simplified for mobile */}
          <div className="flex justify-center items-center space-x-4 md:space-x-8 space-x-reverse mb-8 md:mb-10 animate-fade-in-delay-2">
            <div className="text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-caribbean-300 animate-count-up">5000+</div>
              <div className="text-xs md:text-sm text-white/70">{t('hero.stats.clients')}</div>
            </div>
            <div className="w-px h-8 md:h-12 bg-white/30"></div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-indigo-300 animate-count-up-delayed">24/7</div>
              <div className="text-xs md:text-sm text-white/70">{t('hero.stats.service')}</div>
            </div>
            <div className="w-px h-8 md:h-12 bg-white/30"></div>
            <div className="text-center">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-sky-300 animate-count-up-delayed-2">10+</div>
          <div className="text-xs md:text-sm text-white/70">{t('hero.stats.experience')}</div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center animate-fade-in-delay-3">
        <button 
          onClick={scrollToServices}
          className="group relative bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white px-6 md:px-10 py-3 md:py-5 rounded-full font-bold text-base md:text-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl flex items-center justify-center overflow-hidden animate-pulse-glow border-2 border-white/20 hover:border-white/40"
        >
          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400/20 to-indigo-400/20 animate-pulse"></div>
          <span className="relative z-10">{t('hero.discoverServices')}</span>
          <ChevronDown className="relative z-10 mr-2 md:mr-3 w-5 h-5 md:w-6 md:h-6 group-hover:translate-y-2 transition-transform duration-300 animate-bounce" />
        </button>
        <button 
          onClick={scrollToContact}
          className="group relative border-3 border-white/80 text-white px-6 md:px-10 py-3 md:py-5 rounded-full font-bold text-base md:text-lg hover:bg-white/20 hover:border-white transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl overflow-hidden animate-pulse-glow bg-gradient-to-r from-white/5 to-white/10"
        >
          <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse"></div>
          <span className="relative z-10 flex items-center justify-center">
            {t('hero.contactNow')}
            <Phone className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
          </span>
        </button>
      </div>
      
      {/* Trust Indicators - Simplified for mobile */}
      <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-12 space-x-reverse mt-12 md:mt-16 animate-fade-in-delay-4">
        <div className="flex items-center text-white/70 text-sm md:text-lg">
          <Shield className="w-5 h-5 md:w-7 md:h-7 ml-2 md:ml-3 text-green-400" />
          <span className="text-base md:text-xl font-semibold">{t('hero.trust.licensed')}</span>
        </div>
        <div className="flex items-center text-white/70 text-sm md:text-lg">
          <Clock className="w-5 h-5 md:w-7 md:h-7 ml-2 md:ml-3 text-caribbean-400" />
          <span className="text-base md:text-xl font-semibold">{t('hero.trust.fast')}</span>
        </div>
        <div className="flex items-center text-white/70 text-sm md:text-lg">
          <Star className="w-5 h-5 md:w-7 md:h-7 ml-2 md:ml-3 text-sky-400" />
          <span className="text-base md:text-xl font-semibold">{t('hero.trust.excellent')}</span>
        </div>
      </div>
    </div>
    
    {/* Chat Bot Button - Replaces Available Now */}
    <div className="absolute bottom-10 left-10 animate-bounce-slow">
      <button
        onClick={() => setIsChatBotOpen(!isChatBotOpen)}
        className="bg-gradient-to-r from-caribbean-600 to-indigo-700 hover:from-caribbean-700 hover:to-indigo-800 backdrop-blur-sm rounded-full p-3 md:p-4 border-2 border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
      >
        <div className="flex items-center text-white text-xs md:text-sm font-semibold">
          <MessageCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 group-hover:animate-pulse" />
          <span className="hidden sm:inline">{language === 'ar' ? 'شات بوت' : 'Chat Bot'}</span>
        </div>
      </button>
    </div>
    
    <div className="absolute bottom-10 right-10 animate-float hidden md:block">
      <div className="bg-caribbean-500/20 backdrop-blur-sm rounded-full p-4 border border-caribbean-400/30 flex items-center justify-center">
        <button onClick={scrollToServices} className="flex items-center text-white text-sm hover:text-caribbean-200 transition-colors duration-300">
          {t('hero.discoverServicesShort')}
          <ChevronDown className="mr-2 w-5 h-5 group-hover:translate-y-1 transition-transform duration-300 animate-bounce" />
          <ArrowRight className="w-4 h-4 mr-2" />
        </button>
      </div>
    </div>

    {/* Mobile Chat Bot Button */}
    <div className="fixed bottom-6 right-6 z-40 md:hidden">
      <button
        onClick={() => setIsChatBotOpen(!isChatBotOpen)}
        className="bg-gradient-to-r from-caribbean-600 to-indigo-700 hover:from-caribbean-700 hover:to-indigo-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>
    </div>
  </section>

  {/* Services Section */}
  <section id="services" className="py-20 bg-gradient-to-br from-caribbean-50/30 via-indigo-50/20 to-platinum-50 dark:from-caribbean-900/10 dark:via-indigo-900/5 dark:to-jet-700 relative overflow-hidden pt-24 md:pt-20">
    {/* Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-caribbean-200/20 to-indigo-200/20 dark:from-caribbean-800/10 dark:to-indigo-800/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-caribbean-200/20 dark:from-indigo-800/10 dark:to-caribbean-800/10 rounded-full blur-3xl animate-float-reverse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-caribbean-100/30 to-indigo-100/30 dark:from-caribbean-900/20 dark:to-indigo-900/20 rounded-full blur-2xl animate-pulse-slow"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-caribbean-700 via-indigo-700 to-caribbean-600 dark:from-caribbean-400 dark:via-indigo-400 dark:to-caribbean-300 bg-clip-text text-transparent mb-6 animate-text-shimmer bg-[length:200%_100%] ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('services.title')}
        </h2>
        <p className={`text-xl text-jet-700 dark:text-platinum-300 max-w-3xl mx-auto leading-relaxed ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('services.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="group bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-platinum-300 dark:border-jet-600 hover:border-caribbean-300 dark:hover:border-caribbean-500"
          >
            <div className="mb-6 p-3 bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
              {service.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-jet-800 dark:text-platinum-200 group-hover:text-caribbean-700 dark:group-hover:text-caribbean-400 transition-colors duration-300">
              {service.title}
            </h3>
            <p className="text-jet-600 dark:text-platinum-400 leading-relaxed mb-6">
              {service.description}
            </p>
            <button 
              onClick={() => handleServiceClick(service.id)}
              className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center group"
            >
              {t('services.discoverMore')}
              <ArrowRight className="mr-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            {user && (
              <button 
                onClick={() => openServiceRequestForm(service.id, service.title)}
                className="w-full mt-2 bg-white dark:bg-jet-700 text-caribbean-600 dark:text-caribbean-400 border-2 border-caribbean-600 dark:border-caribbean-400 py-2 px-6 rounded-lg font-semibold hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-all duration-300 flex items-center justify-center"
              >
                {t('services.quickRequest')}
              </button>
            )}
            {!user && (
              <button 
                onClick={() => openServiceRequestForm(service.id, service.title)}
                className="w-full mt-2 bg-blue-500 text-white border-2 border-blue-500 py-2 px-6 rounded-lg font-semibold hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 flex items-center justify-center"
              >
                {t('services.loginToRequest')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* About Section */}
  <section id="about" className="py-20 bg-white dark:bg-jet-800 pt-24 md:pt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isLanguageChanging ? 'language-change-text' : ''}`}>
            <span className="bg-gradient-to-r from-caribbean-600 via-indigo-600 to-caribbean-800 bg-clip-text text-transparent">
              <span className="pb-2 block">{t('about.title')}</span>
            </span>
          </h2>
          <p className={`text-xl text-jet-600 dark:text-platinum-400 mb-6 leading-relaxed ${isLanguageChanging ? 'language-change-text' : ''}`}>
            {t('about.description1')}
          </p>
          <p className={`text-lg text-jet-600 dark:text-platinum-400 mb-8 leading-relaxed ${isLanguageChanging ? 'language-change-text' : ''}`}>
            {t('about.description2')}
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-caribbean-600 dark:text-caribbean-400 mb-2">5000+</div>
              <div className="text-jet-600 dark:text-platinum-400">{t('about.stats.clients')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">10+</div>
              <div className="text-jet-600 dark:text-platinum-400">{t('about.stats.experience')}</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="bg-gradient-to-br from-caribbean-100 to-indigo-100 dark:from-caribbean-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-jet-700 p-4 rounded-lg text-center">
                <Users className="w-8 h-8 text-caribbean-500 mx-auto mb-2" />
                <div className="font-semibold text-jet-800 dark:text-platinum-200">{t('about.features.team')}</div>
              </div>
              <div className="bg-white dark:bg-jet-700 p-4 rounded-lg text-center">
                <Zap className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <div className="font-semibold text-jet-800 dark:text-platinum-200">{t('about.features.speed')}</div>
              </div>
              <div className="bg-white dark:bg-jet-700 p-4 rounded-lg text-center">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="font-semibold text-jet-800 dark:text-platinum-200">{t('about.features.security')}</div>
              </div>
              <div className="bg-white dark:bg-jet-700 p-4 rounded-lg text-center">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="font-semibold text-jet-800 dark:text-platinum-200">{t('about.features.care')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Contact Section */}
  <section id="contact" className="py-20 bg-gradient-to-br from-caribbean-50/30 via-indigo-50/20 to-platinum-50 dark:from-caribbean-900/10 dark:via-indigo-900/5 dark:to-jet-700 pt-24 md:pt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-caribbean-700 via-indigo-700 to-caribbean-600 dark:from-caribbean-400 dark:via-indigo-400 dark:to-caribbean-300 bg-clip-text text-transparent mb-6 ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('contact.title')}
        </h2>
        <p className={`text-xl text-jet-700 dark:text-platinum-300 max-w-3xl mx-auto ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-lg border border-platinum-300 dark:border-jet-600">
            <h3 className={`text-2xl font-bold mb-6 text-jet-800 dark:text-platinum-200 ${isLanguageChanging ? 'language-change-text' : ''}`}>
              {t('contact.info.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-caribbean-500 ml-3" />
                <span className="text-jet-600 dark:text-platinum-400">info@tevasul.group</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-6 h-6 text-indigo-500 ml-3" />
                <span className="text-jet-600 dark:text-platinum-400 font-mono text-left font-bold" dir="ltr">
                  +90 534 962 72 41
                </span>
                <a
                  href="https://wa.me/905349627241"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors cursor-pointer"
                  title="فتح الواتساب"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
              </div>
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-green-500 ml-3" />
                <span className="text-jet-600 dark:text-platinum-400">{t('contact.info.address')}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={handleContactSubmit} className="bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-lg border border-platinum-300 dark:border-jet-600 space-y-6">
            {/* Success/Error Messages */}
            {contactSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
                  <span className="text-green-800 dark:text-green-200">
                    {language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Mesajınız başarıyla gönderildi! Yakında sizinle iletişime geçeceğiz.'}
                  </span>
                </div>
              </div>
            )}
            
            {contactError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
                  <span className="text-red-800 dark:text-red-200">{contactError}</span>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.name')}</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                placeholder={t('contact.form.name') as string}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.email')}</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.serviceType')}</label>
              <select 
                value={contactForm.serviceType}
                onChange={(e) => setContactForm({ ...contactForm, serviceType: e.target.value })}
                className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
              >
                <option value="">{t('contact.form.selectService')}</option>
                <option value={t('contact.form.translation') as string}>{t('contact.form.translation')}</option>
                <option value={t('contact.form.travel') as string}>{t('contact.form.travel')}</option>
                <option value={t('contact.form.legal') as string}>{t('contact.form.legal')}</option>
                <option value={t('contact.form.government') as string}>{t('contact.form.government')}</option>
                <option value={t('contact.form.insurance') as string}>{t('contact.form.insurance')}</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.message')}</label>
              <textarea
                rows={5}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                placeholder={t('contact.form.message') as string}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={contactLoading}
              className={`w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-4 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center ${isLanguageChanging ? 'language-change-text' : ''}`}
            >
              {contactLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  {language === 'ar' ? 'جاري الإرسال...' : 'Gönderiliyor...'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 ml-2" />
                  {t('contact.form.submit')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="bg-jet-900 dark:bg-black text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="flex items-center justify-center space-x-3 space-x-reverse mb-4">
        <img 
          src="/logo-fınal.png" 
          alt="مجموعة تواصل" 
          className={`w-8 h-8 rounded-lg object-cover shadow-md ${isLanguageChanging ? 'language-change-logo' : ''}`}
        />
        <span className={`text-xl font-bold bg-gradient-to-r from-caribbean-400 via-indigo-400 to-caribbean-600 bg-clip-text text-transparent ${isLanguageChanging ? 'language-change-text' : ''}`}>مجموعة تواصل</span>
      </div>
      <p className={`text-platinum-400 mb-4 ${isLanguageChanging ? 'language-change-text' : ''}`}>
        {t('footer.description')}
      </p>
      <p className={`text-sm text-platinum-500 ${isLanguageChanging ? 'language-change-text' : ''}`}>
        {t('footer.copyright')}
      </p>
    </div>
  </footer>

  {/* Auth Modals */}
  <AuthModals
    isLoginOpen={isLoginOpen}
    isSignupOpen={isSignupOpen}
    onCloseLogin={closeLogin}
    onCloseSignup={closeSignup}
    onSwitchToSignup={switchToSignup}
    onSwitchToLogin={switchToLogin}
    isDarkMode={isDarkMode}
    setShowWelcome={setShowWelcome}
    onNavigateToHome={navigateToMainHome}
  />

  {/* Welcome Message - Only for regular users */}
  {showWelcome && user && profile && profile.role === 'user' && (
    <WelcomeMessage
      userName={profile.full_name || user.email || 'مستخدم'}
      userRole={profile.role}
      onClose={() => setShowWelcome(false)}
    />
  )}

  {/* Service Request Form */}
  <ServiceRequestForm
    isOpen={serviceRequestForm.isOpen}
    onClose={closeServiceRequestForm}
    serviceType={serviceRequestForm.serviceType}
    serviceTitle={serviceRequestForm.serviceTitle}
    isDarkMode={isDarkMode}
  />

  {/* Login Success Modal */}
  {showLoginSuccess && loginSuccessData && (
    <LoginSuccessModal
      isOpen={showLoginSuccess}
      onClose={() => {
        setShowLoginSuccess(false);
        setLoginSuccessData(null);
      }}
      userRole={loginSuccessData.userRole}
      userName={loginSuccessData.userName}
      onRedirect={handleLoginSuccessRedirect}
    />
  )}

  {/* Chat Bot */}
  <ChatBot
    isOpen={isChatBotOpen}
    onToggle={() => setIsChatBotOpen(!isChatBotOpen)}
    isMinimized={isChatBotMinimized}
    onToggleMinimize={() => setIsChatBotMinimized(!isChatBotMinimized)}
  />


</div>
  );
}

export default App;
