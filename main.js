/* -------- Storage Keys -------- */
const THEME_KEY = 'site_theme_v1';            // 'light' | 'dark'
const SESSION_USER_KEY = 'session_user_v1';   // current signed-in username or 'Guest'
const ACCOUNTS_KEY = 'accounts_v1';           // { username: { pass, fullName } }
const LAST_USER_KEY = 'last_user_v1';         // remember last signed-in user (persistent)

/* ===== Tiny DOM helpers ===== */
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt); }
function setAttr(el, k, v) { if (el) el.setAttribute(k, v); }

/* ===== Accounts ===== */
function loadAccounts() { try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); } catch { return {}; } }
function saveAccounts(obj) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(obj || {})); }

/* Current user helpers */
function sessionUser() { return sessionStorage.getItem(SESSION_USER_KEY) || 'Guest'; }
function setSessionUser(u) { sessionStorage.setItem(SESSION_USER_KEY, u || 'Guest'); }

/* Persist/restore login across browser restarts */
function hydrateSessionFromMemory() {
  const now = sessionUser();
  if (now && now !== 'Guest') {
    // already signed-in for this tab; also remember persistently
    localStorage.setItem(LAST_USER_KEY, now);
    return;
  }
  const last = localStorage.getItem(LAST_USER_KEY);
  if (!last) return;
  const acc = loadAccounts();
  if (acc[last]) {
    setSessionUser(last);  // restore last signed-in user
  } else {
    // stale memory
    localStorage.removeItem(LAST_USER_KEY);
  }
}

function rememberIfSignedIn() {
  const u = sessionUser();
  if (u && u !== 'Guest') localStorage.setItem(LAST_USER_KEY, u);
}

/* ===== Theme ===== */
function applyTheme(theme) {
  const next = (theme === 'dark') ? 'dark' : 'light';
  setAttr(document.documentElement, 'data-bs-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch (_) { }
  const icon = $('#themeToggleIcon');
  const text = $('#themeToggleText');
  if (icon) icon.textContent = next === 'dark' ? '🌞' : '🌙';
  if (text) text.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'dark' ? 'dark' : 'light');
  on($('#themeToggleItem'), 'click', () => {
    const cur = (document.documentElement.getAttribute('data-bs-theme') === 'dark') ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

/* ===== Navbar active link ===== */
function highlightActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  $all('.navbar .nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    a.classList.toggle('active', href === path);
  });
}

/* ===== Auth dropdown (avatar menu) ===== */
function renderAuthDropdown() {
  const u = sessionUser();
  const acc = loadAccounts();
  const user = acc[u];

  const ddFullName = $('#ddFullName');
  const ddUsername = $('#ddUsername');
  const navUser = $('#navUser');
  const liUserInfo = document.querySelector('.dropdown-userinfo');
  const accountSettings = $('#navAccountSettings');
  const signBtn = $('#navSignout');

  if (navUser) {
    const title = (u !== 'Guest') ? `Hi, ${user?.fullName || u}` : 'Hi, Guest';
    navUser.setAttribute('title', title);
    navUser.setAttribute('aria-label', title);
  }

  if (u !== 'Guest' && user) {
    liUserInfo?.classList.remove('d-none');
    if (ddFullName) ddFullName.textContent = user.fullName || u;
    if (ddUsername) ddUsername.textContent = '@' + (user.username || u);
  } else {
    liUserInfo?.classList.add('d-none');
    if (ddFullName) ddFullName.textContent = 'Guest';
    if (ddUsername) ddUsername.textContent = '@guest';
  }

  if (accountSettings) accountSettings.classList.toggle('d-none', u === 'Guest');

  if (signBtn) {
    // replace to remove previous listeners
    const clone = signBtn.cloneNode(true);
    signBtn.parentNode.replaceChild(clone, signBtn);
    const btn = clone;

    if (u === 'Guest') {
      btn.textContent = 'Sign in';
      btn.classList.remove('text-danger');
      btn.addEventListener('click', () => location.href = 'account.html');
    } else {
      btn.textContent = 'Sign out';
      btn.classList.add('text-danger');
      btn.addEventListener('click', () => {
        setSessionUser('Guest');
        localStorage.removeItem(LAST_USER_KEY);
        renderAuthDropdown();
        // stay on page
      });
    }
  }
}

/* ===== Favourites (per-user) ===== */
// Key helpers
function favKey(u) { return `favourites_${u}`; }
function favMetaKey(u) { return `favourites_meta_${u}`; }

// Storage for current user (Guest uses sessionStorage; users use localStorage)
function userStore() {
  const u = sessionUser();
  const isGuest = (u === 'Guest');
  const read = (k, def) => {
    try { return JSON.parse((isGuest ? sessionStorage.getItem(k) : localStorage.getItem(k)) || def); }
    catch { return JSON.parse(def); }
  };
  const write = (k, val) => {
    (isGuest ? sessionStorage : localStorage).setItem(k, JSON.stringify(val));
  };
  const kList = isGuest ? 'guest_favourites' : favKey(u);
  const kMeta = isGuest ? 'guest_fav_meta_v1' : favMetaKey(u);

  // one-time migration from legacy global keys (only for signed-in users)
  if (!isGuest) {
    const oldList = localStorage.getItem('favourites');
    const oldMeta = localStorage.getItem('favourites_meta_v1');
    if (oldList && !localStorage.getItem(kList)) {
      localStorage.setItem(kList, oldList);
      localStorage.removeItem('favourites');
    }
    if (oldMeta && !localStorage.getItem(kMeta)) {
      localStorage.setItem(kMeta, oldMeta);
      localStorage.removeItem('favourites_meta_v1');
    }
  }

  return {
    keyList: kList,
    keyMeta: kMeta,
    getFavs: () => read(kList, '[]'),
    setFavs: (arr) => write(kList, arr || []),
    getFavMeta: () => read(kMeta, '{}'),
    setFavMeta: (obj) => write(kMeta, obj || {}),
  };
}

function isAdded(name) {
  const { getFavs } = userStore();
  return getFavs().includes(name);
}

function addFavourite(name, meta) {
  const store = userStore();
  const list = store.getFavs();
  if (!list.includes(name)) list.push(name);
  store.setFavs(list);

  const m = store.getFavMeta();
  if (meta && typeof meta === 'object') {
    m[name] = { ...(m[name] || {}), ...meta };
  } else {
    m[name] = m[name] || {};
  }
  store.setFavMeta(m);
}

function removeFavourite(name) {
  const store = userStore();
  const list = store.getFavs().filter(x => x !== name);
  store.setFavs(list);
  const m = store.getFavMeta();
  if (m[name]) { delete m[name]; store.setFavMeta(m); }
}

/* Infer metadata from surrounding DOM (works for Malaysia/Global cards) */
function inferMetaFromDOM(btn) {
  // Try various attributes first
  const name = btn.getAttribute('data-food') || btn.getAttribute('data-fav') || btn.textContent.trim();
  const img = btn.getAttribute('data-img') || (btn.closest('.card')?.querySelector('img')?.getAttribute('src')) || '';
  let country = btn.getAttribute('data-country') || '';
  let state = btn.getAttribute('data-state') || btn.getAttribute('data-region') || '';

  // Parse "(Country)" pattern in titles like "Takoyaki (Japan)"
  if (!country) {
    const titleEl = btn.closest('.card')?.querySelector('.card-title, h5, h6');
    const t = titleEl ? titleEl.textContent.trim() : '';
    const m = t.match(/\(([^)]+)\)\s*$/);
    if (m) country = m[1];
  }

  // Malaysia page: data-region on ancestor
  if (!state) {
    const regionHolder = btn.closest('[data-region], [data-state]');
    if (regionHolder) {
      state = regionHolder.getAttribute('data-region') || regionHolder.getAttribute('data-state') || '';
    }
  }

  // Optional link
  const link = (btn.closest('.card')?.querySelector('a')?.getAttribute('href')) || '#';

  // Normalization
  country = (country || '').trim();
  state = (state || '').trim();

  if (!country && state) country = 'Malaysia';

  const meta = { img, country, state, link, source: 'site' };
  return meta;

}

