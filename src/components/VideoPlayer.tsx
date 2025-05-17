import React, { useRef, useState, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Volume1, Volume,
  Maximize, Minimize, SkipForward, Settings,
  Subtitles, Keyboard, PictureInPicture, Rewind,
  X, ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface VideoPlayerProps {
  src: string;
  movieId: string;
  poster: string;
  onNext?: () => void;
}

export function VideoPlayer({ src, movieId, poster, onNext }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<string>('auto');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const controlsTimeoutRef = useRef<number>();
  
  const { videoSettings, watchProgress, updateWatchProgress, setVideoSettings } = useStore();

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isFullscreen);
      setShowControls(true);
      
      if (!isFullscreen) {
        container.style.width = '100%';
        container.style.height = 'auto';
        video.style.width = '100%';
        video.style.height = '100%';
        clearTimeout(controlsTimeoutRef.current);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const savedProgress = watchProgress[movieId];
    if (savedProgress) {
      video.currentTime = savedProgress;
    }

    const interval = setInterval(() => {
      if (video.currentTime > 0) {
        updateWatchProgress(movieId, video.currentTime);
        setCurrentTime(video.currentTime);
      }
    }, 1000);

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
      video.playbackRate = playbackSpeed;
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime += e.shiftKey ? 10 : 5;
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime -= e.shiftKey ? 10 : 5;
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'p':
          e.preventDefault();
          togglePictureInPicture();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      if (isPlaying && !showSettings && !showKeyboardShortcuts) {
        controlsTimeoutRef.current = window.setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', () => setShowControls(true));
    container.addEventListener('mouseleave', () => {
      if (isPlaying && !showSettings && !showKeyboardShortcuts) {
        setShowControls(false);
      }
    });

    // Handle touch events for mobile
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let isSeeking = false;
    let initialVolume = video.volume;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartTime = Date.now();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      initialVolume = video.volume;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSeeking) return;

      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;

      // Horizontal swipe for seeking
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const seekAmount = (deltaX / container.clientWidth) * video.duration;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seekAmount));
        touchStartX = e.touches[0].clientX;
      }
      // Vertical swipe for volume
      else {
        const volumeChange = deltaY / container.clientHeight;
        const newVolume = Math.max(0, Math.min(1, initialVolume - volumeChange));
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime;
      
      // Single tap to toggle controls
      if (touchDuration < 250 && !isSeeking) {
        setShowControls(!showControls);
      }
      
      isSeeking = false;
    };

    // Double tap to seek
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300) {
        const rect = container.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        
        if (x < rect.width / 2) {
          video.currentTime -= 10;
        } else {
          video.currentTime += 10;
        }
        
        e.preventDefault();
      }
      
      lastTap = currentTime;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchstart', handleDoubleTap);

    return () => {
      clearInterval(interval);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      container.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchstart', handleDoubleTap);
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [movieId, updateWatchProgress, isPlaying, playbackSpeed, showSettings, showKeyboardShortcuts]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
        setShowControls(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setShowControls(true);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    setVideoSettings({ volume: newVolume });
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress) return;

    const rect = progress.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setVideoSettings({ playbackSpeed: speed });
    setShowSettings(false);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={20} />;
    if (volume < 0.3) return <Volume size={20} />;
    if (volume < 0.7) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  return (
    <div 
      ref={containerRef}
      className="relative group aspect-video bg-black rounded-xl overflow-hidden"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Click to play/pause overlay */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress touch-none"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-accent-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="absolute h-4 w-4 bg-accent-500 rounded-full -translate-y-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime -= 10;
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
            >
              <Rewind className="w-5 h-5" />
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime += 10;
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume controls */}
            <div className="relative group/volume hidden sm:block">
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {getVolumeIcon()}
              </button>
              
              <div
                className={`absolute bottom-full left-0 mb-2 bg-neutral-900/95 rounded-lg p-2 transition-all duration-200 ${
                  showVolumeSlider ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500"
                />
              </div>
            </div>

            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-neutral-900/95 backdrop-blur-sm rounded-lg overflow-hidden">
                  <div className="p-2 border-b border-white/10">
                    <div className="text-sm font-medium mb-2">Playback Speed</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handlePlaybackSpeedChange(speed)}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-white/10 rounded ${
                          playbackSpeed === speed ? 'text-accent-500' : ''
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts */}
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
            >
              <Keyboard className="w-5 h-5" />
            </button>

            {/* Picture in Picture */}
            <button
              onClick={togglePictureInPicture}
              className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts overlay */}
      {showKeyboardShortcuts && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm p-6 z-30">
          <div className="relative max-w-lg mx-auto">
            <button
              onClick={() => setShowKeyboardShortcuts(false)}
              className="absolute -right-2 -top-2 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h3>
            <div className="grid gap-2">
              {[
                { key: 'Space/K', action: 'Play/Pause' },
                { key: 'M', action: 'Mute/Unmute' },
                { key: 'F', action: 'Toggle fullscreen' },
                { key: '←', action: 'Rewind 5 seconds' },
                { key: '→', action: 'Forward 5 seconds' },
                { key: 'Shift + ←', action: 'Rewind 10 seconds' },
                { key: 'Shift + →', action: 'Forward 10 seconds' },
                { key: 'P', action: 'Picture in Picture' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="font-medium">{action}</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-sm">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile touch gestures hint */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-center pointer-events-none sm:hidden">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-center">
          <p>Double tap sides to seek ±10s</p>
          <p className="text-xs text-neutral-400">Swipe horizontally to seek, vertically for volume</p>
        </div>
      </div>
    </div>
  );
}