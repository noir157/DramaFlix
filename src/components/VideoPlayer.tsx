import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Volume1, Volume, Maximize, Minimize, SkipForward, Settings, Subtitles, Keyboard, PictureInPicture, Rewind, X, ChevronRight, AlertCircle, RefreshCw, BugOff as Buffer } from 'lucide-react';
import { useStore } from '../store/useStore';
import Hls from 'hls.js';

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
  const hlsRef = useRef<Hls | null>(null);
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
  const [error, setError] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const controlsTimeoutRef = useRef<number>();
  const lastPlaybackTime = useRef<number>(0);
  const bufferCheckInterval = useRef<number>();
  
  const { videoSettings, watchProgress, updateWatchProgress, setVideoSettings } = useStore();

  const initPlayer = async () => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if the video URL is accessible
      const response = await fetch(src, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Video source is not accessible');
      }

      // Initialize HLS if supported and it's an HLS stream
      if (Hls.isSupported() && src.includes('.m3u8')) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (videoSettings.autoplay) {
            video.play().catch(() => {
              setIsPlaying(false);
              setError('Falha ao iniciar a reprodução automática');
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Erro ao carregar o vídeo');
                setIsLoading(false);
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else {
        // Fallback for direct video playback
        video.src = src;
        video.load();
      }
    } catch (err) {
      console.error('Error initializing video player:', err);
      setError('Não foi possível carregar o vídeo. Verifique sua conexão com a internet.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset states when src changes
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    setIsPlaying(false);
    setIsBuffering(false);

    const handleError = () => {
      setIsLoading(false);
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(initPlayer, 1000);
      } else {
        setError('Não foi possível reproduzir este vídeo. Por favor, tente novamente mais tarde.');
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (videoSettings.autoplay) {
        video.play().catch(() => {
          setIsPlaying(false);
          setError('Falha ao iniciar a reprodução automática');
        });
      }
    };

    // Enhanced buffer checking
    const checkBuffer = () => {
      if (!video.paused) {
        const currentPlaybackTime = video.currentTime;
        
        if (currentPlaybackTime === lastPlaybackTime.current) {
          setIsBuffering(true);
        } else {
          setIsBuffering(false);
        }
        
        lastPlaybackTime.current = currentPlaybackTime;
      }
    };

    bufferCheckInterval.current = window.setInterval(checkBuffer, 1000);

    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', () => setIsBuffering(true));
    video.addEventListener('playing', () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setError(null);
    });

    // Set initial volume from settings
    video.volume = videoSettings.volume;
    setVolume(videoSettings.volume);

    // Initialize the player
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', () => setIsBuffering(true));
      video.removeEventListener('playing', () => {
        setIsBuffering(false);
        setIsPlaying(true);
      });
      clearInterval(bufferCheckInterval.current);
    };
  }, [src, retryCount, videoSettings.autoplay, videoSettings.volume]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setShowControls(true);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Restore watch progress
    const savedProgress = watchProgress[movieId];
    if (savedProgress && savedProgress > 0) {
      video.currentTime = savedProgress;
    }

    // Save progress periodically
    const progressInterval = setInterval(() => {
      if (video.currentTime > 0) {
        updateWatchProgress(movieId, video.currentTime);
      }
    }, 1000);

    // Video event handlers
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
      video.playbackRate = playbackSpeed;
    };

    const handleWaiting = () => {
      setIsLoading(true);
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setError(null);
      setIsPlaying(true);
      setIsBuffering(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext) {
        onNext();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);

    return () => {
      clearInterval(progressInterval);
      clearInterval(bufferCheckInterval.current);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [movieId, updateWatchProgress, playbackSpeed, onNext]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      setError('Não foi possível reproduzir o vídeo. Verifique sua conexão com a internet.');
    }
  };

  const retryPlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    setIsBuffering(false);
    
    // Reset the video element
    video.load();
    
    // Attempt to play after a short delay
    setTimeout(() => {
      video.play().catch(() => {
        setError('Não foi possível reproduzir o vídeo. Por favor, tente novamente.');
        setIsLoading(false);
      });
    }, 1000);
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
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Erro ao alternar tela cheia:', error);
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
      console.error('Picture-in-Picture falhou:', error);
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

  if (error) {
    return (
      <div className="relative aspect-video bg-[#1A1C25] rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white/90 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setRetryCount(0);
              initPlayer();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative group aspect-video bg-black rounded-xl overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isLoading && !isBuffering && setShowControls(false)}
    >
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
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
              className="absolute h-full bg-blue-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="absolute h-4 w-4 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
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
                  className="w-24 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
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
                    <div className="text-sm font-medium mb-2">Velocidade de Reprodução</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handlePlaybackSpeedChange(speed)}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-white/10 rounded ${
                          playbackSpeed === speed ? 'text-blue-500' : ''
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

            <h3 className="text-xl font-semibold mb-4">Atalhos do Teclado</h3>
            <div className="grid gap-2">
              {[
                { key: 'Espaço/K', action: 'Reproduzir/Pausar' },
                { key: 'M', action: 'Mutar/Desmutar' },
                { key: 'F', action: 'Tela Cheia' },
                { key: '←', action: 'Retroceder 5 segundos' },
                { key: '→', action: 'Avançar 5 segundos' },
                { key: 'Shift + ←', action: 'Retroceder 10 segundos' },
                { key: 'Shift + →', action: 'Avançar 10 segundos' },
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
          <p>Toque duplo nas laterais para avançar/retroceder ±10s</p>
          <p className="text-xs text-neutral-400">Deslize horizontalmente para buscar, verticalmente para volume</p>
        </div>
      </div>
    </div>
  );
}

export { VideoPlayer }