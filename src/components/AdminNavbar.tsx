import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Sun,
  Moon,
  Home,
  Shield,
  DollarSign, 
  Euro, 
  Clock, 
  Calendar,
  TrendingUp,
  RefreshCw,
  Globe,
  Activity
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import SimpleThemeToggle from './SimpleThemeToggle';
import { startExchangeRateUpdates } from '../services/exchangeRateService';

interface ExchangeRates {
  USD: number;
  EUR: number;
}

interface AdminNavbarProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut?: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onBack,
  isDarkMode,
  onToggleDarkMode,
  onSignOut
}) => {
  const { user, profile, signOut } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 0,
    EUR: 0
  });
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تحديث رسالة التحية حسب الوقت
  useEffect(() => {
    const hour = currentTime.getHours();
    let newGreeting = '';
    
    if (hour >= 5 && hour < 12) {
      newGreeting = 'صباح الخير';
    } else if (hour >= 12 && hour < 17) {
      newGreeting = 'مساء الخير';
    } else if (hour >= 17 && hour < 22) {
      newGreeting = 'مساء الخير';
    } else {
      newGreeting = 'ليلة سعيدة';
    }
    
    setGreeting(newGreeting);
  }, [currentTime]);

  // تحديث شريط التحميل كل 5 ثواني
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / 5);
      });
    }, 1000);

    return () => clearInterval(progressTimer);
  }, []);

  // إعادة تعيين شريط التحميل عند تحديث الأسعار
  useEffect(() => {
    if (!isLoadingRates) {
      setUpdateProgress(0);
    }
  }, [isLoadingRates]);

  // إعادة تشغيل شريط التحميل كل 5 ثواني
  useEffect(() => {
    const restartTimer = setInterval(() => {
      setUpdateProgress(0);
    }, 5000);

    return () => clearInterval(restartTimer);
  }, []);

  // جلب أسعار الصرف من الخدمة
  useEffect(() => {
    setIsLoadingRates(true);
    const cleanup = startExchangeRateUpdates(
      (rates) => {
        setExchangeRates(rates);
        setIsLoadingRates(false);
        setUpdateProgress(0);
        setLastUpdateTime(new Date());
      },
      (isLoading) => {
        setIsLoadingRates(isLoading);
      },
      5
    );

    return cleanup;
  }, []);

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await signOut();
        navigate('/');
      } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
      }
    }
  };

  // تنسيق التاريخ الميلادي
  const formatGregorianDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // تنسيق التاريخ الهجري
  const formatHijriDate = (date: Date) => {
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
    
    return hijriDate;
  };

  // تنسيق الوقت
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-50/80 via-blue-50/60 to-indigo-50/40 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 shadow-2xl border-b border-white/20 dark:border-white/10 backdrop-blur-md">
      {/* Enhanced Glass Morphism Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-200/15 to-indigo-200/10 backdrop-blur-sm rounded-full animate-pulse border border-white/10" style={{ animationDuration: '8s' }}></div>
        <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-tr from-indigo-200/12 to-purple-200/8 backdrop-blur-sm rounded-full animate-pulse border border-white/8" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-r from-sky-200/8 to-blue-200/6 backdrop-blur-sm rounded-full animate-pulse border border-white/5" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-gradient-to-l from-purple-200/6 to-pink-200/4 backdrop-blur-sm rounded-full animate-pulse border border-white/5" style={{ animationDelay: '1s', animationDuration: '9s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop Layout - Unified Bar */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Left side - Home button and Time */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Home Button */}
            <button
              onClick={onBack}
              className="group flex items-center px-3 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 border border-white/30 dark:border-white/20"
            >
              <Home className="w-4 h-4 ml-2 group-hover:animate-pulse text-blue-500" />
              <span className="text-sm font-semibold">{t('nav.home')}</span>
            </button>

            {/* Time Display - Compact */}
            <div className="flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          {/* Center - Title and Greeting */}
          <div className="flex-1 text-center">
            <div className="flex flex-col items-center">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                لوحة تحكم الأدمن
              </h1>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {greeting} أدمن
                </p>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right side - Exchange Rates, Dates, User Info, and Controls */}
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Exchange Rates - Compact */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isLoadingRates && (
                  <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                )}
              </div>
              
              <div className={`group relative flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 hover:shadow-lg transition-all duration-500 shadow-md transform hover:scale-105 ${isLoadingRates ? 'ring-2 ring-emerald-200 dark:ring-emerald-800' : ''} overflow-hidden`}>
                <DollarSign className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isLoadingRates ? 'animate-pulse' : 'group-hover:animate-pulse'} relative z-10`} />
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm relative z-10">
                  {isLoadingRates ? '...' : exchangeRates.USD.toFixed(2)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs relative z-10">₺</span>
              </div>
              
              <div className={`group relative flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 hover:shadow-lg transition-all duration-500 shadow-md transform hover:scale-105 ${isLoadingRates ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''} overflow-hidden`}>
                <Euro className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isLoadingRates ? 'animate-pulse' : 'group-hover:animate-pulse'} relative z-10`} />
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm relative z-10">
                  {isLoadingRates ? '...' : exchangeRates.EUR.toFixed(2)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs relative z-10">₺</span>
              </div>
            </div>

            {/* Dates - Compact */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div className="flex flex-col">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                    {formatGregorianDate(currentTime)}
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold text-xs">
                    {formatHijriDate(currentTime)}
                  </span>
                </div>
              </div>
            </div>



            {/* Dark Mode Toggle */}
            <div className="relative">
              <div className="p-1.5 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-lg border border-white/30 dark:border-white/20 shadow-lg">
                <SimpleThemeToggle
                  isDarkMode={isDarkMode}
                  onToggle={onToggleDarkMode}
                  className="relative z-10"
                />
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="group flex items-center px-3 py-2 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 backdrop-blur-md text-white transition-all duration-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 border border-red-400/30"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 ml-2 group-hover:animate-pulse" />
              <span className="text-sm font-semibold">تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden flex-col space-y-3">
          {/* Top Row - Title and Main Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="group flex items-center px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-500 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/30 dark:border-white/20"
            >
              <Home className="w-4 h-4 ml-2 group-hover:animate-pulse text-blue-500" />
              <span className="text-sm font-semibold">{t('nav.home')}</span>
            </button>

            <div className="flex flex-col items-center">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                لوحة تحكم الأدمن
              </h1>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {greeting} أدمن
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-1.5 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-lg border border-white/30 dark:border-white/20 shadow-lg">
                <SimpleThemeToggle
                  isDarkMode={isDarkMode}
                  onToggle={onToggleDarkMode}
                  className="relative z-10"
                />
              </div>

              <button
                onClick={handleSignOut}
                className="group flex items-center px-4 py-2 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 backdrop-blur-md text-white transition-all duration-500 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 border border-red-400/30"
              >
                <LogOut className="w-4 h-4 ml-2 group-hover:animate-pulse" />
                <span className="text-sm font-semibold">تسجيل الخروج</span>
              </button>
            </div>
          </div>

          {/* Bottom Row - Time, Exchange Rates, Dates */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatTime(currentTime)}
              </span>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md ${isLoadingRates ? 'ring-2 ring-emerald-200 dark:ring-emerald-800' : ''}`}>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {isLoadingRates ? '...' : exchangeRates.USD.toFixed(2)}
                </span>
              </div>
              <div className={`flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md ${isLoadingRates ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}>
                <Euro className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {isLoadingRates ? '...' : exchangeRates.EUR.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {formatGregorianDate(currentTime)}
                </span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  {formatHijriDate(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col space-y-3">
          {/* Top Row - Title and Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="group flex items-center px-3 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 border border-white/30 dark:border-white/20"
            >
              <Home className="w-4 h-4 ml-1 group-hover:animate-pulse text-blue-500" />
              <span className="text-xs font-semibold">{t('nav.home')}</span>
            </button>

            <div className="flex flex-col items-center">
              <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                لوحة تحكم الأدمن
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {greeting} أدمن
              </p>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-1 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-lg border border-white/30 dark:border-white/20 shadow-md">
                <SimpleThemeToggle
                  isDarkMode={isDarkMode}
                  onToggle={onToggleDarkMode}
                  className="relative z-10"
                />
              </div>

              <button
                onClick={handleSignOut}
                className="group flex items-center px-3 py-2 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 backdrop-blur-md text-white transition-all duration-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 border border-red-400/30"
              >
                <LogOut className="w-4 h-4 group-hover:animate-pulse" />
              </button>
            </div>
          </div>

          {/* Bottom Row - Time and Exchange Rates */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/30 dark:border-white/20 shadow-md">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatTime(currentTime)}
              </span>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`flex items-center space-x-1 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/20 shadow-md ${isLoadingRates ? 'ring-2 ring-emerald-200 dark:ring-emerald-800' : ''}`}>
                <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  {isLoadingRates ? '...' : exchangeRates.USD.toFixed(2)}
                </span>
              </div>
              <div className={`flex items-center space-x-1 space-x-reverse bg-white/20 dark:bg-white/10 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/30 dark:border-white/20 shadow-md ${isLoadingRates ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}>
                <Euro className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                  {isLoadingRates ? '...' : exchangeRates.EUR.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
