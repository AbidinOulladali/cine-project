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

// Classe principale de l'application
class MovieApp {
  constructor() {
    this.currentPage = 1;
    this.movies = [];

    // Initialisation de l'application
    this.initializeAuth();
    this.loadTrendingMovies();
    this.setupEventListeners();
  }

  // Configure l'authentification
  initializeAuth() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userInfo = document.getElementById("userInfo");

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
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Erreur lors de la création de la session:", error);
          localStorage.setItem("auth_message", "error");
          window.location.href = "index.html";
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
    this.currentPage = 1;
    this.movies = [];
    window.location.href = "index.html";
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
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    loadMoreBtn.addEventListener("click", () => this.loadMoreMovies());

    // Scroll infini
    window.addEventListener("scroll", () => this.handleInfiniteScroll());
  }

  // Gère le scroll infini
  handleInfiniteScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // Si on est proche du bas de la page
    if (scrollPosition >= documentHeight - 500) {
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      if (loadMoreBtn.style.display !== "none") {
        this.loadMoreMovies();
      }
    }
  }

  // Charge les films en tendance
  async loadTrendingMovies() {
    try {
      this.showLoading(true);
      const data = await TMDBService.getTrendingMovies(this.currentPage);
      this.movies = data.results;
      this.renderMovies();
    } catch (error) {
      console.error("Erreur lors du chargement des films:", error);
      this.showError("Erreur lors du chargement des films en tendance");
    } finally {
      this.showLoading(false);
    }
  }

  // Charge plus de films
  async loadMoreMovies() {
    try {
      this.showLoading(true);
      this.currentPage++;
      const data = await TMDBService.getTrendingMovies(this.currentPage);
      this.movies = [...this.movies, ...data.results];
      this.renderMovies();
    } catch (error) {
      console.error("Erreur lors du chargement de plus de films:", error);
      this.showError("Erreur lors du chargement de plus de films");
    } finally {
      this.showLoading(false);
    }
  }

  // Affiche les films dans le DOM
  renderMovies() {
    const moviesContainer = document.getElementById("moviesContainer");

    // Génère le HTML pour chaque film
    const moviesHTML = this.movies
      .map((movie) => {
        const posterUrl = TMDBService.getImageUrl(movie.poster_path);
        const releaseDate = new Date(movie.release_date).toLocaleDateString(
          "fr-FR"
        );

        return `
          <div class="movie-card">
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
              <div class="movie-title">${movie.title}</div>
              <div class="movie-date">${releaseDate}</div>
              <button class="more-info-btn" onclick="window.location.href='movie.html?id=${movie.id}'">
                En savoir plus
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    moviesContainer.innerHTML = moviesHTML;
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
const app = new MovieApp();
