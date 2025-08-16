# Background Music Setup Guide

## Overview
The website now includes a background music feature with a floating control button. The music automatically starts playing when the website loads and loops continuously.

## Features
- 🎵 **Auto-play background music** when the website loads
- 🔄 **Continuous loop** for seamless playback
- 🔇 **Mute/Unmute** with a single click
- 🔊 **Volume control** (right-click the button to access)
- 🌍 **Multi-language support** (Arabic, Turkish, English)
- 📱 **Responsive design** that works on all devices

## How to Use

### For Users
1. **Play/Pause**: Click the floating music button (bottom-right corner)
2. **Mute/Unmute**: Click the button to toggle mute
3. **Volume Control**: Right-click the button to show volume slider
4. **Visual Indicators**: 
   - Green button with pulse animation = Music playing
   - Red button = Music muted or stopped
   - Green dot with ping animation = Music actively playing

### For Developers

#### Current Setup
- The component uses `/empathy-slow-ambient-music-pad-background-385736.mp3` as the background music
- Located at: `src/components/BackgroundMusic.tsx`
- Integrated into: `src/App.tsx`

#### To Change the Background Music
1. **Replace the audio file**:
   - Add your preferred background music file to the `public/` folder
   - Update the `audioSrc` prop in `App.tsx`:
   ```tsx
   <BackgroundMusic audioSrc="/your-music-file.mp3" />
   ```

2. **Recommended audio specifications**:
   - Format: MP3
   - Sample rate: 44.1kHz
   - Bitrate: 128-192kbps
   - Duration: 1-3 minutes (will loop)
   - File size: Under 2MB for web performance
   - Style: Soft, ambient, non-intrusive

#### Customization Options
- **Volume**: Default is 15%, adjustable via volume slider (optimized for ambient music)
- **Position**: Change the button position by modifying the CSS classes
- **Styling**: Customize colors, animations, and effects in the component
- **Auto-play**: Can be disabled by modifying the component logic

## Browser Compatibility
- ✅ Chrome/Edge (auto-play supported)
- ✅ Firefox (auto-play supported)
- ✅ Safari (auto-play supported)
- ⚠️ Some browsers may block auto-play initially - users can click to start

## Technical Details
- Uses HTML5 `<audio>` element
- React hooks for state management
- Tailwind CSS for styling
- Responsive design with backdrop blur effects
- Click outside detection for volume slider
- Multi-language support via translation system

## Troubleshooting
1. **Music doesn't play automatically**: This is normal browser behavior. Users can click the button to start.
2. **Audio file not found**: Check that the file path is correct and the file exists in the public folder.
3. **Volume slider not working**: Ensure the component has proper event handlers and CSS classes.

## Future Enhancements
- [ ] Add multiple music tracks with playlist functionality
- [ ] Implement fade in/out effects
- [ ] Add music visualization
- [ ] Save user preferences in localStorage
- [ ] Add keyboard shortcuts for controls
