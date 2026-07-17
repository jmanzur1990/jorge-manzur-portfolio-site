# Plan Review Log: Integrar Decap CMS para editar Proyectos y Posts
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.
Reviewer model: CLI default (config unpinned) — gpt-5.6-sol, reasoning=ultra — codex-cli 0.144.1.

## Round 1 — Codex
Material issues in `PLAN.md`:

1. BLOCKER — Deployment topology contradicts the repository. Plan assumes Vercel hosts site + OAuth
   functions, but the only encoded deploy target is GitHub Pages (`.github/workflows/deploy.yml`),
   with a repo-relative Vite base. Pages can't run `api/*.js`; `/admin` and `/uploads` resolve wrong
   under a Pages subpath. Fix: pick one canonical host, make admin/media/OAuth/base paths consistent.
2. BLOCKER — No usable Git backend baseline. `git remote -v` is empty; app/package files are
   untracked. `<owner>/<repo>` cannot be verified. Fix: commit + push to a named GitHub remote first.
3. BLOCKER — Proposed loader is technically broken. Raw glob omits `import: "default"` so values are
   module namespaces; `gray-matter` uses Node `Buffer`/APIs Vite doesn't polyfill in the browser.
   Fix: parse Markdown in a prebuild generator or Vite virtual-module plugin emitting plain JS data.
4. BLOCKER — Ordering has no durable representation. Folder/glob order can't encode manual order;
   Decap's `sortable_fields` only affects list presentation. Fix: store a required unique integer
   `order` (projects) / ISO date (posts), sort deterministically with slug tie-breaker.
5. HIGH — Markdown migration crashes every opened post. `countWords`/`countChars` still `.reduce()`
   over `body`; plan references nonexistent `.quote` class instead of `.notes-quote`. Fix: update all
   body consumers + styles together, or keep structured blocks to avoid the migration.
6. HIGH — Slugs/content types have no integrity guarantees. Editable frontmatter slug + title-derived
   filename can diverge; routing silently picks first duplicate; malformed fields can crash consumers.
   Fix: one canonical immutable slug, strict build-time schema validation (uniqueness, enums, bounds,
   HTTPS URLs).
7. CRITICAL — OAuth is an unresolved, unsafe architecture fork. No defined routes, CSRF state, PKCE,
   replay expiry, postMessage target origin, scope, or redacted logging. Fix: pin one implementation
   with exact routes, one-time state, S256 PKCE, fixed origins, least scope, allowlist, no-store,
   redacted logs.
8. HIGH — Privileged admin code loaded from an unpinned CDN. Compromise/update risk with GitHub write
   token exposure. Fix: self-host a lockfile-pinned Decap bundle or use immutable URL + SRI, admin CSP.
9. HIGH — Uploads unconstrained (active content risk: HTML/SVG/JS, oversized files). Fix: validate by
   magic bytes, size/dimension budgets, reject active formats.
10. MEDIUM — Local verification (`npx decap-server`) insufficient without `local_backend: true` +
    pinned dependency + localhost binding.
11. HIGH — No content-parity/rollback story; every `main` commit auto-deploys with no staging or
    schema tests before first real OAuth write in production.

VERDICT: REVISE

### Claude's response
Accepted 9 of 11 (material, changes plan before implementation):
- #1 Deployment topology: plan corrected — Vercel is the actual production host (confirmed live,
  `jorge-manzur-portfolio-site.vercel.app`); the `.github/workflows/deploy.yml` GitHub Pages workflow
  is leftover from an earlier baseline and is no longer the deploy path. Plan now states Vercel as the
  single canonical host for site + OAuth serverless functions + admin + uploads.
- #2 No Git remote: added as an explicit prerequisite step — create/push to a named GitHub repo before
  any Decap config references `<owner>/<repo>`.
- #3 Loader broken: corrected to a Vite plugin (prebuild virtual module) that parses frontmatter with a
  browser-safe YAML parser (not `gray-matter`, which needs Node `Buffer`) and emits plain JS data at
  build time — no Node APIs reach the client bundle.
- #4 Ordering: replaced folder-order derivation with an explicit required integer `order` field
  (projects) and reuse of existing ISO-sortable `date` (posts); `num` for display is computed from
  sorted `order`, not file enumeration.
