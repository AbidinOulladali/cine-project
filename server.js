require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.TMDB_API_KEY;

// Configuration CORS
app.use(
  cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "dist")));

// ✅ Route en POST pour obtenir un token
app.post("/api/auth/request-token", async (req, res) => {
  try {
    console.log("📡 POST /api/auth/request-token reçu");

    const response = await fetch(
      `https://api.themoviedb.org/3/authentication/token/new?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Token créé:", data.request_token);

    res.json(data);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ Route en GET aussi (pour compatibilité)
app.get("/api/auth/request-token", async (req, res) => {
  try {
    console.log("📡 GET /api/auth/request-token reçu");

    const response = await fetch(
      `https://api.themoviedb.org/3/authentication/token/new?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Token créé:", data.request_token);

    res.json(data);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Route pour créer une session après authentification TMDB
app.post("/api/auth/session", async (req, res) => {
  try {
    console.log("📡 POST /api/auth/session reçu");
    const { request_token } = req.body;

    if (!request_token) {
      return res.status(400).json({
        success: false,
        error: "request_token manquant",
      });
    }

    // Créer une session avec TMDB
    const response = await fetch(
      `https://api.themoviedb.org/3/authentication/session/new?api_key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_token }),
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const sessionData = await response.json();
    console.log("✅ Session créée:", sessionData.session_id);

    // Récupérer les infos utilisateur
    const userResponse = await fetch(
      `https://api.themoviedb.org/3/account?api_key=${API_KEY}&session_id=${sessionData.session_id}`
    );

    const userData = await userResponse.json();

    res.json({
      success: true,
      sessionId: sessionData.session_id,
      user: {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar?.tmdb?.avatar_path
          ? `https://image.tmdb.org/t/p/w64${userData.avatar.tmdb.avatar_path}`
          : null,
      },
    });
  } catch (error) {
    console.error("❌ Erreur création session:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Route pour les films en tendance
app.get("/api/movies/trending", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=fr-FR`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Route catch-all (DOIT être en dernier)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Démarrage
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend sur http://localhost:${PORT}`);
  console.log(
    `🔑 Clé API chargée: ${
      API_KEY ? API_KEY.substring(0, 10) + "..." : "MANQUANTE"
    }`
  );
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
});
