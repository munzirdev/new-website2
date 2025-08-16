import React, { useState, useEffect } from 'react';
import { Home, User, LogOut, Globe, Sun, Moon, Menu, X, LogIn, Settings, Volume2, VolumeX } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useLanguage, Language } from '../hooks/useLanguage';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount?: () => void;
  onOpenHelp: () => void;
  onOpenLogin?: () => void;
  onSignOut?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onOpenAccount = () => {},
  onOpenLogin = () => {},
  onSignOut,
  isDarkMode,
  onToggleDarkMode
}) => {
  const { user, signOut, loading } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Music control state
  const [isMusicMuted, setIsMusicMuted] = useState(() => {
    const savedMuted = localStorage.getItem('backgroundMusicMuted');
    return savedMuted ? JSON.parse(savedMuted) : false;
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [showMusicVolumeSlider, setShowMusicVolumeSlider] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.04);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const getLanguageFlag = (lang: Language) => {
    switch (lang) {
      case 'ar': return '/6211558.png';
      case 'tr': return '/pngtree-turkey-flag-icon-template-picture-image_8141270.png';
      case 'en': return '/pngtree-united-kingdom-flag-icon-template-png-image_5098880.png';
      default: return '/6211558.png';
    }
  };

  const getLanguageName = (lang: Language) => {
    switch (lang) {
      case 'ar': return 'العربية';
      case 'tr': return 'Türkçe';
      case 'en': return 'English';
      default: return 'العربية';
    }
  };

  const getLogoPath = (lang: Language) => {
    const path = (() => {
      switch (lang) {
        case 'ar': return '/logo-text.png';
        case 'tr': return '/logo-text-en.png';
        case 'en': return '/logo-text-en.png';
        default: return '/logo-text.png';
      }
    })();
    console.log(`Logo path for language ${lang}:`, path);
    // Add timestamp to avoid cache issues
    return `${path}?v=${Date.now()}`;
  };

  const getLogoAlt = (lang: Language) => {
    switch (lang) {
      case 'ar': return 'مجموعة تواصل';
      case 'tr': return 'Tevasul Group';
      case 'en': return 'Tevasul Group';
      default: return 'مجموعة تواصل';
    }
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Music control functions
  const toggleMusicMute = () => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

    if (isMusicMuted) {
      audio.muted = false;
      setIsMusicMuted(false);
      localStorage.setItem('backgroundMusicMuted', 'false');
    } else {
      audio.muted = true;
      setIsMusicMuted(true);
      localStorage.setItem('backgroundMusicMuted', 'true');
    }
  };

  const handleMusicClick = () => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

    if (!isMusicPlaying) {
      audio.play().catch(console.error);
    } else {
      toggleMusicMute();
    }
  };

  const handleMusicVolumeChange = (newVolume: number) => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

    setMusicVolume(newVolume);
    audio.volume = newVolume;
    
    // Unmute if volume is increased
    if (isMusicMuted && newVolume > 0) {
      setIsMusicMuted(false);
      audio.muted = false;
      localStorage.setItem('backgroundMusicMuted', 'false');
    }
  };

  // Listen for audio state changes
  useEffect(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

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
  }, []);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] navbar-glass ${isScrolled ? 'scrolled' : ''} rounded-2xl px-12 py-3 hidden md:block`}>
        <div className="flex items-center justify-center space-x-10">
          {/* Logo and Home */}
          <div className="flex items-center">
            <button
              onClick={() => {
                console.log('🖱️ تم النقر على اللوجو في النافبار');
                // Navigate to home page with hash
                onNavigateHome();
                // Set hash to trigger scroll
                setTimeout(() => {
                  console.log('🔗 تعيين hash للانتقال إلى hero...');
                  window.location.hash = 'hero';
                  // Additional scroll after hash
                  setTimeout(() => {
                    const heroSection = document.getElementById('hero');
                    if (heroSection) {
                      console.log('✅ تم العثور على hero، الانتقال إليه...');
                      heroSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      console.log('⚠️ لم يتم العثور على hero، الانتقال إلى أعلى الصفحة...');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }, 100);
                }, 300);
              }}
              className={`flex items-center ${language === 'ar' ? 'space-x-3 space-x-reverse' : 'space-x-3'} hover:opacity-80 transition-opacity duration-300`}
            >
              <img 
                key={language}
                src={getLogoPath(language)} 
                alt={getLogoAlt(language)} 
                className="h-10 object-contain brightness-0 invert dark:brightness-100 dark:invert-0"
              />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Home Button */}
            <button
              onClick={() => {
                console.log('🏠 تم النقر على زر الرئيسية في النافبار');
                onNavigateHome();
                setTimeout(() => {
                  window.location.hash = 'hero';
                  setTimeout(() => {
                    const heroSection = document.getElementById('hero');
                    if (heroSection) {
                      heroSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }, 100);
                }, 300);
              }}
              className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
            >
              <span className="text-sm">{language === 'ar' ? 'الرئيسية' : language === 'tr' ? 'Ana Sayfa' : 'Home'}</span>
            </button>

            {/* Services Button */}
            <button
              onClick={() => {
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                  servicesSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
            >
              <span className="text-sm">{language === 'ar' ? 'خدماتنا' : language === 'tr' ? 'Hizmetlerimiz' : 'Services'}</span>
            </button>

            {/* About Button */}
            <button
              onClick={() => {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                  aboutSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
            >
              <span className="text-sm">{language === 'ar' ? 'من نحن' : language === 'tr' ? 'Hakkımızda' : 'About'}</span>
            </button>

            {/* Contact Button */}
            <button
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
            >
              <span className="text-sm">{language === 'ar' ? 'تواصل معنا' : language === 'tr' ? 'İletişim' : 'Contact'}</span>
            </button>

            {/* Professional Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              <Sun className="icon sun-icon w-4 h-4" />
              <Moon className="icon moon-icon w-4 h-4" />
            </button>

            {/* Music Control Button */}
            <div className="relative group">
              <button
                onClick={handleMusicClick}
                onMouseEnter={() => setShowMusicVolumeSlider(true)}
                onMouseLeave={() => setShowMusicVolumeSlider(false)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-110
                  ${isMusicMuted || !isMusicPlaying 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }
                  ${isMusicPlaying && !isMusicMuted ? 'animate-pulse' : ''}
                `}
                title={isMusicMuted ? 'تشغيل الموسيقى' : 'إيقاف الموسيقى'}
              >
                {isMusicMuted || !isMusicPlaying ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              
              {/* Music indicator */}
              {isMusicPlaying && !isMusicMuted && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
              )}
              
              {/* Volume Slider */}
              {showMusicVolumeSlider && (
                <div 
                  className="absolute top-12 right-0 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-xl"
                  onMouseEnter={() => setShowMusicVolumeSlider(true)}
                  onMouseLeave={() => setShowMusicVolumeSlider(false)}
                >
                  <div className="text-blue-300 text-xs mb-3 text-center font-medium">
                    {Math.round(musicVolume * 100)}%
                  </div>
                  <div className="flex flex-col items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={musicVolume}
                      onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                      className="w-16 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer border border-white/30 hover:bg-white/30 transition-colors"
                    />
                    <div className="text-blue-300/80 text-xs mt-2 font-medium">صوت</div>
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative group">
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-110"
                title="تغيير اللغة"
              >
                <img 
                  src={getLanguageFlag(language)} 
                  alt={`${getLanguageName(language)} flag`}
                  className="w-8 h-8 rounded-full flag-shadow flag-gloss object-cover"
                />
              </button>
              
              {/* Language Dropdown */}
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-[140px]">
                {(['ar', 'tr', 'en'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
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

            {/* User Menu */}
            {!user && !loading ? (
              /* Login Button for Guests */
              <button
                onClick={() => {
                  console.log('زر تسجيل الدخول تم النقر عليه');
                  onOpenLogin();
                }}
                className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
                title={language === 'ar' ? 'تسجيل الدخول' : language === 'tr' ? 'Giriş Yap' : 'Login'}
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="text-sm">{language === 'ar' ? 'تسجيل الدخول' : language === 'tr' ? 'Giriş Yap' : 'Login'}</span>
              </button>
            ) : (
              /* User Menu for Logged In Users */
              <div className="flex items-center space-x-4">
                {/* My Account Button */}
                <button
                  onClick={() => {
                    console.log('زر حسابي تم النقر عليه');
                    if (onOpenAccount) {
                      onOpenAccount();
                    }
                  }}
                  className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
                  title={language === 'ar' ? 'حسابي' : language === 'tr' ? 'Hesabım' : 'My Account'}
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">{language === 'ar' ? 'حسابي' : language === 'tr' ? 'Hesabım' : 'My Account'}</span>
                </button>

                {/* Dashboard Button */}
                <button
                  onClick={() => {
                    console.log('زر لوحة التحكم تم النقر عليه');
                    // يمكن إضافة منطق الانتقال للوحة التحكم هنا
                    window.location.href = '/admin';
                  }}
                  className="flex items-center px-4 py-2 text-white hover:text-caribbean-300 transition-all duration-300 font-medium"
                  title={language === 'ar' ? 'لوحة التحكم' : language === 'tr' ? 'Kontrol Paneli' : 'Dashboard'}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm">{language === 'ar' ? 'لوحة التحكم' : language === 'tr' ? 'Kontrol Paneli' : 'Dashboard'}</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={async () => {
                    console.log('🚪 زر تسجيل الخروج تم النقر عليه');
                    if (onSignOut) {
                      onSignOut();
                    } else {
                      try {
                        await signOut();
                        console.log('✅ تم تسجيل الخروج بنجاح');
                      } catch (error) {
                        console.error('❌ خطأ في تسجيل الخروج:', error);
                      }
                    }
                  }}
                  className="flex items-center px-4 py-2 text-white hover:text-red-300 transition-all duration-300 font-medium"
                  title={language === 'ar' ? 'تسجيل الخروج' : language === 'tr' ? 'Çıkış Yap' : 'Logout'}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="text-sm">{language === 'ar' ? 'تسجيل الخروج' : language === 'tr' ? 'Çıkış Yap' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className={`fixed top-4 left-4 right-4 z-[9999] navbar-glass ${isScrolled ? 'scrolled' : ''} rounded-2xl px-4 py-3 md:hidden`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => {
              console.log('🖱️ تم النقر على اللوجو في النافبار');
              onNavigateHome();
              setTimeout(() => {
                window.location.hash = 'hero';
                setTimeout(() => {
                  const heroSection = document.getElementById('hero');
                  if (heroSection) {
                    heroSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }, 100);
              }, 300);
            }}
            className="flex items-center hover:opacity-80 transition-opacity duration-300"
          >
            <img 
              key={language}
              src={getLogoPath(language)} 
              alt={getLogoAlt(language)} 
              className="h-8 object-contain brightness-0 invert dark:brightness-100 dark:invert-0"
            />
          </button>

          {/* User Actions - Icons Only */}
          <div className="flex items-center space-x-3">
            {/* Login/Account Icon */}
            {!user && !loading ? (
              <button
                onClick={() => {
                  console.log('زر تسجيل الدخول تم النقر عليه');
                  onOpenLogin();
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                title={language === 'ar' ? 'تسجيل الدخول' : language === 'tr' ? 'Giriş Yap' : 'Login'}
              >
                <LogIn className="w-5 h-5 text-white" />
              </button>
            ) : (
              <>
                {/* My Account Icon */}
                <button
                  onClick={() => {
                    console.log('زر حسابي تم النقر عليه');
                    if (onOpenAccount) {
                      onOpenAccount();
                    }
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                  title={language === 'ar' ? 'حسابي' : language === 'tr' ? 'Hesabım' : 'My Account'}
                >
                  <User className="w-5 h-5 text-white" />
                </button>

                {/* Dashboard Icon */}
                <button
                  onClick={() => {
                    console.log('زر لوحة التحكم تم النقر عليه');
                    window.location.href = '/admin';
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                  title={language === 'ar' ? 'لوحة التحكم' : language === 'tr' ? 'Kontrol Paneli' : 'Dashboard'}
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>

                {/* Logout Icon */}
                <button
                  onClick={async () => {
                    console.log('🚪 زر تسجيل الخروج تم النقر عليه');
                    if (onSignOut) {
                      onSignOut();
                    } else {
                      try {
                        await signOut();
                        console.log('✅ تم تسجيل الخروج بنجاح');
                      } catch (error) {
                        console.error('❌ خطأ في تسجيل الخروج:', error);
                      }
                    }
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-red-500/20 transition-all duration-300"
                  title={language === 'ar' ? 'تسجيل الخروج' : language === 'tr' ? 'Çıkış Yap' : 'Logout'}
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hamburger-button flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-4 space-y-2">
              {/* Navigation Links */}
              <div className="space-y-1">
                {/* Home */}
                <button
                  onClick={() => {
                    handleMobileMenuClose();
                    onNavigateHome();
                    setTimeout(() => {
                      window.location.hash = 'hero';
                      setTimeout(() => {
                        const heroSection = document.getElementById('hero');
                        if (heroSection) {
                          heroSection.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }, 100);
                    }, 300);
                  }}
                  className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <Home className="w-5 h-5 mr-3" />
                  <span className="font-medium">{language === 'ar' ? 'الرئيسية' : language === 'tr' ? 'Ana Sayfa' : 'Home'}</span>
                </button>

                {/* Services */}
                <button
                  onClick={() => {
                    handleMobileMenuClose();
                    const servicesSection = document.getElementById('services');
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                  <span className="font-medium">{language === 'ar' ? 'خدماتنا' : language === 'tr' ? 'Hizmetlerimiz' : 'Services'}</span>
                </button>

                {/* About */}
                <button
                  onClick={() => {
                    handleMobileMenuClose();
                    const aboutSection = document.getElementById('about');
                    if (aboutSection) {
                      aboutSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{language === 'ar' ? 'من نحن' : language === 'tr' ? 'Hakkımızda' : 'About'}</span>
                </button>

                {/* Contact */}
                <button
                  onClick={() => {
                    handleMobileMenuClose();
                    const contactSection = document.getElementById('contact');
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{language === 'ar' ? 'تواصل معنا' : language === 'tr' ? 'İletişim' : 'Contact'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/20 my-3"></div>

              {/* User Actions */}
              <div className="space-y-1">
                {/* Theme Toggle */}
                <button
                  onClick={onToggleDarkMode}
                  className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 mr-3" />
                  ) : (
                    <Moon className="w-5 h-5 mr-3" />
                  )}
                  <span className="font-medium">
                    {isDarkMode 
                      ? (language === 'ar' ? 'الوضع النهاري' : language === 'tr' ? 'Gündüz Modu' : 'Light Mode')
                      : (language === 'ar' ? 'الوضع الليلي' : language === 'tr' ? 'Gece Modu' : 'Dark Mode')
                    }
                  </span>
                </button>

                {/* Music Control */}
                <button
                  onClick={handleMusicClick}
                  className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  {isMusicMuted || !isMusicPlaying ? (
                    <VolumeX className="w-5 h-5 mr-3" />
                  ) : (
                    <Volume2 className="w-5 h-5 mr-3" />
                  )}
                  <span className="font-medium">
                    {isMusicMuted || !isMusicPlaying 
                      ? (language === 'ar' ? 'تشغيل الموسيقى' : language === 'tr' ? 'Müziği Aç' : 'Play Music')
                      : (language === 'ar' ? 'إيقاف الموسيقى' : language === 'tr' ? 'Müziği Kapat' : 'Stop Music')
                    }
                  </span>
                  {isMusicPlaying && !isMusicMuted && (
                    <div className="ml-auto w-3 h-3 bg-blue-400 rounded-full animate-ping" />
                  )}
                </button>

                {/* Language Selector */}
                <div className="px-4 py-3">
                  <div className="flex items-center mb-2">
                    <Globe className="w-5 h-5 mr-3 text-white" />
                    <span className="font-medium text-white">
                      {language === 'ar' ? 'اللغة' : language === 'tr' ? 'Dil' : 'Language'}
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    {(['ar', 'tr', 'en'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`transition-all duration-200 ${
                          language === lang 
                            ? 'ring-2 ring-caribbean-400 ring-offset-2 ring-offset-transparent' 
                            : 'hover:ring-2 hover:ring-caribbean-200 hover:ring-offset-2 hover:ring-offset-transparent'
                        }`}
                      >
                        <img 
                          src={getLanguageFlag(lang)} 
                          alt={`${getLanguageName(lang)} flag`}
                          className="w-8 h-8 rounded-full object-cover shadow-lg"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Account Actions */}
                <div className="border-t border-white/20 my-3"></div>
                
                {/* Login/Account Actions */}
                {!user && !loading ? (
                  <button
                    onClick={() => {
                      handleMobileMenuClose();
                      console.log('زر تسجيل الدخول تم النقر عليه');
                      onOpenLogin();
                    }}
                    className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <LogIn className="w-5 h-5 mr-3" />
                    <span className="font-medium">{language === 'ar' ? 'تسجيل الدخول' : language === 'tr' ? 'Giriş Yap' : 'Login'}</span>
                  </button>
                ) : (
                  <>
                    {/* My Account */}
                    <button
                      onClick={() => {
                        handleMobileMenuClose();
                        if (onOpenAccount) {
                          onOpenAccount();
                        }
                      }}
                      className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <User className="w-5 h-5 mr-3" />
                      <span className="font-medium">{language === 'ar' ? 'حسابي' : language === 'tr' ? 'Hesabım' : 'My Account'}</span>
                    </button>

                    {/* Dashboard */}
                    <button
                      onClick={() => {
                        handleMobileMenuClose();
                        window.location.href = '/admin';
                      }}
                      className="w-full flex items-center px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      <span className="font-medium">{language === 'ar' ? 'لوحة التحكم' : language === 'tr' ? 'Kontrol Paneli' : 'Dashboard'}</span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={async () => {
                        handleMobileMenuClose();
                        console.log('🚪 زر تسجيل الخروج تم النقر عليه');
                        if (onSignOut) {
                          onSignOut();
                        } else {
                          try {
                            await signOut();
                            console.log('✅ تم تسجيل الخروج بنجاح');
                          } catch (error) {
                            console.error('❌ خطأ في تسجيل الخروج:', error);
                          }
                        }
                      }}
                      className="w-full flex items-center px-4 py-3 text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span className="font-medium">{language === 'ar' ? 'تسجيل الخروج' : language === 'tr' ? 'Çıkış Yap' : 'Logout'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
