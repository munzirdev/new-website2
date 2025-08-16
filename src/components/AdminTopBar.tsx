import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Euro, 
  Clock, 
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { startExchangeRateUpdates } from '../services/exchangeRateService';

interface ExchangeRates {
  USD: number;
  EUR: number;
}

const AdminTopBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
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

  // تحديث شريط التحميل كل 5 ثواني
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / 5); // تقسيم 100 على 5 ثواني
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
        setUpdateProgress(0); // إعادة تعيين شريط التحميل
        setLastUpdateTime(new Date()); // تحديث وقت آخر تحديث
      },
      (isLoading) => {
        setIsLoadingRates(isLoading);
      },
      5 // تحديث كل 5 ثواني
    );

    return cleanup;
  }, []);

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
    <div className="bg-gradient-to-r from-sky-50 via-blue-50/30 to-cyan-50/40 dark:from-jet-900 dark:via-jet-800 dark:to-jet-900 shadow-sm border-b border-sky-200 dark:border-jet-700">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-sky-200/15 to-transparent rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-tr from-blue-200/12 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-r from-cyan-200/8 to-sky-200/8 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between text-sm">
          {/* Left side - Exchange Rates */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="relative">
                <TrendingUp className="w-4 h-4 text-caribbean-600 dark:text-caribbean-400" />
                {isLoadingRates && (
                  <RefreshCw className="absolute -top-1 -right-1 w-2 h-2 text-green-500 animate-spin" />
                )}
              </div>
              <span className="text-jet-600 dark:text-platinum-400 font-medium">أسعار الصرف:</span>
              <span className="text-xs text-jet-500 dark:text-platinum-500">
                (آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-SA', { hour12: false, hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
            
                         <div className="flex items-center space-x-3 space-x-reverse">
               <div className={`group relative flex items-center space-x-1 space-x-reverse bg-white/90 dark:bg-jet-700/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-sky-200 dark:border-jet-600 hover:bg-white dark:hover:bg-jet-600 hover:shadow-lg transition-all duration-300 shadow-sm transform hover:scale-105 ${isLoadingRates ? 'ring-2 ring-green-200 dark:ring-green-800' : ''} overflow-hidden`}>
                 {/* شريط التحميل الشفاف داخل الزر */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/30 dark:via-green-600/30 to-transparent transform -skew-x-12 transition-all duration-1000 ease-out" 
                      style={{ 
                        left: `${updateProgress - 50}%`,
                        width: '100%'
                      }}></div>
                 
                 <DollarSign className={`w-3 h-3 text-green-600 dark:text-green-400 ${isLoadingRates ? 'animate-pulse' : 'group-hover:animate-pulse'} relative z-10`} />
                 <span className="font-mono font-medium text-green-600 dark:text-green-400 relative z-10">
                   {isLoadingRates ? '...' : exchangeRates.USD.toFixed(2)}
                 </span>
                 <span className="text-jet-500 dark:text-platinum-500 text-xs relative z-10">₺/USD</span>
                 
                 {/* مؤشر التحديث */}
                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75 z-20"></div>
                 
                 {/* تأثير التحميل */}
                 {isLoadingRates && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/20 dark:via-green-800/20 to-transparent animate-pulse rounded-lg"></div>
                 )}
               </div>
              
                                            <div className={`group relative flex items-center space-x-1 space-x-reverse bg-white/90 dark:bg-jet-700/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-sky-200 dark:border-jet-600 hover:bg-white dark:hover:bg-jet-600 hover:shadow-lg transition-all duration-300 shadow-sm transform hover:scale-105 ${isLoadingRates ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''} overflow-hidden`}>
                 {/* شريط التحميل الشفاف داخل الزر */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/30 dark:via-blue-600/30 to-transparent transform -skew-x-12 transition-all duration-1000 ease-out" 
                      style={{ 
                        left: `${updateProgress - 50}%`,
                        width: '100%'
                      }}></div>
                 
                 <Euro className={`w-3 h-3 text-blue-600 dark:text-blue-400 ${isLoadingRates ? 'animate-pulse' : 'group-hover:animate-pulse'} relative z-10`} />
                 <span className="font-mono font-medium text-blue-600 dark:text-blue-400 relative z-10">
                   {isLoadingRates ? '...' : exchangeRates.EUR.toFixed(2)}
                 </span>
                 <span className="text-jet-500 dark:text-platinum-500 text-xs relative z-10">₺/EUR</span>
                 
                 {/* مؤشر التحديث */}
                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75 z-20"></div>
                 
                 {/* تأثير التحميل */}
                 {isLoadingRates && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 dark:via-blue-800/20 to-transparent animate-pulse rounded-lg"></div>
                 )}
               </div>
            </div>
          </div>

          {/* Center - Time */}
          <div className="group flex items-center space-x-2 space-x-reverse bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-sky-200 dark:border-jet-600 hover:shadow-md transition-all duration-200 shadow-sm transform hover:scale-105">
            <Clock className="w-4 h-4 text-caribbean-600 dark:text-caribbean-400 group-hover:animate-pulse" />
            <span className="font-mono font-bold text-caribbean-600 dark:text-caribbean-400 text-lg">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Right side - Dates */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="group flex items-center space-x-2 space-x-reverse bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-sky-200 dark:border-jet-600 hover:bg-white dark:hover:bg-jet-600 hover:shadow-md transition-all duration-200 shadow-sm transform hover:scale-105">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:animate-pulse" />
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                {formatGregorianDate(currentTime)}
              </span>
            </div>
            
            <div className="group flex items-center space-x-2 space-x-reverse bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-sky-200 dark:border-jet-600 hover:bg-white dark:hover:bg-jet-600 hover:shadow-md transition-all duration-200 shadow-sm transform hover:scale-105">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:animate-pulse" />
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {formatHijriDate(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col space-y-3">
          {/* Time - Mobile */}
          <div className="group flex items-center justify-center space-x-2 space-x-reverse bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-sky-200 dark:border-jet-600 hover:shadow-md transition-all duration-200 shadow-sm transform hover:scale-105">
            <Clock className="w-4 h-4 text-caribbean-600 dark:text-caribbean-400 group-hover:animate-pulse" />
            <span className="font-mono font-bold text-caribbean-600 dark:text-caribbean-400 text-lg">
              {formatTime(currentTime)}
            </span>
          </div>
          
          {/* Exchange Rates and Dates - Mobile */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
                             <div className={`group relative flex items-center space-x-1 space-x-reverse bg-white/90 dark:bg-jet-700/90 backdrop-blur-sm px-2 py-1 rounded border border-sky-200 dark:border-jet-600 hover:shadow-md transition-all duration-200 shadow-sm transform hover:scale-105 ${isLoadingRates ? 'ring-1 ring-green-200 dark:ring-green-800' : ''} overflow-hidden`}>
                 {/* شريط التحميل الشفاف داخل الزر للموبايل */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/30 dark:via-green-600/30 to-transparent transform -skew-x-12 transition-all duration-1000 ease-out" 
                      style={{ 
                        left: `${updateProgress - 50}%`,
                        width: '100%'
                      }}></div>
                 
                 <DollarSign className={`w-3 h-3 text-green-600 dark:text-green-400 ${isLoadingRates ? 'animate-pulse' : 'group-hover:animate-pulse'} relative z-10`} />
                 <span className="font-mono font-medium text-green-600 dark:text-green-400 relative z-10">
                   {isLoadingRates ? '...' : exchangeRates.USD.toFixed(2)}
                 </span>
                 <span className="text-jet-500 dark:text-platinum-500 text-xs relative z-10">₺</span>
                 
                 {/* مؤشر التحديث للموبايل */}
                 <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-75 z-20"></div>
                 
                 {/* تأثير التحميل للموبايل */}
                 {isLoadingRates && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/20 dark:via-green-800/20 to-transparent animate-pulse rounded"></div>
                 )}
               </div>
                             <div className={`group relative flex items-center space-x-1 space-x-reverse bg-white/90 dark:bg-jet-700/90 backdrop-blur-sm px-2 py-1 rounded border border-sky-200 dark:border-jet-600 hover:shadow-md transition-all duration-200 shadow-sm transform hover:scale-105 ${isLoadingRates ? 'ring-1 ring-blue-200 dark:ring-blue-800' : ''} overflow-hidden`}>
                 {/* شريط التحميل الشفاف داخل الزر للموبايل */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/30 dark:via-blue-600/30 to-transparent transform -skew-x-12 transition-all duration-1000 ease-out" 
                      style={{ 
                        left: `${updateProgress - 50}%`,
                        width: '100%'
                      }}></div>
                 
                 <Euro className={`w-3 h-3 text-blue-600 dark:text-blue-400 ${isLoadingRates ? 'animate-pulse' : 'group-hover:animate-pulse'} relative z-10`} />
                 <span className="font-mono font-medium text-blue-600 dark:text-blue-400 relative z-10">
                   {isLoadingRates ? '...' : exchangeRates.EUR.toFixed(2)}
                 </span>
                 <span className="text-jet-500 dark:text-platinum-500 text-xs relative z-10">₺</span>
                 
                 {/* مؤشر التحديث للموبايل */}
                 <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-75 z-20"></div>
                 
                 {/* تأثير التحميل للموبايل */}
                 {isLoadingRates && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 dark:via-blue-800/20 to-transparent animate-pulse rounded"></div>
                 )}
               </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                {formatGregorianDate(currentTime)}
              </span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {formatHijriDate(currentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
