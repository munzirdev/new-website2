import React, { useEffect, useRef } from 'react';

interface ThemeTransitionLoggerProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const ThemeTransitionLogger: React.FC<ThemeTransitionLoggerProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const transitionCountRef = useRef<number>(0);
  const lastTransitionTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isTransitioning) {
      const currentTime = Date.now();
      transitionCountRef.current++;
      lastTransitionTimeRef.current = currentTime;

      // Log transition details
      const transitionData = {
        timestamp: currentTime,
        transitionNumber: transitionCountRef.current,
        newTheme: isDarkMode ? 'dark' : 'light',
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🎨 Theme Transition:', transitionData);
      }

      // Store transition data in localStorage for analytics
      try {
        const existingData = localStorage.getItem('theme-transitions');
        const transitions = existingData ? JSON.parse(existingData) : [];
        transitions.push(transitionData);
        
        // Keep only last 100 transitions
        if (transitions.length > 100) {
          transitions.splice(0, transitions.length - 100);
        }
        
        localStorage.setItem('theme-transitions', JSON.stringify(transitions));
      } catch (error) {
        console.warn('Failed to store theme transition data:', error);
      }

      // Send analytics data (if analytics service is configured)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'theme_transition', {
          event_category: 'user_preference',
          event_label: isDarkMode ? 'dark' : 'light',
          value: transitionCountRef.current
        });
      }
    }
  }, [isTransitioning, isDarkMode]);

  // Log performance metrics
  useEffect(() => {
    if (isTransitioning) {
      const startTime = performance.now();
      
      const logPerformance = () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ Theme Transition Performance: ${duration.toFixed(2)}ms`);
        }
      };

      // Log performance after transition completes
      setTimeout(logPerformance, 1000);
    }
  }, [isTransitioning]);

  return null; // This component doesn't render anything
};

export default ThemeTransitionLogger;
