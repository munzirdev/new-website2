import React, { useEffect, useState } from 'react';

interface InteractiveFeedbackProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const InteractiveFeedback: React.FC<InteractiveFeedbackProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
    show: boolean;
  }>({
    type: 'info',
    message: '',
    show: false
  });

  useEffect(() => {
    if (isTransitioning) {
      const message = isDarkMode 
        ? 'تم التبديل إلى الوضع الليلي 🌙'
        : 'تم التبديل إلى الوضع النهاري ☀️';
      
      setFeedback({
        type: 'success',
        message,
        show: true
      });

      // Hide feedback after animation
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  }, [isTransitioning, isDarkMode]);

  if (!feedback.show) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
      <div className={`
        px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border
        transition-all duration-500 ease-out
        ${feedback.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        ${feedback.type === 'success' 
          ? 'bg-green-500/90 text-white border-green-400/50' 
          : 'bg-blue-500/90 text-white border-blue-400/50'
        }
        ${isDarkMode ? 'dark:bg-green-600/90 dark:border-green-500/50' : ''}
      `}>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-sm font-medium">{feedback.message}</span>
          <div className={`
            w-2 h-2 rounded-full animate-pulse
            ${feedback.type === 'success' ? 'bg-green-200' : 'bg-blue-200'}
          `} />
        </div>
      </div>
    </div>
  );
};

export default InteractiveFeedback;