/* Bind favourites buttons within a container.
   Options:
     - getMetaFor(btn): return meta object to store (overrides auto inference)
     - onChange({name, added}): callback after toggle
*/
function bindFavourites(root, options = {}) {
  if (!root) root = document;

  const buttons = $all('.fav-btn, [data-fav], [data-food]', root).filter(el => {
    const name = el.getAttribute('data-food') || el.getAttribute('data-fav');
    return !!name;
  });

  function setBtnAdded(el, added) {
    el.classList.toggle('btn-added', !!added);
    const hasLabel = el.hasAttribute('data-label');
    if (!hasLabel) {
      el.textContent = added ? 'Added to favourites' : (el.getAttribute('data-add-label') || 'Add to favourites');
    }
    el.disabled = false; // keep clickable to allow remove if you prefer toggle behavior
  }

  buttons.forEach(btn => {
    const name = btn.getAttribute('data-food') || btn.getAttribute('data-fav');
    setBtnAdded(btn, isAdded(name));

    // remove previous listeners by cloning
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.addEventListener('click', () => {
      const name2 = clone.getAttribute('data-food') || clone.getAttribute('data-fav');
      const already = isAdded(name2);
      if (already) {
        removeFavourite(name2);
        setBtnAdded(clone, false);
        options.onChange?.({ name: name2, added: false });
        return;
      }
      const meta = options.getMetaFor ? options.getMetaFor(clone) : inferMetaFromDOM(clone);
      addFavourite(name2, meta);
      setBtnAdded(clone, true);
      options.onChange?.({ name: name2, added: true });
    }, { passive: true });
  });
}

/* ===== Hero (homepage slideshow; safe no-op if not present) ===== */
function initHeroSlides() {
  const slides = $all('.hero-slides .slide');
  if (!slides.length) return;
  let i = 0;
  slides[0].classList.add('active');
  setInterval(() => {
    slides[i].classList.remove('active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('active');
  }, 4000);
}

/* ===== Change-password bridge (no-op if not present) ===== */
function initChangePasswordBridge() {
  // This file intentionally leaves change-password page logic inside its own HTML.
  // Nothing to do here; function kept for compatibility.
}

/* ===== Bootstrap everything ===== */
document.addEventListener('DOMContentLoaded', () => {
  try {
    hydrateSessionFromMemory();   // restore persisted login if any
    rememberIfSignedIn();         // persist current login if signed-in
    initTheme();
    highlightActiveNav();
    renderAuthDropdown();
    bindFavourites(document);
    initHeroSlides();
    initChangePasswordBridge();
  } catch (err) {
    console.warn('Init error:', err);
  }
});

/* ===== Expose tiny API ===== */
window.Site = {
  applyTheme,
  renderAuthDropdown,
  bindFavourites,
  sessionUser,
  userStore,
  addFavourite,
  removeFavourite,
  isAdded
};
window.renderAuthDropdown = renderAuthDropdown;

window.addEventListener('storage', (e) => {
  if (e.key === LAST_USER_KEY) {
    hydrateSessionFromMemory();
    renderAuthDropdown();
  }
});

