---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Session resumed, proceeding to execute Phase 1.5 (deploy preview) — Plans 01.5-01 (adapter-netlify swap) and 01.5-02 (Netlify site link + iOS HUMAN-UAT) drafted but not yet executed.
last_updated: "2026-04-23T06:26:50.303Z"
last_activity: 2026-04-23 -- Phase 01.5 execution started
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Surface at least one non-obvious pattern between work/social context and mood/energy that is actually actionable
**Current focus:** Phase 01.5 — deploy-preview-inserted-2026-04-20

## Current Position

Phase: 01.5 (deploy-preview-inserted-2026-04-20) — EXECUTING
Plan: 1 of 2
Status: Executing Phase 01.5
Last activity: 2026-04-23 -- Phase 01.5 execution started

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 72min | 3 tasks | 65 files |
| Phase 01 P02 | 5min | 2 tasks | 7 files |
| Phase 01 P03 | 29min | 2 tasks | 8 files |
| Phase 01 P04 | ~3h elapsed (cross-session) | 3 tasks + 4 fixes + 1 scope-expansion (i18n) | 16 files |
| Phase 01 P05 | ~40min | 2 tasks + 1 fix (workbox marker) | 19 files (12 created + 7 modified) |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All phases: Cross-device sync deferred to v2 — v1 data layer is local-only (IndexedDB via Dexie)
- Phase 1: Data model decisions locked in Phase 1 — local_date TEXT, 1-5 ordinal scale, normalised tag table, timezone handling
- Phase 4: Insight callouts gated at N≥30 globally and N≥5 per tag; InsightEngine as pure functions developed in Phase 4
- Scaffold via sv@0.15.1 create (non-interactive CLI) rather than npm create svelte
- Pin vite ^7.1.0 + @sveltejs/vite-plugin-svelte ^6.2.4 for vite-plugin-pwa@1.2.0 peer compatibility
- Tailwind v4 @theme inline indirection: UI-SPEC palette in :root / .dark, shadcn utilities map via @theme inline
- components.json style = 'nova' (current shadcn-svelte CLI default; rejects 'default')
- Copy-discipline grep excludes src/lib/components/ui/ (vendored shadcn primitives carry non-user-facing token names)
- Phase 01 Plan 02: Dexie compound-PK typed as Table<EntryTag, [string, string]> (not EntityTable<_, never>) to satisfy svelte-check on bulkDelete + db.transaction
- Phase 01 Plan 02: localDate helper colocated with mutations.ts (not a separate util) — keeps 'never toISOString near local_date' rule visually obvious
- Phase 01 Plan 02: Runtime guards use Set<unknown> whitelists rather than typed const literals — avoids cast-to-any at call site while keeping O(1) lookup
- Phase 01 Plan 03: Selected-state fill uses --color-primary (shadcn) not --color-accent — UI-SPEC 'accent' CTA role maps to shadcn primary per app.css banner
- Phase 01 Plan 03: DateChip uses @internationalized/date (CalendarDate) not JS Date — bits-ui Calendar requires DateValue; parseDate() + today(tz) build value/maxValue
- Phase 01 Plan 03: TagChipPicker $effect is read-only (listTagsPrefixed + db.tags.anyOf); writes live in user-event handlers only (RESEARCH §Anti-Patterns)
- Phase 01 Plan 04: onsubmit|preventDefault over use:enhance — Pitfall 7 bans +page.server.ts, so use:enhance has no server-action contract to enhance and falls through to 405. Pattern applies everywhere Dexie is the sole persistence layer.
- Phase 01 Plan 04: Paraglide-JS i18n (EN+DE) with compile-time message bundling via @inlang/paraglide-js (direct package, not @inlang/paraglide-sveltekit — folded into main package). Reactive locale via module-scoped $state signal; $derived wraps m.*() calls.
- Phase 01 Plan 04: Locale precedence = Dexie settings.locale wins over navigator.language auto-detect on subsequent loads; first-load writes detected value.
- Phase 01 Plan 04: useLiveQuery subscription lives inside $effect; synchronous queryFn() call at top registers Svelte reactive deps so date-change triggers re-subscription.
- Phase 01 Plan 04: Scale endpoint labels live in +page.svelte (not in ScaleDotPicker widget) — content-specific to mood/energy, keep widget generic.
- Phase 01 Plan 04: German banned-word list in copy.test.ts aligned with PITFALLS #11 — großartig/toll (≈great), mies/furchtbar (≈rough), Serie/Streak, Weiter so.
- Phase 01 Plan 04: Chrome DevTools MCP automated verify caught two Plan-time grep-acceptance criteria as runtime-wrong (use:enhance, contrast wrapper text-accent) — use runtime verification, not just greps, for UX-critical assertions going forward.
- Phase 01 Plan 05: Workbox __WB_MANIFEST marker preserved via side-effectful assignment `(self as unknown as { __moodlog_precache_manifest: unknown }).__moodlog_precache_manifest = self.__WB_MANIFEST;` — Vite tree-shakes bare expression forms; the assignment gives Vite an observable side effect AND gives workbox-build the literal string to find-and-replace for precache manifest injection.
- Phase 01 Plan 05: handleNotificationClick extracted to $lib/notifications/handle-click.ts (not embedded in service-worker.ts) — vitest node env cannot resolve webworker lib reference or top-level self.addEventListener; pure helper + thin SW glue is cleaner single-responsibility structure.
- Phase 01 Plan 05: In-app reminder scheduler via setInterval (not VAPID/push) — honest Phase 1 scope per RESEARCH Pitfall 2. Scheduler fires at most once per local_date, prefers SW registration for notificationclick routing, falls back to new Notification(). If tab is closed at reminder time, user does not get pinged — surfaced in OnboardingSheet + InstallBanner copy as the reason to install.
- Phase 01 Plan 05: requestPersistence() called silently on every layout onMount (not just onboarding) — D-16. Result stored in settings.storage_persistent so a future Settings/Backup UI can read it without re-calling the API.
- Phase 01 Plan 05: Permission-denied path still writes reminder_time (not just onboarded=true) — user picked a time; re-enabling browser permission later should not force them back through onboarding. 1200ms dwell before redirect lets denied-copy be read.
- Phase 01 Plan 05: Platform-adaptive onboarding step-1 copy — one widget picks iOS vs Chrome/Android message key via isIOSSafari(). iOS version explicitly warns about Safari's 7-day eviction; non-iOS omits the warning (Chrome install flow guarantees persistence).
- Phase 01 Plan 05: Manifest icons are neutral #FAFAF9 placeholders at exact 192/512/180 dimensions — Phase 1 ships on installability, branded artwork deferred as a pre-v1-ship follow-up.

