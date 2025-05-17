document.addEventListener("DOMContentLoaded", () => {
  const player = document.getElementById("player");
  const listaFilmes = document.getElementById("lista");
  const currentTitle = document.getElementById("current-title");
  const currentDescription = document.getElementById("current-description");
  const searchInput = document.getElementById("search");

  let filmesList = [];
  let isLoading = false;

  const setLoading = (loading) => {
    isLoading = loading;
    if (loading) {
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "loading";
      player.parentElement.appendChild(loadingDiv);
      player.style.opacity = "0.5";
    } else {
      const loadingDiv = player.parentElement.querySelector(".loading");
      if (loadingDiv) loadingDiv.remove();
      player.style.opacity = "1";
    }
  };

  const renderFilmes = (filmes) => {
    listaFilmes.innerHTML = '';
    filmes.forEach(filme => {
      const container = document.createElement("div");
      container.className = "filme-item";

      const img = document.createElement("img");
      img.src = filme.poster_url.trim();
      img.alt = filme.title;
      img.loading = "lazy"; // Lazy loading for better performance

      const infoDiv = document.createElement("div");
      infoDiv.className = "filme-info";

      const title = document.createElement("h3");
      title.textContent = filme.title;

      const description = document.createElement("p");
      description.textContent = filme.description || "Sem descrição disponível";

      infoDiv.appendChild(title);
      infoDiv.appendChild(description);

      container.appendChild(img);
      container.appendChild(infoDiv);

      container.onclick = async () => {
        const videoUrl = filme.vimeo_url.trim();
        if (videoUrl) {
          setLoading(true);
          try {
            // Update player
            player.querySelector("source").src = videoUrl;
            player.load();
            
            // Update info with smooth transition
            currentTitle.style.opacity = "0";
            currentDescription.style.opacity = "0";
            
            setTimeout(() => {
              currentTitle.textContent = filme.title;
              currentDescription.textContent = filme.description || "Sem descrição disponível";
              currentTitle.style.opacity = "1";
              currentDescription.style.opacity = "1";
            }, 300);

            // Scroll to player with smooth animation
            player.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Start playing after a short delay
            setTimeout(() => {
              player.play();
              setLoading(false);
            }, 1000);
          } catch (error) {
            console.error("Erro ao carregar o vídeo:", error);
            setLoading(false);
            alert("Ocorreu um erro ao carregar o vídeo. Por favor, tente novamente.");
          }
        } else {
          alert("Este filme não possui link de vídeo disponível no momento.");
        }
      };

      listaFilmes.appendChild(container);
    });
  };

  // Search functionality with debounce
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredFilmes = filmesList.filter(filme => 
        filme.title.toLowerCase().includes(searchTerm)
      );
      renderFilmes(filteredFilmes);
    }, 300);
  });

  // Load movies with error handling and loading state
  const loadMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch("filmes.json");
      if (!response.ok) throw new Error("Falha ao carregar os dados");
      
      const filmes = await response.json();
      if (!Array.isArray(filmes)) {
        throw new Error("Formato de dados inválido");
      }
      
      filmesList = filmes;
      renderFilmes(filmes);
    } catch (err) {
      console.error("Erro ao carregar filmes:", err);
      listaFilmes.innerHTML = `
        <div style="text-align: center; padding: 2rem; grid-column: 1/-1;">
          <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Ops! Algo deu errado.</h3>
          <p>Não foi possível carregar os filmes. Tente novamente mais tarde.</p>
        </div>
      `;
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  loadMovies();

  // Handle video player events
  player.addEventListener("play", () => {
    player.classList.add("playing");
  });

  player.addEventListener("pause", () => {
    player.classList.remove("playing");
  });

  player.addEventListener("ended", () => {
    player.classList.remove("playing");
  });

  // Handle errors in video playback
  player.addEventListener("error", () => {
    setLoading(false);
    alert("Ocorreu um erro ao reproduzir o vídeo. Por favor, tente novamente.");
  });
});