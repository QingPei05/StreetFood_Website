// Loader (shared)
document.addEventListener('DOMContentLoaded', async () => {
    // 1) Inject partials
    const hosts = Array.from(document.querySelectorAll('[data-include]'));
    await Promise.all(
        hosts.map(async host => {
            const url = host.getAttribute('data-include');
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                host.outerHTML = await res.text();
            } catch (e) {
                console.warn('Failed to include', url, e);
            }
        })
    );

    // 2) Highlight active nav link
    try {
        const path = (location.pathname.split('/').pop() || 'index.html');
        document.querySelectorAll('.navbar .nav-link').forEach(a => {
            const href = a.getAttribute('href');
            if (href) a.classList.toggle('active', href === path);
        });
    } catch { }

    // 3) Re-render auth dropdown (main.js exposes this)
    try { window.renderAuthDropdown && window.renderAuthDropdown(); } catch { }

    // 4) Bind theme toggle for the now-inserted navbar
    try {
        const btn = document.getElementById('themeToggleItem');
        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = '1';
            btn.addEventListener('click', () => {
                const cur = (document.documentElement.getAttribute('data-bs-theme') === 'dark') ? 'dark' : 'light';
                if (window.Site && window.Site.applyTheme) {
                    window.Site.applyTheme(cur === 'dark' ? 'light' : 'dark');
                } else {
                    const next = (cur === 'dark') ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-bs-theme', next);
                    try { localStorage.setItem('site_theme_v1', next); } catch { }
                }
            });

            // Ensure icon/text match saved theme on first load
            try {
                const saved = localStorage.getItem('site_theme_v1');
                if (window.Site && window.Site.applyTheme) {
                    window.Site.applyTheme(saved === 'dark' ? 'dark' : 'light');
                }
            } catch { }
        }
    } catch { }
});