### Pending Todos

- **Logged-day dot on DateChip calendar popover** — deferred to Phase 3 (absorbed into Phase 3 calendar heatmap as success criterion #5). Captured 2026-04-21 during Plan 04 verify.
- **bits-ui Calendar weekday/month header localization** — currently in default locale when running in DE mode. Phase 1.7 polish candidate, or natural Phase 3 work.

### Blockers/Concerns

- Phase 1: Verify iOS web push deep-link behaviour for non-installed origins at implementation time
- Phase 3: Verify React island ssr=false pattern in SvelteKit 2 + Svelte 5 before committing to react-activity-calendar
- Phase 4: Correlation rendering UX (hedged language wording, scatter view layout, MNAR heuristic) — design decisions needing a short spike before coding

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Sync | Cross-device sync via Turso (SYN-01) | v2 | Requirements |
| Auth | Passkey / WebAuthn (SYN-02) | v2 | Requirements |
| Insights+ | Energy heatmap variant (INS+01) | v2 | Requirements |
| Insights+ | Correlation trend over time (INS+02) | v2 | Requirements |
| Insights+ | Optional note field (INS+03) | v2 | Requirements |
| Persistence | Export/import JSON (user-triggered backup) | v1.5 backlog | 2026-04-20 Plan 04 discussion |
| Persistence | Eviction detection (warn when entry count shrinks) | v1.5 backlog | 2026-04-20 Plan 04 discussion |
| Persistence | Backup nudge toast (every 10 entries) | v1.5 backlog | 2026-04-20 Plan 04 discussion |
| Deploy | Production deploy (custom domain, Lighthouse CI) | After Phase 1.5 | 2026-04-20 Plan 04 discussion |
| Onboarding | Production demo mode (/demo with canned data) | Phase 4 boundary | 2026-04-20 Plan 04 discussion |

## Session Continuity

Last session: 2026-04-23
Stopped at: Session resumed, proceeding to execute Phase 1.5 (deploy preview) — Plans 01.5-01 (adapter-netlify swap) and 01.5-02 (Netlify site link + iOS HUMAN-UAT) drafted but not yet executed.
Resume file: None

**Planned Phase:** 1.5 () — 0 plans — 2026-04-22T11:38:26.783Z
