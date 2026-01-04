// Configuration de l'API TMDB
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzODc3Y2NkZjhkNDFiMmMwNDAyYTQ2YjMzYTFmODU1NiIsIm5iZiI6MTc2NjUxODEzOS43OTMsInN1YiI6IjY5NGFlZDdiNTdkNDhkY2VmMWIxZDQzNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.s7dVAKaihxDgIwKIEr3xcrCyabNxYLBHKMUNAO1ENEU";

const API_HEADERS = {
  Authorization: `Bearer ${TMDB_API_KEY}`,
  "Content-Type": "application/json",
};

// Service pour gérer les appels à l'API TMDB
class TMDBService {
  // Récupère les films en tendance
  static async getTrendingMovies(page = 1) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/trending/movie/day?page=${page}`,
        { headers: API_HEADERS }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des films:", error);
      throw error;
    }
  }

  // Recherche des films par titre
  static async searchMovies(query, page = 1) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
          query
        )}&page=${page}`,
        { headers: API_HEADERS }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      throw error;
    }
  }

  // Récupère les détails d'un film
  static async getMovieDetails(movieId) {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}`, {
        headers: API_HEADERS,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
      throw error;
    }
  }

  // Récupère les avis d'un film
  static async getMovieReviews(movieId) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/reviews`,
        { headers: API_HEADERS }
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des avis:", error);
      return [];
    }
  }

  // Construit l'URL de l'image
  static getImageUrl(posterPath) {
    if (!posterPath) {
      return "https://via.placeholder.com/500x750?text=No+Image";
    }
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }
}

// Service pour gérer l'authentification
const AUTH_API_URL = "/api/auth";

class AuthService {
  static SESSION_STORAGE_KEY = "tmdb_session";
  static USER_STORAGE_KEY = "tmdb_user";

