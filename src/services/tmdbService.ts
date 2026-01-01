// Configuration et services pour l'API TMDB
import { Movie, SearchResult, Comment } from "../types";

const TMDB_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzODc3Y2NkZjhkNDFiMmMwNDAyYTQ2YjMzYTFmODU1NiIsIm5iZiI6MTc2NjUxODEzOS43OTMsInN1YiI6IjY5NGFlZDdiNTdkNDhkY2VmMWIxZDQzNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.s7dVAKaihxDgIwKIEr3xcrCyabNxYLBHKMUNAO1ENEU";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const headers = {
  'Authorization': `Bearer ${TMDB_BEARER_TOKEN}`,
  'Content-Type': 'application/json'
};

// Service pour les appels API TMDB
export class TMDBService {
  static async getTrendingMovies(page: number = 1): Promise<SearchResult> {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/day?page=${page}`,
      { headers }
    );
    return response.json();
  }

  static async searchMovies(
    query: string,
    page: number = 1
  ): Promise<SearchResult> {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&page=${page}`,
      { headers }
    );
    return response.json();
  }

  static async getMovieDetails(movieId: number): Promise<Movie> {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}`,
      { headers }
    );
    return response.json();
  }

  static async getMovieReviews(movieId: number): Promise<Comment[]> {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/reviews`,
      { headers }
    );
    const data = await response.json();
    return data.results || [];
  }

  static getImageUrl(posterPath: string): string {
    if (!posterPath) return "https://via.placeholder.com/500x750?text=No+Image";
    return TMDB_IMAGE_BASE_URL + posterPath;
  }
}
