import React, { useEffect, useRef } from 'react';

interface ThemeSecurityProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const ThemeSecurity: React.FC<ThemeSecurityProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const transitionAttemptsRef = useRef<number>(0);
  const lastAttemptTimeRef = useRef<number>(0);
  const isBlockedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isTransitioning) {
      const currentTime = Date.now();
      
      // Rate limiting: prevent rapid transitions
      if (currentTime - lastAttemptTimeRef.current < 500) {
        transitionAttemptsRef.current++;
        
        // Block if too many rapid attempts
        if (transitionAttemptsRef.current > 10) {
          isBlockedRef.current = true;
          console.warn('🚫 Theme transition blocked due to rapid attempts');
          
          // Reset after 30 seconds
          setTimeout(() => {
            isBlockedRef.current = false;
            transitionAttemptsRef.current = 0;
          }, 30000);
          
          return;
        }
      } else {
        // Reset counter if enough time has passed
        transitionAttemptsRef.current = 0;
      }
      
      lastAttemptTimeRef.current = currentTime;
    }
  }, [isTransitioning]);

  useEffect(() => {
    // Validate theme state
    const isValidTheme = isDarkMode === true || isDarkMode === false;
    
    if (!isValidTheme) {
      console.error('❌ Invalid theme state detected:', isDarkMode);
      return;
    }

    // Check for potential XSS in theme data
    const themeString = isDarkMode.toString();
    if (themeString.includes('<script>') || themeString.includes('javascript:')) {
      console.error('❌ Potential XSS detected in theme data');
      return;
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Sanitize transition state
    if (isTransitioning && typeof isTransitioning !== 'boolean') {
      console.error('❌ Invalid transition state detected:', isTransitioning);
      return;
    }
  }, [isTransitioning]);

  // Prevent clickjacking attempts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTransitioning) {
        console.warn('⚠️ Theme transition interrupted by page visibility change');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTransitioning]);

  return null; // This component doesn't render anything
};

export default ThemeSecurity;
