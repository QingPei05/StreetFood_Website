/* ===========================
   main.js — site-wide logic
   =========================== */

/* -------- Storage Keys -------- */
const THEME_KEY = 'site_theme_v1';            // 'light' | 'dark'
const SESSION_USER_KEY = 'session_user_v1';   // current signed-in username or 'Guest'
const ACCOUNTS_KEY = 'accounts_v1';           // { username: { password, fullName, username } }
const COOKIE_LAST_NAME = 'last_username_v1';  // optional “remember me” cookie

/* ===== Tiny DOM helpers ===== */
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt); }
function setAttr(el, k, v) { if (el) el.setAttribute(k, v); }

/* ===== Cookies (optional) ===== */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}
function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, kv) => {
    const [k, v] = kv.split('=');
    if (decodeURIComponent(k || '') === name) acc = decodeURIComponent(v || '');
    return acc;
  }, '');
}

/* ===== Accounts helpers (local demo) ===== */
function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); } catch { return {}; }
}
function saveAccounts(obj) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(obj || {}));
}

/* ===== Theme ===== */
function applyTheme(theme) {
  const next = (theme === 'dark') ? 'dark' : 'light';
  setAttr(document.documentElement, 'data-bs-theme', next);
  localStorage.setItem(THEME_KEY, next);

  // Update toggle label/icon when present
  const icon = $('#themeToggleIcon');
  const text = $('#themeToggleText');
  if (icon) icon.textContent = next === 'dark' ? '🌞' : '🌙';
  if (text) text.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

/* ===== Navbar: active link ===== */
function highlightActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  $all('.navbar .nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').split('?')[0];
    a.classList.toggle('active', href === path);
  });
}

/* ===== Session gate ===== */
function initSessionGate() {
  if (!sessionStorage.getItem(SESSION_USER_KEY)) {
    sessionStorage.setItem(SESSION_USER_KEY, 'Guest');
  }
  const cur = sessionStorage.getItem(SESSION_USER_KEY) || 'Guest';
  const navUser = $('#navUser');
  if (navUser) {
    navUser.title = `Hi, ${cur}`;
    navUser.setAttribute('aria-label', `Hi, ${cur}`);
  }
}

function renderAuthDropdown() {
  const current = sessionStorage.getItem(SESSION_USER_KEY) || 'Guest';
  const accounts = loadAccounts();
  const user = accounts[current] || null;

  const liUserInfo = $('.dropdown-userinfo');
  const ddFullName = $('#ddFullName');
  const ddUsername = $('#ddUsername');
  const accountSettings = $('#navAccountSettings') || $('a[href="account.html"].dropdown-item');
  const signBtn = $('#navSignout'); // this slot becomes "Sign in" when Guest

  // Fill name/@username and show/hide the header
  if (current !== 'Guest' && user) {
    if (liUserInfo) liUserInfo.classList.remove('d-none');
    if (ddFullName) ddFullName.textContent = user.fullName || current;
    if (ddUsername) ddUsername.textContent = '@' + (user.username || current);
  } else {
    if (liUserInfo) liUserInfo.classList.add('d-none');
  }

  // Show/hide Account settings
  if (accountSettings) {
    accountSettings.classList.toggle('d-none', current === 'Guest');
  }

  // Configure bottom button
  if (signBtn) {
    signBtn.replaceWith(signBtn.cloneNode(true)); // remove previous listeners cleanly
  }
  const signSlot = $('#navSignout') || $('button.dropdown-item.text-danger'); // reselect after clone
  if (!signSlot) return;

  if (current === 'Guest') {
    signSlot.textContent = 'Sign in';
    signSlot.classList.remove('text-danger');
    signSlot.classList.add('text-primary');
    signSlot.onclick = () => { location.href = 'account.html'; };
  } else {
    signSlot.textContent = 'Sign out';
    signSlot.classList.add('text-danger');
    signSlot.classList.remove('text-primary');
    signSlot.onclick = () => {
      sessionStorage.setItem(SESSION_USER_KEY, 'Guest');
      renderAuthDropdown();
      location.href = 'account.html';
    };
  }

  // Update avatar tooltip to use full name if available
  const navUser = $('#navUser');
  const displayName = (current !== 'Guest' && user && user.fullName) ? user.fullName : current;
  if (navUser) {
    navUser.title = `Hi, ${displayName}`;
    navUser.setAttribute('aria-label', `Hi, ${displayName}`);
  }
}

/* ===== Wire global UI controls ===== */
function wireGlobalControls() {
  // Theme toggle
  on($('#themeToggleItem'), 'click', () => {
    const cur = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(cur === 'light' ? 'dark' : 'light');
  });
}

/* ===== Home hero slides (if present) ===== */
function initHeroSlides() {
  const wrap = $('#heroSlides');
  if (!wrap) return;

  const slides = [
    { img: 'https://www.vegkit.com/wp-content/uploads/sites/2/2023/02/Homestyle_Eggplant_Chickpea_Curry.jpg', alt: 'Eggplant Chickpea Curry' },
    { img: 'https://sweetkitchencravings.com/wp-content/uploads/2023/09/IMG_0946-copy-2.jpg', alt: 'Peaches & Cream Crumb Cake' },
    { img: 'https://sweetkitchencravings.com/wp-content/uploads/2023/09/IMG_5259.jpg', alt: 'Golden Syrup Dumplings' },
    { img: 'https://cdn.vegkit.com/wp-content/uploads/sites/2/2022/10/19151142/VegKit_Mushroom_Bake.jpg', alt: 'Mushroom Bake' },
    { img: 'https://sweetkitchencravings.com/wp-content/uploads/2024/03/IMG_5807-copy.jpg', alt: 'Berry Chantilly Cupcakes' },
    { img: 'https://sweetkitchencravings.com/wp-content/uploads/2024/02/IMG_3389-2-1536x2048.jpg', alt: 'Mini Orange Cheesecakes' }
  ];

  wrap.innerHTML = slides.map((s, i) =>
    `<div class="slide${i === 0 ? ' active' : ''}" role="img" aria-label="${s.alt}"
       style="background-image:url('${s.img}')"></div>`).join('');

  let idx = 0;
  const nodes = wrap.querySelectorAll('.slide');
  if (nodes.length <= 1) return;

  setInterval(() => {
    nodes[idx].classList.remove('active');
    idx = (idx + 1) % nodes.length;
    nodes[idx].classList.add('active');
  }, 4000);
}

/* ===== Init on DOM ready ===== */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initTheme();
    initSessionGate();
    highlightActiveNav();
    wireGlobalControls();
    renderAuthDropdown();   // <<< keeps dropdown consistent on all pages
    initHeroSlides();
  } catch (err) {
    console.warn('Init error:', err);
  }
});

/* ===== Optional tiny API ===== */
window.Site = {
  applyTheme,
  renderAuthDropdown
};
