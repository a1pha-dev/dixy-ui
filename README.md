# Dixy UI — A/B Testing Platform for Conversion Optimization

## Objective

Increase order conversion rate by **1.5 percentage points** through data-driven A/B testing of the mobile storefront UI.

The project compares two versions of the interface:
- **Variant A (Reference)** — full-featured home screen with loyalty program, quick actions, brand grid, stories carousel, promo slider, and catalog preview.
- **Variant B (Conversion-Optimized)** — stripped-down home screen focused on speed: prominent search, hero banner, horizontal category chips, and a direct product grid with one-tap add-to-cart. The seasonal "Summer" tab and all non-essential navigation paths are removed.

Hypothesis: reducing cognitive load and click depth will shorten the path from landing to checkout, increasing the share of completed orders.

---

## What Was Done

### 1. UI Redesign (Variant A — Reference)
- Redesigned home screen to match the Dixy mobile app reference screenshots:
  - Compact loyalty header (level, cashback, coin balance, full-width barcode)
  - 2×4 quick actions grid (products by card, purchases, coupons, stickers, favorites, categories, promo codes)
  - Store address bar + search
  - Two banners (assortment + mini-game)
  - Popular brands grid (4×2) with inline SVG logos (Nescafé, Baltika, Ouch, O!Life, etc.)
  - Stories-style promo scroll (vertical cards)
  - Big promo carousel with scroll-snap
  - Catalog preview (3×2 categories)
- Redesigned profile screen with custom header, orange loyalty card, quick-action buttons, and settings list with icons.
- Replaced emoji nav icons with inline SVG for consistent rendering.

### 2. UI Redesign (Variant B — Conversion-Optimized)
- Removed loyalty header, quick actions, brands, stories, promo carousel, and catalog preview from the home screen.
- Added compact top bar with prominent search and promo badge.
- Single focused hero banner.
- Horizontal scrollable category chips for faster navigation.
- **Direct product grid on the home screen** with a visible "+" add button — one click to add to cart.
- Toast notification on every add-to-cart action.
- Bottom nav reduced from 5 to 4 tabs (removed "Summer" tab).

### 3. Navigation & Scrolling Fixes
- Fixed broken DOM nesting (extra `</div>` tags in `profile.html` and `nav.html` that pushed the bottom bar outside the flex layout).
- Restructured bottom navigation to 5 tabs (Home, Catalog, Summer, Promotions, Profile) with a floating cart pill button.
- Fixed conflicting `overflow-y` rules: `.screen` is now the sole scroll container, `#home-screen` uses `display: block`, eliminating double scrollbars.

### 4. A/B Testing Framework
- **Random 50/50 assignment** on first visit, persisted in `localStorage` across sessions.
- Assignment stored in `state.abGroup` (`'A'` or `'B'`).
- CSS classes `ui-a` / `ui-b` on `<body>` toggle which home screen markup is displayed.
- Manual override for testing: `localStorage.setItem('dixy_ab_group', 'A'); location.reload()`.

### 5. Mission System with Version Awareness
- Missions are generated server-side (or client-side for static builds) with the constraint that **Variant B users never receive missions requiring the "Summer" tab**, since that tab does not exist in the conversion UI.
- Mission types: `SCREEN` (visit target screen), `ADD_ITEM` (add N items), `CHECKOUT` (complete purchase), `COMBO` (multi-step).
- **Auto-completion logic**:
  - `SCREEN` — completes when the target screen is entered.
  - `ADD_ITEM` — completes when the required number of items is in the cart.
  - `CHECKOUT` — completes when the checkout button is pressed.
  - `COMBO` — tracks subtasks (`screen_*`, `add_item`, `checkout`) and completes when all are satisfied.
- Guard flag `missionCompleting` prevents double completion.
- Confetti animation fires on every successful completion.

### 6. Detailed Analytics Logging
Every screen transition and interaction now logs:
- `from`, `to` — navigation path
- `timestamp` — ISO-8601
- `ab_group` — A or B variant
- `session_id` — unique per browser session
- `time_on_screen_ms` — dwell time on the previous screen
- `cart_value` — total ruble value of the current cart
- `cart_count` — number of distinct items in cart

