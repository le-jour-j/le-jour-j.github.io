# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo hosted on GitHub Pages containing:
- **le-jour-j.github.io**: Main site (jeansonpechin.com)
- **banque-fantome**: React PWA for a fictional economy system with Supabase
- **tour-de-phrance**: React app for roadtrip planning/viewing with Supabase
- **Static sites**: lamusique (music player), modules (documentation), poiasie (poetry collection), etc.

## Development Commands

### Universal

Run commands from the working directory (`C:\Users\Pole-Fromage\Documents\GitHub\le-jour-j.github.io`).

```bash
# Clone dependencies
cd banque-fantome && npm install
cd ../tour-de-phrance && npm install

# Build for deployment (generates dist/ in each project)
cd banque-fantome && npm run build
cd tour-de-phrance && npm run build

# Local development server
cd banque-fantome && npm run dev       # Runs on http://localhost:5173/
cd tour-de-phrance && npm run dev      # Runs on http://localhost:5173/
```

### Supabase Configuration

Both React projects require Supabase credentials as environment variables:

**banque-fantome** (.env.local or CI secrets):
```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**tour-de-phrance**: Check `src/config/` or source files for required env vars (may be hardcoded or in config).

In CI (deploy.yml), these are injected as GitHub secrets.

## Architecture

### Project Structure

```
le-jour-j.github.io/
├── banque-fantome/           # React PWA for economy simulation
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx          # Entry point
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Supabase client (supabase.js)
│   │   └── utils/            # Utilities
│   ├── vite.config.js        # PWA + caching strategy configured here
│   └── package.json
│
├── tour-de-phrance/          # React app for roadtrips
│   ├── src/
│   │   ├── App.jsx
│   │   ├── RoadtripApp.jsx   # Main roadtrip logic
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── data/             # Static roadtrip data
│   │   ├── config/           # Configuration
│   │   ├── lib/
│   │   └── pages/
│   ├── vite.config.js
│   └── package.json
│
├── lamusique/                # Static music player site
│   ├── index.html
│   ├── player.js
│   ├── embeds.js
│   ├── feed.rss              # RSS feed
│   └── [music-dirs]/
│
├── modules/                  # Static documentation/module pages
│   └── *.html
│
├── poiasie/                  # Poetry site
│   ├── index.html
│   └── poemes.json           # Poetry data
│
├── drive/, images/, assets/  # Static content
│
├── scripts/
│   └── inject-bf-redirect.cjs # GitHub Pages SPA hack for banque-fantome
│
├── .github/workflows/
│   ├── deploy.yml             # Main CI/CD pipeline
│   ├── keep-supabase-awake.yml # Keep Supabase from going idle
│   └── keep-tour-de-phrance-awake.yml
│
└── [root static files]        # index.html, 404.html, CSS, etc.
```

### Key Architectural Decisions

1. **GitHub Pages Deployment**: No backend server; all builds must produce static assets or SPAs
2. **SPA Routing Hack**: banque-fantome uses client-side routing; 404.html is injected with a sessionStorage redirect in deploy.yml
3. **Vite PWA**: banque-fantome is a PWA with service worker caching (polices, images, and Supabase data policy defined in vite.config.js)
4. **Supabase as Backend**: Both React apps talk to Supabase for data/auth (URLs/keys injected at build time)
5. **Monorepo, No Monorepo Tool**: No workspaces or lerna; each project is independent; rsync assembles the final site

## Build & Deployment Pipeline

**File**: `.github/workflows/deploy.yml`

**Trigger**: Push to `main` or manual `workflow_dispatch`

**Steps**:
1. Checkout code
2. Setup Node.js (v24)
3. Install & build `tour-de-phrance` → `tour-de-phrance/dist/`
4. Install & build `banque-fantome` (with Supabase env secrets) → `banque-fantome/dist/`
5. Assemble site:
   - Copy repo root (except `.git`, `.github`, `scripts`, both source dirs) to `public-build/`
   - Copy `tour-de-phrance/dist/*` → `public-build/tour-de-phrance/`
   - Copy `banque-fantome/dist/*` → `public-build/banque-fantome/`
   - Set CNAME to `jeansonpechin.com`
6. **Inject banque-fantome SPA hack**: Run `scripts/inject-bf-redirect.cjs` on `public-build/404.html` (adds sessionStorage redirect for deep links)
7. Deploy to GitHub Pages

**Important**: 404.html is regenerated from index.html by an external process and loses the SPA injection on each deploy; it is reinjected in step 6.

## Common Tasks

### Add a New React Component

1. Create file in `banque-fantome/src/components/` or `tour-de-phrance/src/components/`
2. Use React 18 hooks; import Supabase client from `../lib/supabase.js` if needed
3. Run `npm run dev` to test locally
4. Commit to main; CI will rebuild and deploy

### Modify Supabase Data

- Both apps source data from Supabase Realtime or REST API
- Check `lib/supabase.js` in each project for the client setup
- Env vars for URLs/keys are injected in deploy.yml; update GitHub secrets if endpoints change

### Update Static Sites (lamusique, modules, poiasie)

- Edit HTML/CSS/JSON directly
- Commit; pipeline includes them in the site as-is
- No build step required for static content

### Test PWA Offline

- banque-fantome is a PWA with a service worker
- `npm run dev` inside banque-fantome and open DevTools → Application → Service Workers to test offline behavior
- Caching strategy in vite.config.js: fonts (cache-first), Supabase images (stale-while-revalidate), Supabase API (network-only)

### Debug Deep Links in banque-fantome

- GitHub Pages has no server-side rewrites; URLs like `/banque-fantome/market` would 404
- Solution: 404.html detects `/banque-fantome/*` paths, stores them in sessionStorage, and redirects to `/banque-fantome/`
- App (App.jsx) checks sessionStorage on load and navigates to the intended route
- If a deep link fails, check:
  1. `scripts/inject-bf-redirect.cjs` ran successfully in deploy.yml
  2. App.jsx loads the redirect from sessionStorage on mount
  3. React Router is configured with correct base path `/banque-fantome/`

## Gotchas & Notes

1. **No Root package.json**: Each project is independent; install dependencies in the project directory, not root
2. **Vite base paths**: 
   - banque-fantome: `base: '/banque-fantome/'` in vite.config.js
   - tour-de-phrance: `base: './'` (relative)
   - Import/export paths must be relative or use aliases; check vite.config.js
3. **GitHub Pages SPA routing**: Only banque-fantome uses this hack; tour-de-phrance has `base: './'` and may need different handling if it uses HashRouter
4. **Secrets in CI**: Supabase URL and keys are stored in GitHub repository secrets, not in code
5. **Node version**: CI uses Node 24; if issues arise locally, match this version
6. **PWA versioning**: banque-fantome's service worker auto-updates on page reload (registerType: 'autoUpdate' in vite.config.js); hard refresh may be needed to test cache changes

## Useful Files to Read First

- `banque-fantome/src/App.jsx` - main component and routing
- `tour-de-phrance/src/RoadtripApp.jsx` - main app logic
- `banque-fantome/vite.config.js` - PWA and caching setup
- `.github/workflows/deploy.yml` - build and deployment process
- `scripts/inject-bf-redirect.cjs` - SPA hack for GitHub Pages