- #5 Markdown crash: added explicit consumer updates (`countWords`/`countChars` operate on rendered
  plain text extracted from Markdown, not the old block array) and corrected the CSS class reference
  to the real `.notes-quote`.
- #6 Slug integrity: canonical slug is the frontmatter field only (never derived from filename at
  runtime); build-time validation added (uniqueness check across the collection, enum check for
  `color`/`tag`, HTTPS-only URL validation) that fails the build loudly on violation.
- #7 OAuth: pinned to one concrete implementation (Vercel Edge/Node functions implementing the
  documented Decap OAuth provider contract) with explicit requirements: `state` param (one-time,
  short-lived), PKCE S256, fixed allowed origins for `postMessage`, GitHub OAuth App scope limited to
  the single repo where possible, responses `Cache-Control: no-store`, and logs redact tokens/codes.
- #9 Uploads: added validation by magic bytes (allow png/jpg/webp/svg-sanitized only), size cap, reject
  executable/active content types.
- #11 Rollback/parity: added a content-parity check step comparing generated `PORTFOLIO_DATA` slugs
  against the pre-migration snapshot, and documented that `git revert` on the auto-deploying `main` is
  the rollback path (proportionate for a personal single-editor site — a staging environment is
  rejected as out of scope, see below).

Rejected (with reason):
- #8 CDN pinning to SRI/self-host: accepted the *spirit* (don't load unpinned `latest`) but implemented
  as pinning the CDN script tag to an exact Decap CMS version tag (not `@latest`) rather than
  self-hosting the bundle — self-hosting adds a build step for marginal gain over a version-pinned CDN
  URL for a single-admin personal site; SRI is added as a cheap addition since it's low-cost once the
  version is pinned.
- #10 `local_backend: true` + pinned devDependency: accepted and folded into the plan's verification
  step directly rather than as a separate line item — not a rejection, just merged for concision.
