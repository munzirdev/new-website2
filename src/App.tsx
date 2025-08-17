import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Menu, X, ArrowRight, Star, Users, Zap, Heart, Mail, Phone, MapPin, Sun, Moon, Globe, FileText, Building, ChevronDown, CheckCircle, Shield, Clock, UserPlus, User, Settings, HelpCircle, LogOut, Send, MessageCircle, Code, Volume2, VolumeX } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import DebugThemeToggle from './components/DebugThemeToggle';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from './components/AuthProvider';
import { useLanguage } from './hooks/useLanguage';
import ServicePage from './components/ServicePage';
import HealthInsurancePage from './components/HealthInsurancePage';
import AuthModals from './components/AuthModals';
import WelcomeMessage from './components/WelcomeMessage';
import GlassWelcomeMessage from './components/GlassWelcomeMessage';
import AdminDashboard from './components/AdminDashboard';
import ServiceRequestForm from './components/ServiceRequestForm';
import UserAccount from './components/UserAccount';
import ProfileEdit from './components/ProfileEdit';
import HelpSupport from './components/HelpSupport';
import VoluntaryReturnPage from './components/VoluntaryReturnPage';
import EmailVerification from './components/EmailVerification';
import LoginSuccessModal from './components/LoginSuccessModal';
import ChatBot from './components/ChatBot';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';



