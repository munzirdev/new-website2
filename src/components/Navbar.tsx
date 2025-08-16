import React from 'react';
import { Home, User, LogOut, Globe, Lock } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useLanguage, Language } from '../hooks/useLanguage';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount?: () => void;
  onOpenHelp: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateToContact,
  onOpenProfile,
  onOpenAccount = () => {},
  onOpenHelp,
  isDarkMode,
  onToggleDarkMode
}) => {
  const { user, profile, signOut, hasNotifications, clearNotifications, loading } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();



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

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-white/95 dark:bg-jet-800/95 backdrop-blur-md border-b border-platinum-200 dark:border-jet-700 shadow-sm navbar-fixed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Home */}
          <div className="flex items-center">
            <button
              onClick={onNavigateHome}
              className={`flex items-center ${language === 'ar' ? 'space-x-3 space-x-reverse' : 'space-x-3'} hover:opacity-80 transition-opacity duration-300`}
            >
              <img 
                key={language}
                src={getLogoPath(language)} 
                alt={getLogoAlt(language)} 
                className="h-10 object-contain brightness-0 dark:brightness-100"
              />
            </button>
          </div>

          {/* Navigation Links */}
          <div className={`flex items-center ${language === 'ar' ? 'space-x-4 space-x-reverse' : 'space-x-4'}`}>
            {/* Home Button */}
            <button
              onClick={onNavigateHome}
              className={`flex items-center px-3 py-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300`}
              title={t('navbar.home')}
            >
              <Home className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
              <span className="hidden sm:inline">{t('navbar.home')}</span>
            </button>

            {/* Language Selector */}
            <div className="relative group">
              <button
                className="flex items-center px-3 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-all duration-300"
                title="تغيير اللغة"
              >
                <Globe className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                <img 
                  src={getLanguageFlag(language)} 
                  alt={`${getLanguageName(language)} flag`}
                  className="hidden sm:inline w-6 h-6 rounded-full flag-shadow flag-gloss object-cover"
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
            {user && !loading ? (
              <div className={`flex items-center ${language === 'ar' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                {/* Account Button */}
                <button
                  onClick={() => {
                    console.log('زر حسابي تم النقر عليه في النافبار');
                    console.log('onOpenAccount function:', onOpenAccount);
                    if (onOpenAccount) {
                      onOpenAccount();
                    } else {
                      console.error('onOpenAccount function is not defined');
                    }
                  }}
                  className={`relative flex items-center px-3 py-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300`}
                  title={t('navbar.account')}
                >
                  <User className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                  <span className="hidden sm:inline">{t('navbar.account')}</span>
                  {hasNotifications && (
                    <div className={`absolute -top-1 ${language === 'ar' ? '-right-1' : '-left-1'} w-3 h-3 bg-red-500 rounded-full animate-pulse`}></div>
                  )}
                </button>



                {/* User Info */}
                <div className="hidden md:flex items-center px-3 py-2 bg-caribbean-50 dark:bg-caribbean-900/20 rounded-lg">
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium text-jet-800 dark:text-white">
                      {profile?.full_name || 'المستخدم'}
                    </p>
                    <p className="text-xs text-jet-600 dark:text-platinum-400">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {/* Change Password */}
                <button
                  onClick={() => window.location.href = '/reset-password'}
                  className={`flex items-center px-3 py-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300`}
                  title="تغيير كلمة المرور"
                >
                  <Lock className="w-5 h-5" />
                </button>

                {/* Logout */}
                <button
                  onClick={async () => {
                    console.log('🚪 زر تسجيل الخروج تم النقر عليه');
                    try {
                      const result = await signOut();
                      console.log('📊 نتيجة تسجيل الخروج:', result);
                    } catch (error) {
                      console.error('❌ خطأ في تسجيل الخروج:', error);
                    }
                  }}
                  className={`flex items-center px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300`}
                  title={t('navbar.logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={onToggleDarkMode}
                  className="p-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300"
                  title={isDarkMode ? t('navbar.lightMode') : t('navbar.darkMode')}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
            ) : !loading ? (
              <div className={`flex items-center ${language === 'ar' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                {/* Login Button for non-authenticated users */}
                <button
                  onClick={() => {
                    console.log('زر تسجيل الدخول تم النقر عليه');
                    // يمكن إضافة منطق فتح نموذج تسجيل الدخول هنا
                    window.dispatchEvent(new CustomEvent('openLogin'));
                  }}
                  className={`flex items-center px-3 py-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300`}
                  title="تسجيل الدخول"
                >
                  <User className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                  <span className="hidden sm:inline">تسجيل الدخول</span>
                </button>

                {/* Dark Mode Toggle for non-authenticated users */}
                <button
                  onClick={onToggleDarkMode}
                  className="p-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300"
                  title={isDarkMode ? t('navbar.lightMode') : t('navbar.darkMode')}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
            ) : (
              // Loading state - show a subtle loading indicator
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-caribbean-200 border-t-caribbean-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
