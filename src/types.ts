// Type definitions et exports communs
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  overview: string;
  vote_average: number;
}

export interface SearchResult {
  results: Movie[];
  total_pages: number;
  page: number;
}

export interface Comment {
  id: string;
  author: string;
  author_details: {
    avatar_path: string;
    name: string;
  };
  content: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  avatar: string;
  sessionId: string;
}

// Utilitaires
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export function formatRating(rating: number): string {
  return `${(rating || 0).toFixed(1)}/10`;
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
