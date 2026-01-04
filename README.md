# Application Cinéma - TMDB

Application web pour consulter les films en tendance utilisant l'API TMDB.

## 🚀 Installation

1. Installer les dépendances :

```bash
npm install

```

2. Créer un fichier .env à la racine (si elle n'est pas présente):
   TMDB_API_KEY=votre_clé_api_tmdb
   PORT=3001

3. Obtenir une clé API sur TMDB (au cas où masclé API ne marche pas)

📱 Démarrage :
npm start
L'application sera accessible sur :
Frontend : http://localhost:8080
Backend : http://localhost:3001

🛠️ Technologies
Frontend : Vanilla JavaScript, Webpack, HTML5, CSS3
Backend : Node.js, Express
API : TMDB (The Movie Database)

src/client/ # Code frontend (3 pages)
server.js # Serveur Express
webpack.config # Configuration Webpack

✨ Fonctionnalités
Films en tendance avec pagination
Recherche de films avec debouncing
Authentification TMDB
Détails des films et avis
Scroll infini
Design responsive

👤 Auteur
AMOUDAN Krishna et Abdellah Oullad-ali

### 4. **Vérifier le .gitignore**

Assurez-vous qu'il contient :
node_modules/
dist/
.env
.DS_Store
\*.log

### 5. **Points à mentionner au prof**

**⚠️ NOTES IMPORTANTES À INCLURE :**

1. **Installation requise** : `npm install` avant de lancer
2. **Clé API nécessaire** : Créer un compte TMDB et obtenir une clé
3. **Démarrage** : `npm start` lance automatiquement backend + frontend
4. **URL ngrok hardcodée** : Dans [search.js:108](c:\Users\prasa\lab\SupInfo\JS_Supinfo\src\client\search.js#L108), remplacer par votre URL si nécessaire
5. **Ports utilisés** : 3001 (backend) et 8080 (frontend)

## 🔐 Authentification TMDB (Optionnel)

**Note importante** : TMDB n'autorise pas les redirections vers localhost.

### Option A : Utilisation sans authentification

L'application fonctionne sans connexion. Vous pouvez :

- Consulter les films en tendance
- Rechercher des films
- Voir les détails et avis
- ❌ Vous ne pourrez pas noter les films

### Option B : Tester avec ngrok (pour l'authentification)

1. Installer ngrok : https://ngrok.com/download
2. Lancer l'application : `npm start`
3. Dans un autre terminal : `ngrok http 8080`
4. Copier l'URL ngrok (ex: https://xxxx.ngrok-free.app)
5. Modifier les fichiers index.js, movie.js, search.js ligne ~113 :
   ```javascript
   const redirectUrl = "https://votre-url-ngrok.ngrok-free.app";
   ```