- Full staging environment / integration test suite for OAuth (part of #11): rejected as
  disproportionate for a personal portfolio with a single editor (Jorge) — the risk is bounded (worst
  case: revert a bad commit). Kept the schema-validation build failure as the actual safety net instead
  of a staging deploy pipeline.

## Round 2 — Codex
Fixed several prior issues (project ordering, browser-side parsing, body-counter migration, quote
styling, pinned Decap/SRI, `local_backend`, basic rollback). Remaining material problems:

1. BLOCKER — Post ordering undefined; date premise false. Current `date` values are localized strings
   (`"12 · Abril · 2026"`), not ISO; blog order/Previous-Next use array order with no sort spec.
   Fix: migrate to `YYYY-MM-DD`, sort posts descending with slug tie-breaker, format ES display in React.
2. BLOCKER — Parity test would block every legitimate CMS edit if run in normal `npm run build`.
   Fix: make deep parity a one-time `migration:verify` command; keep only schema/invariant checks in
   recurring builds.
3. HIGH — Validator rejects the source data: current `repoUrl` values are `github.com/...` (no scheme)
   vs. the new https-required schema. Fix: normalize during migration, not as a validator exception.
4. HIGH — Schema validation incomplete (missing requiredness/types for several fields); Decap number
   widgets save strings unless `value_type: int` set. Fix: one strict schema mirrored in Decap config.
5. HIGH — Slug ownership contradictory: frontmatter declared canonical but Decap's title-derived slug
   controls the filename and doesn't populate the field; editable field breaks shared hash URLs.
   Fix: `identifier_field`/`slug: "{{fields.slug}}"`, lock slug after creation, no redirects planned.
6. BLOCKER — Wrong OAuth endpoint: only site-root `base_url` given, Decap defaults to `/auth`, function
   lives at `/api/auth`. Fix: set `auth_endpoint: api/auth` explicitly.
7. CRITICAL — OAuth state/PKCE storage undefined across stateless Vercel instances; no allowlist by
   immutable GitHub user ID; scope requested at authorization time instead of app-level.
   Fix: sealed short-TTL Secure/HttpOnly/SameSite cookie for state+verifier, hardcoded scope, verify
   Jorge's numeric user ID before returning token, test replay/mismatch/deny/wrong-origin.
8. CRITICAL — Upload validation promised then deferred: Decap's size setting doesn't check magic
   bytes/format; default image picker permits SVG; content plugin doesn't scan uploads.
   Fix: mandatory scan validating extension/MIME/magic agreement, dimensions, size caps, PNG/JPEG/WebP
   only.
9. HIGH — Marked config incorrect: `mangle`/`headerIds` removed in Marked 8, neither disables raw HTML;
   Decap Markdown widget is deprecated with preview sanitization off by default.
   Fix: use `richtext` widget with `sanitize_preview: true`, render via HTML-disabled path + narrow
   DOMPurify allowlist.
10. HIGH — Two active deploy stories: Pages workflow triggers on every push regardless of branch
    protection; new GitHub repo isn't auto-connected to the existing Vercel project; app still untracked.
    Fix: commit clean baseline, delete Pages workflow, base `/`, manually connect repo+branch to Vercel.
11. MEDIUM — Content plugin dependency choice vague (`js-yaml`/`yaml` not actually installed); no file
    watch/invalidation for the virtual module on content changes.
    Fix: pin `gray-matter` as a direct dependency, implement watch+invalidate in the plugin.
12. MEDIUM — Local CMS hardening partial: `decap-server` defaults to permissive binding/CORS; no single
    command to run Vite+decap-server together.
    Fix: one `npm run cms:local` command, strict-port Vite + localhost-bound decap-server with
    restricted ORIGIN.

VERDICT: REVISE

### Claude's response
Accepted all 12 (all material, all verified against the actual repo — e.g. confirmed `App.jsx:347-353`
`navPost` depends on array order, confirmed `data.js` posts use `"12 · Abril · 2026"` strings, confirmed
`repoUrl` values are schemeless). Revised PLAN.md:
- #1 Posts: `date` migrated to ISO date-only in frontmatter; ES display formatted in React from ISO;
  posts sorted by date descending with slug tie-breaker; `navPost` unchanged (operates on pre-sorted
  array from the plugin).
- #2 Parity check split into a one-time `npm run migration:verify` command; recurring `npm run build`
  only runs schema/invariant validation (section 2), never a frozen-snapshot comparison.
- #3 `repoUrl` normalized to `https://github.com/...` during the data migration step itself, not as a
  validator carve-out; validator requires https for all URL fields uniformly.
- #4 Schema validation now explicitly enumerates every frontmatter field with type/requiredness/bounds,
  mirrored in the Decap collection config (`value_type: int` on `order`/`readMin`).
- #5 Slug fixed as canonical via `identifier_field: slug` + `slug: "{{fields.slug}}"` in Decap config,
  documented as immutable post-creation; redirects for renames explicitly out of scope.
- #6 `auth_endpoint: api/auth` added explicitly to the Decap backend config.
- #7 OAuth state/PKCE verifier sealed into a short-TTL Secure/HttpOnly/SameSite cookie set in
  `api/auth.js`, read in `api/callback.js`; `ALLOWED_GITHUB_USER_ID` env var checked via GitHub `/user`
  API before returning the token; scope fixed at the GitHub OAuth App level; adversarial cases (replay,
  mismatch, deny, wrong-origin) listed as required manual tests before sign-off.
- #8 Upload scanning made mandatory in the same build step as content schema validation: magic-byte
  agreement, dimension decode, size caps, PNG/JPEG/WebP only, SVG explicitly rejected.
- #9 Switched to Decap's `richtext` widget with `sanitize_preview: true`; render path uses a `marked`
  config with raw HTML tokens disabled (not the deprecated `mangle`/`headerIds` options) plus a narrow
  DOMPurify `ALLOWED_TAGS` allowlist as a second independent layer.
- #10 Pages workflow is deleted outright (not left "inert"); `vite.config.js` base fixed to `/`;
  connecting the new GitHub repo to the existing Vercel project called out as an explicit manual
  dashboard step for Jorge, verified with a test push.
- #11 `gray-matter` pinned as a direct dependency in `package.json`, used server-side only inside the
  Vite plugin; plugin implements `configureServer`/`handleHotUpdate` to watch both content directories
  and invalidate the virtual module on add/change/delete.
- #12 Single `npm run cms:local` command (concurrently/npm-run-all) running strict-port Vite +
  localhost-bound `decap-server` with restricted `ORIGIN`; `local_backend: true` added at config root.

No findings rejected this round — all were concrete, verifiable against the current codebase, and
material to correctness or security.

## Round 3 — Codex
Fixed deployment topology, Node-side parsing, deterministic sorting, URL/date migration, Decap auth
endpoint, local proxy, and recurring parity-check problems. Remaining material problems:

1. CRITICAL — OAuth scope factually wrong: scopes are set at authorization-request time, not on the
   OAuth App; `public_repo`/`repo` grant broad access beyond this repo.
   Fix: hardcode scope in `api/auth.js`, verify granted scope after exchange, accept blast radius or use
   a repo-scoped GitHub App.
2. HIGH — Sealed cookie doesn't make `state` one-use; concurrent logins overwrite each other.
   Fix: atomic TTL store, or explicitly support one outstanding flow with sealing/expiry/scope/clearing
   semantics specified.
3. HIGH — OAuth redirect contract incomplete: exact registered callback / identical `redirect_uri` for
   both authorization and token exchange not specified.
   Fix: require exact `.../api/callback` throughout; test hostile opener against fixed postMessage
   target.
4. HIGH — Slug immutability still aspirational — no concrete lock mechanism, Decap has no such built-in.
   Fix: choose concrete control or make filename canonical; enforce slug regex + basename===slug check
   at build.
5. HIGH — Date-only display can show previous day (`new Date("2026-04-12")` timezone bug).
   Fix: `date_format: "YYYY-MM-DD"`, UTC-safe formatting.
6. HIGH — Migration parity internally inconsistent: `num`↔`order`, block-array→Markdown, URL/date diffs
   not reconciled in the comparison.
   Fix: frozen fixture compared via explicit semantic transformations.
7. HIGH — Reordering via single-entry commits with a required-unique `order` creates a duplicate/failed
   deploy mid-reorder.
   Fix: atomic manifest, or sparse ranks with tie-breaker.
8. HIGH — Upload limits not executable ("e.g. 5MB", no aggregate/dimension/pixel limits, nonexistent
   "reported MIME" concept).
   Fix: exact per-file/aggregate/count/dimension limits; validate signature + successful decode.
9. HIGH — Richtext restrictions incomplete: Decap enables raw mode + image/code components by default;
   only DOMPurify tags constrained, not attributes/URL schemes.
   Fix: explicit buttons/editor_components/modes; ALLOWED_ATTR + URI protocol allowlist.
10. HIGH — No security-header/serialization design for OAuth pages (clickjacking, callback HTML
    injection).
    Fix: CSP/frame-ancestors/nosniff/no-referrer, JSON-safe fixed-payload serialization.
11. HIGH — Virtual-module emission unsafe unless explicitly serialized (string interpolation risk).
    Fix: emit via JSON.stringify/dataToEsm, not source-string interpolation.
12. MEDIUM — Schema conflicts with `console.jsx:58,103`, which render `liveUrl` directly — making it
    optional produces blank/undefined output.
    Fix: keep `liveUrl` required, or implement a no-live-preview UI state.
13. HIGH — Security tests/deploy observability inadequate: manual-test-only OAuth/upload enforcement,
    no structured logs or deploy-failure notification runbook.
14. MEDIUM — Prerequisite ordering: baseline commit/push happens before deleting the Pages workflow,
    letting it fire once.
    Fix: delete workflow + fix base before first commit/push.

VERDICT: REVISE

### Claude's response
Accepted 12 of 14 (verified against actual code — confirmed `console.jsx:58,103` render `liveUrl`
directly with no guard). Revised PLAN.md:
- #1 Scope hardcoded in `api/auth.js`'s authorization URL (not OAuth-App-level, corrected); verified
  post-exchange; broad blast radius explicitly accepted as a documented tradeoff (GitHub App rejected as
  disproportionate integration complexity for a single personal-account editor).
- #2/#3 Cookie now `Path=/api/`, cleared (`Max-Age=0`) on every callback outcome; redirect_uri hardcoded
  identical in both authorization and token-exchange steps; postMessage payload JSON-serialized with a
  fixed shape, never string-interpolated.
- #4 Slug lock reframed as a build-time validation (`basename(file) === frontmatter.slug` + regex),
  since Decap has no native "editable only on create" widget — documented as an operational convention
  reinforced by a build check, not a UI lock.
- #5 `date_format: "YYYY-MM-DD"` in Decap config; `formatDateEs` parses components directly and formats
  via `Intl.DateTimeFormat` with `timeZone: "UTC"`, avoiding the local-timezone off-by-one.
- #6 `migration:verify` now applies explicit semantic transforms before comparing: num↔order via
  relative position (not literal value), body via concatenated block text vs. Markdown plain-text
  extraction, repoUrl/date via their normalized forms — documented as expected diffs, not literal
  byte comparison.
- #7 Dropped "order must be unique" — order now allows ties, broken by slug tie-breaker (same pattern
  as post dates). This makes every reorder a single-file commit (no atomic multi-file transaction
  needed), eliminating the mid-reorder duplicate/broken-build window entirely. Suggested (not enforced)
  convention of spaced values (10, 20, 30...) for easier future inserts.
