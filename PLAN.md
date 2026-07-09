# Plan: Implement "Jorge Manzur Portfolio" (Manzur.OS) from claude.ai/design import
_Locked via grill — by Claude + Jorge_

## Goal
Turn the imported claude.ai/design prototype (`design-import/` — a retro Mac OS Classic desktop-metaphor portfolio in React 18 + Babel-standalone) into a production static site: a Vite + React app that reproduces the design faithfully on desktop (boot screen, menubar, draggable windows, dock, fake SSH terminal per project, SimpleText-style blog reader, 4 themes, 3 font pairings), adds a stacked-cards fallback on small screens, exposes theme/font as a visitor-facing persisted setting, supports hash deep links to posts/projects, and deploys automatically to GitHub Pages.

## Approach
1. **Scaffold**: scaffold Vite (react template, JavaScript — source is plain JSX, no TS migration) in a temp dir and copy the generated files into the repo root, since the root is non-empty (`PLAN.md`, `design-import/`) and in-place `npm create vite` prompts/refuses on non-empty dirs. Git repo already initialized — do not re-init. Keep `design-import/` as the frozen reference.
2. **Port source**: split prototype files into `src/` modules with real ES imports instead of `window.*` globals and `Object.assign(window, …)`:
   - `src/data.js` (content verbatim, exported as `PORTFOLIO_DATA` — remains the single editable content file)
   - `src/styles.css` (verbatim as the desktop baseline, imported in `main.jsx`; a new mobile section overrides `html/body` overflow, `.desktop` sizing, `.win` absolute positioning, dock, titlebar, terminal, and notes layout under the <768px media query)
   - `src/desktop.jsx` (`WindowChrome` — titlebar + body, position-agnostic; `WindowFrame` — desktop draggable wrapper around it; useDraggable, MenuBar, Dock, Wallpaper, BootScreen)
   - `src/windows.jsx` (Hero/About/Projects/Blog/Experience/Contact/Post/Console windows + helpers)
   - `src/App.jsx` (window manager state, WINDOWS_CONFIG, ThemePicker)
   - Replace the prototype's `useTweaks`/`TweaksPanel` host-protocol code with a `usePrefs` hook: `{ theme, font }` state persisted to `localStorage`, defaults sunset/editorial. Reads validate against the theme/font whitelists (fall back to defaults on unknown values) and all storage access is wrapped in try/catch (private-mode safety).
   - Split `WindowFrame` into a reusable `WindowChrome` (titlebar + body, no positioning) and a desktop-only draggable wrapper, so the mobile layout reuses the chrome statically without drag state or absolute dimensions.
3. **Settings window ("Preferencias")**: new window opened from the dock (and menubar) — draggable `WindowFrame` on desktop, static `WindowChrome` card on mobile — containing the ThemePicker (4 swatch buttons) and font-pairing radio (reusing the design's visual style, not the twk-* panel). Closed by default.
4. **Boot screen**: play once per browser session; the `booted` state initializes synchronously (lazy `useState` initializer reading guarded `sessionStorage` + `matchMedia('(prefers-reduced-motion: reduce)')`) so skipped loads never flash the overlay.
5. **Hash deep links**: `#/post/<slug>` and `#/proyecto/<slug>`; the hash is the source of truth for the post/project overlays. Reading: on load and `hashchange`, a read-only handler derives state — a post/project hash sets exactly one active overlay, `#/` (or no hash) clears both — so browser Back from `#/post/foo` closes the post. Writing: hash writes happen only in the explicit user handlers (open → `pushState`; prev/next and close → `replaceState`); the `hashchange` handler never writes, preventing double-writes/loops. Unknown post/project slugs clear both overlays and normalize the URL to `#/` via `replaceState` (no stale UI/URL mismatch). No router library.
6. **Mobile fallback (<768px)**: media-query + `matchMedia`-driven mode where the desktop canvas becomes a normally scrolling page; each open section renders as a full-width static card using `WindowChrome` (no drag, no absolute positioning); dock becomes a simple nav that scrolls to/toggles sections; terminal and post reader render inline as cards.
7. **HTML shell**: `index.html` with `lang="es"`, real `<title>`, meta description, OG tags, retro favicon (simple SVG square logo matching `.logo`), Google Fonts CDN links preserved.
8. **Deploy**: GitHub Actions workflow (`.github/workflows/deploy.yml`): Node 20, `vite build`, then the full Pages chain — `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` — with `permissions: { contents: read, pages: write, id-token: write }`. `vite.config.js` derives `base` from `process.env.GITHUB_REPOSITORY` (→ `/<repo>/`), defaulting to `/` locally; documented override for a future custom domain.
9. **Hardening ported code**: escape every value interpolated into the terminal `srcDoc` (including stack chips, currently unescaped in the prototype); "↗ Live" only opens `liveUrl` when it parses as an `https:` URL, otherwise renders as plain text; window positions clamp to the viewport on mount **and** on window resize/orientation change.
10. **Verify**: `npm run build` clean; drive the built site via `vite preview` with scripted browser checks (Chrome automation) covering: boot-once behavior, dragging, open/close of every window, theme/font switching + persistence across reload, deep-link open for a post and a project, Back/Forward sanity, and a 390px-wide mobile pass.

## Key decisions & tradeoffs
- **Vite + React over no-build or Next/Astro**: faithful port with a real production bundle; site is fully client-side interactive so SSR adds nothing.
- **Placeholder content ships as-is**: `data.js` is knowingly fictional (projects, jobs, phone, URLs); Jorge edits it later. Not a bug.
- **ES modules over window globals**: mechanical refactor, riskiest part of the port (implicit load-order deps in the prototype, e.g. `windows.jsx` references `ConsoleWindow` before its definition in an `Object.assign` — fixed naturally by modules).
- **Hash links, not a router**: shareability at ~30 LOC; the desktop is one canvas, routes would fight the metaphor.
- **Stacked-cards mobile fallback**: same content components, alternate layout; full mobile window-manager rejected as low payoff.
- **Google Fonts CDN kept** (vs self-host): simpler; accepted third-party dependency.
- **Terminal previews stay `srcDoc` placeholders**: the live URLs are fictional; the "↗ Live" button opens a URL only if it validates as `https:` (per Approach step 9), otherwise it renders as plain text.
- **Tweaks host protocol dropped**: it only functions inside the claude.ai/design host.

## Risks / open questions
- Draggable windows use mouse events only — touch drag won't work; acceptable because mobile uses the stacked fallback, but tablets in the 768px+ range lose drag (could add pointer events cheaply).
- `dangerouslySetInnerHTML` in the terminal renders only self-generated text escaped by `colorizeTerm`; keep the escaping (srcDoc escaping gap is fixed in Approach step 9).
- No automated test suite: verification is scripted-browser + build checks (Playwright harness judged out of proportion for a personal static site; can be added later if the site grows).

## Out of scope
- Real content (projects/CV/contact) — future `data.js` edit.
- CMS, blog markdown pipeline, or per-post SEO/SSR.
- Full mobile desktop metaphor; touch dragging.
- Custom domain setup.
- Analytics, contact form backend.
