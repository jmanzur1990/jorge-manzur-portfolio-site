# Plan Review Log: Manzur.OS portfolio implementation
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

## Round 1 — Codex
Material issues in `PLAN.md`:

- [PLAN.md:8](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:8) says `git init`, but this repo is already a git repo; that risks needless metadata churn or confusion. Fix: change scaffold step to “detect existing repo; only initialize git if `.git` is absent.”
- [PLAN.md:11](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:11) says `styles.css` is ported verbatim, but [styles.css:110](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/design-import/styles.css:110), [styles.css:126](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/design-import/styles.css:126), and [styles.css:620](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/design-import/styles.css:620) hard-lock the page into hidden 100vh desktop layout. Fix: explicitly add mobile overrides for `html/body`, `.desktop`, `.win`, `.dock`, titlebars, terminal, and notes layout.
- [PLAN.md:15](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:15) does not validate persisted prefs. A stale or malicious `localStorage` value can produce invalid `theme-*` / `font-*` classes. Fix: whitelist theme/font enum values and wrap storage reads/writes in `try/catch`.
- [PLAN.md:17](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:17) can still flash the boot overlay before effects read `sessionStorage` or `prefers-reduced-motion`. Fix: initialize `booted` synchronously from guarded `sessionStorage`/`matchMedia` before first render.
- [PLAN.md:18](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:18) underspecifies hash/history behavior; naive `location.hash = ""` or per-open assignments will spam history and make Back/Forward reopen/close windows unpredictably. Fix: define `pushState` only for user-opened post/project links and `replaceState` for close/nav normalization.
- [PLAN.md:18](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:18) mentions open/close sync but not post navigation via [windows.jsx:272](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/design-import/windows.jsx:272). Fix: update the hash whenever `activePostSlug` or `activeProjectSlug` changes, including prev/next navigation.
- [PLAN.md:19](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:19) says “same components” for mobile, but `WindowFrame` owns drag state and inline absolute dimensions. Fix: split reusable `WindowChrome` from desktop positioning/drag wrapper, or add an explicit static mobile frame component.
- [PLAN.md:21](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:21) says GitHub Pages deploy with `actions/deploy-pages` but omits required Pages setup permissions/artifact actions. Fix: specify `permissions: contents: read, pages: write, id-token: write`, `configure-pages`, `upload-pages-artifact`, and `deploy-pages`.
- [PLAN.md:21](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:21) leaves `base` as an open question, which is a known blank-page failure for this repo name. Fix: set `base: '/jorge_manzur-portfilio-site/'` or derive it from `GITHUB_REPOSITORY` with a documented custom-domain override.
- [PLAN.md:22](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:22) verification is too manual for a layout-heavy port. Fix: require Playwright or equivalent smoke checks for desktop and mobile screenshots, deep links, and persisted prefs.
- [PLAN.md:31](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:31) accepts opening editable `liveUrl` values from data via [windows.jsx:360](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/design-import/windows.jsx:360). Fix: only allow `https:` URLs and disable/render plain text for invalid URLs.
- [PLAN.md:36](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:36) says terminal HTML is escaped, but `buildPreviewSrcDoc` injects raw stack chip text at [windows.jsx:444](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/design-import/windows.jsx:444). Fix: run every interpolated `srcDoc` value, including stack items, through `escapeHtml`.
- [PLAN.md:37](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:37) says clamp positions “at mount” only; after resize/orientation changes windows can remain offscreen. Fix: clamp on mount and on viewport resize, preserving current drag offsets where possible.

VERDICT: REVISE
### Claude's response
Accepted 12 of 13 findings, revised PLAN.md accordingly:
- git already initialized (scaffold step corrected)
- explicit mobile CSS override section named
- localStorage prefs validated against whitelists + try/catch
- boot state initialized synchronously (no overlay flash)
- hash semantics defined: pushState on open, replaceState on prev/next + close; hash follows slug state incl. navigation
- WindowFrame split into WindowChrome + desktop drag wrapper
- Pages workflow now specifies permissions + configure/upload/deploy-pages chain
- vite `base` derived from GITHUB_REPOSITORY with custom-domain override
- srcDoc stack chips escaped; Live button restricted to https: URLs
- position clamping on mount AND resize

