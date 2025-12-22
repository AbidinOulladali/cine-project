const grid = document.getElementById('movies-grid');

// Mock Data pour le test
const mock = [
    { title: "Batman", year: "2022", img: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDp9QmSbmvQv2Gq7Qp7.jpg" },
    { title: "Spider-Man", year: "2021", img: "https://image.tmdb.org/t/p/w500/1g0mXp9pf9YvU97mS6q3o7yo9Ym.jpg" },
    { title: "Inception", year: "2010", img: "https://image.tmdb.org/t/p/w500/edv5CZvRjS99vO6YzoH6j3pA1QX.jpg" },
    { title: "Interstellar", year: "2014", img: "https://image.tmdb.org/t/p/w500/gEU2QniE6E07Qv8nooJuG47STfs.jpg" }
];

mock.forEach(m => {
    grid.innerHTML += `
        <div class="movie-card">
            <img src="${m.img}" alt="${m.title}">
            <div class="movie-info">
                <h3>${m.title}</h3>
                <p>${m.year}</p>
            </div>
        </div>
    `;
});