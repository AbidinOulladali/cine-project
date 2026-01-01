// Service d'authentification TMDB
// Documentation: https://www.themoviedb.org/settings/api/request_token
import { User } from "../types";

const AUTH_API_URL = "http://localhost:3001/api/auth";
const TMDB_AUTH_URL = "https://www.themoviedb.org/authenticate";

export class AuthService {
  private static readonly STORAGE_KEY = "tmdb_session";
  private static readonly USER_KEY = "tmdb_user";

  // Étape 1: Créer un request token via le backend
  static async createRequestToken(): Promise<string> {
    const response = await fetch(`${AUTH_API_URL}/request-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    const data = await response.json();
    if (data.request_token) {
      return data.request_token;
    }
    throw new Error("Failed to create request token");
  }

  // Étape 2: Rediriger vers TMDB pour se connecter
  static redirectToTMDBAuth(requestToken: string): void {
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    // Utiliser l'URL /authenticate/{request_token} recommandée par TMDB
    window.location.href = `${TMDB_AUTH_URL}/${requestToken}?redirect_to=${encodeURIComponent(
      redirectUrl
    )}`;
  }

  // Étape 3: Créer une session après l'authentification via le backend
  static async createSession(requestToken: string): Promise<string> {
    const response = await fetch(`${AUTH_API_URL}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request_token: requestToken }),
      credentials: "include",
    });
    const data = await response.json();
    if (data.sessionId) {
      const sessionId = data.sessionId;
      localStorage.setItem(this.STORAGE_KEY, sessionId);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
      return sessionId;
    }
    throw new Error("Failed to create session");
  }

  // Vérifier si l'utilisateur est connecté
  static isAuthenticated(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY);
  }

  // Récupérer la session actuelle
  static getSessionId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  // Récupérer les données utilisateur
  static getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Se déconnecter
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Ajouter une review/commentaire via le backend
  static async addReview(
    movieId: number,
    rating: number,
    review?: string
  ): Promise<boolean> {
    const sessionId = this.getSessionId();
    if (!sessionId) return false;

    const response = await fetch(`http://localhost:3001/api/movie/${movieId}/rating`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, rating }),
      credentials: "include",
    });

    return response.ok;
  }
}
