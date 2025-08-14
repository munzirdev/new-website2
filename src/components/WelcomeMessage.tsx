import React, { useState, useEffect } from 'react';
import { CheckCircle, X, User, Star } from 'lucide-react';

interface WelcomeMessageProps {
  userName: string;
  onClose: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ userName, onClose }) => {
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

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white p-6 rounded-2xl shadow-2xl border border-caribbean-500/20 backdrop-blur-sm max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ml-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">مرحباً بك!</h3>
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
          🎉 مرحباً بك في مجموعة تواصل! تم تسجيل دخولك بنجاح.
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white/70 text-xs">
            <Star className="w-4 h-4 ml-1 text-yellow-300" />
            <span>عضو مميز</span>
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
