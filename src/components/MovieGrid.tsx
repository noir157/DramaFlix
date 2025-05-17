import React from 'react';
import { Heart, Clock, Star } from 'lucide-react';
import { Movie } from '../types/movie';
import { useStore } from '../store/useStore';

interface MovieGridProps {
  movies: Movie[];
  onSelect: (movie: Movie) => void;
}

export function MovieGrid({ movies, onSelect }: MovieGridProps) {
  const { favorites, toggleFavorite } = useStore();

  const formatDuration = (duration: number | undefined) => {
    if (!duration || isNaN(duration)) return null;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleMovieSelect = (movie: Movie) => {
    onSelect(movie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {movies.map(movie => (
        <div
          key={movie.id}
          className="group relative isolate aspect-[2/3] overflow-hidden rounded-lg bg-neutral-900/50 ring-1 ring-neutral-800/50 backdrop-blur-sm transition duration-300 hover:ring-accent-500/50 hover:shadow-lg hover:shadow-accent-500/10 cursor-pointer"
          onClick={() => handleMovieSelect(movie)}
        >
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 will-change-transform group-hover:scale-105"
            loading="lazy"
          />
          
          <div className="absolute inset-0 movie-card-overlay opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="absolute inset-0 flex flex-col justify-end p-3 translate-y-[70%] transition-transform duration-500 ease-out group-hover:translate-y-0">
            <div className="mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mb-1.5">
                {formatDuration(movie.duration) && (
                  <>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatDuration(movie.duration)}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                {movie.rating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                {movie.year > 0 && <span>{movie.year}</span>}
              </div>
              
              <h2 className="text-sm font-semibold tracking-tight text-white mb-1.5 line-clamp-2">
                {movie.title}
              </h2>
              
              <p className="text-xs leading-relaxed text-neutral-300 line-clamp-2">
                {movie.description || 'No description available'}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(movie.genre) && movie.genre.slice(0, 2).map(genre => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 text-xs font-medium text-neutral-300 bg-neutral-800/50 rounded-full ring-1 ring-neutral-700/50"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(movie.id);
                }}
                className={`group/btn relative isolate p-1.5 rounded-full transition-all duration-300 ${
                  favorites.includes(movie.id)
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-800/50 text-neutral-400 hover:text-accent-400 ring-1 ring-neutral-700/50'
                }`}
              >
                <Heart
                  size={14}
                  className={`transition-transform duration-300 group-hover/btn:scale-110 ${
                    favorites.includes(movie.id) ? 'fill-current' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}