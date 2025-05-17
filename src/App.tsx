import React, { useState } from 'react';
import { Search, Clapperboard, Heart, Github } from 'lucide-react';
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
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-accent-500/20 animate-pulse-slow" />
          <div className="absolute inset-0 rounded-full border-t-2 border-accent-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4">
        <div className="glass-panel max-w-md mx-auto p-8 rounded-2xl text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Unable to Load Movies</h2>
          <p className="text-neutral-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014]">
      <header className="sticky top-0 z-50 glass-effect">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-accent-500/20 blur-xl rounded-full" />
                <Clapperboard className="relative w-7 h-7 text-accent-400" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-accent-200 via-accent-400 to-accent-600 text-transparent bg-clip-text">
                DramaFlix
              </h1>
            </div>
            
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md group">
                <div className="absolute inset-0 bg-accent-500/10 blur rounded-xl transition-all group-focus-within:bg-accent-500/20" />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-accent-400 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search movies..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-black/20 text-neutral-200 placeholder-neutral-500 rounded-xl border border-white/[0.08] focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all relative"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`relative group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  showFavorites
                    ? 'bg-accent-500 text-white'
                    : 'glass-effect text-neutral-300 hover:text-accent-400'
                }`}
              >
                <Heart
                  size={18}
                  className={`transition-transform duration-300 group-hover:scale-110 ${
                    showFavorites ? 'fill-current' : ''
                  }`}
                />
                <span className="hidden sm:inline font-medium">
                  Favorites
                </span>
                {favoritedMovies.length > 0 && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-accent-500 text-white rounded-full">
                    {favoritedMovies.length}
                  </span>
                )}
              </button>

              <a
                href="https://github.com/noir157"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-effect px-4 py-2 rounded-xl text-neutral-300 hover:text-accent-400 transition-colors flex items-center gap-2"
                title="View on GitHub"
              >
                <Github size={18} />
                <span className="text-sm font-medium bg-gradient-to-r from-accent-200 via-accent-400 to-accent-600 text-transparent bg-clip-text whitespace-nowrap">
                  by Noir
                </span>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectedMovie && (
          <div className="mb-8 animate-fade-in">
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

        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {showFavorites ? (
                <>
                  <Heart className="text-accent-400" size={20} />
                  <span className="bg-gradient-to-r from-accent-200 to-accent-400 text-transparent bg-clip-text">
                    Favorite Movies
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-accent-200 to-accent-400 text-transparent bg-clip-text">
                  All Movies
                </span>
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
            <div className="glass-panel rounded-2xl py-16 text-center">
              <Heart className="w-12 h-12 text-accent-500/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                No favorites yet
              </h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
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