import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Sun,
  Moon,
  Home
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';

interface AdminNavbarProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ 
  onBack, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  const { user, profile, signOut } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

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



  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-sky-50 via-blue-50/30 to-cyan-50/40 dark:from-jet-900 dark:via-jet-800 dark:to-jet-900 shadow-lg border-b border-sky-200 dark:border-jet-700">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-sky-200/15 to-transparent rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-tr from-blue-200/12 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-r from-cyan-200/8 to-sky-200/8 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Home button */}
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="group flex items-center px-4 py-2 bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-white dark:hover:bg-jet-600 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <Home className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2 group-hover:animate-pulse" />
              <span className="text-sm md:text-base font-medium">{t('nav.home')}</span>
            </button>
          </div>

          {/* Center - Title and Greeting */}
          <div className="flex-1 text-center">
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-caribbean-600 via-indigo-600 to-caribbean-600 dark:from-caribbean-400 dark:via-indigo-400 dark:to-caribbean-400 bg-clip-text text-transparent animate-pulse">
              {t('admin.dashboard')}
            </h1>
            <p className="text-sm md:text-base text-jet-600 dark:text-platinum-400 mt-1">
              {greeting}، {profile?.full_name || user?.email}
            </p>
          </div>

                     {/* Right side - User info and controls */}
           <div className="flex items-center space-x-2 space-x-reverse">
             {/* User Info */}
             <div className="hidden sm:flex items-center px-3 py-2 bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm rounded-lg shadow-sm">
               <User className="w-4 h-4 text-caribbean-600 ml-1" />
               <span className="text-sm font-medium text-jet-600 dark:text-platinum-400">
                 {profile?.full_name || user?.email}
               </span>
             </div>

             {/* Dark Mode Toggle */}
             {onToggleDarkMode && (
               <button
                 onClick={onToggleDarkMode}
                 className="group flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-white dark:hover:bg-jet-600 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-110"
                 title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               >
                 {isDarkMode ? (
                   <Sun className="w-5 h-5 group-hover:animate-spin" />
                 ) : (
                   <Moon className="w-5 h-5 group-hover:animate-pulse" />
                 )}
               </button>
             )}

             {/* Sign Out Button */}
             <button
               onClick={handleSignOut}
               className="group flex items-center px-3 py-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm text-white hover:text-white transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-105"
               title="تسجيل الخروج"
             >
               <LogOut className="w-4 h-4 ml-1 group-hover:animate-pulse" />
               <span className="text-sm font-medium hidden sm:inline">تسجيل الخروج</span>
             </button>
           </div>
        </div>

        
      </div>
    </div>
  );
};

export default AdminNavbar;
