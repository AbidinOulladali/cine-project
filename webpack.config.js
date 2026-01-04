const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",

  // Point d'entrée
  entry: {
    index: "./src/client/index.js",
    movie: "./src/client/movie.js",
    search: "./src/client/search.js",
  },

  // Sortie
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    clean: true,
  },

  // Serveur de développement
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 8080,
    hot: true,
    open: true,
    historyApiFallback: true,
    allowedHosts: "all", // ✅ Accepte tous les hosts (ngrok, localhost, etc.)
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  // Plugins
  plugins: [
    // Page d'accueil
    new HtmlWebpackPlugin({
      template: "./src/client/index.html",
      filename: "index.html",
      chunks: ["index"],
    }),

    // Page de film
    new HtmlWebpackPlugin({
      template: "./src/client/movie.html",
      filename: "movie.html",
      chunks: ["movie"],
    }),

    // Page de recherche
    new HtmlWebpackPlugin({
      template: "./src/client/search.html",
      filename: "search.html",
      chunks: ["search"],
    }),
  ],

  // Loaders
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource",
      },
    ],
  },
};
