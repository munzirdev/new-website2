import React, { useEffect } from 'react';

interface AccessibilityEnhancerProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  useEffect(() => {
    // Announce theme change to screen readers
    if (isTransitioning) {
      const message = isDarkMode 
        ? 'تم التبديل إلى الوضع الليلي'
        : 'تم التبديل إلى الوضع النهاري';
      
      // Create temporary element for screen reader announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only'; // Screen reader only
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [isTransitioning, isDarkMode]);

  useEffect(() => {
    // Reduce motion for users who prefer it
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.body.style.setProperty('--animation-duration', '0.1s');
      document.body.style.setProperty('--transition-duration', '0.1s');
    } else {
      document.body.style.setProperty('--animation-duration', '1s');
      document.body.style.setProperty('--transition-duration', '0.7s');
    }
  }, []);

  useEffect(() => {
    // High contrast mode support
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersHighContrast) {
      document.body.style.setProperty('--toggle-border-width', '3px');
      document.body.style.setProperty('--toggle-shadow-intensity', '0.8');
    } else {
      document.body.style.setProperty('--toggle-border-width', '1px');
      document.body.style.setProperty('--toggle-shadow-intensity', '0.5');
    }
  }, []);

  return null; // This component doesn't render anything
};

export default AccessibilityEnhancer;
