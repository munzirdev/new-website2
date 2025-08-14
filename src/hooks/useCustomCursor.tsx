import { useEffect } from 'react';

/**
 * Hook لتطبيق المؤشر المخصص على أي صفحة
 * يمكن استخدامه في أي مكون جديد
 */
export const useCustomCursor = () => {
  useEffect(() => {
    // إضافة CSS للمؤشر المخصص
    const style = document.createElement('style');
    style.textContent = `
      /* Hide default cursor everywhere */
      * {
        cursor: none !important;
      }
      
      /* Show default cursor on touch devices */
      @media (hover: none) and (pointer: coarse) {
        * {
          cursor: auto !important;
        }
        .cursor-element {
          display: none !important;
        }
      }
      
      /* Show pointer cursor on clickable elements for accessibility */
      button, a, [role="button"], input, select, textarea, [tabindex] {
        cursor: pointer !important;
      }
      
      /* Ensure cursor elements are always on top */
      .cursor-element {
        z-index: 9999 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
};

export default useCustomCursor;
