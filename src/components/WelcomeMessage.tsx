import React, { useState, useEffect } from 'react';
import { CheckCircle, X, User, Star, Shield, Crown, Settings } from 'lucide-react';

interface WelcomeMessageProps {
  userName: string;
  userRole?: string;
  onClose: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ userName, userRole, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the message with animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // تحديد نوع المستخدم والرسالة المناسبة
  const getUserInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'مرحباً بك أيها المدير! 👑',
          message: '🎉 مرحباً بك في لوحة تحكم مجموعة تواصل! لديك صلاحيات كاملة لإدارة النظام.',
          icon: <Crown className="w-6 h-6 text-yellow-400" />,
          badge: 'مدير النظام',
          badgeColor: 'from-yellow-500 to-orange-500',
          bgColor: 'from-purple-600 to-indigo-700'
        };
      case 'moderator':
        return {
          title: 'مرحباً بك أيها المشرف! 🛡️',
          message: '🎉 مرحباً بك في لوحة إشراف مجموعة تواصل! يمكنك إدارة المحتوى والمستخدمين.',
          icon: <Shield className="w-6 h-6 text-blue-400" />,
          badge: 'مشرف النظام',
          badgeColor: 'from-blue-500 to-cyan-500',
          bgColor: 'from-blue-600 to-indigo-700'
        };
      default:
        return {
          title: 'مرحباً بك! 👋',
          message: '🎉 مرحباً بك في مجموعة تواصل! تم تسجيل دخولك بنجاح.',
          icon: <User className="w-6 h-6 text-white" />,
          badge: 'عضو مميز',
          badgeColor: 'from-green-500 to-emerald-500',
          bgColor: 'from-caribbean-600 to-indigo-700'
        };
    }
  };

  const userInfo = getUserInfo();

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`bg-gradient-to-r ${userInfo.bgColor} text-white p-6 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm max-w-sm`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ml-3">
              {userInfo.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">{userInfo.title}</h3>
              <div className="flex items-center text-white/80 text-sm">
                <User className="w-4 h-4 ml-1" />
                <span>{userName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors duration-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-white/90 text-sm leading-relaxed mb-4">
          {userInfo.message}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`bg-gradient-to-r ${userInfo.badgeColor} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center`}>
              {userRole === 'admin' && <Crown className="w-3 h-3 ml-1" />}
              {userRole === 'moderator' && <Shield className="w-3 h-3 ml-1" />}
              {(!userRole || userRole === 'user') && <Star className="w-3 h-3 ml-1" />}
              <span>{userInfo.badge}</span>
            </div>
          </div>
          <div className="text-white/60 text-xs">
            منذ لحظات
          </div>
        </div>
        
        {/* Progress bar for auto-hide */}
        <div className="mt-4 w-full bg-white/20 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full transition-all duration-[5000ms] ease-linear"
            style={{ width: isVisible ? '0%' : '100%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
