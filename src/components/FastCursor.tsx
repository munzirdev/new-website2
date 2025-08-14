import React, { useState, useEffect, useCallback, useRef } from 'react';

interface FastCursorProps {
  className?: string;
}

const FastCursor: React.FC<FastCursorProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // دالة للتحقق من الوضع الليلي
  const checkDarkMode = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.body.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  // دالة لتحديث ألوان المؤشر
  const updateCursorColors = useCallback(() => {
    if (cursorRef.current && glowRef.current && ringRef.current) {
      const cursorColor = isDarkMode ? '#ffffff' : '#0ea5e9';
      const glowColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(14, 165, 233, 0.3)';
      const ringColor = isDarkMode ? '#ffffff' : '#0ea5e9';
      const shadowColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(14, 165, 233, 0.5)';

      // تحديث لون المؤشر الرئيسي
      cursorRef.current.style.background = isPointer ? cursorColor : (isDarkMode ? '#ffffff' : '#333333');
      cursorRef.current.style.boxShadow = isPointer 
        ? `0 0 20px ${shadowColor}, 0 0 40px ${shadowColor.replace('0.5', '0.3')}` 
        : `0 0 10px ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`;

      // تحديث لون التوهج
      glowRef.current.style.background = `radial-gradient(circle, ${glowColor} 0%, ${glowColor.replace('0.3', '0.1')} 50%, transparent 100%)`;

      // تحديث لون الحلقة
      ringRef.current.style.borderColor = isPointer ? ringColor : (isDarkMode ? '#ffffff' : '#666666');
    }
  }, [isDarkMode, isPointer]);

  // استخدام useCallback لتحسين الأداء
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (cursorRef.current && glowRef.current && ringRef.current) {
      // تحديث الموضع مباشرة بدون React state للسرعة
      cursorRef.current.style.left = `${e.clientX - 4}px`;
      cursorRef.current.style.top = `${e.clientY - 4}px`;
      
      glowRef.current.style.left = `${e.clientX - 20}px`;
      glowRef.current.style.top = `${e.clientY - 20}px`;
      
      ringRef.current.style.left = `${e.clientX - 12}px`;
      ringRef.current.style.top = `${e.clientY - 12}px`;
      
      setIsVisible(true);
    }
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

  // تحديث الألوان عند تغيير الوضع أو حالة المؤشر
  useEffect(() => {
    updateCursorColors();
  }, [updateCursorColors]);

  // Don't render on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return null;
  }

  return (
    <>
      {/* Cursor Glow */}
      <div
        ref={glowRef}
        className={`fixed pointer-events-none z-[9999] will-change-transform transition-transform duration-100 ease-out ${className}`}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          transform: isPointer ? 'scale(1.5)' : 'scale(1)',
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Main Cursor */}
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-[9999] will-change-transform transition-all duration-100 ease-out ${className}`}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          transform: isPointer ? 'scale(1.5)' : 'scale(1)',
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Cursor Ring */}
      <div
        ref={ringRef}
        className={`fixed pointer-events-none z-[9998] will-change-transform transition-all duration-150 ease-out ${className}`}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          opacity: isVisible ? (isPointer ? 0.8 : 0.4) : 0,
          transform: isPointer ? 'scale(1.2)' : 'scale(1)',
        }}
      />
    </>
  );
};

export default FastCursor;
