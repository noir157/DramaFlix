import React, { useState, useEffect } from 'react';
import { Search, Home, Heart, Film, Menu, X } from 'lucide-react';
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
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { favorites } = useStore();

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoritedMovies = movies.filter(movie => favorites.includes(movie.id));

  useEffect(() => {
    if (filteredMovies.length > 0 && !showFavorites) {
      const randomIndex = Math.floor(Math.random() * filteredMovies.length);
      setFeaturedMovie(filteredMovies[randomIndex]);
    }
  }, [filteredMovies.length, showFavorites]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-pulse-slow" />
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center p-4">
        <div className="bg-[#1A1C25] max-w-md mx-auto p-8 rounded-2xl text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Não foi possível carregar os filmes</h2>
          <p className="text-neutral-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] flex">
      {/* Navegação Lateral */}
      <nav className={`
        lg:w-64 bg-[#1A1C25] border-r border-white/[0.05] p-6 flex flex-col fixed h-screen z-50
        w-[280px] transition-transform duration-300 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-2 mb-12">
          <Film className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white">DramaFlix</h1>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden hover:bg-white/5 p-2 rounded-lg"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => {
              setShowFavorites(false);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              !showFavorites
                ? 'bg-blue-500/10 text-blue-500'
                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Home size={20} />
            <span className="font-medium">Página Inicial</span>
          </button>

          <button
            onClick={() => {
              setShowFavorites(true);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              showFavorites
                ? 'bg-blue-500/10 text-blue-500'
                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Heart size={20} />
            <span className="font-medium">Favoritos</span>
            {favoritedMovies.length > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                {favoritedMovies.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 lg:ml-64">
        {/* Cabeçalho */}
        <header className="sticky top-0 z-40 bg-[#0A0B0F]/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="px-4 lg:px-8 py-4 flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden hover:bg-white/5 p-2 rounded-lg"
            >
              <Menu size={24} className="text-neutral-400" />
            </button>
            
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Buscar filmes..."
                className="w-full bg-[#1A1C25] text-white placeholder-neutral-400 rounded-xl pl-12 pr-4 py-3 border border-white/[0.05] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Filme em Destaque ou Selecionado */}
          {selectedMovie ? (
            <div className="mb-8 lg:mb-12 animate-fade-in">
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
          ) : featuredMovie && !showFavorites ? (
            <div className="relative mb-8 lg:mb-12 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
              <img
                src={featuredMovie.poster_url}
                alt={featuredMovie.title}
                className="w-full h-[300px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 lg:p-8">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-300 mb-4">
                    {Array.isArray(featuredMovie.genre) && featuredMovie.genre.map((genre) => (
                      <span key={genre} className="px-2 py-1 bg-white/10 rounded-md">{genre}</span>
                    ))}
                  </div>
                  <h2 className="text-2xl lg:text-4xl font-bold text-white mb-2 lg:mb-4">{featuredMovie.title}</h2>
                  <p className="text-base lg:text-lg text-neutral-300 mb-4 lg:mb-6 line-clamp-2">
                    {featuredMovie.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setSelectedMovie(featuredMovie)}
                      className="px-4 lg:px-6 py-2.5 lg:py-3 text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      Assistir Agora
                    </button>
                    <button 
                      onClick={() => useStore.getState().toggleFavorite(featuredMovie.id)}
                      className="px-4 lg:px-6 py-2.5 lg:py-3 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      {favorites.includes(featuredMovie.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Grade de Filmes */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl lg:text-2xl font-bold text-white">
                {showFavorites ? 'Filmes Favoritos' : 'Todos os Filmes'}
              </h2>
              {!showFavorites && (
                <p className="text-sm text-neutral-400">
                  {filteredMovies.length} {filteredMovies.length === 1 ? 'filme' : 'filmes'}
                </p>
              )}
            </div>

            <MovieGrid
              movies={showFavorites ? favoritedMovies : filteredMovies}
              onSelect={setSelectedMovie}
            />

            {showFavorites && favoritedMovies.length === 0 && (
              <div className="bg-[#1A1C25] rounded-2xl py-12 lg:py-16 text-center">
                <Heart className="w-12 h-12 text-blue-500/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhum favorito ainda
                </h3>
                <p className="text-sm text-neutral-400 max-w-md mx-auto px-4">
                  Clique no ícone de coração em qualquer filme para adicioná-lo aos favoritos
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;