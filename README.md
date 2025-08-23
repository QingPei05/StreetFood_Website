# Explore Street Food — Web Project

A lightweight, static website that showcases Malaysian and global street food with favourites, account simulation, dark/light theme, and a “View on Map” experience that centers correctly on the selected country or Malaysian state.

---

## 1) Quick Start

You should serve the site over HTTP (so the partials loader can fetch the navbar/footer and the browser can grant better geolocation accuracy).

### Option A — VS Code (recommended)

* Install the “Live Server” extension.
* Open the project folder, right-click `index.html` → **Open with Live Server**.

### Option B — Python (built-in on macOS/Linux/WSL)

```bash
# from the project folder:
python -m http.server 8000
# then open http://localhost:8000
```

### Option C — Node

```bash
npx serve .
# then open the printed URL, e.g. http://localhost:3000
```

---

## 2) Project Structure

```
.
├─ index.html              # Home (hero section + highlights)
├─ about.html              # About + team section (numbered badges)
├─ malaysia.html           # Malaysian dishes (state filter + “View on Map”)
├─ global.html             # Global dishes (continent filter + “View on Map”)
├─ map.html                # Map page (geolocate by default; honors ?food/&country/&state)
├─ search.html             # Simple search (optional demo)
├─ reviews.html            # Local reviews (saved in localStorage)
├─ favourites.html         # Per-user favourites grid
├─ account.html            # Sign in / Sign up / Signed-in actions
├─ change-password.html    # Change password (localStorage demo)
├─ contact.html            # Contact form + social card
├─ styles.css              # All site styling (including About “team number” circle)
├─ main.js                 # Shared JS: theme, navbar, favourites, auth dropdown, etc.
├─ partials/
│  ├─ navbar.html          # Shared navbar (included into pages)
│  ├─ footer.html          # Shared footer (included into pages)
│  └─ loader.js            # Minimal include loader for partials (navbar/footer)
└─ scripts/
   └─ auth-gate.js         # Optional auth gate hook (kept as a shared include)
```

---

## 3) Credits / License

* **Images**: Educational use from public sources credited on the **About** page.
* **Libraries**: [Bootstrap 5.3](https://getbootstrap.com/).
* **License**: Classroom/educational use.