import React from 'react';
import { useStore } from '../store/useStore';

interface VideoPlayerProps {
  src: string;
  movieId: string;
  poster: string;
  onNext?: () => void;
}

export function VideoPlayer({ src, movieId, poster, onNext }: VideoPlayerProps) {
  const { watchProgress, updateWatchProgress } = useStore();

  // Save progress periodically
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.currentTime > 0) {
      updateWatchProgress(movieId, video.currentTime);
    }
  };

  // Handle video end
  const handleEnded = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <video
        src={src}
        poster={poster}
        controls
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
        playsInline
      />
    </div>
  );
}