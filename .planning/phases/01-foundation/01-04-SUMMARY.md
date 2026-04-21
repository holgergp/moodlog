---
phase: 01-foundation
plan: 04
subsystem: ui
tags: [sveltekit, routing, entry-form, layout, i18n, paraglide, onsubmit, dexie-livequery]

requires:
  - phase: 01-foundation
    provides: Plan 03 components (ScaleDotPicker, SegmentedControl, TagChipPicker, DateChip), reactive state stores (draft, liveEntry, settings), Dexie schema + mutations
provides:
  - Entry form at src/routes/+page.svelte composing Plan 03 widgets with pure-client-side onsubmit save (no server action)
  - App shell src/routes/+layout.svelte with svelte-sonner Toaster, CSS import, notification deep-link reader for ?date=today
  - Paraglide-JS i18n with EN + DE, navigator.language auto-detect, persisted in Dexie settings.locale, <html lang> reactive
  - Scale endpoint labels (mood low/high, energy drained/wired) in both locales
  - copy.test.ts extended to scan messages/*.json with German banned-word list
affects: [01-05, 02, 03]

tech-stack:
  added: [@inlang/paraglide-js, project.inlang settings, messages/en.json, messages/de.json]
  patterns:
    - "Pure client-side form: onsubmit={async (e) => { e.preventDefault(); ... }} — no use:enhance, no method=POST, no +page.server.ts"
    - "Reactive locale signal via src/lib/state/locale.svelte.ts — $derived wraps m.*() calls so Svelte re-evaluates on locale change"
    - "Locale reconciliation in +layout.svelte onMount: persisted Dexie value wins over navigator.language detection; write detected on first load"
    - "Svelte 5 runes: $state, $derived, $effect cleanup for Dexie liveQuery re-subscription"

key-files:
  created:
    - src/routes/+page.svelte
    - src/routes/+page.ts
    - src/routes/+layout.svelte
    - src/routes/+layout.ts
    - src/lib/i18n.ts
    - src/lib/state/locale.svelte.ts
    - project.inlang/settings.json
    - messages/en.json
    - messages/de.json
    - tests/liveentry.test.ts
  modified:
    - src/lib/state/liveEntry.svelte.ts
    - src/lib/db/local.ts
    - src/lib/components/entry/DateChip.svelte
    - src/lib/components/entry/TagChipPicker.svelte
    - tests/copy.test.ts
    - vite.config.ts
    - package.json / package-lock.json

key-decisions:
  - "Replace misapplied use:enhance with pure onsubmit|preventDefault (Pitfall 7 forbids +page.server.ts, so the server-action contract use:enhance enhances FROM does not exist)"
  - "Paraglide-JS over svelte-i18n — compile-time, tree-shakeable, ~0 KB runtime; official @inlang/paraglide-js integration"
  - "Locale auto-detect uses navigator.language prefix match (de* → de, else en); persisted value wins on subsequent loads (user control over browser inference)"
  - "Scale endpoint labels live in +page.svelte as content-specific siblings of ScaleDotPicker — keep the widget reusable and locale-agnostic"
  - "useLiveQuery re-creates its Dexie subscription inside $effect so reactive deps (draft.date) trigger re-subscription — bug caught via D-14 verify on past dates"
  - "German banned-word list in copy.test.ts aligned with PITFALLS #11 rationale: großartig, toll, mies, furchtbar, Serie/Streak, Weiter so"
  - "No use:enhance anywhere in this app (reversed the plan-time grep-acceptance criterion after runtime verification caught the 405 bug)"

patterns-established:
  - "Pattern: pure-client-side Svelte 5 form — <form onsubmit={async (e) => { e.preventDefault(); await dexieWrite(); toast(); }}>. No method=POST, no use:enhance, no +page.server.ts. Applies whenever Dexie is the sole persistence layer."
  - "Pattern: Paraglide + reactive locale signal — module-scoped $state in .svelte.ts file + $derived wrappers around m.*() calls + setLocale() pushed from layout onMount reconciliation. Persisted settings.locale wins over navigator.language."
  - "Pattern: Dexie liveQuery Svelte 5 wrapper — subscription inside $effect with synchronous queryFn() call at top to register reactive deps; effect cleanup unsubscribes. Any rune change inside the query function retriggers subscription."
  - "Pattern: endpoint-label overlay for 1-5 scales — flex row with left label, thin border-t spacer, right label; text-xs + muted-foreground; aria-hidden='true' (scale widget owns its own a11y surface)."

requirements-completed: [ENT-01, ENT-02, ENT-03, ENT-04, ENT-05, ENT-06]

duration: ~3h (elapsed, across two sessions)
completed: 2026-04-21
---

# Phase 01-04: Entry Form + Layout + i18n Summary

**Pure-client-side entry form at `/` composing Plan 03 widgets over Paraglide EN+DE i18n, with Dexie liveQuery-driven D-11 edit flow and auto-detected/persisted locale.**

## Performance

- **Duration:** ~3 hours elapsed across two sessions (many checkpoint revisions)
- **Started:** 2026-04-20T11:25Z
- **Completed:** 2026-04-21T07:40Z (close commit)
- **Tasks:** 3 planned + 4 scope-expansion fix passes
- **Files modified/created:** 16 (route + layout + i18n + tests + wrapper)

## Accomplishments

- Entry form renders 5 sections (mood, energy, workload, social, people) + date chip + submit; handles both today and past-date workflows
- D-11 edit flow: liveQuery pre-fills saved entries, CTA toggles Save ↔ Update, toasts confirm both paths
- D-14 neutral empty form on past dates with no entry — no red, no missed badge, no guilt framing
- D-13 future-date blocking via DateChip two-layer guard
- Paraglide EN+DE: navigator.language auto-detect, Dexie persistence, `<html lang>` reactive, full message coverage including aria labels, toasts, endpoint labels, and DateChip
- Endpoint labels for 1-5 scales (`low ← → high` / `niedrig ← → hoch`, `drained ← → wired` / `erschöpft ← → voller Energie`) visible under each ScaleDotPicker
- Copy-discipline test extended to scan messages/*.json with German banned-word list
- Four post-execution fixes landed atomically — contrast, liveQuery re-subscription, use:enhance→onsubmit, token-mapping

## Task Commits

**Original tasks (Plan 04 as written):**

1. **Task 1: App shell + Toaster + deep-link reader** — `6786c7a` (feat)
2. **Task 2: Entry form with use:enhance + D-11 edit flow** — `e99a6aa` (feat) — later reverted to onsubmit pattern
3. **Task 3: Human verification** — checkpoint (see fix passes)

**Post-execution fix passes (all landed atomically during human-verify revision cycles):**

4. **Fix — contrast: drop text-[var(--color-accent)] on layout wrapper** — `e62d225` (fix)
5. **Fix — liveQuery re-subscription on reactive deps** — `2dcd46c` (fix)
6. **Test — cover liveQuery re-subscription on draft.date change** — `9cf1cfd` (test)
7. **Feat — Paraglide i18n EN + DE (auto-detect + persist) + scale endpoint labels** — `7bfe5fa` (feat)
8. **Test — extend banned-copy scan to messages/*.json (EN + DE)** — `bfb4b73` (test)
9. **Fix — replace misapplied use:enhance with onsubmit|preventDefault (save triggered 405)** — `a484fa5` (fix)

**Plan metadata / tracking (this commit):** `<upcoming>` (docs: complete plan)

## Files Created/Modified

- `src/routes/+page.svelte` — entry form, onsubmit client handler, i18n-wrapped copy, scale endpoint labels
- `src/routes/+page.ts` — ssr=false
- `src/routes/+layout.svelte` — Toaster, notification deep-link reader, locale reconciliation, `<html lang>` effect
- `src/routes/+layout.ts` — ssr=true default
- `src/lib/i18n.ts` — detectLocale/getLocale/setLocale helpers over Paraglide runtime
- `src/lib/state/locale.svelte.ts` — reactive locale signal
- `src/lib/state/liveEntry.svelte.ts` — subscription inside $effect for dep-reactive re-subscription
- `src/lib/db/local.ts` — SettingKey gains 'locale'
- `src/lib/components/entry/DateChip.svelte` — localized Heute/Today + ariaLabel
- `src/lib/components/entry/TagChipPicker.svelte` — localized placeholder, empty hint, + Create prefix
- `project.inlang/settings.json` — baseLocale=en, locales=[en, de], message-format plugin
- `messages/en.json`, `messages/de.json` — ~30 keys per locale
- `vite.config.ts` — paraglide vite plugin
- `tests/copy.test.ts` — scans messages/*.json + German banned-word list
- `tests/liveentry.test.ts` — regression test for date-change re-subscription
- `package.json` / `package-lock.json` — @inlang/paraglide-js added

## Decisions Made

See frontmatter `key-decisions` for the compact list. Rationale highlights:

- **onsubmit over use:enhance:** use:enhance is designed to progressively enhance a form that posts to a SvelteKit server action. With PITFALLS #7 banning `+page.server.ts`, there is no server-side contract to enhance from. Clicking Save POSTed to `/`, got 405, and `use:enhance`'s default `update()` rendered the 405 HTML in place. Fix: drop `method="POST"` + `use:enhance` entirely, use pure onsubmit|preventDefault. Caught via automated Chrome DevTools MCP verification; the planning-time grep-acceptance criterion `grep use:enhance` was reversed as a known-wrong assertion.
- **Paraglide-JS:** chosen via user decision matrix — compile-time tree-shaking, ~0 KB runtime, official SvelteKit integration. Alternatives rejected: svelte-i18n (~4 KB runtime) and plain messages object (no pluralization). Used as `@inlang/paraglide-js@2.16.0` (the direct library — `@inlang/paraglide-sveltekit` has been folded into the main package per current inlang docs).
- **Locale persistence precedence:** Dexie settings.locale wins over navigator.language on subsequent loads. This gives the user explicit control over their choice — once persisted, the app respects it even if browser language changes (tested programmatically: forced `locale=en` in IndexedDB overrode `de-DE` browser).
- **Endpoint labels location:** `+page.svelte`, not `ScaleDotPicker.svelte`. The widget is generic 1-5; the mood/energy endpoint words are content-specific. Keeping the widget reusable matters more than DRY copy.
- **liveQuery reactivity fix:** originally `useLiveQuery` created its Dexie observable at module-scope constructor time, capturing `draft.date` once. Dexie's `liveQuery` only re-emits on table writes, not on external rune changes — so picking a past date left `entryForDate.current` stale and the $effect never fired. Fix: move subscription inside `$effect`, call `queryFn()` synchronously at top to register Svelte reactive deps, use effect-cleanup to unsubscribe on dep change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Incorrect token mapping] Layout wrapper used text-[var(--color-accent)]**
- **Found during:** Plan 04 human-verify checkpoint (contrast screenshot)
- **Issue:** `app.css` maps UI-SPEC "accent" → `--primary`. Wrapper applied `text-[var(--color-accent)]` = stone-100 (#F5F5F4), cascading as near-white body text on stone-50 bg. Every element inheriting its text color (h1, section labels) became unreadable.
- **Fix:** Removed `text-[var(--color-accent)]` + `bg-[var(--color-background)]` from wrapper (body's `@apply bg-background text-foreground` already handles both).
- **Committed in:** `e62d225`

**2. [Rule 1 - D-14 violation] liveQuery stale on date change**
- **Found during:** Plan 04 human-verify cycle 2
- **Issue:** Picking a past date with no entry left form filled with today's values (D-14 "neutral empty form" violated). Root cause: liveQuery doesn't re-subscribe when rune deps change.
- **Fix:** Restructured useLiveQuery per tech-stack patterns note above.
- **Committed in:** `2dcd46c` + test in `9cf1cfd`

**3. [Rule 2 - Scope expansion] Paraglide i18n + scale endpoint labels**
- **Found during:** Plan 04 human-verify cycle 2 (user request: "please add German translation")
- **Issue:** Plan 04 was English-only; user expanded scope to EN+DE during the verify window.
- **Fix:** Added @inlang/paraglide-js, messages, locale reconciliation, <html lang> effect, full DateChip + TagChipPicker + +page + +layout wrapping, copy.test.ts extension. ScaleDotPicker unchanged (labels live in +page).
- **Committed in:** `7bfe5fa` + `bfb4b73`
- **Note:** bits-ui Calendar weekday headers remain in its default locale — localising them requires wiring @internationalized/date locale through Popover+Calendar and was deferred as a Phase 1.7 (or Phase 3) polish per plan-time notes.

**4. [Rule 3 - Blocking bug] use:enhance triggered 405 page replacement**
- **Found during:** Plan 04 human-verify cycle 3 (automated Chrome DevTools MCP click-Save test)
- **Issue:** `<form method="POST" use:enhance>` posted form-data to `/`. No +page.server.ts exists (correctly — PITFALLS #7). 405 returned. `await update({ reset: false })` rendered the 405 response body, replacing the app UI with `<h1>405</h1> <p>Method Not Allowed</p>` until manual refresh. Dexie write still succeeded client-side.
- **Fix:** Dropped `method="POST"` + `use:enhance` + `update()`; replaced with `<form onsubmit={async (e) => { e.preventDefault(); ... }}>`.
- **Files modified:** src/routes/+page.svelte (form wrapper + handler + banner comment + removed `enhance` import)
- **Committed in:** `a484fa5`
- **Reverses:** Plan 04 Task 2 grep-acceptance criterion `grep use:enhance`. Documented as a known-wrong planning assertion.

---

**Total deviations:** 4 auto-fixed (1 token-mapping bug, 1 reactive-reactivity bug, 1 scope expansion — user-requested, 1 blocking framework-misuse bug)
**Impact on plan:** All four auto-fixes land tightly scoped commits. Scope expansion (Paraglide i18n) adds a production dependency and 5 new verify points — documented here and in ROADMAP.

## Issues Encountered

- **Scale endpoint wording collision:** user's initial choice "rough ← → great" hit the banned-phrases list (`rough`/`great` in PITFALLS #11 and `tests/copy.test.ts`). Resolved via decision-required checkpoint — user picked Option 1 (`low/high`, `drained/wired`) as the ban-safe equivalent.
- **Mobile LAN testing blocked:** user's Mac has JobRad split-tunnel routing (six IPs on en0, several non-routable `.0` addresses). iPhone couldn't reach any LAN IP. Resolved by pivoting to Xcode iOS Simulator for mobile-specific verify (points 2, 12). Logged as user-memory for future sessions.

## User Setup Required

None - no external service configuration required. Paraglide-JS is compile-time only, and i18n persistence uses local Dexie.

## Verification Results

**Chrome DevTools MCP automated (15/18):** points 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18 ✓.

**Xcode iOS Simulator (real WebKit, 2/2 human-gated):** points 2 (tap budget ≤ 3, felt fast enough for 30-second check-in), 12 (no viewport zoom on People input focus) ✓.

**Point 13 (no +page.server.ts):** verified by file absence grep — pre-existing enforcement.

Screenshots retained in `/tmp/mood-0*.png` for this session (initial DE, filled state EN, past date neutral empty, focus ring, save toast).

## Next Phase Readiness

**Plan 05 can:**
- Adopt the Paraglide i18n contract — add PWA install prompt, notification permission UI, onboarding copy via `m.*()` calls with EN + DE entries
- Use the existing layout's notification deep-link reader (already honors `?date=today`)
- Register the service worker against the Vite PWA setup (inject pattern already scaffolded; remove the `globPatterns: []` placeholder in `vite.config.ts` when `src/service-worker.ts` exists)

**Open items explicitly deferred to later phases:**
- bits-ui Calendar weekday/month header localization (Phase 1.7 polish candidate, or natural Phase 3 work)
- Presence dot on DateChip calendar popover showing logged days (deferred to Phase 3 per roadmap decision 2026-04-21; added as Phase 3 success criterion #5)
- Production demo mode — deferred to Phase 4 boundary
- Export/import JSON + eviction detection + backup nudge — v1.5 backlog

**Carried concerns (unchanged):**
- iOS web push deep-link behavior for non-installed PWAs (verify at Plan 05 impl time)
- Secondary REQUIREMENTS.md traceability table rows still show "Pending" despite checkbox `[x]` — known tooling gap with `requirements.mark-complete`, not a Plan 04 regression.

---
*Phase: 01-foundation*
*Plan: 04*
*Completed: 2026-04-21*
