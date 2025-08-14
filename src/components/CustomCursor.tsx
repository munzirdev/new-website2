import React, { useState, useEffect, useCallback } from 'react';

interface CustomCursorProps {
  className?: string;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // دالة للتحقق من الوضع الليلي
  const checkDarkMode = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.body.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  // استخدام useCallback لتحسين الأداء
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // استخدام requestAnimationFrame لتحسين الأداء
    requestAnimationFrame(() => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isClickable = target.closest('button, a, [role="button"], input, select, textarea, [tabindex], .cursor-pointer, [data-cursor="pointer"]');
    setIsPointer(!!isClickable);
  }, []);

  useEffect(() => {
    // Add event listeners with passive option for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    // Hide cursor on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      setIsVisible(false);
    }

    // التحقق من الوضع الليلي عند التحميل
    checkDarkMode();

    // مراقبة تغييرات الوضع الليلي
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // مراقبة تغييرات النظام
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, handleMouseOver, checkDarkMode]);

  // Don't render on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return null;
  }

  return (
    <>
      {/* Cursor Glow */}
      {isVisible && (
        <div
          className={`fixed pointer-events-none z-[9999] will-change-transform ${className}`}
          style={{
            left: position.x - 20,
            top: position.y - 20,
            width: 40,
            height: 40,
            background: isDarkMode 
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)'
              : 'radial-gradient(circle, rgba(0, 123, 255, 0.3) 0%, rgba(0, 123, 255, 0.1) 50%, transparent 100%)',
            borderRadius: '50%',
            transform: isPointer ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}

      {/* Main Cursor */}
      {isVisible && (
        <div
          className={`fixed pointer-events-none z-[9999] will-change-transform ${className}`}
          style={{
            left: position.x - 4,
            top: position.y - 4,
            width: 8,
            height: 8,
            background: isPointer 
              ? (isDarkMode ? '#ffffff' : '#007bff') 
              : (isDarkMode ? '#ffffff' : '#333333'),
            borderRadius: '50%',
            transform: isPointer ? 'scale(1.5)' : 'scale(1)',
            boxShadow: isPointer 
              ? (isDarkMode 
                  ? '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3)' 
                  : '0 0 20px rgba(0, 123, 255, 0.5), 0 0 40px rgba(0, 123, 255, 0.3)')
              : (isDarkMode 
                  ? '0 0 10px rgba(255, 255, 255, 0.3)' 
                  : '0 0 10px rgba(0, 0, 0, 0.3)'),
            transition: 'all 0.1s ease-out',
          }}
        />
      )}

      {/* Cursor Ring */}
      {isVisible && (
        <div
          className={`fixed pointer-events-none z-[9998] will-change-transform ${className}`}
          style={{
            left: position.x - 12,
            top: position.y - 12,
            width: 24,
            height: 24,
            border: `2px solid ${isPointer 
              ? (isDarkMode ? '#ffffff' : '#007bff') 
              : (isDarkMode ? '#ffffff' : '#666666')}`,
            borderRadius: '50%',
            opacity: isPointer ? 0.8 : 0.4,
            transform: isPointer ? 'scale(1.2)' : 'scale(1)',
            transition: 'all 0.15s ease-out',
          }}
        />
      )}

      {/* Cursor Trail - إزالة للتأثير الأسرع */}
      {/* {isVisible && (
        <div
          className={`fixed pointer-events-none z-[9997] will-change-transform ${className}`}
          style={{
            left: position.x - 6,
            top: position.y - 6,
            width: 12,
            height: 12,
            background: isPointer ? 'rgba(0, 123, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            transform: 'scale(0.8)',
            transition: 'all 0.2s ease-out',
          }}
        />
      )} */}
    </>
  );
};

export default CustomCursor;
