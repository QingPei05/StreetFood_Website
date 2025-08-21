/* -------- Storage Keys -------- */
const THEME_KEY = 'site_theme_v1';            // 'light' | 'dark'
const SESSION_USER_KEY = 'session_user_v1';   // current signed-in username or 'Guest'
const ACCOUNTS_KEY = 'accounts_v1';           // { username: { pass, fullName } }
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
function saveAccounts(obj) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(obj || {})); }

/* ===== Theme ===== */
function applyTheme(theme) {
  const next = (theme === 'dark') ? 'dark' : 'light';
  setAttr(document.documentElement, 'data-bs-theme', next);
  localStorage.setItem(THEME_KEY, next);

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

/* ===== Auth dropdown render (exposed) ===== */
function renderAuthDropdown() {
  const current = sessionStorage.getItem(SESSION_USER_KEY) || 'Guest';
  const accounts = loadAccounts();
  const user = accounts[current] || null;

  const liUserInfo = $('.dropdown-userinfo');
  const ddFullName = $('#ddFullName');
  const ddUsername = $('#ddUsername');
  const accountSettings = $('#navAccountSettings') || $('a[href="account.html"].dropdown-item');
  const signBtn = $('#navSignout');

  if (current !== 'Guest' && user) {
    if (liUserInfo) liUserInfo.classList.remove('d-none');
    if (ddFullName) ddFullName.textContent = user.fullName || current;
    if (ddUsername) ddUsername.textContent = '@' + (user.username || current);
    ddFullName?.classList.add('px-2', 'py-1', 'rounded', 'bg-secondary-subtle');
    ddUsername?.classList.add('px-2', 'py-1', 'rounded', 'bg-body-tertiary');
  } else {
    if (liUserInfo) liUserInfo.classList.add('d-none');
  }

  if (accountSettings) accountSettings.classList.toggle('d-none', current === 'Guest');

  if (signBtn) signBtn.replaceWith(signBtn.cloneNode(true));
  const signSlot = $('#navSignout') || $('button.dropdown-item.text-danger');
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

  const navUser = $('#navUser');
  const displayName = (current !== 'Guest' && user && user.fullName) ? user.fullName : current;
  if (navUser) {
    navUser.title = `Hi, ${displayName}`;
    navUser.setAttribute('aria-label', `Hi, ${displayName}`);
  }
}

/* ===== Favorites (copy state/country from Malaysia/Global DOM) ===== */
function getFavs() { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
function setFavs(a) { localStorage.setItem('favorites', JSON.stringify(a || [])); }
function getFavMeta() { try { return JSON.parse(localStorage.getItem('favorites_meta_v1') || '{}'); } catch { return {}; } }
function setFavMeta(m) { localStorage.setItem('favorites_meta_v1', JSON.stringify(m || {})); }

function bindFavorites(container, options = {}) {
  const root = container || document;
  const btns = $all('.fav-btn', root);
  if (!btns.length) return;

  function mark(btn, added) {
    const addText = btn.getAttribute('data-add-text') || 'Add to favorites';
    const addedText = btn.getAttribute('data-added-text') || 'Added to favorites';
    btn.classList.toggle('btn-added', !!added);
    btn.classList.toggle('btn-outline-primary', !added);
    btn.disabled = false;
    btn.textContent = added ? addedText : addText;
    btn.setAttribute('aria-pressed', added ? 'true' : 'false');
  }

  function inferName(btn) {
    const n = btn.getAttribute('data-food')
      || btn.closest('.card')?.querySelector('.card-title')?.textContent?.trim();
    return (n && n.length) ? n : 'Unknown';
  }

  // Copy state/country from Malaysia/Global pages
  function inferMetaFromDOM(btn) {
    const card = btn.closest('.card');
    const imgEl = card?.querySelector('img');
    const titleEl = card?.querySelector('.card-title, h5, h6');
    const linkEl = titleEl?.querySelector('a');
    const countryTextEl = card?.querySelector('.text-muted, small, .country');

    // Malaysia: state sits on the column data-region
    const stateFromRegion = btn.closest('[data-region]')?.getAttribute('data-region') || '';

    // Global: title pattern "Food (Country)"
    const titleText = titleEl?.textContent?.trim() || '';
    const mCountry = titleText.match(/\(([^)]+)\)\s*$/);
    let parsedCountry = mCountry ? mCountry[1].trim() : '';

    // Fallbacks for country
    let country = (btn.getAttribute('data-country') || (countryTextEl?.textContent || '')).trim();
    if (!country) {
      if (stateFromRegion) country = 'Malaysia';
      else if (parsedCountry) country = parsedCountry;
    }

    return {
      img: imgEl?.getAttribute('src') || '',
      country,
      state: stateFromRegion,              // persist state copied from malaysia.html
      link: linkEl?.getAttribute('href') || '#',
      source: 'site'
    };
  }

  btns.forEach(btn => {
    const name = inferName(btn);
    const favSet = new Set(getFavs());
    mark(btn, favSet.has(name));

    btn.addEventListener('click', () => {
      const favsNow = new Set(getFavs());
      const metaNow = getFavMeta();

      if (favsNow.has(name)) {
        if (confirm(`Remove "${name}" from favorites?`)) {
          favsNow.delete(name);
          setFavs(Array.from(favsNow));
          setFavMeta(metaNow);
          mark(btn, false);
        }
      } else {
        let m = null;
        if (typeof options.getMetaFor === 'function') {
          try { m = options.getMetaFor(btn); } catch { }
        }
        if (!m) m = inferMetaFromDOM(btn);

        favsNow.add(name);
        metaNow[name] = Object.assign({ img: '', country: '', state: '', link: '#', source: 'site' }, m || {});
        setFavs(Array.from(favsNow));
        setFavMeta(metaNow);
        mark(btn, true);
      }
    });
  });
}

/* ===== Wire global UI controls ===== */
function wireGlobalControls() {
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

  $('#heroSlides').innerHTML = slides.map((s, i) =>
    `<div class="slide${i === 0 ? ' active' : ''}" role="img" aria-label="${s.alt}"
       style="background-image:url('${s.img}')"></div>`).join('');

  let idx = 0;
  const nodes = document.querySelectorAll('#heroSlides .slide');
  if (nodes.length <= 1) return;

  setInterval(() => {
    nodes[idx].classList.remove('active');
    idx = (idx + 1) % nodes.length;
    nodes[idx].classList.add('active');
  }, 4000);
}

/* ===== Change Password Bridge ===== */
function initChangePasswordBridge() {
  const form = document.getElementById('cpForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const msg = document.getElementById('cpMsg');
    if (msg) { msg.className = 'mt-3 small text-danger'; msg.textContent = ''; }

    const u = sessionStorage.getItem(SESSION_USER_KEY) || 'Guest';
    const acc = (function () { try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); } catch { return {}; } })();

    if (u === 'Guest') {
      if (msg) msg.textContent = 'Please sign in first.';
      return;
    }

    if (!acc[u]) {
      acc[u] = { pass: '' };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(acc));
    }

    const curEl = document.getElementById('cur');
    const newEl = document.getElementById('newp');
    const confEl = document.getElementById('conf');
    const curHelp = document.getElementById('curHelp');
    const matchHelp = document.getElementById('matchHelp');

    if (curHelp) curHelp.classList.add('d-none');
    if (matchHelp) matchHelp.classList.add('d-none');

    const curOK = (acc[u].pass === (curEl?.value ?? ''));
    if (!curOK) {
      if (curHelp) curHelp.classList.remove('d-none');
      if (msg) msg.textContent = 'Current password is incorrect.';
      if (curEl) curEl.focus();
      return;
    }

    const matchOK = (newEl?.value === confEl?.value);
    if (!matchOK) {
      if (matchHelp) matchHelp.classList.remove('d-none');
      if (msg) msg.textContent = 'Passwords do not match.';
      if (confEl) confEl.focus();
      return;
    }

    acc[u].pass = newEl.value;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(acc));
    location.href = 'account.html';
  }, true);
}

/* ===== Init on DOM ready ===== */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initTheme();
    initSessionGate();
    highlightActiveNav();
    wireGlobalControls();
    renderAuthDropdown();
    bindFavorites(document);
    initHeroSlides();
    initChangePasswordBridge();
  } catch (err) {
    console.warn('Init error:', err);
  }
});

/* ===== Expose tiny API ===== */
window.Site = { applyTheme, renderAuthDropdown, bindFavorites };
window.renderAuthDropdown = renderAuthDropdown;
