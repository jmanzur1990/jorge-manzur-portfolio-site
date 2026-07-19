# Plan Review Log: About/Contact Payload Globals
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.
Reviewer model: gpt-5.5 (config.toml) — codex-cli 0.144.6.

## Round 1 — Codex
**Findings**
- [PLAN.md](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:8>) cites an access-control pattern in `collections/shared.ts`, but that file only has validators/hooks and the existing collections declare no `access` at all ([collections/shared.ts](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/collections/shared.ts:1>), [collections/Projects.ts](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/collections/Projects.ts:9>)). Fix: define explicit reusable access helpers, e.g. `publicRead` and `authenticatedUpdate`, and use them intentionally on both globals.

- [PLAN.md](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:12>) says `content.about || STATIC.about`, which conflicts with the per-field fallback requirement and will let partial/empty objects suppress defaults. Fix: normalize `about` and `contact` into complete objects field by field before passing them to `createPortfolioData`, or make `createPortfolioData` perform deep per-field fallback.

- Payload array fields return rows like `{ text }`, but `AboutWindow` renders `d.paragraphs.map((p) => <p>{p}</p>)` as strings ([src/windows.jsx](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/src/windows.jsx:62>)). Fix: explicitly map `about.paragraphs` with `rows.map(row => row.text?.trim()).filter(Boolean)` and fall back when the resulting string array is empty.

- [PLAN.md](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:13>) says Payload types are regenerated “as part of running dev”, but `package.json` has no typegen script and `dev` is only `next dev` ([package.json](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/package.json:6>)). Fix: add an explicit step/script for `payload generate:types` and verify `payload-types.ts` is created or intentionally gitignored.

- The checked-in admin import map is generated state ([app/(payload)/admin/importMap.js](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/app/(payload)/admin/importMap.js:27>)), but the plan only mentions type generation. Fix: add an explicit `payload generate:importmap` step after registering globals so admin generated artifacts stay in sync.

- If Vercel deploys before Neon schema push completes, `getFrontendPortfolioData` will call `findGlobal` when `DATABASE_URL` exists and the page can 500 despite the stated fallback goal ([lib/frontend-data.ts](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/lib/frontend-data.ts:29>)). Fix: either catch global fetch/schema errors and use static global defaults, or make schema push a hard predeploy gate with a verification command.

- Public `read` access on `contact` exposes email/phone/socials through Payload REST/GraphQL in addition to the rendered site; the plan doesn’t acknowledge that API surface ([PLAN.md](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:9>)). Fix: decide explicitly between public API reads and server-only local reads; if server-only is desired, keep `read` authenticated/default and rely on Local API `overrideAccess`, or disable default global endpoints.

- Editable `email` feeds directly into `mailto:${d.email}` ([src/windows.jsx](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/src/windows.jsx:186>)), but the plan declares it as plain text with no validation. Fix: add an email validator and trim hooks for contact fields, and cap text lengths to prevent malformed links or layout blowups.

- The plan’s “matching existing seed-fallback pattern for projects/posts” is overstated: with `DATABASE_URL` set, current code reads Payload and does not fall back to seed files if collections are empty or unavailable ([lib/frontend-data.ts](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/lib/frontend-data.ts:30>)). Fix: either remove that claim or define equivalent fallback behavior deliberately.

- Verification is too manual for the risky part: fallback semantics for nulls, empty strings, empty arrays, and unsaved globals are easy to get subtly wrong ([PLAN.md](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:24>)). Fix: add focused tests or a small normalization test harness covering missing docs, null fields, empty strings, empty arrays, and mixed partial content.

VERDICT: REVISE
### Claude's response (Round 1)
Accepted 9 of 10 findings, adapted 1:
- Access pattern: repo indeed has no access config. Resolved BOTH the access-helper finding and the public-API-exposure finding with one decision: declare no `access` (Payload default = authenticated-only API), read via Local API with overrideAccess. Contact email/phone never exposed publicly.
- Replaced `content.about || STATIC.about` with exported pure normalizers doing per-field fallback (also covers paragraphs `{text}` row-shape mapping and empty-array cases).
- Added explicit `npx payload generate:types` + `generate:importmap` steps; both artifacts committed.
- Wrapped global fetches in error fallback to static defaults (deploy-before-push 500 risk).
- `email` now uses Payload's `email` field type for validation (feeds mailto:).
- Corrected the overstated "matches seed-fallback pattern" claim; asymmetry with projects/posts noted as deliberate.
- Test harness: accepted as a small `node --test` file for the normalizers (no heavier infra — repo has none).
Rejected nothing outright; the "length caps to prevent layout blowups" sub-point was dropped as over-engineering for a single-admin site (the admin is the only writer), logged here as the reason.

## Round 2 — Codex
Prior findings are mostly addressed: access is now explicit by omission/default, per-field fallback is specified, array row normalization is specified, global fetch failures fall back, generated artifacts are explicit, and the project/post fallback asymmetry is acknowledged.

New issue: [PLAN.md](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/PLAN.md:15>) says to export/test normalizers from `lib/frontend-data.ts`, but that module currently has top-level imports of Payload config ([lib/frontend-data.ts](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/lib/frontend-data.ts:1>), [lib/frontend-data.ts](</Users/jorgemanzur/dev/jorge_manzur-portfilio-site/lib/frontend-data.ts:3>)); a bare normalizer test can accidentally require `PAYLOAD_SECRET` / Payload config just to import pure functions. Fix: put normalizers in a side-effect-free module, or move Payload/config imports inside `getFrontendPortfolioData`.

Minor correction: use an explicit test command compatible with TS imports, e.g. `tsx --test` or `node --import tsx --test`, and add it to `package.json`; don’t rely on an unspecified “node --test file” path.

VERDICT: APPROVED