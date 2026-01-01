const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Configuration TMDB
const TMDB_API_KEY = '3877ccdf8d41b2c0402a46b33a1f8556'; // Clé API v3
const TMDB_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzODc3Y2NkZjhkNDFiMmMwNDAyYTQ2YjMzYTFmODU1NiIsIm5iZiI6MTc2NjUxODEzOS43OTMsInN1YiI6IjY5NGFlZDdiNTdkNDhkY2VmMWIxZDQzNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.s7dVAKaihxDgIwKIEr3xcrCyabNxYLBHKMUNAO1ENEU'; // Bearer Token v4
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_AUTH_URL = 'https://www.themoviedb.org/auth/access';

// Middleware
const allowedOrigins = [
  'http://localhost:8080',
  'https://viscously-stratospherical-loralee.ngrok-free.dev'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Stockage des sessions (en mémoire, à remplacer par une BDD en production)
const sessions = new Map();

// 1. Créer un request token
app.post('/api/auth/request-token', async (req, res) => {
  try {
    const url = `${TMDB_BASE_URL}/authentication/token/new?api_key=${TMDB_API_KEY}`;
    console.log('Requesting token from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    console.log('TMDB Response:', data);
    
    if (data.success) {
      res.json({ request_token: data.request_token });
    } else {
      console.error('TMDB Error:', data);
      res.status(400).json({ error: 'Failed to create request token', details: data });
    }
  } catch (error) {
    console.error('Error creating request token:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// 2. Créer une session après authentification

app.post('/api/auth/session', async (req, res) => {
  const { request_token } = req.body;
  if (!request_token) {
    return res.status(400).json({ error: 'Missing request_token' });
  }
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/authentication/session/new?api_key=${TMDB_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_token })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      const sessionId = data.session_id;
      
      // Récupérer les détails de l'utilisateur
      const userResponse = await fetch(
        `${TMDB_BASE_URL}/account?api_key=${TMDB_API_KEY}&session_id=${sessionId}`
      );
      const userData = await userResponse.json();
      
      const user = {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar?.tmdb?.avatar_path || '',
        sessionId: sessionId
      };
      
      res.json({ 
        sessionId, 
        user 
      });
    } else {
      res.status(400).json({ error: 'Failed to create session' });
    }
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Ajouter une review/rating
app.post('/api/movie/:movieId/rating', async (req, res) => {
  const { movieId } = req.params;
  const { sessionId, rating } = req.body;
  
  if (!sessionId || !rating) {
    return res.status(400).json({ error: 'Missing sessionId or rating' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/rating?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: rating })
      }
    );
    
    if (response.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to add rating' });
    }
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Proxy pour OneTrust geolocation (contourne l'erreur CORS côté client)
app.get('/api/proxy/geolocation', async (req, res) => {
  try {
    const remoteUrl = 'https://geolocation.onetrust.com/cookieconsentpub/v1/geo/location';
    const response = await fetch(remoteUrl, { method: 'GET' });
    const text = await response.text();

    // Essayer d'extraire un objet JSON même si la réponse est enveloppée
    let parsed = null;
    try {
      let candidate = text.trim();
      if (!candidate.startsWith('{')) {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          candidate = candidate.slice(start, end + 1);
        }
      }
      parsed = JSON.parse(candidate);
    } catch (err) {
      console.warn('Could not parse geolocation as JSON, returning raw text');
    }

    res.set('Access-Control-Allow-Origin', '*');
    if (parsed) {
      res.json(parsed);
    } else {
      res.json({ raw: text });
    }
  } catch (error) {
    console.error('Error proxying geolocation:', error);
    res.status(500).json({ error: 'Failed to fetch geolocation' });
  }
});

console.log('Starting auth server...');
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in server:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in server:', reason);
});

app.listen(PORT, () => {
  console.log(`🎬 Auth server running on http://localhost:${PORT}`);
});

console.log('Server script executed, awaiting connections...');
