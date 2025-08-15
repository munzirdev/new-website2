import React, { useEffect, useState } from 'react';

interface CustomCursorProps {
  isDarkMode: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ isDarkMode }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    // Add event listeners
    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Add hover detection for interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick], [tabindex], .interactive'
    );

    const handleElementMouseEnter = () => {
      setIsHovering(true);
    };

    const handleElementMouseLeave = () => {
      setIsHovering(false);
    };

    interactiveElements.forEach((element) => {
      element.addEventListener('mouseenter', handleElementMouseEnter);
      element.addEventListener('mouseleave', handleElementMouseLeave);
    });

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);

      interactiveElements.forEach((element) => {
        element.removeEventListener('mouseenter', handleElementMouseEnter);
        element.removeEventListener('mouseleave', handleElementMouseLeave);
      });
    };
  }, []);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Hide default cursor */
          * {
            cursor: none !important;
          }
          
          /* Show default cursor on touch devices */
          @media (hover: none) and (pointer: coarse) {
            * {
              cursor: auto !important;
            }
            .custom-cursor {
              display: none !important;
            }
          }
        `
      }} />
      
      <div
        className="custom-cursor fixed pointer-events-none z-[9999] transition-opacity duration-300"
        style={{
          left: position.x,
          top: position.y,
          opacity: isVisible ? 1 : 0,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Main cursor dot - Using vibrant colors for better visibility */}
        <div
          className={`absolute w-4 h-4 rounded-full transition-all duration-200 ease-out ${
            isDarkMode 
              ? 'bg-gradient-to-r from-cyan-400 to-sky-400 shadow-lg shadow-cyan-400/60 ring-2 ring-cyan-300/50' 
              : 'bg-gradient-to-r from-cyan-500 to-sky-500 shadow-lg shadow-cyan-500/60 ring-2 ring-cyan-400/50'
          } ${
            isClicking ? 'scale-75' : 'scale-100'
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Inner glow ring */}
        <div
          className={`absolute w-6 h-6 rounded-full transition-all duration-300 ease-out ${
            isDarkMode 
              ? 'border-2 border-cyan-300/60 shadow-lg shadow-cyan-400/40' 
              : 'border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/40'
          } ${
            isHovering ? 'scale-125 opacity-100' : 'scale-100 opacity-80'
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Middle glow ring */}
        <div
          className={`absolute w-12 h-12 rounded-full transition-all duration-400 ease-out ${
            isDarkMode 
              ? 'border border-sky-300/40 shadow-lg shadow-sky-400/30' 
              : 'border border-sky-400/40 shadow-lg shadow-sky-500/30'
          } ${
            isHovering ? 'scale-150 opacity-60' : 'scale-100 opacity-40'
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Outer glow ring */}
        <div
          className={`absolute w-20 h-20 rounded-full transition-all duration-500 ease-out ${
            isDarkMode 
              ? 'border border-cyan-200/30 shadow-lg shadow-cyan-400/20' 
              : 'border border-cyan-300/30 shadow-lg shadow-cyan-500/20'
          } ${
            isHovering ? 'scale-175 opacity-30' : 'scale-100 opacity-20'
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Click animation ring */}
        {isClicking && (
          <div
            className={`absolute w-16 h-16 rounded-full animate-ping ${
              isDarkMode 
                ? 'bg-cyan-400/40' 
                : 'bg-cyan-500/40'
            }`}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
        
        {/* Hover effect particles - Using different colors for better contrast */}
        {isHovering && (
          <>
            <div
              className={`absolute w-1.5 h-1.5 rounded-full animate-pulse ${
                isDarkMode ? 'bg-cyan-300' : 'bg-cyan-400'
              }`}
              style={{
                left: 'calc(50% - 10px)',
                top: 'calc(50% - 10px)',
                animationDelay: '0ms',
              }}
            />
            <div
              className={`absolute w-1.5 h-1.5 rounded-full animate-pulse ${
                isDarkMode ? 'bg-sky-300' : 'bg-sky-400'
              }`}
              style={{
                left: 'calc(50% + 10px)',
                top: 'calc(50% - 10px)',
                animationDelay: '200ms',
              }}
            />
            <div
              className={`absolute w-1.5 h-1.5 rounded-full animate-pulse ${
                isDarkMode ? 'bg-cyan-300' : 'bg-cyan-400'
              }`}
              style={{
                left: 'calc(50% - 10px)',
                top: 'calc(50% + 10px)',
                animationDelay: '400ms',
              }}
            />
            <div
              className={`absolute w-1.5 h-1.5 rounded-full animate-pulse ${
                isDarkMode ? 'bg-sky-300' : 'bg-sky-400'
              }`}
              style={{
                left: 'calc(50% + 10px)',
                top: 'calc(50% + 10px)',
                animationDelay: '600ms',
              }}
            />
            {/* Additional corner particles for more visual impact */}
            <div
              className={`absolute w-1 h-1 rounded-full animate-pulse ${
                isDarkMode ? 'bg-cyan-200' : 'bg-cyan-300'
              }`}
              style={{
                left: 'calc(50% - 15px)',
                top: 'calc(50% - 15px)',
                animationDelay: '100ms',
              }}
            />
            <div
              className={`absolute w-1 h-1 rounded-full animate-pulse ${
                isDarkMode ? 'bg-sky-200' : 'bg-sky-300'
              }`}
              style={{
                left: 'calc(50% + 15px)',
                top: 'calc(50% - 15px)',
                animationDelay: '300ms',
              }}
            />
            <div
              className={`absolute w-1 h-1 rounded-full animate-pulse ${
                isDarkMode ? 'bg-cyan-200' : 'bg-cyan-300'
              }`}
              style={{
                left: 'calc(50% - 15px)',
                top: 'calc(50% + 15px)',
                animationDelay: '500ms',
              }}
            />
            <div
              className={`absolute w-1 h-1 rounded-full animate-pulse ${
                isDarkMode ? 'bg-sky-200' : 'bg-sky-300'
              }`}
              style={{
                left: 'calc(50% + 15px)',
                top: 'calc(50% + 15px)',
                animationDelay: '700ms',
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

export default CustomCursor;
