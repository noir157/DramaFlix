import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoState } from '../types/movie';

interface Store {
  videoSettings: VideoState;
  favorites: string[];
  watchProgress: Record<string, number>;
  setVideoSettings: (settings: Partial<VideoState>) => void;
  toggleFavorite: (id: string) => void;
  updateWatchProgress: (movieId: string, time: number) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      videoSettings: {
        currentTime: 0,
        volume: 1,
        playbackSpeed: 1,
        quality: 'auto',
        subtitlesEnabled: false,
      },
      favorites: [],
      watchProgress: {},
      setVideoSettings: (newSettings) =>
        set((state) => ({
          videoSettings: { ...state.videoSettings, ...newSettings },
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((fid) => fid !== id)
            : [...state.favorites, id],
        })),
      updateWatchProgress: (movieId, time) =>
        set((state) => ({
          watchProgress: { ...state.watchProgress, [movieId]: time },
        })),
    }),
    {
      name: 'movie-store',
    }
  )
);