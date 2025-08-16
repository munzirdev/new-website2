import React, { useEffect, useState } from 'react';

interface CompatibilityCheckerProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const CompatibilityChecker: React.FC<CompatibilityCheckerProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const [compatibility, setCompatibility] = useState({
    webAudio: false,
    webGL: false,
    cssVariables: false,
    reducedMotion: false,
    highContrast: false
  });

  useEffect(() => {
    // Check Web Audio API support
    const checkWebAudio = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        setCompatibility(prev => ({ ...prev, webAudio: true }));
        audioContext.close();
      } catch (error) {
        console.warn('Web Audio API not supported');
      }
    };

    // Check WebGL support
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setCompatibility(prev => ({ ...prev, webGL: !!gl }));
      } catch (error) {
        console.warn('WebGL not supported');
      }
    };

    // Check CSS Variables support
    const checkCSSVariables = () => {
      const supportsCSSVariables = CSS.supports('color', 'var(--test)');
      setCompatibility(prev => ({ ...prev, cssVariables: supportsCSSVariables }));
    };

    // Check media query support
    const checkMediaQueries = () => {
      const supportsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const supportsHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      setCompatibility(prev => ({ 
        ...prev, 
        reducedMotion: supportsReducedMotion,
        highContrast: supportsHighContrast
      }));
    };

    // Run all checks
    checkWebAudio();
    checkWebGL();
    checkCSSVariables();
    checkMediaQueries();

    // Log compatibility info in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('🔧 Compatibility Check:', compatibility);
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Apply compatibility-based optimizations
    if (!compatibility.webAudio) {
      document.body.style.setProperty('--sound-enabled', 'false');
    }

    if (!compatibility.webGL) {
      document.body.style.setProperty('--particle-count', '8');
    }

    if (!compatibility.cssVariables) {
      // Fallback for older browsers
      document.body.style.setProperty('--animation-duration', '0.5s');
      document.body.style.setProperty('--transition-duration', '0.3s');
    }

    if (compatibility.reducedMotion) {
      document.body.style.setProperty('--animation-duration', '0.1s');
      document.body.style.setProperty('--transition-duration', '0.1s');
    }

    if (compatibility.highContrast) {
      document.body.style.setProperty('--toggle-border-width', '3px');
      document.body.style.setProperty('--toggle-shadow-intensity', '0.8');
    }
  }, [compatibility]);

  return null; // This component doesn't render anything
};

export default CompatibilityChecker;