Rejected (with reason): mandatory Playwright/equivalent test harness — out of proportion for a personal
static portfolio; verification remains scripted browser checks + clean build, explicitly listed as a
residual risk in PLAN.md.

## Round 2 — Codex
Prior findings are mostly addressed: no `git init`, storage validation, boot flash, mobile layout overrides, `WindowChrome` split, Pages workflow, `base`, `srcDoc` escaping, URL validation, resize clamping, and scripted browser verification are now in the plan.

Remaining material issues:

- [PLAN.md:19](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:19) only says hash parsing opens matching windows; it does not say `#/` clears `activePostSlug` / `activeProjectSlug`, so browser Back from `#/post/foo` to `#/` can leave the post window open. Fix: define hash as the source of truth for post/project overlays: `#/` clears both, post/project hashes set exactly one active overlay.
- [PLAN.md:19](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:19) combines “pushState when user opens” with “hash updates on every active slug change,” which can easily double-write history or loop with `hashchange`. Fix: centralize hash writes in explicit user/navigation handlers and make the `hashchange` handler read-only, or add a guarded sync flag.
- [PLAN.md:17](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:17) still says settings uses the existing `WindowFrame` chrome, but [PLAN.md:16](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:16) splits chrome into `WindowChrome` plus a desktop wrapper. Fix: specify `Preferencias` uses desktop `WindowFrame` on desktop and static `WindowChrome` on mobile.
- [PLAN.md:33](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:33) says `"↗ Live" button still opens them (accepted)`, but [PLAN.md:23](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:23) says invalid/non-HTTPS URLs render as plain text. Fix: update the tradeoff text to match the hardening rule.

VERDICT: REVISE
### Claude's response
Accepted all 4 findings (consistency/underspecification):
- Hash is now defined as source of truth: read-only hashchange handler; `#/` clears both overlays.
- Hash writes centralized in user handlers only (pushState on open, replaceState on nav/close); no writes from hashchange — no loops.
- Preferencias window specified as WindowFrame on desktop / WindowChrome card on mobile.
- Tradeoff text for "↗ Live" aligned with the https-only hardening rule.

## Round 3 — Codex
Prior findings are addressed: hash clearing/back behavior, read-only hashchange, settings desktop/mobile chrome, and Live-button hardening are now explicit.

Remaining issues:

- [PLAN.md:8](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:8) still says `npm create vite@latest` “at repo root”; Vite scaffolding into a non-empty directory with `PLAN.md` and `design-import/` can prompt or refuse depending invocation. Fix: specify non-interactive `npm create vite@latest . -- --template react` only after confirming/allowing non-empty dir behavior, or scaffold in a temp dir and copy generated files.
- [PLAN.md:19](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:19) says the hash is source of truth but “unknown slugs are ignored”; if a post is open and the user navigates to `#/post/not-real`, ignoring leaves stale UI that no longer matches the URL. Fix: unknown post/project hashes should clear both overlays or normalize to `#/`.
- [PLAN.md:12](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:12) still lists `WindowFrame` as the desktop module export, while [PLAN.md:16](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:16) says it will be split into `WindowChrome` plus a desktop wrapper. Fix: update the module inventory to name both exports so implementers do not preserve the old coupled component.

VERDICT: REVISE
### Claude's response
Accepted all 3:
- Scaffold now via temp dir + copy (non-empty root).
- Unknown slugs clear overlays and replaceState to `#/`.
- Module inventory names WindowChrome + WindowFrame explicitly.

## Round 4 — Codex
Prior findings are addressed: scaffolding now avoids the non-empty root, `WindowChrome`/`WindowFrame` are named in the module inventory, and unknown slugs no longer leave stale overlays.

One minor wording conflict remains: [PLAN.md:19](/Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:19) says the `hashchange` handler is read-only, then says unknown slugs normalize the URL via `replaceState`. Fix: phrase this as a guarded canonicalization exception after clearing overlays, or drop URL normalization and just clear state. This is not a material implementation blocker.

VERDICT: APPROVED
Converged: APPROVED in 4 rounds.