import { supabase } from './lib/supabase';
import { webhookService } from './services/webhookService';

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
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loginSuccessData, setLoginSuccessData] = useState<{
    userRole: 'admin' | 'moderator' | 'user';
    userName: string;
  } | null>(null);
  
  // Glass welcome message states
  const [showGlassWelcome, setShowGlassWelcome] = useState(false);
  const [glassWelcomeData, setGlassWelcomeData] = useState<{
    type: 'login' | 'logout';
    userName?: string;
    userRole?: string;
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
    phone: '',
    serviceType: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  
  // Music state
  const [isMusicMuted, setIsMusicMuted] = useState(() => {
    const savedMuted = localStorage.getItem('backgroundMusicMuted');
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (savedMuted !== null) {
      return JSON.parse(savedMuted);
    }
    
    // On mobile, default to unmuted (will play with 2% volume)
    // On desktop, default to unmuted (will play with 4% volume)
    return false;
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [musicVolume, setMusicVolume] = useState(() => {
    const savedVolume = localStorage.getItem('backgroundMusicVolume');
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (savedVolume !== null) {
      return parseFloat(savedVolume);
    }
    
    // On mobile, default to 2% volume, on desktop default to 4%
    return isMobile ? 0.02 : 0.04;
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  
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
      navigate('/', { replace: true });
    }
    
    // Close the success modal
    setShowLoginSuccess(false);
    setLoginSuccessData(null);
  }, [loginSuccessData, navigate]);





  // Navigation definition
  const navigation = [
    { name: t('nav.home'), href: '/', isSection: false },
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
        navigate('/', { replace: true });
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
        navigate('/', { replace: true });
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
    
    // Handle admin routes with proper access control
    if (path.startsWith('/admin')) {
      console.log('🔧 Admin route detected:', path);
      
      // Check if user is authenticated and has proper role
      if (user && profile) {
        const userRole = profile.role;
        const isAdmin = userRole === 'admin';
        const isModerator = userRole === 'moderator';
        
        if (isAdmin || isModerator) {
          console.log('🔧 تم اكتشاف مسار الأدمن، فتح لوحة التحكم للمستخدم المصرح له');
          setShowAdminDashboard(true);
        } else {
          console.log('🔧 المستخدم ليس لديه صلاحيات للوصول إلى لوحة التحكم');
          setShowAdminDashboard(false);
          // Redirect unauthorized users to home
          navigate('/', { replace: true });
        }
      } else {
        console.log('🔧 المستخدم غير مسجل دخول، إخفاء لوحة التحكم');
        setShowAdminDashboard(false);
        // Redirect unauthenticated users to home
        navigate('/', { replace: true });
      }
    } else {
      console.log('🔧 Non-admin route, hiding admin components');
      setShowAdminDashboard(false);
    }
  }, [location.pathname, user, profile, navigate]);

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
      
      // تنظيف localStorage (بعد التحويل)
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      
      // عرض رسالة الترحيب الزجاجية لجميع المستخدمين
      setGlassWelcomeData({
        type: 'login',
        userName: profile?.full_name || user.email || 'مستخدم',
        userRole: profile?.role
      });
      setShowGlassWelcome(true);
      
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
      
      // حذف justLoggedIn للمستخدمين العاديين أيضاً
      localStorage.removeItem('justLoggedIn');
      
      return () => clearTimeout(timer);
    }
  }, [user, profile, authLoading]);

  // First login admin redirection effect (only redirect on first login)
  useEffect(() => {
    if (!authLoading && user) {
      const isAdmin = profile?.role === 'admin';
      const isModerator = profile?.role === 'moderator';
      const currentPath = location.pathname;
      
      // Check if this is the first login (using justLoggedIn flag)
      const justLoggedIn = localStorage.getItem('justLoggedIn');
      
      if ((isAdmin || isModerator) && justLoggedIn === 'true' && (currentPath === '/' || currentPath === '/')) {
        console.log('🔧 أول تسجيل دخول للأدمن/المشرف، إعادة توجيه إلى لوحة التحكم');
        navigate('/admin', { replace: true });
        // حذف justLoggedIn بعد التحويل لمنع التكرار
        localStorage.removeItem('justLoggedIn');
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
      
      // Clear user visit flags (no longer needed since we use justLoggedIn)
      // const userVisitKeys = Object.keys(sessionStorage);
      // userVisitKeys.forEach(key => {
      //   if (key.startsWith('user-visited-')) {
      //     sessionStorage.removeItem(key);
      //   }
      // });
      
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

  // Audio initialization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.volume = musicVolume;
    audio.muted = isMusicMuted;


    
    // Auto-play when component mounts (only if not muted)
    const playAudio = async () => {
      try {
        if (!isMusicMuted) {
          // Both mobile and desktop need user interaction for autoplay
          console.log('🎵 Setting up music to play on user interaction');
          // Set a flag to play music on first user interaction
          const playOnInteraction = () => {
            audio.play().then(() => {
              console.log('✅ Music started playing');
              setIsMusicPlaying(true);
              document.removeEventListener('touchstart', playOnInteraction);
              document.removeEventListener('click', playOnInteraction);
            }).catch((error) => {
              console.error('❌ Failed to play music:', error);
            });
          };
          
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('click', playOnInteraction, { once: true });
        } else {
          setIsMusicPlaying(false);
        }
      } catch (error) {
        console.log('Auto-play prevented by browser policy');
        setIsMusicPlaying(false);
      }
    };

    playAudio();

    // Handle audio events
    const handlePlay = () => setIsMusicPlaying(true);
    const handlePause = () => setIsMusicPlaying(false);
    const handleEnded = () => setIsMusicPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [musicVolume, isMusicMuted]);

  // Save volume to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('backgroundMusicVolume', musicVolume.toString());
  }, [musicVolume]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Music control functions
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('🎵 Toggle music called');
    console.log('Current state:', { isMusicMuted, isMusicPlaying });

    if (isMusicMuted) {
      audio.muted = false;
      setIsMusicMuted(false);
      localStorage.setItem('backgroundMusicMuted', 'false');
      console.log('🔊 Music unmuted');
    } else {
      audio.muted = true;
      setIsMusicMuted(true);
      localStorage.setItem('backgroundMusicMuted', 'true');
      console.log('🔇 Music muted');
    }
  };

  const handleMusicClick = () => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('🎵 Music button clicked');
    console.log('Current state:', { isMusicPlaying, isMusicMuted });

    if (isMusicMuted) {
      // If muted, unmute and play
      audio.muted = false;
      setIsMusicMuted(false);
      localStorage.setItem('backgroundMusicMuted', 'false');
      
      // Try to play if not already playing
      if (!isMusicPlaying) {
        audio.play().then(() => {
          console.log('✅ Music started playing');
          setIsMusicPlaying(true);
        }).catch((error) => {
          console.error('❌ Failed to play music:', error);
        });
      }
    } else {
      // If not muted, mute
      audio.muted = true;
      setIsMusicMuted(true);
      localStorage.setItem('backgroundMusicMuted', 'true');
      console.log('🔇 Music muted');
    }
  };

  // Function to update music volume
  const updateMusicVolume = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    
    setMusicVolume(clampedVolume);
    audio.volume = clampedVolume;
    
    // Save to localStorage
    localStorage.setItem('backgroundMusicVolume', clampedVolume.toString());
    
    console.log('🔊 Music volume updated to:', clampedVolume);
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
    navigate('/');
  };

  const navigateToMainHome = () => {
    console.log('🚀 تنفيذ navigateToMainHome');
    console.log('📍 المسار الحالي:', location.pathname);
    
    // Force navigation to home page
    if (location.pathname === '/login' || location.pathname === '/signup') {
      console.log('🔄 إعادة توجيه من صفحة تسجيل الدخول إلى الصفحة الرئيسية');
      // Use replace to prevent back button issues
      navigate('/', { replace: true });
    } else {
      console.log('🔄 الانتقال إلى الصفحة الرئيسية');
      navigate('/');
    }
    
    // Scroll to hero section after navigation
    setTimeout(() => {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
      navigate('/', { replace: true });
    }
  };
  
  const closeSignup = () => {
    setIsSignupOpen(false);
    // إعادة توجيه للصفحة الرئيسية عند إغلاق مودال تسجيل الحساب
    if (location.pathname === '/signup') {
      console.log('🔄 إغلاق مودال تسجيل الحساب - إعادة توجيه للصفحة الرئيسية');
      navigate('/', { replace: true });
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
    
    // حفظ معلومات المستخدم قبل تسجيل الخروج لعرض رسالة الوداع
    const currentUserName = profile?.full_name || user?.email || 'مستخدم';
    const currentUserRole = profile?.role;
    
    const { error } = await signOut();
    if (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
    } else {
      console.log('✅ تم تسجيل الخروج بنجاح من التطبيق');
      
      // عرض رسالة الوداع بتأثير زجاجي
      setGlassWelcomeData({
        type: 'logout',
        userName: currentUserName,
        userRole: currentUserRole
      });
      setShowGlassWelcome(true);
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

  // Check if user is admin or moderator based on profile role
  const isAdmin = profile?.role === 'admin';
  const isModerator = profile?.role === 'moderator';
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
    
    // Special handling for health insurance - navigate to health insurance page and scroll to calculator
    if (serviceType === 'health-insurance') {
      setCurrentService('health-insurance');
      // Navigate to health insurance page with hash for calculator section
      navigate('/services/health-insurance#calculator');
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
    console.log('👤 المستخدم:', user?.email || 'ضيف');
    console.log('📝 بيانات النموذج:', contactForm);

    // Validate form
    if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) {
      console.log('❌ النموذج غير مكتمل');
      setContactError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة (الاسم، رقم الهاتف، الرسالة)' : 'Lütfen tüm gerekli alanları doldurun (Ad, Telefon, Mesaj)');
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
        user_id: user?.id || null,
        name: contactForm.name.trim(),
        email: contactForm.email.trim() || null,
        phone: contactForm.phone.trim(),
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
      
      // إرسال إشعار التيليجرام
      try {
        const webhookData = {
          id: data?.[0]?.id || Date.now().toString(),
          user_id: user?.id || null,
          title: messageData.subject,
          description: messageData.message,
          priority: 'medium',
          status: 'pending',
          service_type: contactForm.serviceType || 'general_inquiry',
          created_at: new Date().toISOString()
        };
        
        await webhookService.sendServiceRequestWebhook(webhookData);
        console.log('✅ تم إرسال إشعار التيليجرام بنجاح');
      } catch (webhookError) {
        console.error('Error sending webhook notification:', webhookError);
      }
      
      setContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', serviceType: '', message: '' });
      setContactLoading(false);
      
      // رسالة نجاح مختلفة للضيوف
      const successMessage = user 
        ? (language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Mesajınız başarıyla gönderildi! Yakında sizinle iletişime geçeceğiz.')
        : (language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً. شكراً لاهتمامك بمجموعة تواصل.' : 'Mesajınız başarıyla gönderildi! Yakında sizinle iletişime geçeceğiz. Tevasul Group\'a ilginiz için teşekkürler.');
      
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

  // If admin dashboard is open, show it with proper access control
  if (showAdminDashboard) {
    // Only log once to prevent spam
    if (!(window as any).adminDashboardLogged) {
      console.log('🔧 عرض لوحة تحكم الأدمن');
      (window as any).adminDashboardLogged = true;
    }
    return (
      <ProtectedRoute requireModerator={true}>
        <AdminDashboard onBack={() => navigate('/')} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} onSignOut={handleSignOut} />
      </ProtectedRoute>
    );
  }

  // If user account is open, show it
  if (showUserAccount) {
    return <UserAccount 
      onBack={() => {
        setShowUserAccount(false);
        navigate('/', { replace: true });
      }} 
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
          onBack={() => navigate('/')} 
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-jet-800 text-white' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-800'} overflow-x-hidden font-alexandria ${isLanguageChanging ? 'language-change-blur language-change-animation' : ''}`}>
      <CustomCursor isDarkMode={isDarkMode} />
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Waveform Animation Keyframes */
          @keyframes waveform {
            0%, 100% {
              transform: scaleY(0.3);
            }
            50% {
              transform: scaleY(1);
            }
          }
          
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
      <Navbar
        onNavigateHome={navigateToMainHome}
        onNavigateToContact={() => {
          const contactSection = document.getElementById('contact');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onOpenProfile={() => setShowProfileEdit(true)}
        onOpenAccount={() => setShowUserAccount(true)}
        onOpenHelp={() => setShowHelpSupport(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

        {/* Click outside to close dropdown */}
        {showUserDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUserDropdown(false)}
          ></div>
        )}

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24 pb-20 md:pb-32">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900' : 'bg-gradient-to-br from-blue-600 via-blue-400 to-white'}`}>
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
            
            {/* Glassy Service Icons - Random Distribution with Slow Random Movement */}
            {/* FileText Icon */}
            <div className="absolute top-[15%] left-[18%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-1 shadow-lg">
              <FileText className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Users Icon */}
            <div className="absolute top-[25%] right-[22%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-2 shadow-lg">
              <Users className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Zap Icon */}
            <div className="absolute top-[45%] left-[35%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-3 shadow-lg">
              <Zap className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Globe Icon */}
            <div className="absolute top-[35%] right-[45%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-4 shadow-lg">
              <Globe className="w-10 h-10 text-white/70" />
            </div>
            
            {/* MapPin Icon */}
            <div className="absolute top-[65%] left-[28%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-5 shadow-lg">
              <MapPin className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Shield Icon */}
            <div className="absolute top-[55%] right-[38%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-1 shadow-lg" style={{animationDelay: '-5s'}}>
              <Shield className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Building Icon */}
            <div className="absolute bottom-[30%] left-[42%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-2 shadow-lg" style={{animationDelay: '-8s'}}>
              <Building className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Heart Icon */}
            <div className="absolute bottom-[25%] right-[32%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-3 shadow-lg" style={{animationDelay: '-12s'}}>
              <Heart className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Star Icon */}
            <div className="absolute top-[75%] left-[55%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-4 shadow-lg" style={{animationDelay: '-15s'}}>
              <Star className="w-10 h-10 text-white/70" />
            </div>
            
            {/* CheckCircle Icon */}
            <div className="absolute bottom-[40%] left-[15%] w-20 h-20 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-5 shadow-lg" style={{animationDelay: '-18s'}}>
              <CheckCircle className="w-10 h-10 text-white/70" />
            </div>
            
            {/* Additional Animated Elements */}
            <div className="absolute top-1/6 right-1/6 w-24 h-24 glass-circle-dark rounded-full animate-spin-slow"></div>
            <div className="absolute bottom-1/6 left-1/6 w-20 h-20 glass-circle-dark-2 rounded-full animate-spin-slow-reverse"></div>
            <div className="absolute top-1/2 left-1/6 w-16 h-16 glass-circle-dark rounded-full animate-bounce-slow"></div>
            <div className="absolute top-1/2 right-1/6 w-18 h-18 glass-circle-dark-2 rounded-full animate-pulse-slow delay-500"></div>
            
            {/* Animated Lines */}
            <div className="absolute top-1/4 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-caribbean-400/30 to-transparent animate-pulse-slow"></div>
            <div className="absolute bottom-1/3 right-1/3 w-24 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-pulse-slow delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse-slow delay-2000"></div>
            
            {/* Orbiting Elements */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-[500px] h-[500px]">
                <div className="absolute inset-0 border border-white/5 rounded-full animate-spin-slow"></div>
                <div className="absolute top-0 left-1/2 w-6 h-6 glass-circle-dark rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit"></div>
                <div className="absolute bottom-0 right-1/2 w-5 h-5 glass-circle-dark-2 rounded-full transform translate-x-1/2 translate-y-1/2 animate-orbit-reverse"></div>
                <div className="absolute top-1/4 right-1/4 w-4 h-4 glass-circle-dark rounded-full animate-orbit" style={{animationDelay: '-5s'}}></div>
                <div className="absolute bottom-1/4 left-1/4 w-3 h-3 glass-circle-dark-2 rounded-full animate-orbit-reverse" style={{animationDelay: '-3s'}}></div>
              </div>
            </div>
          </div>

          {/* Mobile-only glassy icon elements - Random Distribution with Slow Movement */}
          <div className="md:hidden">
            {/* FileText Icon */}
            <div className="absolute top-[12%] left-[18%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-1 shadow-lg">
              <FileText className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Users Icon */}
            <div className="absolute top-[28%] right-[15%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-2 shadow-lg">
              <Users className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Zap Icon */}
            <div className="absolute top-[45%] left-[25%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-3 shadow-lg">
              <Zap className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Shield Icon */}
            <div className="absolute top-[35%] right-[35%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-4 shadow-lg">
              <Shield className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Globe Icon */}
            <div className="absolute top-[62%] left-[12%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-5 shadow-lg">
              <Globe className="w-8 h-8 text-white/60" />
            </div>
            
            {/* MapPin Icon */}
            <div className="absolute top-[55%] right-[22%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-1 shadow-lg" style={{animationDelay: '-3s'}}>
              <MapPin className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Building Icon */}
            <div className="absolute bottom-[25%] left-[38%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-2 shadow-lg" style={{animationDelay: '-6s'}}>
              <Building className="w-8 h-8 text-white/60" />
            </div>
            
            {/* Heart Icon */}
            <div className="absolute bottom-[18%] right-[28%] w-16 h-16 glass-icon-circle rounded-full flex items-center justify-center animate-float-random-3 shadow-lg" style={{animationDelay: '-9s'}}>
              <Heart className="w-8 h-8 text-white/60" />
            </div>
          </div>
        </div>
        
        {/* Blurred Background Overlay for Text Readability */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/30 pointer-events-none"></div>

        <div className="relative text-center px-4 max-w-6xl mx-auto">
          {/* Logo Section - Adjusted for mobile with dangerous scroll animation */}
          <div className="flex items-center justify-center mb-6 md:mb-8 animate-fade-in relative">

            
            {/* Main logo */}
            <img 
              src="/logo-fınal.png" 
              alt="مجموعة تواصل" 
              className={`w-48 h-48 md:w-60 md:h-60 lg:w-84 lg:h-84 xl:w-96 xl:h-96 object-contain animate-float brightness-0 invert ${isLanguageChanging ? 'language-change-logo' : ''}`}
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
          className="group relative bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white px-6 md:px-10 py-3 md:py-5 rounded-full font-bold text-lg md:text-xl hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl flex items-center justify-center overflow-hidden animate-pulse-glow border-2 border-white/20 hover:border-white/40"
        >
          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400/20 to-indigo-400/20 animate-pulse"></div>
          <span className="relative z-10 flex items-center animate-pulse-text-arrow">
            {t('hero.discoverServices')}
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-white/90" />
          </span>
        </button>
        <button 
          onClick={scrollToContact}
          className="group relative border-3 border-white/80 text-white px-6 md:px-10 py-3 md:py-5 rounded-full font-bold text-lg md:text-xl hover:bg-white/20 hover:border-white transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl overflow-hidden animate-pulse-glow bg-gradient-to-r from-white/5 to-white/10"
        >
          <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse"></div>
          <span className="relative z-10 flex items-center justify-center">
            {t('hero.contactNow')}
            <Phone className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
          </span>
        </button>
      </div>
      
      {/* Trust Indicators - Icons in row, text below */}
      <div className="flex flex-col items-center space-y-4 mt-12 md:mt-16 animate-fade-in-delay-4">
        {/* Icons Row */}
        <div className="flex justify-center items-center space-x-reverse">
          <div className="flex flex-col items-center">
            <Shield className="w-12 h-12 md:w-16 md:h-16 text-green-400 mb-4" />
            <span className="text-base md:text-lg font-semibold text-white/90 text-center">{t('hero.trust.licensed')}</span>
          </div>
          <div className="flex flex-col items-center mx-20 md:mx-32">
            <Clock className="w-12 h-12 md:w-16 md:h-16 text-caribbean-400 mb-4" />
            <span className="text-base md:text-lg font-semibold text-white/90 text-center">{t('hero.trust.fast')}</span>
          </div>
          <div className="flex flex-col items-center">
            <Star className="w-12 h-12 md:w-16 md:h-16 text-sky-400 mb-4" />
            <span className="text-base md:text-lg font-semibold text-white/90 text-center">{t('hero.trust.excellent')}</span>
          </div>
        </div>
      </div>
    </div>
    

  </section>

  {/* Glass Divider */}
  <div className="relative h-1 overflow-hidden">
    <div className="absolute inset-0 glass-divider"></div>
  </div>

  {/* Services Section */}
  <section id="services" className={`py-20 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100'} relative overflow-hidden pt-24 md:pt-20 services-section`}>
    {/* Background Elements - Matching Hero Design */}
    <div className="absolute inset-0 overflow-hidden">
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
      
      {/* Floating Background Elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-caribbean-200/20 to-indigo-200/20 dark:from-caribbean-800/10 dark:to-indigo-800/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-caribbean-200/20 dark:from-indigo-800/10 dark:to-caribbean-800/10 rounded-full blur-3xl animate-float-reverse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-caribbean-100/30 to-indigo-100/30 dark:from-caribbean-900/20 dark:to-indigo-900/20 rounded-full blur-2xl animate-pulse-slow"></div>
      
      {/* Additional Floating Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 glass-effect rounded-full shadow-lg animate-float-slow transform rotate-12 flex items-center justify-center">
        <FileText className="w-8 h-8 text-white/60" />
      </div>
      <div className="absolute bottom-20 right-10 w-16 h-16 glass-effect rounded-full flex items-center justify-center animate-float-wide-slower shadow-lg">
        <Users className="w-8 h-8 text-caribbean-300" />
      </div>
      <div className="absolute top-1/3 right-1/6 w-16 h-16 glass-effect rounded-full flex items-center justify-center animate-pulse-wide-slower shadow-lg">
        <Shield className="w-8 h-8 text-indigo-300" />
      </div>
      <div className="absolute bottom-1/3 left-1/6 w-16 h-16 glass-effect rounded-full flex items-center justify-center animate-bounce-wide-slower shadow-lg">
        <Globe className="w-8 h-8 text-caribbean-300" />
      </div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 glass-effect rounded-full flex items-center justify-center animate-glass-float shadow-lg">
        <Star className="w-6 h-6 text-sky-300" />
      </div>
      <div className="absolute bottom-1/4 right-1/4 w-14 h-14 glass-effect rounded-full flex items-center justify-center animate-glass-pulse shadow-lg">
        <Heart className="w-7 h-7 text-red-300" />
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center mb-16 animate-fade-in services-section-header">
        <h2 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-6 services-title ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('services.title')}
        </h2>
        <p className={`text-xl ${isDarkMode ? 'text-white/80' : 'text-slate-600'} max-w-3xl mx-auto leading-relaxed services-subtitle ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('services.subtitle')}
        </p>
        {/* Decorative Line */}
        <div className="w-16 h-0.5 mx-auto mt-6 rounded-full services-decorative-line"></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 services-grid">
        {services.map((service, index) => (
                      <div
              key={index}
              className={`group relative p-8 rounded-2xl shadow-2xl hover:shadow-3xl service-card-hover service-card-enhanced overflow-hidden animate-fade-in service-card-container ${
                isDarkMode ? 'glass-card-dark' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'
              }`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 dark:from-caribbean-900/10 dark:to-indigo-900/10 rounded-2xl animate-glass-pulse"></div>
            
            {/* Animated Border Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-caribbean-400/20 via-indigo-400/20 to-caribbean-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm animate-border-glow"></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full service-card-content">
              <div className="service-content-area">
                <div className="mb-6 p-4 glass-effect dark:glass-effect-dark rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300 animate-glass-float service-icon-float service-icon-container">
                  <div className={`service-icon ${
                    service.id === 'health-insurance' ? 'service-icon-health' :
                    service.id === 'translation' ? 'service-icon-translation' :
                    service.id === 'travel' ? 'service-icon-travel' :
                    service.id === 'legal' ? 'service-icon-legal' :
                    service.id === 'government' ? 'service-icon-government' :
                    service.id === 'insurance' ? 'service-icon-insurance' : ''
                  }`}>
              {service.icon}
            </div>
                </div>
                
                <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 text-glow-caribbean ${
                  isDarkMode ? 'text-white group-hover:text-caribbean-300' : 'text-slate-800 group-hover:text-caribbean-600'
                }`}>
              {service.title}
            </h3>
                
                <p className={`leading-relaxed drop-shadow-sm ${
                  isDarkMode ? 'text-white/80' : 'text-slate-600'
                }`}>
              {service.description}
            </p>
              </div>
              
              {/* Buttons Container - Fixed at Bottom */}
              <div className="service-card-buttons service-button-group">
            <button 
              onClick={() => handleServiceClick(service.id)}
                  className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center group/btn backdrop-blur-sm border border-white/20 animate-glass-shimmer glass-button"
            >
                  <span className="relative z-10">{t('services.discoverMore')}</span>
                  <ArrowRight className="mr-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300 relative z-10" />
                  <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left rounded-lg"></div>
            </button>
                
            {user && (
              <button 
                onClick={() => openServiceRequestForm(service.id, service.title)}
                    className="w-full glass-effect dark:glass-effect-dark text-white border-2 border-white/30 dark:border-jet-600/30 py-2 px-6 rounded-lg font-semibold hover:bg-white/20 dark:hover:bg-caribbean-900/30 hover:border-caribbean-300/50 dark:hover:border-caribbean-500/50 transition-all duration-300 flex items-center justify-center"
              >
                {t('services.quickRequest')}
              </button>
            )}
                
            {!user && (
              <button 
                onClick={() => openServiceRequestForm(service.id, service.title)}
                    className="w-full login-button text-white border-2 border-white/30 dark:border-jet-600/30 py-2 px-6 rounded-lg font-semibold hover:bg-white/20 dark:hover:bg-caribbean-900/30 hover:border-caribbean-300/50 dark:hover:border-caribbean-500/50 transition-all duration-300 flex items-center justify-center login-pulse-glow relative overflow-hidden"
              >
                    <span className="relative z-10 flex items-center">
                      <User className="w-4 h-4 mr-2 login-icon" />
                {t('services.loginToRequest')}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400/20 to-indigo-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </button>
            )}
              </div>
            </div>
            
            {/* Hover Effect Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-caribbean-400/0 via-caribbean-400/10 to-indigo-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* Glass Divider */}
  <div className="relative h-1 overflow-hidden">
    <div className="absolute inset-0 glass-divider"></div>
  </div>

  {/* About Section */}
  <section id="about" className={`py-20 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} relative overflow-hidden pt-24 md:pt-20`}>
    {/* Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-caribbean-200/10 to-indigo-200/10 dark:from-caribbean-800/5 dark:to-indigo-800/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/10 to-caribbean-200/10 dark:from-indigo-800/5 dark:to-caribbean-800/5 rounded-full blur-3xl animate-float-reverse"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'} ${isLanguageChanging ? 'language-change-text' : ''}`}>
            {t('about.title')}
          </h2>
          <p className={`text-xl ${isDarkMode ? 'text-white/85' : 'text-slate-700'} mb-6 leading-relaxed ${isLanguageChanging ? 'language-change-text' : ''}`}>
            {t('about.description1')}
          </p>
          <p className={`text-lg ${isDarkMode ? 'text-white/80' : 'text-slate-600'} mb-8 leading-relaxed ${isLanguageChanging ? 'language-change-text' : ''}`}>
            {t('about.description2')}
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'glass-card-dark' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'}`}>
              <div className="text-3xl font-bold text-caribbean-600 mb-2">5000+</div>
              <div className={isDarkMode ? 'text-white/70' : 'text-slate-600'}>{t('about.stats.clients')}</div>
            </div>
            <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'glass-card-dark' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'}`}>
              <div className="text-3xl font-bold text-indigo-600 mb-2">10+</div>
              <div className={isDarkMode ? 'text-white/70' : 'text-slate-600'}>{t('about.stats.experience')}</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className={`p-8 rounded-2xl ${isDarkMode ? 'glass-card-dark' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <Users className="w-8 h-8 text-caribbean-600 mx-auto mb-2" />
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('about.features.team')}</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('about.features.speed')}</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('about.features.security')}</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('about.features.care')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Glass Divider */}
  <div className="relative h-1 overflow-hidden">
    <div className="absolute inset-0 glass-divider"></div>
  </div>

  {/* Contact Section */}
  <section id="contact" className={`py-20 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} relative overflow-hidden pt-24 md:pt-20`}>
    {/* Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-caribbean-200/10 to-indigo-200/10 dark:from-caribbean-800/5 dark:to-indigo-800/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/10 to-caribbean-200/10 dark:from-indigo-800/5 dark:to-caribbean-800/5 rounded-full blur-3xl animate-float-reverse"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center mb-16">
        <h2 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-6 ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('contact.title')}
        </h2>
        <p className={`text-xl ${isDarkMode ? 'text-white/85' : 'text-slate-600'} max-w-3xl mx-auto ${isLanguageChanging ? 'language-change-text' : ''}`}>
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className={`p-8 rounded-2xl ${isDarkMode ? 'glass-card-dark' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'}`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'} ${isLanguageChanging ? 'language-change-text' : ''}`}>
              {t('contact.info.title')}
            </h3>
            <div className="space-y-4">
              <div className={`flex items-center p-3 rounded-lg ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <Mail className="w-6 h-6 text-caribbean-600 ml-3" />
                <span className={isDarkMode ? 'text-white/90' : 'text-slate-700'}>info@tevasul.group</span>
              </div>
              <div className={`flex items-center p-3 rounded-lg ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <Phone className="w-6 h-6 text-indigo-600 ml-3" />
                <a 
                  href="tel:+905349627241" 
                  className={`font-sans text-left font-semibold tracking-wide transition-colors duration-300 cursor-pointer ${isDarkMode ? 'text-white/90 hover:text-indigo-300' : 'text-slate-700 hover:text-indigo-600'}`}
                  dir="ltr"
                >
                  +90 534 962 72 41
                </a>
                <a
                  href="https://wa.me/905349627241"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-green-300 hover:text-green-200 hover:bg-green-500/20 rounded transition-colors cursor-pointer"
                  title="فتح الواتساب"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
              </div>
              <div className={`flex items-center p-3 rounded-lg ${isDarkMode ? 'glass-effect-dark' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200'}`}>
                <MapPin className="w-6 h-6 text-green-600 ml-3" />
                <a 
                  href="https://maps.app.goo.gl/39YFtk8fcES8p1JA8?g_st=awb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`transition-colors duration-300 cursor-pointer ${isDarkMode ? 'text-white/90 hover:text-green-300' : 'text-slate-700 hover:text-green-600'}`}
                >
                  {t('contact.info.address')}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={handleContactSubmit} className={`p-8 rounded-2xl space-y-6 ${isDarkMode ? 'glass-card-dark' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'}`}>
            {/* Success/Error Messages */}
            {contactSuccess && (
              <div className={`rounded-lg p-4 ${
                isDarkMode 
                  ? 'bg-green-900/20 border border-green-800' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center">
                  <CheckCircle className={`w-5 h-5 ml-2 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className={isDarkMode ? 'text-green-200' : 'text-green-800'}>
                    {user 
                      ? (language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Mesajınız başarıyla gönderildi! Yakında sizinle iletişime geçeceğiz.')
                      : (language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً. شكراً لاهتمامك بمجموعة تواصل.' : 'Mesajınız başarıyla gönderildi! Yakında sizinle iletişime geçeceğiz. Tevasul Group\'a ilginiz için teşekkürler.')
                    }
                  </span>
                </div>
              </div>
            )}
            
            {contactError && (
              <div className={`rounded-lg p-4 ${
                isDarkMode 
                  ? 'bg-red-900/20 border border-red-800' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <X className={`w-5 h-5 ml-2 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                  <span className={isDarkMode ? 'text-red-200' : 'text-red-800'}>{contactError}</span>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium text-white/90 mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.name')}</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-effect-dark text-white placeholder-white/50' 
                    : 'bg-white/90 border border-slate-300 text-slate-800 placeholder-slate-500'
                }`}
                placeholder={t('contact.form.name') as string}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-slate-700'} mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.email')}</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-effect-dark text-white placeholder-white/50' 
                    : 'bg-white/90 border border-slate-300 text-slate-800 placeholder-slate-500'
                }`}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-slate-700'} mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.phone')}</label>
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-effect-dark text-white placeholder-white/50' 
                    : 'bg-white/90 border border-slate-300 text-slate-800 placeholder-slate-500'
                }`}
                placeholder="+90 534 962 72 41"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-slate-700'} mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.serviceType')}</label>
              <select 
                value={contactForm.serviceType}
                onChange={(e) => setContactForm({ ...contactForm, serviceType: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-effect-dark text-white' 
                    : 'bg-white/90 border border-slate-300 text-slate-800'
                }`}
              >
                <option value="" className={isDarkMode ? 'text-jet-900' : 'text-slate-800'}>{t('contact.form.selectService')}</option>
                <option value={t('contact.form.translation') as string} className={isDarkMode ? 'text-jet-900' : 'text-slate-800'}>{t('contact.form.translation')}</option>
                <option value={t('contact.form.travel') as string} className={isDarkMode ? 'text-jet-900' : 'text-slate-800'}>{t('contact.form.travel')}</option>
                <option value={t('contact.form.legal') as string} className={isDarkMode ? 'text-jet-900' : 'text-slate-800'}>{t('contact.form.legal')}</option>
                <option value={t('contact.form.government') as string} className={isDarkMode ? 'text-jet-900' : 'text-slate-800'}>{t('contact.form.government')}</option>
                <option value={t('contact.form.insurance') as string} className={isDarkMode ? 'text-jet-900' : 'text-slate-800'}>{t('contact.form.insurance')}</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-slate-700'} mb-2 ${isLanguageChanging ? 'language-change-text' : ''}`}>{t('contact.form.message')}</label>
              <textarea
                rows={5}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-400 focus:border-transparent transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-effect-dark text-white placeholder-white/50' 
                    : 'bg-white/90 border border-slate-300 text-slate-800 placeholder-slate-500'
                }`}
                placeholder={t('contact.form.message') as string}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={contactLoading}
              className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center ${isLanguageChanging ? 'language-change-text' : ''} ${
                isDarkMode 
                  ? 'glass-button text-white' 
                  : 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700'
              }`}
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

  {/* Glass Divider */}
  <div className="relative h-1 overflow-hidden">
    <div className="absolute inset-0 glass-divider"></div>
  </div>

  {/* Footer */}
  <footer className={`relative overflow-hidden ${
    isDarkMode 
      ? 'bg-gradient-to-br from-jet-900 via-slate-900 to-black text-white' 
      : 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-slate-800'
  }`}>
    {/* Animated Background */}
    <div className="absolute inset-0">
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-caribbean-900/10 via-indigo-900/10 to-caribbean-900/10' 
          : 'bg-gradient-to-r from-caribbean-500/5 via-indigo-500/5 to-caribbean-500/5'
      }`}></div>
      <div className={`absolute top-0 left-0 w-full h-1 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-transparent via-caribbean-500 to-transparent opacity-50' 
          : 'bg-gradient-to-r from-transparent via-caribbean-400 to-transparent opacity-30'
      }`}></div>
      <div className={`absolute -top-40 -left-40 w-80 h-80 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-caribbean-500/5 to-indigo-500/5' 
          : 'bg-gradient-to-br from-caribbean-400/10 to-indigo-400/10'
      } rounded-full blur-3xl animate-float`}></div>
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 ${
        isDarkMode 
          ? 'bg-gradient-to-tr from-indigo-500/5 to-caribbean-500/5' 
          : 'bg-gradient-to-tr from-indigo-400/10 to-caribbean-400/10'
      } rounded-full blur-3xl animate-float-reverse`}></div>
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Main Footer Content */}
      <div className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <div className="relative">
        <img 
          src="/logo-fınal.png" 
          alt="مجموعة تواصل" 
                  className={`w-12 h-12 rounded-xl object-cover shadow-lg ${isLanguageChanging ? 'language-change-logo' : ''} hover:scale-110 transition-transform duration-300`}
        />
                <div className="absolute -inset-1 bg-gradient-to-r from-caribbean-500 to-indigo-500 rounded-xl blur opacity-20 animate-pulse"></div>
      </div>
              <div>
                <h3 className={`text-2xl font-bold bg-gradient-to-r from-caribbean-400 via-indigo-400 to-caribbean-600 bg-clip-text text-transparent ${isLanguageChanging ? 'language-change-text' : ''}`}>
                  مجموعة تواصل
                </h3>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-caribbean-300' : 'text-caribbean-600'}`}>Tevasul Group</p>
              </div>
            </div>
            <p className={`leading-relaxed mb-6 max-w-md ${isLanguageChanging ? 'language-change-text' : ''} ${
              isDarkMode ? 'text-white/80' : 'text-slate-600'
            }`}>
        {t('footer.description')}
      </p>
                         <div className="flex space-x-4 space-x-reverse">
            <a href="https://twitter.com/TawasulGroupTr" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-300 group footer-link-hover ${
              isDarkMode ? 'glass-effect' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'
            }`}>
              <svg className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-white group-hover:text-caribbean-300' 
                  : 'text-slate-700 group-hover:text-caribbean-600'
              }`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/tawasul.group.tr" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-300 group footer-link-hover ${
              isDarkMode ? 'glass-effect' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'
            }`}>
              <svg className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-white group-hover:text-indigo-300' 
                  : 'text-slate-700 group-hover:text-indigo-600'
              }`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://wa.me/905349627241" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-300 group footer-link-hover ${
              isDarkMode ? 'glass-effect' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg'
            }`}>
              <svg className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-white group-hover:text-green-300' 
                  : 'text-slate-700 group-hover:text-green-600'
              }`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </a>
          </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-lg font-bold mb-6 flex items-center ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              <span className="w-8 h-0.5 bg-gradient-to-r from-caribbean-500 to-indigo-500 mr-3"></span>
              {t('footer.quickLinks')}
            </h4>
                         <ul className="space-y-3">
               <li>
                 <a href="#hero" onClick={(e) => {
                   e.preventDefault();
                   const heroSection = document.getElementById('hero');
                   if (heroSection) {
                     heroSection.scrollIntoView({ behavior: 'smooth' });
                   }
                 }} className={`transition-colors duration-300 flex items-center group footer-link-hover cursor-pointer ${
                   isDarkMode 
                     ? 'text-white/70 hover:text-caribbean-300' 
                     : 'text-slate-600 hover:text-caribbean-600'
                 }`}>
                   {t('nav.home')}
                 </a>
               </li>
               <li>
                 <a href="#services" onClick={(e) => {
                   e.preventDefault();
                   const servicesSection = document.getElementById('services');
                   if (servicesSection) {
                     servicesSection.scrollIntoView({ behavior: 'smooth' });
                   }
                 }} className={`transition-colors duration-300 flex items-center group footer-link-hover cursor-pointer ${
                   isDarkMode 
                     ? 'text-white/70 hover:text-indigo-300' 
                     : 'text-slate-600 hover:text-indigo-600'
                 }`}>
                   {t('nav.services')}
                 </a>
               </li>
               <li>
                 <a href="#about" onClick={(e) => {
                   e.preventDefault();
                   const aboutSection = document.getElementById('about');
                   if (aboutSection) {
                     aboutSection.scrollIntoView({ behavior: 'smooth' });
                   }
                 }} className={`transition-colors duration-300 flex items-center group footer-link-hover cursor-pointer ${
                   isDarkMode 
                     ? 'text-white/70 hover:text-green-300' 
                     : 'text-slate-600 hover:text-green-600'
                 }`}>
                   {t('nav.about')}
                 </a>
               </li>
               <li>
                 <a href="#contact" onClick={(e) => {
                   e.preventDefault();
                   const contactSection = document.getElementById('contact');
                   if (contactSection) {
                     contactSection.scrollIntoView({ behavior: 'smooth' });
                   }
                 }} className={`transition-colors duration-300 flex items-center group footer-link-hover cursor-pointer ${
                   isDarkMode 
                     ? 'text-white/70 hover:text-red-300' 
                     : 'text-slate-600 hover:text-red-600'
                 }`}>
                   {t('nav.contact')}
                 </a>
               </li>
             </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className={`text-lg font-bold mb-6 flex items-center ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              <span className="w-8 h-0.5 bg-gradient-to-r from-caribbean-500 to-indigo-500 mr-3"></span>
              {t('footer.contactInfo')}
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:info@tevasul.group" className={`transition-colors duration-300 flex items-center group footer-link-hover cursor-pointer ${
                  isDarkMode 
                    ? 'text-white/70 hover:text-caribbean-300' 
                    : 'text-slate-600 hover:text-caribbean-600'
                }`}>
                  <Mail className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">info@tevasul.group</span>
                </a>
              </li>
              <li>
                <a href="tel:+905349627241" className={`transition-colors duration-300 flex items-center group footer-link-hover cursor-pointer ${
                  isDarkMode 
                    ? 'text-white/70 hover:text-indigo-300' 
                    : 'text-slate-600 hover:text-indigo-600'
                }`}>
                  <Phone className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-mono" dir="ltr">+90 534 962 72 41</span>
                </a>
              </li>
              <li>
                <a href="https://maps.app.goo.gl/39YFtk8fcES8p1JA8?g_st=awb" target="_blank" rel="noopener noreferrer" className={`transition-colors duration-300 flex items-start group footer-link-hover cursor-pointer ${
                  isDarkMode 
                    ? 'text-white/70 hover:text-green-300' 
                    : 'text-slate-600 hover:text-green-600'
                }`}>
                  <MapPin className="w-4 h-4 mr-4 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-sm">CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

                 {/* Developer Signature */}
         <div className={`border-t pt-8 ${
           isDarkMode ? 'border-white/10' : 'border-slate-300/30'
         }`}>
           <div className="flex justify-center items-center">
             <div className="flex items-center space-x-3 space-x-reverse developer-signature group">
               <div className="w-8 h-8 bg-gradient-to-br from-caribbean-500 to-indigo-500 rounded-lg flex items-center justify-center footer-glow group-hover:scale-110 transition-transform duration-300">
                 <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                 </svg>
               </div>
               <span className={`text-sm ${
                 isDarkMode ? 'text-white/60' : 'text-slate-500'
               }`}>
                 طوّر بواسطة{' '}
                 <a 
                   href="https://t.me/munzir_96" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   onClick={(e) => {
                     e.stopPropagation();
                     window.open('https://t.me/munzir_96', '_blank', 'noopener,noreferrer');
                   }}
                   className="text-caribbean-600 hover:text-caribbean-500 transition-colors duration-300 font-semibold hover:underline cursor-pointer"
                 >
                   المنذر الآلوسي
                 </a>
               </span>
             </div>
           </div>
         </div>
      </div>

      {/* Bottom Bar */}
      <div className={`border-t py-6 ${
        isDarkMode ? 'border-white/5' : 'border-slate-300/20'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm mb-4 md:mb-0 ${isLanguageChanging ? 'language-change-text' : ''} ${
            isDarkMode ? 'text-white/60' : 'text-slate-500'
          }`}>
        {t('footer.copyright')}
      </p>
          
          <div className="flex items-center space-x-6 space-x-reverse">
            <button
              onClick={() => setShowPrivacy(true)}
              className={`transition-colors text-sm hover:scale-105 transform duration-300 ${
                isDarkMode 
                  ? 'text-white/60 hover:text-caribbean-300' 
                  : 'text-slate-500 hover:text-caribbean-600'
              }`}
            >
              {language === 'ar' ? 'سياسة الخصوصية' : language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
            </button>
            <button
              onClick={() => setShowTerms(true)}
              className={`transition-colors text-sm hover:scale-105 transform duration-300 ${
                isDarkMode 
                  ? 'text-white/60 hover:text-indigo-300' 
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              {language === 'ar' ? 'شروط الاستخدام' : language === 'tr' ? 'Kullanım Şartları' : 'Terms of Service'}
            </button>
            <a href="#" className={`transition-colors text-sm hover:scale-105 transform duration-300 ${
              isDarkMode 
                ? 'text-white/60 hover:text-green-300' 
                : 'text-slate-500 hover:text-green-600'
            }`}>
              {language === 'ar' ? 'سياسة ملفات تعريف الارتباط' : language === 'tr' ? 'Çerez Politikası' : 'Cookie Policy'}
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Elements */}
    <div className="absolute top-10 right-10 w-16 h-16 glass-effect rounded-full flex items-center justify-center footer-floating-element opacity-20">
      <Code className="w-8 h-8 text-caribbean-300" />
    </div>
    <div className="absolute bottom-20 left-10 w-12 h-12 glass-effect rounded-full flex items-center justify-center footer-floating-element opacity-20">
      <Heart className="w-6 h-6 text-red-300" />
    </div>
    <div className="absolute top-1/3 left-1/4 w-10 h-10 glass-effect rounded-full flex items-center justify-center footer-floating-element opacity-20">
      <Star className="w-5 h-5 text-yellow-300" />
    </div>
  </footer>

  {/* Footer Bottom Spacing */}
  <div className={`h-[70px] ${
    isDarkMode 
      ? 'bg-gradient-to-br from-jet-900 via-slate-900 to-black' 
      : 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100'
  }`}></div>

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

  {/* Glass Welcome Message */}
  {showGlassWelcome && glassWelcomeData && (
    <GlassWelcomeMessage
      type={glassWelcomeData.type}
      userName={glassWelcomeData.userName}
      userRole={glassWelcomeData.userRole}
      onClose={() => {
        setShowGlassWelcome(false);
        setGlassWelcomeData(null);
      }}
    />
  )}

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

  {/* Background Music Audio */}
  <audio 
    ref={audioRef} 
    src="/empathy-slow-ambient-music-pad-background-385736.mp3" 
    preload="auto" 
    loop 
    muted={isMusicMuted}
  />

  {/* Music Control Button - Fixed Bottom Left */}
  <div className="fixed bottom-6 left-6 z-[99999]">
    <button
      onClick={handleMusicClick}
      className={`relative w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center shadow-2xl transform hover:scale-110 ${
        isMusicMuted || !isMusicPlaying
          ? isDarkMode 
            ? 'bg-red-500 text-white border-2 border-red-400 shadow-red-500/50' 
            : 'bg-red-500 text-white border-2 border-red-400 shadow-red-500/50'
          : isDarkMode
            ? 'bg-gradient-to-r from-caribbean-500 to-indigo-500 text-white border-2 border-caribbean-400 shadow-caribbean-500/50'
            : 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white border-2 border-caribbean-500 shadow-caribbean-500/50'
      }`}
      title={isMusicMuted ? 'تشغيل الموسيقى' : 'إيقاف الموسيقى'}
    >
      {isMusicMuted || !isMusicPlaying ? (
        <VolumeX className="w-6 h-6" />
      ) : (
        /* Show only waveform when music is playing */
        <div className="flex items-end space-x-0.5 h-5">
          <div className="w-0.5 bg-white opacity-60" style={{ 
            height: '40%', 
            animation: 'waveform 1s ease-in-out infinite',
            animationDelay: '0ms'
          }}></div>
          <div className="w-0.5 bg-white opacity-80" style={{ 
            height: '60%', 
            animation: 'waveform 1.2s ease-in-out infinite',
            animationDelay: '0.2s'
          }}></div>
          <div className="w-0.5 bg-white opacity-100" style={{ 
            height: '80%', 
            animation: 'waveform 0.8s ease-in-out infinite',
            animationDelay: '0.4s'
          }}></div>
          <div className="w-0.5 bg-white opacity-80" style={{ 
            height: '60%', 
            animation: 'waveform 1.1s ease-in-out infinite',
            animationDelay: '0.6s'
          }}></div>
          <div className="w-0.5 bg-white opacity-60" style={{ 
            height: '40%', 
            animation: 'waveform 0.9s ease-in-out infinite',
            animationDelay: '0.8s'
          }}></div>
        </div>
      )}
      
      {/* Music indicator */}
      {isMusicPlaying && !isMusicMuted && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
      )}
    </button>
  </div>

</div>
  );
}

export default App;
