import React, { useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  isTransitioning: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isTransitioning
}) => {
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isTransitioning) {
      startTimeRef.current = performance.now();
      frameCountRef.current = 0;
      lastTimeRef.current = performance.now();

      const measurePerformance = (currentTime: number) => {
        frameCountRef.current++;
        
        // Calculate FPS
        const deltaTime = currentTime - lastTimeRef.current;
        const fps = 1000 / deltaTime;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development' && frameCountRef.current % 30 === 0) {
          console.log(`🎯 Theme Transition Performance:`, {
            fps: Math.round(fps),
            frameCount: frameCountRef.current,
            elapsedTime: Math.round(currentTime - startTimeRef.current)
          });
        }
        
        lastTimeRef.current = currentTime;
      };

      const animationFrame = () => {
        const currentTime = performance.now();
        measurePerformance(currentTime);
        
        if (isTransitioning) {
          requestAnimationFrame(animationFrame);
        }
      };

      requestAnimationFrame(animationFrame);
    }
  }, [isTransitioning]);

  // Optimize performance by reducing re-renders
  useEffect(() => {
    if (isTransitioning) {
      // Disable some animations on low-end devices
      const isLowEndDevice = navigator.hardwareConcurrency <= 4 || 
                           navigator.deviceMemory <= 4;
      
      if (isLowEndDevice) {
        document.body.style.setProperty('--animation-duration', '0.5s');
        document.body.style.setProperty('--particle-count', '8');
      } else {
        document.body.style.setProperty('--animation-duration', '1s');
        document.body.style.setProperty('--particle-count', '16');
      }
    }
  }, [isTransitioning]);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;
