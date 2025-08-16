import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface BackgroundMusicProps {
  audioSrc?: string;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ 
  audioSrc = '/empathy-slow-ambient-music-pad-background-385736.mp3' // Slow ambient background music
}) => {
  const { t } = useLanguage();
  
  // Initialize state from localStorage
  const [isMuted, setIsMuted] = useState(() => {
    const savedMuted = localStorage.getItem('backgroundMusicMuted');
    return savedMuted ? JSON.parse(savedMuted) : false;
  });
  
  const [isPlaying, setIsPlaying] = useState(true); // Default to playing
  const [volume, setVolume] = useState(0.04); // 4% default volume for desktop
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Detect mobile device and set appropriate volume
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Set volume based on device type
      const newVolume = mobile ? 0.016 : 0.04; // 1.6% for mobile, 4% for desktop
      setVolume(newVolume);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.loop = true;
    audio.volume = volume; // Set volume from state
    audio.muted = isMuted; // Set mute state from localStorage

    // Auto-play when component mounts (only if not muted)
    const playAudio = async () => {
      try {
        if (!isMuted) {
          await audio.play();
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      } catch (error) {
        console.log('Auto-play prevented by browser policy');
        setIsPlaying(false);
      }
    };

    playAudio();

    // Handle audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume]);

  // Handle hover for volume slider
  useEffect(() => {
    if (isHovering) {
      setShowVolumeSlider(true);
    } else {
      // Delay hiding to allow moving to slider
      const timer = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isHovering]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      localStorage.setItem('backgroundMusicMuted', 'false');
    } else {
      audio.muted = true;
      setIsMuted(true);
      localStorage.setItem('backgroundMusicMuted', 'true');
    }
  };

  const handleClick = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      audio.play().catch(console.error);
    } else {
      toggleMute();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    setVolume(newVolume);
    audio.volume = newVolume;
    
    // Unmute if volume is increased
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      audio.muted = false;
      localStorage.setItem('backgroundMusicMuted', 'false');
    }
  };

  return (
    <>
             <audio ref={audioRef} src={audioSrc} preload="auto" />
       
       
      
      
      

      
             {/* Floating Music Control Button - Mobile Only */}
       <div className="fixed bottom-6 left-4 z-[99999] group music-control pointer-events-auto md:hidden">
                 <button
           onClick={handleClick}
           onMouseEnter={() => setIsHovering(true)}
           onMouseLeave={() => setIsHovering(false)}
                     className={`
             w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110
             backdrop-blur-md border border-white/20
             ${isMuted || !isPlaying 
               ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
               : 'bg-white/10 hover:bg-white/20 text-white'
             }
             flex items-center justify-center
             ${isPlaying && !isMuted ? 'animate-pulse' : ''}
           `}
                     title={`${isMuted ? t('music.unmute') : t('music.mute')} (Hover for volume control)`}
        >
                     {isMuted || !isPlaying ? (
             <VolumeX size={20} className="md:w-6 md:h-6 w-5 h-5" />
           ) : (
             <Volume2 size={20} className="md:w-6 md:h-6 w-5 h-5" />
           )}
        </button>
        
                 {/* Music indicator */}
         {isPlaying && !isMuted && (
           <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full animate-ping" />
         )}
        
                                   {/* Volume Slider - Desktop Only */}
         {showVolumeSlider && !isMobile && (
           <div 
             className="absolute top-16 right-0 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-xl"
             onMouseEnter={() => setIsHovering(true)}
             onMouseLeave={() => setIsHovering(false)}
           >
             <div className="text-blue-300 text-xs mb-3 text-center font-medium">
               {Math.round(volume * 100)}%
             </div>
             <div className="flex flex-col items-center">
               <input
                 type="range"
                 min="0"
                 max="1"
                 step="0.1"
                 value={volume}
                 onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                 className="w-16 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer border border-white/30 hover:bg-white/30 transition-colors"
               />
               <div className="text-blue-300/80 text-xs mt-2 font-medium">صوت</div>
             </div>
           </div>
         )}
        
                 
      </div>
    </>
  );
};

export default BackgroundMusic;
