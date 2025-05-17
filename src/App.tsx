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
        <div className="w-24 h-24 rounded-full animate-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-red-400 mb-3">Unable to Load Movies</h2>
          <p className="text-neutral-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-900">
        <nav className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clapperboard className="w-8 h-8 text-accent-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-400 to-accent-600 text-transparent bg-clip-text">
                DramaFlix
              </h1>
            </div>
            
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="relative flex-1 max-w-xl">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search movies..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 text-neutral-200 placeholder-neutral-500 rounded-xl border border-neutral-800 focus:outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  showFavorites
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-accent-500/50'
                }`}
              >
                <Heart
                  size={20}
                  className={`transition-transform duration-300 hover:scale-110 ${
                    showFavorites ? 'fill-current' : ''
                  }`}
                />
                <span className="hidden sm:inline font-medium">
                  Favorites
                </span>
                {favoritedMovies.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-neutral-800/50 rounded-full">
                    {favoritedMovies.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedMovie && (
          <div className="mb-12 animate-fade-in">
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

        <div className="space-y-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              {showFavorites ? (
                <>
                  <Heart className="text-accent-500" />
                  Favorite Movies
                </>
              ) : (
                'All Movies'
              )}
            </h2>
            
            {!showFavorites && (
              <p className="text-sm text-neutral-400">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} available
              </p>
            )}
          </div>

          <MovieGrid
            movies={showFavorites ? favoritedMovies : filteredMovies}
            onSelect={setSelectedMovie}
          />

          {showFavorites && favoritedMovies.length === 0 && (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-neutral-800 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-300 mb-2">
                No favorites yet
              </h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                Click the heart icon on any movie to add it to your favorites collection
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;