// ========== Theme (Dark/Light) with moon/sun icon ==========
(function themeInit(){
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

  function updateThemeIcon(mode, btn){
    if (mode === 'dark') { btn.textContent = '☀︎ Light Mode'; btn.title = 'Switch to light mode'; }
    else { btn.textContent = '⏾ Dark Mode'; btn.title = 'Switch to dark mode'; }
  }
})();

// ========== Navbar active highlighting ==========
$(function(){
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $('.navbar-nav a').each(function(){
    const href = ($(this).attr('href') || '').toLowerCase();
    if (href === path) $(this).addClass('active');
  });
});

// ========== Favorites helpers ==========
function getFavs(){ try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
function setFavs(arr){ localStorage.setItem('favorites', JSON.stringify(arr)); }

function markAdded(btn){
  btn.classList.add('btn-added');
  btn.classList.remove('btn-outline-primary','btn-primary');
  btn.textContent = 'Added to favorites';
  btn.disabled = true;
}

function addToFavorites(name, btnEl){
  const favs = getFavs();
  if (!favs.includes(name)) { favs.push(name); setFavs(favs); }
  if (btnEl) markAdded(btnEl);
}

// Initialize all .fav-btn buttons on page load
$(function(){
  const favs = getFavs();
  document.querySelectorAll('.fav-btn[data-food]').forEach(btn => {
    const food = btn.getAttribute('data-food');
    if (favs.includes(food)) markAdded(btn);
    else btn.addEventListener('click', () => addToFavorites(food, btn));
  });
});

/* ====== Home page Hero fade carousel (方案 A) ====== */
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('heroSlides');
  if (!wrap) return; // only on index.html

  // Replace or extend with your own images
  const heroImages = [
    'https://www.vegkit.com/wp-content/uploads/sites/2/2023/02/Homestyle_Eggplant_Chickpea_Curry.jpg',
    'https://sweetkitchencravings.com/wp-content/uploads/2023/09/IMG_0946-copy-2.jpg',
    'https://www.marthawhite.com/wp-content/uploads/2023/12/apricot_muffins.jpg',
    'https://images.squarespace-cdn.com/content/v1/5f199ea8c32b8a238cc35d35/1597215637673-6CK6ORW4OW0LRYNUWMFY/image.jpeg',
    'https://addictedtodates.com/wp-content/uploads/2021/12/vegan-creme-brulee.jpg'
  ];

  // Build slide nodes
  heroImages.forEach((src, i) => {
    const d = document.createElement('div');
    d.className = 'slide' + (i === 0 ? ' active' : '');
    d.style.backgroundImage = `url("${src}")`;
    wrap.appendChild(d);
  });

  const slides = Array.from(wrap.children);
  let idx = 0;
  const intervalMs = 5000; // switch every 5s

  setInterval(() => {
    const cur = slides[idx];
    idx = (idx + 1) % slides.length;
    const nxt = slides[idx];
    cur.classList.remove('active');
    nxt.classList.add('active');
  }, intervalMs);
});