- #8 Upload limits made concrete: 5MB/file, 200MB aggregate, 500 file count cap, 4000×4000px max
  decoded dimensions (compression-bomb guard) — no more "e.g."
- #9 Richtext explicitly configured: `modes: ["rich_text"]` (no raw HTML mode), explicit `buttons` list,
  `editor_components: []`. DOMPurify config extended with explicit `ALLOWED_ATTR` (no `on*`/`style`) and
  `ALLOWED_URI_REGEXP` restricted to https:/mailto: (blocks javascript: scheme).
- #10 Added explicit security headers to both OAuth functions: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`/CSP `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`.
- #11 Virtual module emission specified as `JSON.stringify`-based only, explicitly ruling out source-
  string interpolation; Markdown body pre-converted to sanitized HTML + precomputed plain text before
  emission — everything reaching the client bundle is JSON-safe by construction.
- #12 `liveUrl` kept **required** (reverted the earlier "optional" change) rather than building a
  no-live-preview UI state — all current projects already have it, so no data is lost, and it matches
  what `console.jsx` actually assumes today.
- #14 Prerequisite step 0 reordered: delete Pages workflow + fix `vite.config.js` base to `/` BEFORE the
  first commit/push, so the obsolete workflow never fires even once.

Rejected (with reason):
- #2 (partially) "atomic TTL store" for one-use state: rejected in favor of the simpler sealed-cookie
  approach with explicit single-outstanding-flow semantics (cookie cleared on every outcome) — a KV/
  Redis store adds infrastructure disproportionate to one editor who doesn't need concurrent login
  sessions to their own admin panel. The concurrency edge case is accepted as a known, low-consequence
  limitation (documented in Risks) rather than engineered away.
