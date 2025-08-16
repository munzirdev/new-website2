import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import AdvancedThemeTransition from './AdvancedThemeTransition';
import ThemeTransitionSound from './ThemeTransitionSound';
import PerformanceOptimizedTransition from './PerformanceOptimizedTransition';
import VisualEffects from './VisualEffects';
import InteractiveFeedback from './InteractiveFeedback';
import PerformanceMonitor from './PerformanceMonitor';
import AccessibilityEnhancer from './AccessibilityEnhancer';
import ThemeCustomization from './ThemeCustomization';
import ThemeTransitionLogger from './ThemeTransitionLogger';
import ThemeSecurity from './ThemeSecurity';
import CompatibilityChecker from './CompatibilityChecker';
import '../styles/theme-transition.css';

interface ProfessionalThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
  className?: string;
}

const ProfessionalThemeToggle: React.FC<ProfessionalThemeToggleProps> = ({
  isDarkMode,
  onToggle,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    size: number;
    color: string;
  }>>([]);

  const handleTransitionComplete = () => {
    setIsAnimating(false);
    setParticles([]);
  };

  const handleToggle = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Create particles for the transition effect
    const newParticles = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 50, // Center of the toggle
      y: 50,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      opacity: 1,
      size: Math.random() * 5 + 3,
      color: isDarkMode 
        ? ['#fbbf24', '#f59e0b', '#d97706', '#f97316'][Math.floor(Math.random() * 4)] // Sun colors
        : ['#1e40af', '#3b82f6', '#60a5fa', '#8b5cf6'][Math.floor(Math.random() * 4)] // Moon colors
    }));
    
    setParticles(newParticles);
    
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Trigger the actual toggle
    onToggle();
  };

  useEffect(() => {
    // Animate particles
    if (particles.length > 0) {
      const interval = setInterval(() => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            opacity: particle.opacity - 0.02,
            size: particle.size * 0.98
          })).filter(p => p.opacity > 0)
        );
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [particles]);

  return (
    <>
      {/* Advanced theme transition overlay */}
      <AdvancedThemeTransition 
        isDarkMode={isDarkMode} 
        isTransitioning={isAnimating} 
      />
      
      {/* Theme transition sound */}
      <ThemeTransitionSound
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Performance optimized transition */}
      <PerformanceOptimizedTransition
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
        onTransitionComplete={handleTransitionComplete}
      />
      
      {/* Visual effects */}
      <VisualEffects
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Interactive feedback */}
      <InteractiveFeedback
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Performance monitor */}
      <PerformanceMonitor
        isTransitioning={isAnimating}
      />
      
      {/* Accessibility enhancer */}
      <AccessibilityEnhancer
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Theme customization */}
      <ThemeCustomization
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Theme transition logger */}
      <ThemeTransitionLogger
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Theme security */}
      <ThemeSecurity
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      {/* Compatibility checker */}
      <CompatibilityChecker
        isDarkMode={isDarkMode}
        isTransitioning={isAnimating}
      />
      
      <div className={`relative ${className}`}>
        {/* Particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                opacity: particle.opacity,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}
        </div>

              {/* Main toggle button */}
        <button
          onClick={handleToggle}
          disabled={isAnimating}
          className={`
            relative w-16 h-8 rounded-full transition-all duration-700 ease-out
            ${isAnimating ? 'scale-110' : 'scale-100 hover:scale-105 active:scale-95'}
            ${isDarkMode 
              ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl shadow-slate-900/50' 
              : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 shadow-2xl shadow-blue-500/50'
            }
            transform transition-all duration-700 ease-out
            ${isAnimating ? 'rotate-12' : 'rotate-0'}
            focus:outline-none focus:ring-4 focus:ring-caribbean-400/50
            cursor-pointer select-none
            aria-label={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            role="switch"
            aria-checked={isDarkMode}
          `}
          title={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
        >
        {/* Background glow effect */}
        <div className={`
          absolute inset-0 rounded-full transition-all duration-700
          ${isDarkMode 
            ? 'bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20' 
            : 'bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20'
          }
          ${isAnimating ? 'animate-pulse' : ''}
        `} />
        
        {/* Toggle handle */}
        <div className={`
          absolute top-1 w-6 h-6 rounded-full transition-all duration-700 ease-out
          flex items-center justify-center
          ${isDarkMode 
            ? 'left-9 bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg shadow-yellow-400/50' 
            : 'left-1 bg-gradient-to-br from-white to-gray-100 shadow-lg shadow-white/50'
          }
          ${isAnimating ? 'scale-125' : 'scale-100'}
          transform transition-all duration-700 ease-out
        `}>
          {/* Icon with smooth transition */}
          <div className={`
            transition-all duration-700 ease-out
            ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : 'rotate-180 opacity-0 scale-0'}
            ${isAnimating ? 'animate-spin' : ''}
            transform transition-all duration-700 ease-out
          `}>
            <Sun className="w-3 h-3 text-orange-600 drop-shadow-sm" />
          </div>
          <div className={`
            absolute transition-all duration-700 ease-out
            ${isDarkMode ? 'rotate-180 opacity-0 scale-0' : 'rotate-0 opacity-100 scale-100'}
            ${isAnimating ? 'animate-pulse' : ''}
            transform transition-all duration-700 ease-out
          `}>
            <Moon className="w-3 h-3 text-indigo-600 drop-shadow-sm" />
          </div>
        </div>

        {/* Floating sparkles effect */}
        <div className={`
          absolute inset-0 transition-all duration-700
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}>
          <Sparkles className={`
            absolute w-2 h-2 transition-all duration-700
            ${isDarkMode ? 'text-yellow-300' : 'text-blue-300'}
            ${isAnimating ? 'animate-bounce' : ''}
          `} style={{ top: '20%', left: '20%' }} />
          <Sparkles className={`
            absolute w-2 h-2 transition-all duration-700
            ${isDarkMode ? 'text-orange-300' : 'text-indigo-300'}
            ${isAnimating ? 'animate-bounce' : ''}
          `} style={{ top: '60%', right: '20%' }} />
        </div>

        {/* Ripple effect */}
        <div className={`
          absolute inset-0 rounded-full transition-all duration-700
          ${isAnimating 
            ? isDarkMode 
              ? 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 scale-150' 
              : 'bg-gradient-to-r from-blue-400/30 to-indigo-400/30 scale-150'
            : 'scale-100'
          }
        `} />
      </button>

      {/* Ambient glow */}
      <div className={`
        absolute -inset-4 rounded-full transition-all duration-1000
        ${isDarkMode 
          ? 'bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-400/10' 
          : 'bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-purple-400/10'
        }
        ${isAnimating ? 'animate-pulse' : ''}
        blur-xl
      `} />
      </div>
    </>
  );
};

export default ProfessionalThemeToggle;
