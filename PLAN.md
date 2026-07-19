# Plan: Make "Sobre mí" and "Contacto" editable via Payload admin (Globals stored in Neon)
_Locked via grill — by Claude + Jorge. Revised after Codex Round 1. Replaces the previous (shipped) migration plan, preserved in git history._

## Goal
The portfolio (Next.js + Payload CMS + Neon Postgres, deployed on Vercel) currently hardcodes the "Sobre mí" and "Contacto" section content in `src/data.js`. Add two Payload **Globals** — `about` and `contact` — so Jorge can edit that content from the existing `/admin` panel alongside Users, Media, Projects, and Posts. Payload's dev-mode schema push creates the new tables in Neon automatically; no manual Neon work. The rendered site falls back to the current `src/data.js` values per field whenever a global was never saved, a field is empty, or the global fetch fails — so the sections can never render empty.

## Approach
1. Create `globals/About.ts`: fields `paragraphs` (array of `{ text: textarea, required }`), `nowPlaying`, `nowReading`, `nowBuilding` (optional text). Declare **no `access` config**, matching the existing collections (which declare none): Payload's default restricts REST/GraphQL reads and updates to authenticated users, and the frontend reads via the Local API with `overrideAccess` (the default), so nothing new is exposed publicly.
2. Create `globals/Contact.ts`: fields `email` (Payload `email` field type, so it's validated — it feeds `mailto:` in `src/windows.jsx:186`), `phone` (text), `socials` (array of `{ label: text required, handle: text required }`). Same no-`access` default as above; email/phone are therefore NOT readable via the public API, only server-rendered.
3. Register both in `payload.config.ts` via `globals: [About, Contact]`.
4. In `lib/frontend-data.ts`, add pure normalizer functions `normalizeAbout(doc)` / `normalizeContact(doc)` (exported for testing) that map Payload docs to the exact shapes `src/data.js` uses, with **per-field fallback** to the static defaults: null/undefined/empty-string fields and empty arrays fall back individually; `paragraphs`/`socials` rows are mapped (`rows.map(r => r.text?.trim()).filter(Boolean)`, falling back if the result is empty). Unsaved globals (doc with nulls) therefore yield the full static content.
5. Extend `getFrontendPortfolioData`: when `DATABASE_URL` is set, fetch both globals via `payload.findGlobal(...)` in the same `Promise.all` as projects/posts, but **wrapped so a failed global fetch (e.g. table not yet pushed to Neon) logs and falls back to static defaults** instead of 500ing the page. Pass the normalized objects into `createPortfolioData`.
6. Update `src/data.js`: export the static `about`/`contact` defaults; `createPortfolioData` uses the already-normalized `content.about`/`content.contact` when provided, else the static defaults. No-DB path unchanged. (Note: this fallback behavior is deliberately stronger than the existing projects/posts path, which does not fall back when the DB is reachable but empty — that asymmetry is accepted.)
7. Regenerate generated artifacts explicitly: `npx payload generate:types` and `npx payload generate:importmap` (the checked-in `app/(payload)/admin/importMap.js` is generated state); commit both outputs.
8. Add a small `node --test` file exercising the normalizers: missing doc, all-null unsaved doc, empty strings, empty arrays, and mixed partial content.
9. Run `npm run dev` locally once against the Neon `DATABASE_URL` so Payload pushes the two new global tables to Neon (purely additive — should be prompt-free). Verify `/admin` shows About and Contact; save initial content.
10. `npm run build` + tests to verify, then deploy to Vercel. Frontend page is `force-dynamic`, so admin edits appear immediately without redeploy. Even if a deploy ever lands before schema push, step 5's error fallback keeps the page rendering static content.

## Key decisions & tradeoffs
- **Globals, not a single-doc collection** — singletons; Payload's purpose-built primitive.
- **Scope limited to About + Contact** — Hero and Experience stay hardcoded (user's call).
- **No `access` config → API stays authenticated-only** — contact email/phone are not exposed via REST/GraphQL; the server renders them via Local API. Simpler and safer than public read.
- **Dev-mode schema push, no migrations** — matches how existing tables were created. Tradeoff: schema changes require a local dev run before deploy; mitigated by the error-fallback in step 5.
- **Per-field fallback to hardcoded values instead of one-time seed** — sections never render empty; content lives in two places until globals are filled in (accepted).
- **Socials keep `{label, handle}`, no URL field** — zero rendering changes in `src/windows.jsx`.

## Risks / open questions
- Schema push against Neon is interactive on ambiguous changes; these are purely additive so it should be prompt-free, but watch the first `npm run dev` run.
- `npx payload generate:*` needs the Payload config to load (requires env vars present locally).

## Out of scope
- Hero and Experience sections (stay in code).
- Payload migrations setup.
- Clickable social URLs or any visual/frontend redesign.
- Any manual Neon dashboard configuration.
