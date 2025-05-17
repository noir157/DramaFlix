import React, { useState } from 'react';
import { Search, Clapperboard, Heart } from 'lucide-react';
import { VideoPlayer } from './components/VideoPlayer';
import { MovieGrid } from './components/MovieGrid';
import { useMovies } from './hooks/useMovies';
import { Movie } from './types/movie';
import { useStore } from './store/useStore';

function App() {
  const { movies, isLoading, error } = useMovies();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites } = useStore();

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoritedMovies = movies.filter(movie => favorites.includes(movie.id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full animate-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Unable to Load Movies</h2>
          <p className="text-neutral-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-900">
        <nav className="max-w-7xl mx-auto px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-6 h-6 text-accent-500" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-accent-400 to-accent-600 text-transparent bg-clip-text">
                DramaFlix
              </h1>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search movies..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-neutral-900/50 text-neutral-200 placeholder-neutral-500 rounded-lg border border-neutral-800 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                  showFavorites
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-accent-500/50'
                }`}
              >
                <Heart
                  size={16}
                  className={`transition-transform duration-300 hover:scale-110 ${
                    showFavorites ? 'fill-current' : ''
                  }`}
                />
                <span className="hidden sm:inline font-medium">
                  Favorites
                </span>
                {favoritedMovies.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-800/50 rounded-full">
                    {favoritedMovies.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-4">
        {selectedMovie && (
          <div className="mb-6 animate-fade-in">
            <VideoPlayer
              src={selectedMovie.vimeo_url}
              movieId={selectedMovie.id}
              poster={selectedMovie.poster_url}
              onNext={() => {
                const currentMovies = showFavorites ? favoritedMovies : filteredMovies;
                const currentIndex = currentMovies.findIndex(m => m.id === selectedMovie.id);
                if (currentIndex < currentMovies.length - 1) {
                  setSelectedMovie(currentMovies[currentIndex + 1]);
                }
              }}
            />
          </div>
        )}

        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {showFavorites ? (
                <>
                  <Heart className="text-accent-500" size={18} />
                  Favorite Movies
                </>
              ) : (
                'All Movies'
              )}
            </h2>
            
            {!showFavorites && (
              <p className="text-sm text-neutral-400">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
              </p>
            )}
          </div>

          <MovieGrid
            movies={showFavorites ? favoritedMovies : filteredMovies}
            onSelect={setSelectedMovie}
          />

          {showFavorites && favoritedMovies.length === 0 && (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-neutral-800 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-neutral-300 mb-1">
                No favorites yet
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                Click the heart icon on any movie to add it to your favorites
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;