import { TMDBService } from '../services/tmdbService';
import { AuthService } from '../services/authService';
// ...existing code...
import { Movie, SearchResult } from '../types';

class SearchPage {
  private searchTimeout: NodeJS.Timeout | null = null;
  private currentPage: number = 1;
  private currentQuery: string = '';
  private results: Movie[] = [];
  private totalPages: number = 0;

  constructor() {
    this.initializeAuth();
    // ...existing code...
    this.setupEventListeners();
  }

  // ...existing code...

  private initializeAuth(): void {
    const loginBtn = document.getElementById('loginBtn')!;
    const logoutBtn = document.getElementById('logoutBtn');

    if (AuthService.isAuthenticated()) {
      this.updateAuthUI();
    }

    loginBtn.addEventListener('click', () => this.handleLogin());
    logoutBtn?.addEventListener('click', () => this.handleLogout());

    // Si TMDB redirige avec un request_token, finaliser la session
    const params = new URLSearchParams(window.location.search);
    const requestToken = params.get('request_token');
    if (requestToken) {
      AuthService.createSession(requestToken)
        .then(() => {
          localStorage.setItem('auth_message', 'success');
          window.location.href = 'search.html';
        })
        .catch(err => {
          console.error('Failed to create session from redirect:', err);
          localStorage.setItem('auth_message', 'error');
          window.location.href = 'search.html';
        });
    }

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
    window.location.href = 'search.html';
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
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const loadMoreBtn = document.getElementById('loadMoreBtn')!;

    searchInput.addEventListener('input', (e) => this.handleSearch(e));
    loadMoreBtn.addEventListener('click', () => this.loadMoreResults());

    // Infinite scroll bonus
    window.addEventListener('scroll', () => this.handleInfiniteScroll());
  }

  private handleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();

    // Éviter les recherches vides
    if (query.length < 2) {
      this.clearResults();
      return;
    }

    // Debounce la recherche
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentQuery = query;
      this.currentPage = 1;
      this.results = [];
      this.performSearch();
    }, 300);
  }

  private async performSearch(): Promise<void> {
    if (!this.currentQuery) return;

    try {
      this.showLoading(true);
      const data: SearchResult = await TMDBService.searchMovies(this.currentQuery, this.currentPage);
      
      this.results = data.results;
      this.totalPages = data.total_pages;

      if (this.results.length === 0) {
        this.showNoResults();
      } else {
        this.renderResults();
        this.updateLoadMoreButton();
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Erreur lors de la recherche');
    } finally {
      this.showLoading(false);
    }
  }

  private async loadMoreResults(): Promise<void> {
    if (!this.currentQuery) return;

    try {
      this.showLoading(true);
      this.currentPage++;
      const data: SearchResult = await TMDBService.searchMovies(this.currentQuery, this.currentPage);
      
      this.results = [...this.results, ...data.results];
      this.renderResults();
      this.updateLoadMoreButton();
    } catch (error) {
      console.error('Load more error:', error);
      this.showError('Erreur lors du chargement de plus de résultats');
    } finally {
      this.showLoading(false);
    }
  }

  private handleInfiniteScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 500) {
      const loadMoreBtn = document.getElementById('loadMoreBtn')!;
      if (loadMoreBtn.classList.contains('active')) {
        this.loadMoreResults();
      }
    }
  }

  private renderResults(): void {
    const container = document.getElementById('resultsContainer')!;
    const noResults = document.getElementById('noResults')!;

    if (this.results.length === 0) {
      container.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    container.innerHTML = this.results.map(movie => `
      <div class="movie-card">
        <img src="${TMDBService.getImageUrl(movie.poster_path)}" alt="${movie.title}" class="movie-poster">
        <div class="movie-info">
          <div class="movie-title">${movie.title}</div>
          <button class="more-info-btn" onclick="window.location.href='movie.html?id=${movie.id}'">
            En savoir plus
          </button>
        </div>
      </div>
    `).join('');
  }

  private updateLoadMoreButton(): void {
    const loadMoreBtn = document.getElementById('loadMoreBtn')!;
    if (this.currentPage < this.totalPages) {
      loadMoreBtn.classList.add('active');
    } else {
      loadMoreBtn.classList.remove('active');
    }
  }

  private clearResults(): void {
    const container = document.getElementById('resultsContainer')!;
    const noResults = document.getElementById('noResults')!;
    const loadMoreBtn = document.getElementById('loadMoreBtn')!;

    container.innerHTML = '';
    noResults.style.display = 'none';
    loadMoreBtn.classList.remove('active');
    this.results = [];
    this.currentPage = 1;
  }

  private showNoResults(): void {
    const container = document.getElementById('resultsContainer')!;
    const noResults = document.getElementById('noResults')!;
    const loadMoreBtn = document.getElementById('loadMoreBtn')!;

    container.innerHTML = '';
    noResults.style.display = 'block';
    loadMoreBtn.classList.remove('active');
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

new SearchPage();
