import React, { useEffect, useState } from 'react';

interface AdvancedThemeTransitionProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const AdvancedThemeTransition: React.FC<AdvancedThemeTransitionProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isTransitioning) {
      // Create stars for night mode transition
      if (isDarkMode) {
        const newStars = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: 0,
          delay: Math.random() * 1000
        }));
        setStars(newStars);
        
        // Animate stars appearing
        setTimeout(() => {
          setStars(prev => prev.map(star => ({ ...star, opacity: 1 })));
        }, 100);
      } else {
        // Create sun rays for day mode transition
        setStars([]);
      }
    } else {
      setStars([]);
    }
  }, [isTransitioning, isDarkMode]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {/* Background transition overlay */}
      <div className={`
        absolute inset-0 transition-all duration-1000 ease-out
        ${isDarkMode 
          ? 'bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-slate-900/20' 
          : 'bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-red-400/20'
        }
      `} />

      {/* Stars for night mode */}
      {isDarkMode && stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}ms`,
            animationDuration: '2s',
            boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
            transition: 'opacity 0.5s ease-out',
          }}
        />
      ))}

      {/* Sun rays for day mode */}
      {!isDarkMode && (
        <div className="absolute inset-0">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-32 bg-gradient-to-b from-yellow-400 to-transparent animate-pulse"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                transformOrigin: 'center bottom',
                animationDelay: `${i * 100}ms`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
      )}

      {/* Central transition effect */}
      <div className={`
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        w-32 h-32 rounded-full transition-all duration-1000 ease-out
        ${isDarkMode 
          ? 'bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 scale-150 opacity-0' 
          : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-800 scale-150 opacity-0'
        }
        blur-xl
      `} />

      {/* Ripple effects */}
      <div className={`
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        w-64 h-64 rounded-full transition-all duration-1000 ease-out
        ${isDarkMode 
          ? 'bg-gradient-to-br from-yellow-400/10 via-orange-400/10 to-red-400/10 scale-0' 
          : 'bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-purple-400/10 scale-0'
        }
        ${isTransitioning ? 'scale-100' : 'scale-0'}
      `} />
    </div>
  );
};

export default AdvancedThemeTransition;