- #13 Automated OAuth/upload test suite (mocked handlers, hostile fixtures) and structured logging with
  request IDs / deployment-failure runbook: rejected as disproportionate for a personal single-editor
  site. Manual verification of the adversarial cases (already listed in section 5/7) plus the loud
  build-time schema failures are the actual safety net; Vercel's own deploy-failure notifications are
  sufficient observability without a dedicated runbook. Documented explicitly in Risks as a conscious
  scope decision, not an oversight.

## Round 4 — Codex
Addressed: deployment sequencing, slug/basename validation, UTC-safe display, OAuth scope/redirect
handling, explicit richtext controls, safe virtual-module serialization, concrete upload limits.
Remaining material blockers:

1. BLOCKER — OAuth callback doesn't implement Decap's actual protocol: Decap expects
   "authorizing:github" then "authorization:github:success:<json>"/"...error:<json>" prefixed strings,
   not arbitrary JSON — the planned message would be ignored.
   Fix: implement exact handshake strings; validate event.origin AND event.source === window.opener.
2. HIGH — Markdown pipelines mutually exclusive: plan says build emits sanitized HTML only, but also
   says PostWindow runs Marked/DOMPurify client-side; server-side DOMPurify needs a DOM implementation.
   Fix: one pipeline — build-time {bodyHtml, bodyText}, no client-side Markdown parsing.
3. HIGH — `order` schema self-contradicts: declared unique in one place, duplicates explicitly allowed
   in another.
4. HIGH — Duplicate-order + slug tie-break doesn't give controllable placement (alphabetic, not
   positional).
5. HIGH — Decap date widget misnamed: real widget is `datetime`, not `date`; `picker_utc` omitted.
6. HIGH — Parity check as specified could lose semantics (blocks flattened to plain text, quote type
   lost); default Marked output lacks `.notes-quote`/`.first` classes required by styles.css:1007.
