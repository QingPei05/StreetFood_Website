// Navbar active link highlighting
$(document).ready(function () {
    const path = window.location.pathname.split("/").pop() || "index.html";
    $('.navbar-nav a').each(function () {
        if ($(this).attr('href') === path) {
            $(this).addClass('active');
        }
    });
    // Footer year
    $('#y').text(new Date().getFullYear());
});

// Favorites helper (shared)
function addToFavorites(name) {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favs.includes(name)) {
        favs.push(name);
        localStorage.setItem('favorites', JSON.stringify(favs));
        alert(`${name} added to Favorites!`);
    }
}
