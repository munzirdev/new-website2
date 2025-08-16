import React, { useEffect, useState } from 'react';

interface VisualEffectsProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const VisualEffects: React.FC<VisualEffectsProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const [effects, setEffects] = useState<Array<{
    id: number;
    type: 'sparkle' | 'wave' | 'pulse';
    x: number;
    y: number;
    size: number;
    opacity: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isTransitioning) {
      // Create visual effects
      const newEffects = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        type: ['sparkle', 'wave', 'pulse'][Math.floor(Math.random() * 3)] as 'sparkle' | 'wave' | 'pulse',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        opacity: 0,
        delay: Math.random() * 500
      }));
      
      setEffects(newEffects);
      
      // Animate effects appearing
      setTimeout(() => {
        setEffects(prev => prev.map(effect => ({ ...effect, opacity: 1 })));
      }, 100);
    } else {
      setEffects([]);
    }
  }, [isTransitioning]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9997] overflow-hidden">
      {effects.map(effect => (
        <div
          key={effect.id}
          className={`
            absolute rounded-full transition-all duration-1000 ease-out
            ${effect.type === 'sparkle' ? 'animate-pulse' : ''}
            ${effect.type === 'wave' ? 'animate-ping' : ''}
            ${effect.type === 'pulse' ? 'animate-bounce' : ''}
          `}
          style={{
            left: `${effect.x}%`,
            top: `${effect.y}%`,
            width: `${effect.size}px`,
            height: `${effect.size}px`,
            opacity: effect.opacity,
            animationDelay: `${effect.delay}ms`,
            backgroundColor: isDarkMode 
              ? 'rgba(251, 191, 36, 0.3)' // Yellow for dark mode
              : 'rgba(59, 130, 246, 0.3)', // Blue for light mode
            boxShadow: isDarkMode
              ? '0 0 20px rgba(251, 191, 36, 0.5)'
              : '0 0 20px rgba(59, 130, 246, 0.5)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      
      {/* Ambient light effect */}
      <div className={`
        absolute inset-0 transition-all duration-1000 ease-out
        ${isDarkMode 
          ? 'bg-gradient-to-br from-yellow-400/5 via-orange-400/5 to-red-400/5' 
          : 'bg-gradient-to-br from-blue-400/5 via-indigo-400/5 to-purple-400/5'
        }
        ${isTransitioning ? 'opacity-100' : 'opacity-0'}
      `} />
    </div>
  );
};

export default VisualEffects;
