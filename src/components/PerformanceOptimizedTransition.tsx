import React, { useEffect, useRef, useCallback } from 'react';

interface PerformanceOptimizedTransitionProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
  onTransitionComplete: () => void;
}

const PerformanceOptimizedTransition: React.FC<PerformanceOptimizedTransitionProps> = ({
  isDarkMode,
  isTransitioning,
  onTransitionComplete
}) => {
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);

  const animate = useCallback((currentTime: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = currentTime;
    }

    const elapsed = currentTime - startTimeRef.current;
    const duration = 1000; // 1 second
    progressRef.current = Math.min(elapsed / duration, 1);

    // Use easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progressRef.current, 4);

    // Apply transform to document body for smooth theme transition
    if (isTransitioning) {
      document.body.style.transform = `scale(${1 + easeOutQuart * 0.02})`;
      document.body.style.filter = `brightness(${1 + easeOutQuart * 0.1})`;
    }

    if (progressRef.current < 1) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Reset styles
      document.body.style.transform = '';
      document.body.style.filter = '';
      onTransitionComplete();
    }
  }, [isTransitioning, onTransitionComplete]);

  useEffect(() => {
    if (isTransitioning) {
      startTimeRef.current = 0;
      progressRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTransitioning, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Reset styles
      document.body.style.transform = '';
      document.body.style.filter = '';
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PerformanceOptimizedTransition;
