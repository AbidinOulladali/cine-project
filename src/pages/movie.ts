import { TMDBService } from '../services/tmdbService';
import { AuthService } from '../services/authService';
// ...existing code...
import { Movie, Comment } from '../types';

class MoviePage {
  private movieId: number | null = null;
  private movie: Movie | null = null;
  private comments: Comment[] = [];
  private selectedRating: number = 0;

  constructor() {
    this.movieId = this.getMovieIdFromURL();
    if (this.movieId) {
      this.initializeAuth();
      // ...existing code...
      this.loadMovie();
      this.loadComments();
    }
  }

  // ...existing code...

  private getMovieIdFromURL(): number | null {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? parseInt(id, 10) : null;
  }

  private initializeAuth(): void {
    const loginBtn = document.getElementById('loginBtn')!;
    const logoutBtn = document.getElementById('logoutBtn');
    const loginLink = document.getElementById('loginLink');

    if (AuthService.isAuthenticated()) {
      this.updateAuthUI();
      this.setupReviewForm();
    } else {
      this.showLoginMessage();
    }

    loginBtn.addEventListener('click', () => this.handleLogin());
    logoutBtn?.addEventListener('click', () => this.handleLogout());
    loginLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Vérifier si l'authentification vient d'être complétée
    const params = new URLSearchParams(window.location.search);
    const requestToken = params.get('request_token');
    if (requestToken) {
      this.completeAuthentication(requestToken);
    }
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

  private async completeAuthentication(requestToken: string): Promise<void> {
    try {
      await AuthService.createSession(requestToken);
      window.location.href = `movie.html?id=${this.movieId}`;
    } catch (error) {
      console.error('Authentication error:', error);
      this.showError('Erreur lors de la finalisation de la connexion');
    }
  }

  private handleLogout(): void {
    AuthService.logout();
    window.location.href = `movie.html?id=${this.movieId}`;
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

  private showLoginMessage(): void {
    const ratingSection = document.getElementById('ratingSection')!;
    const loginMessage = document.getElementById('loginMessage')!;
    const reviewForm = document.getElementById('reviewForm')!;

    ratingSection.style.display = 'block';
    loginMessage.style.display = 'block';
    reviewForm.style.display = 'none';
  }

  private setupReviewForm(): void {
    const ratingSection = document.getElementById('ratingSection')!;
    const loginMessage = document.getElementById('loginMessage')!;
    const reviewForm = document.getElementById('reviewForm')!;
    const ratingStarsContainer = document.getElementById('ratingStars')!;

    ratingSection.style.display = 'block';
    loginMessage.style.display = 'none';
    reviewForm.style.display = 'block';

    // Créer les étoiles pour la note
    for (let i = 1; i <= 10; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.textContent = '★';
      star.addEventListener('click', () => this.setRating(i));
      star.addEventListener('mouseover', () => this.previewRating(i));
      ratingStarsContainer.appendChild(star);
    }
    ratingStarsContainer.addEventListener('mouseleave', () => this.previewRating(this.selectedRating));

    reviewForm.addEventListener('submit', (e) => this.handleReviewSubmit(e));
  }

  private setRating(rating: number): void {
    this.selectedRating = rating;
    this.previewRating(rating);
  }

  private previewRating(rating: number): void {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  private async handleReviewSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.selectedRating === 0) {
      this.showError('Veuillez sélectionner une note');
      return;
    }

    const reviewText = (document.getElementById('reviewText') as HTMLTextAreaElement).value;
    if (!reviewText.trim()) {
      this.showError('Veuillez écrire un avis');
      return;
    }

    try {
      if (!this.movieId) return;
      
      const success = await AuthService.addReview(this.movieId, this.selectedRating, reviewText);
      
      if (success) {
        this.showSuccess('Votre avis a été publié !');
        (document.getElementById('reviewForm') as HTMLFormElement).reset();
        this.selectedRating = 0;
        this.previewRating(0);
        
        // Recharger les commentaires
        setTimeout(() => this.loadComments(), 1000);
      } else {
        this.showError('Erreur lors de la publication de l\'avis');
      }
    } catch (error) {
      console.error('Review error:', error);
      this.showError('Erreur lors de la publication de l\'avis');
    }
  }

  private async loadMovie(): Promise<void> {
    if (!this.movieId) return;

    try {
      const movieContent = document.getElementById('movieContent')!;
      movieContent.style.display = 'none';

      this.movie = await TMDBService.getMovieDetails(this.movieId);
      
      this.renderMovie();
      movieContent.style.display = 'block';
    } catch (error) {
      console.error('Error loading movie:', error);
      this.showError('Erreur lors du chargement du film');
    } finally {
      this.hideLoading();
    }
  }

  private renderMovie(): void {
    if (!this.movie) return;

    document.getElementById('title')!.textContent = this.movie.title;
    (document.getElementById('poster') as HTMLImageElement).src = TMDBService.getImageUrl(this.movie.poster_path);
    document.getElementById('overview')!.textContent = this.movie.overview;
    document.getElementById('releaseDate')!.textContent = 
      new Date(this.movie.release_date).toLocaleDateString('fr-FR');
    document.getElementById('rating')!.textContent = 
      `${(this.movie.vote_average || 0).toFixed(1)}/10`;
  }

  private async loadComments(): Promise<void> {
    if (!this.movieId) return;

    try {
      this.comments = await TMDBService.getMovieReviews(this.movieId);
      this.renderComments();
    } catch (error) {
      console.error('Error loading comments:', error);
      this.showError('Erreur lors du chargement des avis');
    }
  }

  private renderComments(): void {
    const container = document.getElementById('commentsContainer')!;

    if (this.comments.length === 0) {
      container.innerHTML = '<div class="no-comments">Aucun avis pour le moment.</div>';
      return;
    }

    container.innerHTML = this.comments.map(comment => `
      <div class="comment">
        <div class="comment-header">
          ${comment.author_details.avatar_path ? 
            `<img src="${comment.author_details.avatar_path}" alt="${comment.author_details.name}" class="comment-avatar">` :
            `<div class="comment-avatar"></div>`
          }
          <div class="comment-info">
            <div class="comment-author">${comment.author_details.name || comment.author}</div>
            <div class="comment-date">${new Date(comment.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        <div class="comment-content">${this.escapeHtml(comment.content)}</div>
      </div>
    `).join('');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private hideLoading(): void {
    document.getElementById('loading')!.style.display = 'none';
  }

  private showError(message: string): void {
    const errorDiv = document.getElementById('error')!;
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  private showSuccess(message: string): void {
    const successDiv = document.getElementById('success')!;
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 5000);
  }
}

new MoviePage();
