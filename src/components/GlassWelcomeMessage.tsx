import React, { useState, useEffect } from 'react';
import { X, User, Star, Shield, Crown, LogIn, LogOut, Heart, Sparkles } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface GlassWelcomeMessageProps {
  type: 'login' | 'logout';
  userName?: string;
  userRole?: string;
  onClose: () => void;
}

const GlassWelcomeMessage: React.FC<GlassWelcomeMessageProps> = ({ 
  type, 
  userName, 
  userRole, 
  onClose 
}) => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Show the message with animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto-hide after 5 seconds
    const autoHideTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2; // 2% every 100ms = 5 seconds total
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHideTimer);
      clearInterval(progressInterval);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // تحديد نوع الرسالة والتصميم المناسب
  const getMessageInfo = () => {
    if (type === 'login') {
      const getLoginMessage = (role: string) => {
        switch (language) {
          case 'ar':
            switch (role) {
              case 'admin':
                return {
                  title: 'مرحباً بك أيها المدير! 👑',
                  message: '🎉 تم تسجيل دخولك بنجاح إلى لوحة تحكم مجموعة تواصل! لديك صلاحيات كاملة لإدارة النظام.',
                  badge: 'مدير النظام'
                };
              case 'moderator':
                return {
                  title: 'مرحباً بك أيها المشرف! 🛡️',
                  message: '🎉 تم تسجيل دخولك بنجاح إلى لوحة إشراف مجموعة تواصل! يمكنك إدارة المحتوى والمستخدمين.',
                  badge: 'مشرف النظام'
                };
              default:
                return {
                  title: 'مرحباً بك! 👋',
                  message: '🎉 تم تسجيل دخولك بنجاح إلى مجموعة تواصل! نتمنى لك تجربة ممتعة.',
                  badge: 'عضو مميز'
                };
            }
          case 'tr':
            switch (role) {
              case 'admin':
                return {
                  title: 'Hoş geldiniz Yönetici! 👑',
                  message: '🎉 Tevasul Group kontrol paneline başarıyla giriş yaptınız! Sistem yönetimi için tam yetkiniz var.',
                  badge: 'Sistem Yöneticisi'
                };
              case 'moderator':
                return {
                  title: 'Hoş geldiniz Moderatör! 🛡️',
                  message: '🎉 Tevasul Group denetim paneline başarıyla giriş yaptınız! İçerik ve kullanıcıları yönetebilirsiniz.',
                  badge: 'Sistem Moderatörü'
                };
              default:
                return {
                  title: 'Hoş geldiniz! 👋',
                  message: '🎉 Tevasul Group\'a başarıyla giriş yaptınız! Keyifli bir deneyim dileriz.',
                  badge: 'Özel Üye'
                };
            }
          case 'en':
          default:
            switch (role) {
              case 'admin':
                return {
                  title: 'Welcome Administrator! 👑',
                  message: '🎉 Successfully logged into Tevasul Group control panel! You have full permissions to manage the system.',
                  badge: 'System Administrator'
                };
              case 'moderator':
                return {
                  title: 'Welcome Moderator! 🛡️',
                  message: '🎉 Successfully logged into Tevasul Group moderation panel! You can manage content and users.',
                  badge: 'System Moderator'
                };
              default:
                return {
                  title: 'Welcome! 👋',
                  message: '🎉 Successfully logged into Tevasul Group! We wish you an enjoyable experience.',
                  badge: 'Premium Member'
                };
            }
        }
      };
      
      const loginInfo = getLoginMessage(userRole || 'user');
      
      switch (userRole) {
        case 'admin':
          return {
            title: loginInfo.title,
            message: loginInfo.message,
            icon: <Crown className="w-6 h-6 text-yellow-400" />,
            badge: loginInfo.badge,
            badgeColor: 'from-yellow-500 to-orange-500',
            bgGradient: 'from-purple-600/90 to-indigo-700/90',
            borderColor: 'border-purple-400/30',
            glowColor: 'shadow-purple-500/20'
          };
        case 'moderator':
          return {
            title: loginInfo.title,
            message: loginInfo.message,
            icon: <Shield className="w-6 h-6 text-blue-400" />,
            badge: loginInfo.badge,
            badgeColor: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-600/90 to-indigo-700/90',
            borderColor: 'border-blue-400/30',
            glowColor: 'shadow-blue-500/20'
          };
        default:
          return {
            title: loginInfo.title,
            message: loginInfo.message,
            icon: <User className="w-6 h-6 text-white" />,
            badge: loginInfo.badge,
            badgeColor: 'from-green-500 to-emerald-500',
            bgGradient: 'from-caribbean-600/90 to-indigo-700/90',
            borderColor: 'border-caribbean-400/30',
            glowColor: 'shadow-caribbean-500/20'
          };
      }
    } else {
      // Logout message
      const getLogoutMessage = () => {
        switch (language) {
          case 'ar':
            return {
              title: 'إلى اللقاء! 👋',
              message: `💫 شكراً لك ${userName || 'عزيزي'} على استخدام مجموعة تواصل! نتمنى رؤيتك قريباً.`,
              badge: 'شكراً لك'
            };
          case 'tr':
            return {
              title: 'Güle güle! 👋',
              message: `💫 Tevasul Group'u kullandığınız için teşekkürler ${userName || 'değerli'}! Yakında tekrar görüşmek üzere.`,
              badge: 'Teşekkürler'
            };
          case 'en':
          default:
            return {
              title: 'Goodbye! 👋',
              message: `💫 Thank you ${userName || 'dear'} for using Tevasul Group! We hope to see you soon.`,
              badge: 'Thank you'
            };
        }
      };
      
      const logoutInfo = getLogoutMessage();
      
      return {
        title: logoutInfo.title,
        message: logoutInfo.message,
        icon: <Heart className="w-6 h-6 text-pink-400" />,
        badge: logoutInfo.badge,
        badgeColor: 'from-pink-500 to-rose-500',
        bgGradient: 'from-gray-600/90 to-slate-700/90',
        borderColor: 'border-gray-400/30',
        glowColor: 'shadow-gray-500/20'
      };
    }
  };

  const messageInfo = getMessageInfo();

  return (
    <div className={`fixed top-4 right-4 z-[9999] transition-all duration-500 ease-out ${
      isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className={`
        relative bg-gradient-to-br ${messageInfo.bgGradient} 
        text-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl 
        border ${messageInfo.borderColor} 
        backdrop-blur-xl max-w-xs md:max-w-sm
        ${messageInfo.glowColor}
        before:absolute before:inset-0 before:rounded-2xl md:before:rounded-3xl 
        before:bg-gradient-to-br before:from-white/10 before:to-transparent 
        before:pointer-events-none
        after:absolute after:inset-0 after:rounded-2xl md:after:rounded-3xl 
        after:bg-gradient-to-br after:from-transparent after:to-black/10 
        after:pointer-events-none
      `}>
        {/* Sparkle effects */}
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-white/60 animate-pulse" />
        </div>
        <div className="absolute bottom-2 left-2">
          <Sparkles className="w-3 h-3 text-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center ml-2 md:ml-3 backdrop-blur-sm border border-white/30">
                {messageInfo.icon}
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">{messageInfo.title}</h3>
                {userName && (
                  <div className="flex items-center text-white/80 text-xs md:text-sm">
                    <User className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                    <span>{userName}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-all duration-200 p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          
          <p className="text-white/90 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
            {messageInfo.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`
                bg-gradient-to-r ${messageInfo.badgeColor} 
                text-white px-2 md:px-3 py-1 rounded-full text-xs font-medium 
                flex items-center backdrop-blur-sm border border-white/20
                shadow-lg
              `}>
                {type === 'login' && userRole === 'admin' && <Crown className="w-3 h-3 ml-1" />}
                {type === 'login' && userRole === 'moderator' && <Shield className="w-3 h-3 ml-1" />}
                {type === 'login' && (!userRole || userRole === 'user') && <Star className="w-3 h-3 ml-1" />}
                {type === 'logout' && <Heart className="w-3 h-3 ml-1" />}
                <span className="text-xs">{messageInfo.badge}</span>
              </div>
            </div>
            <div className="text-white/60 text-xs">
              {type === 'login' 
                ? (language === 'ar' ? 'تم تسجيل الدخول' : language === 'tr' ? 'Giriş yapıldı' : 'Logged in')
                : (language === 'ar' ? 'تم تسجيل الخروج' : language === 'tr' ? 'Çıkış yapıldı' : 'Logged out')
              }
            </div>
          </div>
          
          {/* Progress bar for auto-hide */}
          <div className="mt-3 md:mt-4 w-full bg-white/20 rounded-full h-1 overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-white/60 to-white/40 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassWelcomeMessage;
