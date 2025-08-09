// ========== Theme (Dark/Light) with moon/sun icon ==========
(function themeInit() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', saved);

  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    updateThemeIcon(saved, btn);

    btn.onclick = () => {
      const curr = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-bs-theme', curr);
      localStorage.setItem('theme', curr);
      updateThemeIcon(curr, btn);
    };
  });

  function updateThemeIcon(mode, btn) {
    if (mode === 'dark') { btn.textContent = '☀️ Light Mode'; btn.title = 'Switch to light mode'; }
    else { btn.textContent = '🌙 Dark Mode'; btn.title = 'Switch to dark mode'; }
  }
})();

// ========== Navbar active highlighting ==========
$(function () {
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $('.navbar-nav a').each(function () {
    const href = ($(this).attr('href') || '').toLowerCase();
    if (href === path) $(this).addClass('active');
  });
});

// ========== Favorites helpers ==========
function getFavs() { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
function setFavs(arr) { localStorage.setItem('favorites', JSON.stringify(arr)); }

function markAdded(btn) {
  btn.classList.add('btn-added');
  btn.classList.remove('btn-outline-primary', 'btn-primary');
  btn.textContent = 'Added to favorites';
  btn.disabled = true;
}

function addToFavorites(name, btnEl) {
  const favs = getFavs();
  if (!favs.includes(name)) { favs.push(name); setFavs(favs); }
  if (btnEl) markAdded(btnEl);
}

// Initialize all .fav-btn buttons on page load
$(function () {
  const favs = getFavs();
  document.querySelectorAll('.fav-btn[data-food]').forEach(btn => {
    const food = btn.getAttribute('data-food');
    if (favs.includes(food)) markAdded(btn);
    else btn.addEventListener('click', () => addToFavorites(food, btn));
  });
});