  // Crée un token de requête pour l'authentification
  static async createRequestToken() {
    try {
      const response = await fetch(`${AUTH_API_URL}/request-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.request_token) {
        return data.request_token;
      } else {
        throw new Error("Impossible de créer le token");
      }
    } catch (error) {
      console.error("Erreur lors de la création du token:", error);
      throw error;
    }
  }

  // Redirige vers la page d'authentification TMDB
  static redirectToTMDBAuth(requestToken) {
    const redirectUrl =
      "https://viscously-stratospherical-loralee.ngrok-free.dev"; // Enlève les paramètres existants
    const authUrl = `https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=${encodeURIComponent(
      redirectUrl
    )}`;
    window.location.href = authUrl;
  }

  // Crée une session après authentification
  static async createSession(requestToken) {
    try {
      const response = await fetch(`${AUTH_API_URL}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_token: requestToken }),
      });
      const data = await response.json();

      if (data.sessionId) {
        // Sauvegarde la session dans le localStorage
        const sessionId = data.sessionId;
        localStorage.setItem(this.SESSION_STORAGE_KEY, sessionId);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(data.user));
        return sessionId;
      } else {
        throw new Error("Impossible de créer la session");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session:", error);
      throw error;
    }
  }

  // Vérifie si l'utilisateur est connecté
  static isAuthenticated() {
    const sessionId = localStorage.getItem(this.SESSION_STORAGE_KEY);
    return sessionId !== null;
  }

  // Récupère l'ID de session
  static getSessionId() {
    return localStorage.getItem(this.SESSION_STORAGE_KEY);
  }

  // Récupère les infos de l'utilisateur
  static getUser() {
    const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }

  // Déconnecte l'utilisateur
  static logout() {
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
    localStorage.removeItem(this.USER_STORAGE_KEY);
  }

  // Ajoute un avis pour un film
  static async addReview(movieId, rating, comment) {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      return false;
    }

    try {
      const response = await fetch(`/api/movie/${movieId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          rating: rating,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'avis:", error);
      return false;
    }
  }
}

// Classe principale pour la page de recherche
class SearchApp {
  constructor() {
    this.searchTimeout = null; // Timeout pour le debouncing de la recherche
    this.currentPage = 1; // Page actuelle des résultats
    this.currentQuery = ""; // Requête de recherche actuelle
    this.results = []; // Résultats de la recherche
    this.totalPages = 0; // Nombre total de pages disponibles

    // Initialisation de l'application
    this.initializeAuth();
    this.setupEventListeners();
  }

  // Configure l'authentification
  initializeAuth() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    // Met à jour l'interface si l'utilisateur est connecté
    if (AuthService.isAuthenticated()) {
      this.updateAuthUI();
    }

    // Gestionnaires d'événements pour connexion/déconnexion
    loginBtn.addEventListener("click", () => this.handleLogin());
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }

    // Gestion du retour après authentification TMDB
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get("request_token");

    if (requestToken) {
      // On a un token de retour, on crée la session
      AuthService.createSession(requestToken)
        .then(() => {
          localStorage.setItem("auth_message", "success");
          window.location.href = "search.html";
        })
        .catch((error) => {
          console.error("Erreur lors de la création de la session:", error);
          localStorage.setItem("auth_message", "error");
          window.location.href = "search.html";
        });
    }

    // Affiche les messages de succès/erreur
    const authMessage = localStorage.getItem("auth_message");
    if (authMessage) {
      if (authMessage === "success") {
        this.showSuccess("Connexion réussie.");
      } else {
        this.showError("Échec de la connexion.");
      }
      localStorage.removeItem("auth_message");
    }
  }

  // Affiche un message de succès
  showSuccess(message) {
    const successElement = document.getElementById("success");
    successElement.textContent = message;
    successElement.style.display = "block";

    // Cache le message après 5 secondes
    setTimeout(() => {
      successElement.style.display = "none";
    }, 5000);
  }

  // Gère la connexion
  async handleLogin() {
    try {
      const requestToken = await AuthService.createRequestToken();
      AuthService.redirectToTMDBAuth(requestToken);
    } catch (error) {
      console.error("Erreur de connexion:", error);
      this.showError("Erreur lors de la connexion");
    }
  }

  // Gère la déconnexion
  handleLogout() {
    AuthService.logout();
    window.location.href = "search.html";
  }

  // Met à jour l'interface utilisateur après connexion
  updateAuthUI() {
    const loginBtn = document.getElementById("loginBtn");
    const userInfo = document.getElementById("userInfo");
    const user = AuthService.getUser();

    if (user) {
      loginBtn.style.display = "none";
      userInfo.style.display = "flex";
      document.getElementById("username").textContent = user.username;

      if (user.avatar) {
        document.getElementById("userAvatar").src = user.avatar;
      }
    }
  }

  // Configure les écouteurs d'événements
  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    // Événement de saisie dans la barre de recherche
    searchInput.addEventListener("input", (event) => this.handleSearch(event));

    // Bouton "Charger plus"
    loadMoreBtn.addEventListener("click", () => this.loadMoreResults());

    // Scroll infini
    window.addEventListener("scroll", () => this.handleInfiniteScroll());
  }

  // Gère la saisie dans la barre de recherche (avec debouncing)
  handleSearch(event) {
    const query = event.target.value.trim();

    // Si la recherche est trop courte, on efface les résultats
    if (query.length < 2) {
      this.clearResults();
      return;
    }

    // Debouncing : on attend 300ms avant de lancer la recherche
    // Cela évite de faire trop de requêtes pendant que l'utilisateur tape
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentQuery = query;
      this.currentPage = 1;
      this.results = [];
      this.performSearch();
    }, 300); // Délai de 300ms
  }

  // Effectue la recherche
  async performSearch() {
    if (!this.currentQuery) {
      return;
    }

    try {
      this.showLoading(true);

      const data = await TMDBService.searchMovies(
        this.currentQuery,
        this.currentPage
      );

      this.results = data.results;
      this.totalPages = data.total_pages;

      if (this.results.length === 0) {
        this.showNoResults();
      } else {
        this.renderResults();
        this.updateLoadMoreButton();
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
      this.showError("Erreur lors de la recherche");
    } finally {
      this.showLoading(false);
    }
  }

  // Charge plus de résultats (pagination)
  async loadMoreResults() {
    if (!this.currentQuery) {
      return;
    }

    try {
      this.showLoading(true);
      this.currentPage++;

      const data = await TMDBService.searchMovies(
        this.currentQuery,
        this.currentPage
      );

      // Ajoute les nouveaux résultats aux existants
      this.results = [...this.results, ...data.results];

      this.renderResults();
      this.updateLoadMoreButton();
    } catch (error) {
      console.error("Erreur lors du chargement de plus de résultats:", error);
      this.showError("Erreur lors du chargement de plus de résultats");
    } finally {
      this.showLoading(false);
    }
  }

  // Gère le scroll infini
  handleInfiniteScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // Si on est proche du bas de la page et qu'il reste des résultats
    if (scrollPosition >= documentHeight - 500) {
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      if (loadMoreBtn.classList.contains("active")) {
        this.loadMoreResults();
      }
    }
  }

  // Affiche les résultats de recherche dans le DOM
  renderResults() {
    const resultsContainer = document.getElementById("resultsContainer");
    const noResults = document.getElementById("noResults");

    if (this.results.length === 0) {
      resultsContainer.innerHTML = "";
      noResults.style.display = "block";
      return;
    }

    noResults.style.display = "none";

    // Génère le HTML pour chaque résultat
    const resultsHTML = this.results
      .map((movie) => {
        const posterUrl = TMDBService.getImageUrl(movie.poster_path);

        return `
          <div class="movie-card">
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
              <div class="movie-title">${movie.title}</div>
              <button class="more-info-btn" onclick="window.location.href='movie.html?id=${movie.id}'">
                En savoir plus
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    resultsContainer.innerHTML = resultsHTML;
  }

  // Met à jour l'état du bouton "Charger plus"
  updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    // Active le bouton seulement s'il reste des pages à charger
    if (this.currentPage < this.totalPages) {
      loadMoreBtn.classList.add("active");
    } else {
      loadMoreBtn.classList.remove("active");
    }
  }

  // Efface tous les résultats
  clearResults() {
    const resultsContainer = document.getElementById("resultsContainer");
    const noResults = document.getElementById("noResults");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    resultsContainer.innerHTML = "";
    noResults.style.display = "none";
    loadMoreBtn.classList.remove("active");

    this.results = [];
    this.currentPage = 1;
  }

  // Affiche le message "Aucun résultat"
  showNoResults() {
    const resultsContainer = document.getElementById("resultsContainer");
    const noResults = document.getElementById("noResults");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    resultsContainer.innerHTML = "";
    noResults.style.display = "block";
    loadMoreBtn.classList.remove("active");
  }

  // Affiche/cache l'indicateur de chargement
  showLoading(isLoading) {
    const loadingElement = document.getElementById("loading");
    if (isLoading) {
      loadingElement.classList.add("active");
    } else {
      loadingElement.classList.remove("active");
    }
  }

  // Affiche un message d'erreur
  showError(message) {
    const errorElement = document.getElementById("error");
    errorElement.textContent = message;
    errorElement.style.display = "block";

    // Cache le message après 5 secondes
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  }
}

// Initialise l'application quand le DOM est chargé
const app = new SearchApp();