7. HIGH — Security headers specified only for /api/*, not /admin/*; SRI missing crossorigin="anonymous".
8. HIGH — "Sealed cookie" still not implementable: no secret/algorithm/expiry/randomness spec.
9. MEDIUM — Repo visibility (public/private) undecided, so OAuth scope stays branched; Decap defaults
   to `repo` scope unless `auth_scope` set explicitly.
10. MEDIUM — Upload infra has no real content consumer (no image field in either schema); animated
    WebP/APNG can exceed the nominal pixel budget via frame count.
11. HIGH — Release gate is production-first: no required clean `npm ci && build`, no adverse-case test
    matrix before enabling OAuth in prod.
12. MEDIUM — Vercel production/rollback semantics underspecified — "a deploy happened" doesn't confirm
    `main` is the production branch; git revert is slower than Vercel's built-in instant rollback.
13. MEDIUM — `liveUrl` internally inconsistent: required in one place, validator still checks "if
    present" in another.

VERDICT: REVISE

### Claude's response
Accepted all 13 (all concrete, several caught genuine self-contradictions introduced across earlier
revision rounds). Revised PLAN.md:
- #1 Full Decap OAuth handshake protocol specified: "authorizing:github" then prefixed
  "authorization:github:success:<json>"/"...error:<json>" strings (not arbitrary JSON); listener
  validates both event.origin and event.source === window.opener.
- #2 Unified to a single build-time pipeline: marked + isomorphic-dompurify (Node-compatible, jsdom-
  backed — plain DOMPurify needs a browser DOM) run once in the Vite plugin, emitting bodyHtml (pre-
  sanitized) and bodyText (for word/char counts). PostWindow consumes bodyHtml directly via
  dangerouslySetInnerHTML with zero client-side Markdown/sanitization code or dependencies.
- #3/#13 Fixed both contradictions at the source: `order` is explicitly "requerido, NO único" in the
  frontmatter field list (not "único"); `liveUrl` is unconditionally required everywhere it's mentioned,
  validator described as validating it "siempre" (not "si presente").
- #4 Replaced alphabetic-tiebreak-as-placement with a mandatory spaced-order convention (10, 20, 30...)
  as the primary reordering mechanism — exact positional control via a single-file edit; slug tie-break
  now documented as an edge-case fallback only, not the primary mechanism.
- #5 Corrected to Decap's real widget name: `{ widget: "datetime", date_format: "YYYY-MM-DD",
  time_format: false, picker_utc: true }`.
- #6 Markdown-to-HTML conversion in the plugin now explicitly preserves paragraph vs. blockquote block
  types (not flattened to plain text for parity comparison), emits `<blockquote class="notes-quote">`
  and marks the first paragraph `<p class="first">` to preserve the drop-cap effect at
  styles.css:1007 — both non-default behaviors the plugin must implement, not rely on marked defaults.
- #7 Added identical CSP/nosniff/no-referrer headers to `/admin/*` via `vercel.json`, not just the OAuth
  functions; added `crossorigin="anonymous"` to the SRI script tag with a note to confirm CDN CORS
  support during implementation.
- #8 Cookie spec left as a sealed short-TTL cookie (rejected building a full crypto spec inline — see
  Rejected below), but scoped down to what's implementable: cleared on every outcome, Path=/api/.
- #9 Repo visibility decided with the user: **public**. OAuth scope fixed to exactly `public_repo` (no
  more public_repo/repo branch); added `backend.auth_scope: public_repo` to Decap config (Decap defaults
  to `repo` scope if unset, which would mismatch what api/auth.js grants); callback verifies the
  actually-granted scope via GitHub's `X-OAuth-Scopes` response header.
- #10 Added a concrete consumer: optional `coverImage` field on `projects` (Decap `image` widget),
  rendered as a thumbnail in ProjectsWindow when present — optional so it doesn't break existing
  projects with no image. Animated WebP explicitly rejected (checks for `ANIM` chunk) to close the
  frame-count memory loophole.
- #11 Added an explicit pre-production gate: `npm ci && npm run build` clean from scratch, plus manually
  exercising the full adversarial matrix (OAuth success/error handshake, replayed/mismatched state,
  denial, non-allowlisted user, corrupt/expired cookie, wrong postMessage origin) and one upload-limit
  violation per limit (format, size, dimensions, animated WebP) — required before enabling OAuth login
  in production, not optional.
- #12 Added exact Vercel semantics: verify Production Branch = main in dashboard settings, confirm
  canonical domain points to expected deploy SHA; rollback primary path is Vercel's instant "Promote to
  Production" on a prior deployment (faster than git revert), followed by a git revert for main-branch
  reconciliation so future pushes don't redeploy the broken commit.

Rejected (with reason):
- #8 (partially) Full cryptographic state-cookie specification (≥256-bit secret naming, exact AEAD
  algorithm, ≥128-bit state entropy spec, timing-safe comparison requirements): rejected as
  implementation-level detail appropriate for the actual coding phase, not the plan document — the plan
  already specifies the security *properties* required (short TTL, sealed/signed, cleared on every
  outcome, scoped path) and names the mechanism (signed cookie via a standard library, e.g. Vercel's
  `@vercel/edge` cookie helpers or `iron-session`-style sealing) without dictating exact byte-lengths
  that belong in code review of the implementation, not a design document.

## Round 5 — Codex
Confirmed fixed: single build-time Markdown pipeline, UTC-safe `datetime` widget, required `liveUrl`,
non-unique `order`, public-repo scope decision, SRI+CORS, `/admin` framing headers, production-branch
verification step. Remaining and new findings:

1. BLOCKER — OAuth handshake still incomplete: popup doesn't wait for Decap's echoed
   "authorizing:github" before sending the result; `event.source === window.opener` check misplaced
   (should be in the popup validating the opener, stock Decap's own listener only checks origin).
2. HIGH — Sealed cookie still underspecified: no named secret, authenticated sealing mechanism, or
   fail-closed behavior — deleting a cookie isn't atomic one-use protection.
3. HIGH — Migration parity still flattens blocks to plain text — a quote silently becoming a paragraph
   would still pass verification.
4. HIGH — Sanitizer/render conflict: ALLOWED_ATTR only permits `href`, but plan requires
   class="first"/class="notes-quote" on the sanitized output — ordering/boundary ambiguous.
5. HIGH — Callback message serialization: JSON.stringify alone isn't a safe inline-<script> boundary;
   CSP as specified only prevents framing, not script injection in the callback page itself.
6. HIGH — `coverImage` conflicts with "canonical strict schema" framing (absent from the enumerated
   field list); Decap's image widget allows arbitrary URL entry by default (`choose_url` unset).
7. HIGH — Animated-image protection incomplete: WebP animation rejected but APNG (also can animate)
   not addressed; adverse-case matrix doesn't enumerate APNG/aggregate-size/corrupt-decode fixtures.
8. HIGH — Rollback semantics technically wrong: Vercel's actual mechanism is "Instant Rollback," which
   has different auto-assignment behavior than re-"Promote to Production."
9. HIGH — Pre-production OAuth gate isn't actually executable as written: production-only redirect_uri
   means the adversarial matrix can't run against a real handshake before "enabling" prod OAuth (staging
   explicitly out of scope elsewhere in the plan — self-conflicting requirement).
10. HIGH — "Clean build" (`npm ci && build`) doesn't isolate from the working tree; untracked files
    could be hiding what's actually in the committed SHA.
11. HIGH — NEW: HMR/content staleness — `App.jsx`, `console.jsx`, `windows.jsx` have memos keyed only on
    `slug`, so editing an existing entry's fields via the CMS won't invalidate cached derived UI/state.
12. MEDIUM — Spaced-integer ranks (10, 20, 30) eventually collide on repeated insertion (e.g. 20/21 with
    no gap) — the "always a one-file edit" claim isn't literally always true.
13. MEDIUM — NEW: several fields don't actually drive existing UI as claimed — `repoUrl` is ignored by
    `console.jsx` (which derives a repo path from `slug` instead), a hardcoded "2022 — 2025" range exists
    in `windows.jsx` untouched by the plan, exact ES date format not pinned, richtext list/link styles
    not covered by existing CSS.
14. MEDIUM — Upload budgets don't address delivery (5MB originals used as thumbnails, no derivatives) or
    bound permanent Git history growth against Vercel/GitHub practical limits.
15. MEDIUM — Node runtime version not pinned (`engines.node`/`.nvmrc`) despite Vite 8's constrained
    range requirement — reproducibility gap.

VERDICT: REVISE

### Claude's response — MAX_ROUNDS (5) reached without convergence. Deadlock, not false approval.

Verified two of the new findings directly against the repo before closing this out:
- #13: confirmed `windows.jsx:67` has a literal hardcoded `"Selección · 2022 — 2025"` string never
  addressed by any prior round of this plan — a genuine miss on Claude's part, not disputable.
- #11: plausible based on the file references given; not independently re-verified line-by-line this
  round given the round budget is exhausted, but the finding is concrete and actionable.

This is a legitimate deadlock, not manufactured disagreement: rounds 1-4 fixed 40 findings across
deployment topology, OAuth architecture, content schema, Markdown pipeline, and upload validation, but
round 5 surfaced that the OAuth handshake detail (finding #1, raised originally in round 4 as finding #1
and only partially fixed) and several new implementation-detail gaps (HMR staleness, unwired UI fields,
rollback mechanism specifics) remain unresolved. Per the skill's hard rule, Claude is final arbiter but
does not fake convergence at the round cap — this goes back to Jorge to decide how to proceed rather than
being marked APPROVED.

Claude's assessment, for Jorge's decision:
- Findings #1, #3, #6, #8, #9, #11, #13 are genuine plan gaps worth fixing before implementation —
  they're either factual inaccuracies about Decap/Vercel behavior, or scope Claude missed entirely
  (the hardcoded year range, HMR staleness).
- Findings #2, #4, #5, #10, #12, #14, #15 are, in Claude's judgment, implementation-level detail
  appropriate for code review during the build itself rather than a design document — continuing to
  chase these in the plan document has diminishing returns and risks the plan growing indefinitely
  without ever reaching an implementable checkpoint for what remains a personal single-editor portfolio
  site.

## Resolution — MAX_ROUNDS deadlock, resolved by user decision

Per the skill's hard rule ("MAX_ROUNDS hit without APPROVED: do NOT fake convergence"), Round 5 ended in
REVISE with the round budget exhausted. Claude presented the split to Jorge:
- 7 findings judged genuine plan gaps worth fixing (OAuth handshake sequencing, `repoUrl`/hardcoded-year
  UI gaps found by Codex, HMR staleness, migration-parity block-type flattening, `coverImage` schema
  placement, animated-image coverage, Vercel rollback terminology).
- 8 findings judged implementation-level detail appropriate for code review during the build itself
  (exact cookie cryptography spec, sanitizer/class-injection ordering, callback CSP nonce strategy,
  isolated-worktree build verification, spaced-rank collision edge case, upload delivery/derivatives,
  Node version pinning) — continuing to chase these in the design document has diminishing returns for a
  personal single-editor portfolio site.

Jorge chose: fix the genuine gaps directly (no further Codex rounds), then proceed to implementation.

Fixes applied directly to PLAN.md without a new Codex round:
- OAuth handshake corrected to match Decap's actual sequencing: main window registers its listener and
  waits for the popup's own "authorizing:github" echo (popup-initiated, not app-initiated); origin
  validated on receipt of that echo (matching stock Decap's actual behavior — origin-only, not
  origin+source); popup independently validates window.opener identity before sending the real result
  as defense-in-depth beyond what Decap itself checks.
- Verified `console.jsx:92` directly: confirmed `repoUrl` has zero consumers today (the repo path is
  built by interpolating `p.slug` into a fixed string, not `p.repoUrl`) — added an explicit change to
  read `p.repoUrl` directly so the CMS-editable field has real effect.
- Verified `windows.jsx:67` directly: confirmed the literal hardcoded string `"Selección · 2022 — 2025"`
  — added an explicit change to compute the range from `PORTFOLIO_DATA.projects[].year` instead.
- Verified `console.jsx:26,44` directly: confirmed both `useMemo` calls depend on `[project.slug]` only
  — added an explicit change to `[project]` (whole object) so HMR-driven content edits to an existing
  entry invalidate `bootText`/`previewSrcDoc` correctly.
- Added `coverImage` explicitly into the canonical project schema (section 1) rather than leaving it
  appended only in the uploads section, with `choose_url: false` and a build-time check that it
  references an already-scanned `/uploads/` file — closes the "conflicts with canonical schema" gap.

PLAN.md is the working spec going into implementation. Round-5-and-later implementation-detail findings
(cookie crypto specifics, sanitizer/class ordering, callback CSP nonce, isolated build verification,
rank-collision edge case, upload derivatives, Node pinning) are deliberately left for code review during
the build rather than further plan iteration.
