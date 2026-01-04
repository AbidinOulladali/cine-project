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

  // Récupère les détails d'un film spécifique
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

  // Récupère les avis/reviews d'un film
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

  // Construit l'URL complète de l'image
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

  // Ajoute un avis/note pour un film
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

// Classe principale pour la page de détails du film
class MovieDetailsApp {
  constructor() {
    this.movieId = null; // ID du film à afficher
    this.movie = null; // Données du film
    this.comments = []; // Liste des commentaires
    this.selectedRating = 0; // Note sélectionnée par l'utilisateur (0-10)

    // Récupère l'ID du film depuis l'URL
    this.movieId = this.getMovieIdFromURL();

    // Si on a un ID de film valide, on initialise l'application
    if (this.movieId) {
      this.initializeAuth();
      //this.loadGeolocation();
      this.loadMovie();
      this.loadComments();
    }
  }

  // Extrait l'ID du film depuis l'URL (ex: movie.html?id=123)
  getMovieIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    return id ? parseInt(id, 10) : null;
  }

  // Configure l'authentification et les événements
  initializeAuth() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginLink = document.getElementById("loginLink");

    // Si l'utilisateur est déjà connecté
    if (AuthService.isAuthenticated()) {
      this.updateAuthUI();
      this.setupReviewForm();
    } else {
      // Sinon, on affiche le message pour se connecter
      this.showLoginMessage();
    }

    // Gestionnaires d'événements
    loginBtn.addEventListener("click", () => this.handleLogin());
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }
    if (loginLink) {
      loginLink.addEventListener("click", (event) => {
        event.preventDefault();
        this.handleLogin();
      });
    }

    // Gestion du retour après authentification TMDB
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get("request_token");

    if (requestToken) {
      this.completeAuthentication(requestToken);
    }
  }

  // Lance le processus de connexion
  async handleLogin() {
    try {
      const requestToken = await AuthService.createRequestToken();
      AuthService.redirectToTMDBAuth(requestToken);
    } catch (error) {
      console.error("Erreur de connexion:", error);
      this.showError("Erreur lors de la connexion");
    }
  }

  // Finalise l'authentification après le retour de TMDB
  async completeAuthentication(requestToken) {
    try {
      await AuthService.createSession(requestToken);
      // Redirige vers la page du film (sans le token dans l'URL)
      window.location.href = `movie.html?id=${this.movieId}`;
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      this.showError("Erreur lors de la finalisation de la connexion");
    }
  }

  // Gère la déconnexion
  handleLogout() {
    AuthService.logout();
    window.location.href = `movie.html?id=${this.movieId}`;
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

  // Affiche le message de connexion pour laisser un avis
  showLoginMessage() {
    const ratingSection = document.getElementById("ratingSection");
    const loginMessage = document.getElementById("loginMessage");
    const reviewForm = document.getElementById("reviewForm");

    ratingSection.style.display = "block";
    loginMessage.style.display = "block";
    reviewForm.style.display = "none";
  }

  // Configure le formulaire d'avis (système d'étoiles)
  setupReviewForm() {
    const ratingSection = document.getElementById("ratingSection");
    const loginMessage = document.getElementById("loginMessage");
    const reviewForm = document.getElementById("reviewForm");
    const ratingStars = document.getElementById("ratingStars");

    ratingSection.style.display = "block";
    loginMessage.style.display = "none";
    reviewForm.style.display = "block";

    // Crée les 10 étoiles cliquables
    for (let i = 1; i <= 10; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = "★";

      // Événement de clic pour sélectionner une note
      star.addEventListener("click", () => this.setRating(i));

      // Événement de survol pour prévisualiser
      star.addEventListener("mouseover", () => this.previewRating(i));

      ratingStars.appendChild(star);
    }

    // Quand on sort de la zone d'étoiles, on revient à la note sélectionnée
    ratingStars.addEventListener("mouseleave", () =>
      this.previewRating(this.selectedRating)
    );

    // Gestion de la soumission du formulaire
    reviewForm.addEventListener("submit", (event) =>
      this.handleReviewSubmit(event)
    );
  }

  // Définit la note sélectionnée
  setRating(rating) {
    this.selectedRating = rating;
    this.previewRating(rating);
  }

  // Affiche visuellement la note (survol ou sélection)
  previewRating(rating) {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }

  // Gère la soumission du formulaire d'avis
  async handleReviewSubmit(event) {
    event.preventDefault();

    // Vérifie qu'une note a été sélectionnée
    if (this.selectedRating === 0) {
      this.showError("Veuillez sélectionner une note");
      return;
    }

    // Récupère le texte de l'avis
    const reviewText = document.getElementById("reviewText").value;

    if (!reviewText.trim()) {
      this.showError("Veuillez écrire un avis");
      return;
    }

    try {
      if (!this.movieId) {
        return;
      }

      // Envoie l'avis au serveur
      const success = await AuthService.addReview(
        this.movieId,
        this.selectedRating,
        reviewText
      );

      if (success) {
        this.showSuccess("Votre avis a été publié !");

        // Réinitialise le formulaire
        document.getElementById("reviewForm").reset();
        this.selectedRating = 0;
        this.previewRating(0);

        // Recharge les commentaires après 1 seconde
        setTimeout(() => this.loadComments(), 1000);
      } else {
        this.showError("Erreur lors de la publication de l'avis");
      }
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      this.showError("Erreur lors de la publication de l'avis");
    }
  }

  // Charge les détails du film
  async loadMovie() {
    if (!this.movieId) {
      return;
    }

    try {
      const movieContent = document.getElementById("movieContent");
      movieContent.style.display = "none";

      // Récupère les données du film
      this.movie = await TMDBService.getMovieDetails(this.movieId);
      this.renderMovie();

      movieContent.style.display = "block";
    } catch (error) {
      console.error("Erreur lors du chargement du film:", error);
      this.showError("Erreur lors du chargement du film");
    } finally {
      this.hideLoading();
    }
  }

  // Affiche les détails du film dans le DOM
  renderMovie() {
    if (!this.movie) {
      return;
    }

    // Remplit les éléments HTML avec les données du film
    document.getElementById("title").textContent = this.movie.title;
    document.getElementById("poster").src = TMDBService.getImageUrl(
      this.movie.poster_path
    );
    document.getElementById("overview").textContent = this.movie.overview;

    // Formate la date de sortie
    const releaseDate = new Date(this.movie.release_date).toLocaleDateString(
      "fr-FR"
    );
    document.getElementById("releaseDate").textContent = releaseDate;

    // Affiche la note moyenne
    const rating = (this.movie.vote_average || 0).toFixed(1);
    document.getElementById("rating").textContent = `${rating}/10`;
  }

  // Charge les commentaires/avis du film
  async loadComments() {
    if (!this.movieId) {
      return;
    }

    try {
      this.comments = await TMDBService.getMovieReviews(this.movieId);
      this.renderComments();
    } catch (error) {
      console.error("Erreur lors du chargement des avis:", error);
      this.showError("Erreur lors du chargement des avis");
    }
  }

  // Affiche les commentaires dans le DOM
  renderComments() {
    const commentsContainer = document.getElementById("commentsContainer");

    if (this.comments.length === 0) {
      commentsContainer.innerHTML =
        '<div class="no-comments">Aucun avis pour le moment.</div>';
      return;
    }

    // Génère le HTML pour chaque commentaire
    const commentsHTML = this.comments
      .map((comment) => {
        // Gère l'avatar (s'il existe)
        const avatarHTML = comment.author_details.avatar_path
          ? `<img src="${comment.author_details.avatar_path}" alt="${comment.author_details.name}" class="comment-avatar">`
          : '<div class="comment-avatar"></div>';

        // Nom de l'auteur
        const authorName = comment.author_details.name || comment.author;

        // Date de création
        const date = new Date(comment.created_at).toLocaleDateString("fr-FR");

        // Contenu du commentaire (échappé pour éviter XSS)
        const content = this.escapeHtml(comment.content);

        return `
          <div class="comment">
            <div class="comment-header">
              ${avatarHTML}
              <div class="comment-info">
                <div class="comment-author">${authorName}</div>
                <div class="comment-date">${date}</div>
              </div>
            </div>
            <div class="comment-content">${content}</div>
          </div>
        `;
      })
      .join("");

    commentsContainer.innerHTML = commentsHTML;
  }

  // Échappe le HTML pour éviter les attaques XSS
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Cache l'indicateur de chargement
  hideLoading() {
    document.getElementById("loading").style.display = "none";
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
}

// Initialise l'application quand le DOM est chargé
const app = new MovieDetailsApp();