**Storage by environment:**
- **Local server (`localhost:8000`)** — logs appended to `clicks.jsonl` (newline-delimited JSON) in the project root.
- **GitHub Pages (static)** — logs accumulated in browser `localStorage` under key `dixy_logs`. After completing a mission, the user can press **"Download Logs"** in the success modal to receive a JSON file named `dixy_logs_{GROUP}_{TIMESTAMP}.json`.

---

## Architecture

### Backend (FastAPI + Jinja2)
```
main.py                     FastAPI app, CORS, static mount, click-log endpoint
app/config.py               Categories, products, promotions, user profile
app/models.py               Pydantic models (Mission, MissionStats)
app/missions.py             Mission generator with version-aware filtering
app/routes_catalog.py       GET /api/catalog, /api/products, /api/all-products, /api/promotions, /api/profile
app/routes_missions.py      GET /api/mission/new, /api/mission/{id}, POST /api/mission/{id}/complete
app/analytics.py            ClickTracker — persists to clicks.jsonl
```

### Frontend (Vanilla JS + Single CSS)
```
templates/app.html          Root shell, includes all screens and components
templates/screens/
  home.html                 Dual-variant home screen (A and B wrappers)
  profile.html              Custom profile layout
  catalog.html              Category grid
  products.html             Product listing
  cart.html                 Cart with quantity controls
  promo.html                Promotions list
  summer.html               Seasonal products
templates/components/
  nav.html                  Bottom tab bar + floating cart button
  drawer.html               Mission progress drawer
  modal.html                Success modal with stats + download button
static/css/style.css        Single stylesheet (~2400 lines)
static/js/app.js            State management, API wrapper, cart, mission logic, A/B assignment, log export
```

---

## API Endpoints

### Catalog
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/catalog` | Product categories |
| GET | `/api/all-products` | Full product catalog |
| GET | `/api/promotions` | Active promotions |
| GET | `/api/profile` | User profile |

### Missions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mission/new?ab_group=A\|B` | Generate a mission filtered by UI variant |
| GET | `/api/mission/{id}` | Retrieve mission state |
| POST | `/api/mission/{id}/complete` | Complete mission with stats payload |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/click-log` | Log interaction with `ab_group`, `session_id`, `time_on_screen_ms`, `cart_value`, `cart_count` |
| GET | `/api/analytics/clicks` | Aggregated click statistics |

---

## Running Locally

```bash
cd /Users/a1pha/PycharmProjects/dixy-ui-old
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` in a mobile-width browser viewport (390×844 recommended).

---

## GitHub Pages Deployment

The `docs/` folder contains a fully static build (pre-rendered HTML + embedded data + client-side JS).

1. In repository **Settings → Pages**, set:
   - Source: **Deploy from a branch**
   - Branch: `main` → `/docs` folder
2. Save. The site will be available at `https://<username>.github.io/<repo>/`.
3. In static mode, missions are generated client-side and analytics are stored in `localStorage` until manually downloaded.

---

## Project Structure

```
dixy-ui-old/
├── main.py
├── requirements.txt
├── build_static.py          # Pre-renders templates into docs/index.html
├── clicks.jsonl             # Local server analytics log
├── app/
│   ├── config.py
│   ├── models.py
│   ├── missions.py
│   ├── analytics.py
│   ├── routes_catalog.py
│   └── routes_missions.py
├── templates/
│   ├── app.html
│   ├── screens/
│   │   ├── home.html
│   │   ├── profile.html
│   │   ├── catalog.html
│   │   ├── products.html
│   │   ├── cart.html
│   │   ├── promo.html
│   │   └── summer.html
│   └── components/
│       ├── nav.html
│       ├── drawer.html
│       └── modal.html
├── static/
│   ├── css/style.css
│   └── js/app.js
└── docs/                    # Static build output for GitHub Pages
    ├── index.html
    └── static/
        ├── css/style.css
        └── js/app.js
```

---

## Version

**2.1.0** — May 2026

