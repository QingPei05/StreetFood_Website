// ===== Theme with top button + avatar dropdown (single source of truth) =====
(function themeInit(){
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', saved);

  function updateThemeIcon(mode, btn){
    if (!btn) return;
    if (mode === 'dark') { btn.textContent = '☀︎ Light Mode'; btn.title = 'Switch to light mode'; }
    else { btn.textContent = '⏾ Dark Mode'; btn.title = 'Switch to dark mode'; }
  }

  function syncDropdownLabel(mode){
    const txt = document.getElementById('themeToggleText');
    const ico = document.getElementById('themeToggleIcon');
    if (!txt || !ico) return;
    if (mode === 'dark') { txt.textContent = 'Light mode'; ico.textContent = '☀️'; }
    else { txt.textContent = 'Dark mode'; ico.textContent = '🌙'; }
  }

  function setTheme(mode){
    document.documentElement.setAttribute('data-bs-theme', mode);
    try { localStorage.setItem('theme', mode); } catch {}
    updateThemeIcon(mode, document.getElementById('themeToggle'));
    syncDropdownLabel(mode);
  }

  function toggleTheme(){
    const curr = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    setTheme(curr);
  }

  // initial sync
  updateThemeIcon(saved, document.getElementById('themeToggle'));
  syncDropdownLabel(saved);

  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.onclick = () => toggleTheme();
    const item = document.getElementById('themeToggleItem');
    if (item) item.addEventListener('click', () => toggleTheme());
  });
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


// ====== Home page Hero fade carousel ======
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('heroSlides');
  if (!wrap) return; // only on index.html

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

// ===== AUTH MODULE (Guest by default + clean Account UI) =====
const USERS_KEY = 'users_v1';
const SESSION_KEY = 'session_user_v1';
const LAST_USER = 'last_user';

// ---- utils ----
async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function loadUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; } }
function saveUsers(obj){ localStorage.setItem(USERS_KEY, JSON.stringify(obj || {})); }
function setCookie(name, value, days){
  const t = new Date(); t.setTime(t.getTime() + days * 864e5);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${t.toUTCString()}; path=/`;
}
function getCookie(name){
  // fixed regex
  const safe = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
  const re = new RegExp('(?:^|; )' + safe + '=([^;]*)');
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

// ---- session helpers ----
function whoami(){ return sessionStorage.getItem(SESSION_KEY) || 'Guest'; }
function isGuest(){ return whoami() === 'Guest'; }

function updateWho(){
  const navTrigger = document.getElementById('navUser');
  if (navTrigger){
    navTrigger.setAttribute('title', `Hi, ${whoami()}`);
    navTrigger.setAttribute('aria-label', `Hi, ${whoami()}`);
  }
  const el = document.getElementById('whoami');
  if (el) el.textContent = whoami();

  // hide nav Sign out for Guest
  const navSignout = document.getElementById('navSignout');
  if (navSignout) navSignout.style.display = isGuest() ? 'none' : '';
}

// ---- validators ----
function validName(n){ return /^[a-zA-Z0-9_]{3,20}$/.test(n || ''); }
function validPass(p){ return typeof p === 'string' && p.length >= 3; }

// ---- account storage ----
async function registerUser(username, password){
  if (!validName(username)) throw new Error('Username must be 3–20 letters/numbers/_');
  if (!validPass(password)) throw new Error('Password must be at least 3 characters');
  const users = loadUsers();
  if (users[username]) throw new Error('Username already exists');
  users[username] = await sha256Hex(password);
  saveUsers(users);
  return true;
}
async function authenticate(username, password){
  const users = loadUsers();
  const hashed = await sha256Hex(password);
  return users[username] && users[username] === hashed;
}

// ---- sign in/out ----
function signIn(username, remember){
  sessionStorage.setItem(SESSION_KEY, username);
  if (remember) setCookie(LAST_USER, username, 30);
  updateWho();
  renderAccountPage();

  try{
    const u = new URL(location.href);
    const next = u.searchParams.get('next');
    const go = (next && !next.includes('account.html')) ? next : 'index.html';
    location.replace(go);
  }catch{/* noop */}
}
function signOut(){
  sessionStorage.removeItem(SESSION_KEY);
  updateWho();
  renderAccountPage();
}

// ---- account.html conditional sections ----
function renderAccountPage(){
  if (!/account\.html(\?|$)/i.test(location.pathname)) return;
  const guest = isGuest();
  const guestNotice = document.getElementById('guestNotice');
  const sectionAuth = document.getElementById('sectionAuth');
  const sectionSigned = document.getElementById('sectionSigned');

  if (guestNotice) guestNotice.classList.toggle('d-none', !guest);
  if (sectionAuth) sectionAuth.classList.toggle('d-none', !guest);
  if (sectionSigned) sectionSigned.classList.toggle('d-none', guest);
}

// ---- wire up DOM ----
document.addEventListener('DOMContentLoaded', () => {
  // 1) default everyone to Guest on first visit
  if (!sessionStorage.getItem(SESSION_KEY)) sessionStorage.setItem(SESSION_KEY, 'Guest');

  // 2) update navbar state
  updateWho();

  // 3) nav sign out (hidden for Guest by updateWho)
  const navOut = document.getElementById('navSignout') || document.getElementById('btnNavSignout');
  if (navOut) navOut.addEventListener('click', () => { signOut(); location.replace('account.html'); });

  // 4) Sign in form (account.html) — with POPUP when not registered
  const siForm = document.getElementById('signinForm');
  if (siForm){
    const siMsg = document.getElementById('si_msg');
    siForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('si_name').value.trim();
      const pass = document.getElementById('si_pass').value;
      const remember = document.getElementById('si_remember')?.checked || false;

      const ok = await authenticate(name, pass);
      if (!ok){
        alert('Account does not exist or password is incorrect.\nPlease Sign up first.');
        siMsg.className = 'mt-3 small text-danger';
        siMsg.textContent = 'No such account or wrong password. Please sign up first.';
        return;
      }
      siMsg.className = 'mt-3 small text-success';
      siMsg.textContent = 'Signed in!';
      signIn(name, remember);
    });
  }

  // 5) Sign up form (account.html — collapsed panel)
  const suForm = document.getElementById('signupForm');
  if (suForm){
    const suMsg = document.getElementById('su_msg');
    suForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('su_name').value.trim();
      const pass = document.getElementById('su_pass').value;
      try{
        await registerUser(name, pass);
        suMsg.className = 'mt-3 small text-success';
        suMsg.textContent = 'Registration successful. You can sign in now.';
      }catch(err){
        suMsg.className = 'mt-3 small text-danger';
        suMsg.textContent = err?.message || 'Registration failed.';
      }
    });
  }

  // 6) Explicit sign out button on account card
  const btnSignout = document.getElementById('btnSignout');
  if (btnSignout) btnSignout.addEventListener('click', () => { signOut(); });

  // 7) Optional "Continue as Guest" button
  const btnGuest = document.getElementById('btnGuest');
  if (btnGuest) btnGuest.addEventListener('click', () => { sessionStorage.setItem(SESSION_KEY, 'Guest'); updateWho(); renderAccountPage(); });

  // 8) Prefill last username
  const last = getCookie(LAST_USER);
  if (last){ const siName = document.getElementById('si_name'); if (siName) siName.value = last; }

  // 9) Ensure account sections show correct state on load
  renderAccountPage();
});
/* ===== END AUTH MODULE ===== */
