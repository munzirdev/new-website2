import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, LogIn, UserPlus, User, Settings, ChevronDown, FileText, HelpCircle, LogOut } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';

interface SharedNavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount: () => void;
  onOpenHelp: () => void;
  onNavigateToMainHome: () => void;
  onShowAdminDashboard?: () => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
  onSignOut?: () => void;
  showWelcome?: boolean;
  setShowWelcome?: (show: boolean) => void;
  isLanguageChanging?: boolean;
  scrollY: number;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  showUserDropdown: boolean;
  setShowUserDropdown: (show: boolean) => void;
}

const SharedNavbar: React.FC<SharedNavbarProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onNavigateToContact,
  onOpenProfile,
  onOpenAccount,
  onOpenHelp,
  onNavigateToMainHome,
  onShowAdminDashboard,
  onOpenLogin,
  onOpenSignup,
  onSignOut,
  showWelcome,
  setShowWelcome,
  isLanguageChanging = false,
  scrollY,
  isMenuOpen,
  setIsMenuOpen,
  showUserDropdown,
  setShowUserDropdown
}) => {
  const { user, profile, signOut, hasNotifications, clearNotifications } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Check if user is admin or moderator based on profile role and email
  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@tevasul.group';
  const isModerator = profile?.role === 'moderator' || user?.email?.includes('moderator') || user?.email?.includes('moderator@');
  const isAdminOrModerator = isAdmin || isModerator;

  // Debug logging for admin/moderator detection
  useEffect(() => {
    if (user) {
      console.log('🔍 Admin/Moderator Detection:', {
        userEmail: user.email,
        profileRole: profile?.role,
        isAdmin,
        isModerator,
        isAdminOrModerator,
        hasProfile: !!profile
      });
    }
  }, [user, profile, isAdmin, isModerator, isAdminOrModerator]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside language dropdown
      if (!target.closest('.language-dropdown-container')) {
        setShowLanguageDropdown(false);
      }
      
      // Check if click is outside user dropdown
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    // Only add event listener if dropdowns are open
    if (showLanguageDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown, showUserDropdown, setShowUserDropdown]);

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

  // Language change effect
  const handleLanguageChange = (newLanguage: 'ar' | 'tr' | 'en') => {
    setLanguage(newLanguage);
    // Close language dropdown after language change
    setShowLanguageDropdown(false);
    // Close any open dropdowns after language change
    setShowUserDropdown(false);
  };

  // Toggle language dropdown with click outside handling
  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const handleSignOut = async () => {
    if (setShowWelcome) {
      setShowWelcome(false);
    }
    if (onSignOut) {
      onSignOut();
    } else {
      const { error } = await signOut();
      if (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
      }
    }
  };

  const handleUserAccountClick = () => {
    onOpenAccount();
    setShowUserDropdown(false);
    if (hasNotifications) {
      clearNotifications();
    }
  };

  const navigation = [
    { name: t('nav.home'), href: '/home', isSection: false },
    { name: t('nav.services'), href: '/home#services', isSection: true },
    { name: t('nav.about'), href: '/home#about', isSection: true },
    { name: t('nav.contact'), href: '/home#contact', isSection: true }
  ];

  return (
    <nav className={`fixed top-0 w-full z-[9999] transition-all duration-300 navbar-fixed bg-white/95 dark:bg-jet-800/95 backdrop-blur-md shadow-xl border-b border-platinum-300 dark:border-jet-700`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                alert('Logo clicked!'); // Simple test
                console.log('Logo clicked! Navigating to main home...');
                console.log('onNavigateToMainHome function:', onNavigateToMainHome);
                onNavigateToMainHome();
              }}
              className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition-opacity duration-300 cursor-pointer logo-button z-50 relative"
              style={{ cursor: 'pointer', zIndex: 9999, pointerEvents: 'auto' }}
            >
              <img 
                src={language === 'ar' ? '/logo-text.png' : '/logo-text-en.png'} 
                className={`h-8 md:h-10 w-auto max-w-none rounded-lg object-contain transition-all duration-300 ${isLanguageChanging ? 'language-change-logo' : ''} brightness-0 dark:brightness-100`}
                alt={language === 'ar' ? 'مجموعة تواصل' : language === 'tr' ? 'Tevasul Group' : 'Tevasul Group'}
              />
              <span className={`text-lg md:text-xl font-bold transition-colors duration-300 text-caribbean-700 dark:text-caribbean-400`}>
              
              </span>
            </a>
            
            {/* Test button */}
            <button
              onClick={() => alert('Test button clicked!')}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
              style={{ zIndex: 9999 }}
            >
              TEST
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navigation.map((item) => {
              if (item.isSection) {
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      // Navigate to home page first, then scroll to section
                      onNavigateToMainHome();
                      // Wait a bit for navigation to complete, then scroll to section
                      setTimeout(() => {
                        const sectionId = item.href.split('#')[1];
                        const section = document.getElementById(sectionId);
                        if (section) {
                          section.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }
                      }, 100);
                    }}
                    className={`relative transition-colors duration-300 group font-medium ${isLanguageChanging ? 'language-change-text' : ''} text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400`}
                  >
                    {item.name}
                    <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600`}></span>
                  </button>
                );
              } else {
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigateToMainHome()}
                    className={`relative transition-colors duration-300 group font-medium ${isLanguageChanging ? 'language-change-text' : ''} text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400`}
                  >
                    {item.name}
                    <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600`}></span>
                  </button>
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
                <div className="relative user-dropdown-container">
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
                            onOpenProfile();
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
                            onOpenHelp();
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
                {onOpenLogin && (
                  <button
                    onClick={onOpenLogin}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      scrollY > 50 
                        ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    <LogIn className="w-4 h-4 ml-2" />
                    <span className="hidden sm:inline">{t('auth.login')}</span>
                  </button>
                )}
                
                {onOpenSignup && (
                  <button
                    onClick={onOpenSignup}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      scrollY > 50 
                        ? 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 ml-2" />
                    <span className="hidden sm:inline">{t('auth.signup')}</span>
                  </button>
                )}
              </>
            )}
            
            {/* Language Selector */}
            <div className="relative language-dropdown-container">
              <button
                onClick={toggleLanguageDropdown}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  scrollY > 50 
                    ? showLanguageDropdown
                      ? 'bg-gradient-to-r from-caribbean-700 to-indigo-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                    : showLanguageDropdown
                      ? 'bg-white/40 backdrop-blur-sm text-white border border-white/50 shadow-lg'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                }`}
                title="تغيير اللغة"
              >
                <Globe className={`w-4 h-4 ml-2 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                <img 
                  src={getLanguageFlag(language)} 
                  alt={`${getLanguageName(language)} flag`}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="hidden sm:inline mr-2">{t(`language.${language === 'ar' ? 'arabic' : language === 'tr' ? 'turkish' : 'english'}`)}</span>
              </button>
              
              {/* Language Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-700 rounded-lg shadow-lg z-50 min-w-[140px] animate-in slide-in-from-top-2 duration-200">
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
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
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
              <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${
                isDarkMode 
                  ? 'left-7 bg-white shadow-xl transform scale-105' 
                  : 'left-1 bg-white shadow-lg'
              }`}>
                {isDarkMode ? (
                  <Sun className="w-3 h-3 text-yellow-400" />
                ) : (
                  <Moon className="w-3 h-3 text-gray-600" />
                )}
              </div>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2 space-x-reverse">
            {/* Mobile Language Selector */}
            <div className="relative language-dropdown-container">
              <button
                onClick={toggleLanguageDropdown}
                className={`flex items-center px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                  scrollY > 50 
                    ? showLanguageDropdown
                      ? 'bg-gradient-to-r from-caribbean-700 to-indigo-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white hover:from-caribbean-700 hover:to-indigo-700' 
                    : showLanguageDropdown
                      ? 'bg-white/40 backdrop-blur-sm text-white border border-white/50 shadow-lg'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                }`}
                title="تغيير اللغة"
              >
                <Globe className={`w-3 h-3 ml-1 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                <img 
                  src={getLanguageFlag(language)} 
                  alt={`${getLanguageName(language)} flag`}
                  className="w-4 h-4 rounded-full object-cover"
                />
              </button>
              
              {/* Mobile Language Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-700 rounded-lg shadow-lg z-50 min-w-[140px] animate-in slide-in-from-top-2 duration-200">
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
              )}
            </div>

            <button
              onClick={onNavigateToMainHome}
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
                  <Sun className="w-2 h-2 text-yellow-400" />
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
                      // Navigate to home page first, then scroll to section
                      onNavigateToMainHome();
                      // Wait a bit for navigation to complete, then scroll to section
                      setTimeout(() => {
                        const sectionId = item.href.split('#')[1];
                        const section = document.getElementById(sectionId);
                        if (section) {
                          section.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }
                      }, 100);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm ${isLanguageChanging ? 'language-change-text' : ''}`}
                  >
                    {item.name}
                  </button>
                );
              } else {
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      onNavigateToMainHome();
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm ${isLanguageChanging ? 'language-change-text' : ''}`}
                  >
                    {item.name}
                  </button>
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flag-shadow flag-gloss transition-all duration-200 ${
                        language === lang 
                          ? 'ring-2 ring-caribbean-400 ring-offset-1 ring-offset-white dark:ring-offset-jet-700' 
                          : 'bg-white dark:bg-jet-600 hover:ring-2 hover:ring-caribbean-200 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-jet-700'
                      }`}
                      title={t(`language.${lang === 'ar' ? 'arabic' : lang === 'tr' ? 'turkish' : 'english'}`)}
                    >
                      {getLanguageFlag(lang)}
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
                      onOpenProfile();
                      setIsMenuOpen(false);
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                  >
                    {t('user.profile')}
                  </button>
                  <button
                    onClick={() => {
                      onOpenHelp();
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
                  {onOpenLogin && (
                    <button
                      onClick={() => {
                        onOpenLogin();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 text-jet-800 dark:text-platinum-200 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-md transition-colors duration-300 text-sm"
                    >
                      <LogIn className="w-4 h-4 ml-2" />
                      {t('auth.login')}
                    </button>
                  )}
                  {onOpenSignup && (
                    <button
                      onClick={() => {
                        onOpenSignup();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white rounded-md hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 text-sm"
                    >
                      <UserPlus className="w-4 h-4 ml-2" />
                      {t('auth.signup')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SharedNavbar;
