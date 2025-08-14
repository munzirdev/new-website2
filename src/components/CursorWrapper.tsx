import React from 'react';
import FastCursor from './FastCursor';

interface CursorWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const CursorWrapper: React.FC<CursorWrapperProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`cursor-none custom-cursor-container ${className}`}
      style={{
        cursor: 'none',
      }}
    >
      {children}
      <FastCursor />
      
      {/* Global CSS to hide default cursor */}
      <style jsx global>{`
        /* Hide default cursor everywhere */
        * {
          cursor: none !important;
        }
        
        /* Show default cursor on touch devices */
        @media (hover: none) and (pointer: coarse) {
          * {
            cursor: auto !important;
          }
        }
        
        /* Show pointer cursor on clickable elements for accessibility */
        button, a, [role="button"], input, select, textarea, [tabindex], .cursor-pointer, [data-cursor="pointer"] {
          cursor: pointer !important;
        }
        
        /* Hover effects for clickable elements */
        button:hover, a:hover, [role="button"]:hover, .cursor-pointer:hover, [data-cursor="pointer"]:hover {
          cursor: pointer !important;
        }
        
        /* Ensure cursor elements are always on top */
        .cursor-element {
          z-index: 9999 !important;
          pointer-events: none !important;
        }
        
        /* Hide custom cursor on touch devices */
        @media (hover: none) and (pointer: coarse) {
          .cursor-element {
            display: none !important;
          }
        }
        
        /* تحسين الأداء */
        .will-change-transform {
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default CursorWrapper;
