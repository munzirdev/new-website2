import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, User, Star, Shield, Crown } from 'lucide-react';

interface LoginSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'moderator' | 'user';
  userName: string;
  onRedirect: () => void;
}

const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
  isOpen,
  onClose,
  userRole,
  userName,
  onRedirect
}) => {
  const [progress, setProgress] = useState(0);
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setShowRedirect(false);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setShowRedirect(true);
            // Trigger redirect after showing "Redirecting..." for a moment
            setTimeout(() => {
              onRedirect();
            }, 500);
            return 100;
          }
          return prev + 2; // Increase by 2% every 50ms (2.5 seconds total)
        });
      }, 50);

      return () => clearInterval(progressInterval);
    }
  }, [isOpen, onRedirect]);

  if (!isOpen) return null;

  const getUserInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'مرحباً بك أيها المدير! 👑',
          message: '🎉 مرحباً بك في لوحة تحكم مجموعة تواصل! لديك صلاحيات كاملة لإدارة النظام.',
          icon: <Crown className="w-6 h-6 text-yellow-400" />,
          badge: 'مدير النظام',
          badgeColor: 'from-yellow-500 to-orange-500',
          roleText: 'مدير النظام',
          redirectText: 'لوحة التحكم'
        };
      case 'moderator':
        return {
          title: 'مرحباً بك أيها المشرف! 🛡️',
          message: '🎉 مرحباً بك في لوحة إشراف مجموعة تواصل! يمكنك إدارة المحتوى والمستخدمين.',
          icon: <Shield className="w-6 h-6 text-blue-400" />,
          badge: 'مشرف النظام',
          badgeColor: 'from-blue-500 to-cyan-500',
          roleText: 'مشرف',
          redirectText: 'لوحة التحكم'
        };
      default:
        return {
          title: 'مرحباً بك! 👋',
          message: '🎉 مرحباً بك في مجموعة تواصل! تم تسجيل دخولك بنجاح.',
          icon: <User className="w-6 h-6 text-white" />,
          badge: 'عضو مميز',
          badgeColor: 'from-green-500 to-emerald-500',
          roleText: 'مستخدم',
          redirectText: 'الصفحة الرئيسية'
        };
    }
  };

  const userInfo = getUserInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
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
            {userInfo.title}
          </h2>
          <p className="text-jet-600 dark:text-platinum-400 mb-3 text-sm leading-relaxed">
            {userInfo.message}
          </p>
          <div className="flex items-center justify-center mb-3">
            <div className={`bg-gradient-to-r ${userInfo.badgeColor} text-white px-4 py-2 rounded-full text-sm font-medium flex items-center`}>
              {userRole === 'admin' && <Crown className="w-4 h-4 ml-1" />}
              {userRole === 'moderator' && <Shield className="w-4 h-4 ml-1" />}
              {(!userRole || userRole === 'user') && <Star className="w-4 h-4 ml-1" />}
              <span>{userInfo.badge}</span>
            </div>
          </div>
          <p className="text-sm text-jet-500 dark:text-platinum-500">
            مرحباً بك، <span className="font-semibold text-caribbean-600 dark:text-caribbean-400">{userName}</span>
          </p>
        </div>

        {/* Loading Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-jet-600 dark:text-platinum-400 mb-2">
            <span>{showRedirect ? 'جاري التوجيه...' : 'جاري التحضير...'}</span>
            <span>{progress}%</span>
          </div>
          
          {/* Progress Bar Container */}
          <div className="w-full bg-jet-200 dark:bg-jet-700 rounded-full h-3 overflow-hidden">
            {/* Animated Progress Bar */}
            <div 
              className="h-full bg-gradient-to-r from-caribbean-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400 to-emerald-400 blur-sm opacity-50" />
            </div>
          </div>
        </div>

        {/* Redirect Message */}
        {showRedirect && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-caribbean-600 dark:text-caribbean-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">جاري التوجيه إلى {userInfo.redirectText}...</span>
            </div>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
        </div>
        <div className="absolute top-6 right-6">
          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessModal;
