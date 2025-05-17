export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string[];
  year: number;
  rating: number;
  poster_url: string;
  vimeo_url: string;
  language: string;
  duration: number;
}

export interface VideoState {
  currentTime: number;
  volume: number;
  playbackSpeed: number;
  quality: string;
  subtitlesEnabled: boolean;
}