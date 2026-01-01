import { TMDBService } from '../services/tmdbService';
import { AuthService } from '../services/authService';
import { GeolocationService } from '../services/geolocationService';
import { Movie } from '../types';

class IndexPage {
  private currentPage: number = 1;
  private movies: Movie[] = [];

  constructor() {
    this.initializeAuth();
    this.loadTrendingMovies();
    // this.loadGeolocation();
    this.setupEventListeners();
  }

  private async loadGeolocation(): Promise<void> {
    // const geo = await GeolocationService.getGeolocation();
    // if (geo) {
    //   // stocker ou utiliser la géolocalisation si nécessaire
    //   (window as any).appGeolocation = geo;
    // }
  }

  private initializeAuth(): void {
    const loginBtn = document.getElementById('loginBtn')!;
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo')!;

    if (AuthService.isAuthenticated()) {
      this.updateAuthUI();
    }

    loginBtn.addEventListener('click', () => this.handleLogin());
    logoutBtn?.addEventListener('click', () => this.handleLogout());

    // Si TMDB redirige avec un request_token, finaliser la session
    const params = new URLSearchParams(window.location.search);
    const requestToken = params.get('request_token');
    if (requestToken) {
      // terminer l'authentification et recharger la page
      AuthService.createSession(requestToken)
        .then(() => {
          localStorage.setItem('auth_message', 'success');
          window.location.href = 'index.html';
        })
        .catch(err => {
          console.error('Failed to create session from redirect:', err);
          localStorage.setItem('auth_message', 'error');
          window.location.href = 'index.html';
        });
    }

    // Si un message d'auth est présent (créé après redirection), l'afficher
    const authMsg = localStorage.getItem('auth_message');
    if (authMsg) {
      if (authMsg === 'success') this.showSuccess('Connexion réussie.');
      else this.showError('Échec de la connexion.');
      localStorage.removeItem('auth_message');
    }
  }

  private showSuccess(message: string): void {
    const successDiv = document.getElementById('success')!;
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => { successDiv.style.display = 'none'; }, 5000);
  }

  private async handleLogin(): Promise<void> {
    try {
      const requestToken = await AuthService.createRequestToken();
      AuthService.redirectToTMDBAuth(requestToken);
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Erreur lors de la connexion');
    }
  }

  private handleLogout(): void {
    AuthService.logout();
    this.currentPage = 1;
    this.movies = [];
    window.location.href = 'index.html';
  }

  private updateAuthUI(): void {
    const loginBtn = document.getElementById('loginBtn')!;
    const userInfo = document.getElementById('userInfo')!;
    const user = AuthService.getUser();

    if (user) {
      loginBtn.style.display = 'none';
      userInfo.style.display = 'flex';
      document.getElementById('username')!.textContent = user.username;
      if (user.avatar) {
        (document.getElementById('userAvatar') as HTMLImageElement).src = user.avatar;
      }
    }
  }

  private setupEventListeners(): void {
    const loadMoreBtn = document.getElementById('loadMoreBtn')!;
    loadMoreBtn.addEventListener('click', () => this.loadMoreMovies());

    // Infinite scroll bonus
    window.addEventListener('scroll', () => this.handleInfiniteScroll());
  }

  private handleInfiniteScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 500) {
      const loadMoreBtn = document.getElementById('loadMoreBtn')!;
      if (loadMoreBtn.style.display !== 'none') {
        this.loadMoreMovies();
      }
    }
  }

  private async loadTrendingMovies(): Promise<void> {
    try {
      this.showLoading(true);
      const data = await TMDBService.getTrendingMovies(this.currentPage);
      this.movies = data.results;
      this.renderMovies();
    } catch (error) {
      console.error('Error loading trending movies:', error);
      this.showError('Erreur lors du chargement des films en tendance');
    } finally {
      this.showLoading(false);
    }
  }

  private async loadMoreMovies(): Promise<void> {
    try {
      this.showLoading(true);
      this.currentPage++;
      const data = await TMDBService.getTrendingMovies(this.currentPage);
      this.movies = [...this.movies, ...data.results];
      this.renderMovies();
    } catch (error) {
      console.error('Error loading more movies:', error);
      this.showError('Erreur lors du chargement de plus de films');
    } finally {
      this.showLoading(false);
    }
  }

  private renderMovies(): void {
    const container = document.getElementById('moviesContainer')!;
    container.innerHTML = this.movies.map(movie => `
      <div class="movie-card">
        <img src="${TMDBService.getImageUrl(movie.poster_path)}" alt="${movie.title}" class="movie-poster">
        <div class="movie-info">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-date">${new Date(movie.release_date).toLocaleDateString('fr-FR')}</div>
          <button class="more-info-btn" onclick="window.location.href='movie.html?id=${movie.id}'">
            En savoir plus
          </button>
        </div>
      </div>
    `).join('');
  }

  private showLoading(show: boolean): void {
    document.getElementById('loading')!.classList.toggle('active', show);
  }

  private showError(message: string): void {
    const errorDiv = document.getElementById('error')!;
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

new IndexPage();
