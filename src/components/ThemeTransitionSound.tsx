import React, { useEffect, useRef } from 'react';

interface ThemeTransitionSoundProps {
  isDarkMode: boolean;
  isTransitioning: boolean;
}

const ThemeTransitionSound: React.FC<ThemeTransitionSoundProps> = ({
  isDarkMode,
  isTransitioning
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (isTransitioning) {
      // Create audio context for transition sound
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      // Configure oscillator based on theme
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        isDarkMode ? 440 : 880, // A4 for dark, A5 for light
        audioContext.currentTime
      );

      // Configure gain for smooth fade
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Start and stop oscillator
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);

      // Cleanup function
      return () => {
        if (oscillator && oscillator.state !== 'stopped') {
          oscillator.stop();
        }
      };
    }
  }, [isTransitioning, isDarkMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ThemeTransitionSound;
