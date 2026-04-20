# Phase 1: Foundation — Research

**Researched:** 2026-04-20
**Domain:** SvelteKit 2 + Svelte 5 PWA with IndexedDB persistence (Dexie) and scheduled evening notifications on mobile
**Confidence:** HIGH for stack/persistence/PWA; MEDIUM for notification scheduling (platform fragmentation is a real constraint, not a research gap)

## Summary

Phase 1 is the scaffold: a SvelteKit 2 project, Tailwind v4, shadcn-svelte primitives, Dexie v4 on IndexedDB, and `@vite-pwa/sveltekit` to make the app installable with a service worker. The entry form is a single `+page.svelte` with a POST action that delegates persistence to Dexie in the browser (there is no server database in Phase 1 — form actions here are used for progressive enhancement semantics and to keep the save path identical regardless of JS availability).

Two decisions carry material risk and need the planner's attention:

1. **Scheduled evening notifications are platform-fragmented.** The Notification Triggers API (`showTrigger`) that would enable zero-server scheduling never shipped in Chrome stable (development ended) and is not implemented in Safari. Reliable delivery of a "9 PM every day" reminder therefore requires either (a) a push server with VAPID, or (b) a pragmatic fallback that sets a `setTimeout`/`setInterval` the moment the app is open and relies on iOS's home-screen installed PWA to notify via a subscribed push service for offline days. The project's out-of-scope list rules out cross-device sync and a backend for v1, so **the honest Phase 1 scope is "reminder works while the app has been open today, iOS banner nudges installation, server-push arrives in v2 or Phase 2"**. This is already acknowledged in STATE.md Blockers.
2. **`dexie-svelte-query` (stateQuery) is a brand-new package (v1.0.0, Dec 17 2025).** It is the ergonomic fit for the locked Svelte 5 runes + Dexie pattern, but it is four months old with a single release. Recommendation: use raw `liveQuery()` wrapped in a tiny in-repo `.svelte.ts` helper. Zero new dependency, pattern is first-party from Dexie.

**Primary recommendation:** Scaffold via `npm create svelte@latest` (pnpm is not installed in this environment), add Tailwind v4 via `@tailwindcss/vite`, add `@vite-pwa/sveltekit` for the service worker, use raw `Dexie` + `liveQuery()` behind a small `.svelte.ts` reactive wrapper, and ship notification reminders as best-effort-while-open with the iOS install banner doing the honest work of signalling the limitation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Entry form layout**
- **D-01:** Single-screen vertical scroll. All fields visible at once, single Save button at the bottom. No stepper, no multi-screen wizard.
- **D-02:** The entry form IS the app home screen — no dashboard, no landing page before it (PITFALLS #1).
- **D-03:** No confirmation modal on save. Show a brief inline toast ("Logged") that auto-dismisses; no tap required to continue.

**Input widgets**
- **D-04:** Mood (1-5) and energy (1-5): 5 discrete buttons, filled-dot indicator for the selected value. No emoji faces (avoids moralising framing). No slider (avoids ordinal-as-interval illusion).
- **D-05:** Workload (light / moderate / heavy): 3-button horizontal segmented control with text labels. No emoji.
- **D-06:** Social split (3-step ordinal): labels "Mostly alone", "Mixed", "Mostly with others". Stored as ordinal 1 / 2 / 3. Same 3-button segmented control pattern as workload.
- **D-07:** People tags: inline autocomplete input with chip row above. Typing filters existing tags; tapping a chip toggles it. "+ Create new" appears at the bottom of the filtered list when no exact match exists.

**Field defaults & required-ness**
- **D-08:** No fields have pre-selected values. Save is always enabled. Empty fields save as `null`. No required-field validators, no "please select" errors (PITFALLS #1).

**Tag handling**
- **D-09:** Tag duplicate-prevention: case-insensitive match + whitespace trim on a stored lowercase key. The display name the user typed is preserved on the tag row. Typing `alice` surfaces existing `Alice` in the filter list (PITFALLS #9).
- **D-10:** No in-app tag management (rename / merge / delete) in Phase 1 — deferred. Case-insensitive matching prevents duplicates; a management screen can come later if genuine cruft accumulates.

**Edit & backfill flow**
- **D-11:** When an entry already exists for the target date, the form pre-fills with the saved values and the Save button reads "Update". Same screen, same layout — no separate edit view.
- **D-12:** The form header shows a tappable date chip (defaulting to today). Tapping it opens a calendar picker; selecting a date re-loads the form for that date. Single surface for both backfill and edit.
- **D-13:** No limit on how far back the user can backfill. Future dates are blocked in the date picker.
- **D-14:** A past day with no entry shows the same neutral empty form — no "missed" badge, no red/grey negative styling, no "fill in the gap" prompt (PITFALLS #11, no guilt framing per REQ ENT-06).

**First-open onboarding**
- **D-15:** Two-step setup on first open:
  1. "Add to Home Screen" explainer (how-to, per-platform) + `navigator.storage.persist()` called silently in parallel.
  2. Reminder time picker (default 21:00, local timezone) + notification permission request.
  Then land on the empty entry form.
- **D-16:** `navigator.storage.persist()` is called silently on first open regardless of whether the user proceeds with the explainer (PITFALLS #7).
- **D-17:** Onboarding is skippable — "Skip for now" goes straight to the entry form. The reminder-time picker lives in a settings screen for later configuration.

**iOS fallback**
- **D-18:** On non-installed iOS Safari (display-mode: not standalone AND user-agent detection), show a dismissible banner at the top of the entry form: "Install to Home Screen to enable reminders." Banner dismissal persists per-session; re-appears on next open until dismissed again or install detected. This is the honest surface for the iOS web-push limitation.

**Notifications**
- **D-19:** Reminder time is user-configurable (REQ ENT-07). Default: 21:00 local time. Stored in local app settings (same IndexedDB store).
- **D-20:** Notification body: "Log today — how was it?" Plain text, no streak / frequency / personalisation language (PITFALLS #2, #11).
- **D-21:** Notification click deep-links directly to the entry form with today's date pre-selected (REQ ENT-07). Not the settings screen, not a home page.

### Claude's Discretion

The planner and executor have flexibility on:
- Exact Tailwind utility classes, spacing, font scale
- Toast / inline feedback implementation details (svelte transition, library choice)
- Service worker configuration inside `vite-plugin-pwa` (precache list, update strategy)
- Dexie schema version numbering (must start at 1)
- Specific calendar-picker library (native `<input type="date">` vs component library vs custom)
- Tag chip visual treatment (colour, border, pill vs rounded)
- Notification scheduling mechanism (service worker push vs `showTrigger` API vs local in-app scheduling)
- Reminder settings screen layout (when built)

### Deferred Ideas (OUT OF SCOPE)

- **Tag management screen** (rename / merge / delete) — Revisit in a later phase only if case-insensitive matching proves insufficient in real use.
- **Delete entry** — Not discussed; assume not in Phase 1. If needed, add a "clear this entry" affordance on the edit form in a later phase.
- **Weekly / monthly review on entry screen** — Explicitly Phase 3.
- **Multiple check-ins per day** — Out of scope per PROJECT.md.
- **Rich note field on entries** — Out of scope per PROJECT.md. `note TEXT` column in ARCHITECTURE.md is a v2 possibility (INS+03), not Phase 1.
- **Streak / heatmap / completion stats in Phase 1** — Explicitly forbidden by PITFALLS #11 and PROJECT.md "no gamification".

**Research implication:** Do not propose alternatives to D-01..D-21. Do not research tag-management UI, delete flows, streaks, or export — those belong to later phases.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENT-01 | Daily entry captures mood on 1-5 ordinal scale | ScaleDotPicker (5 filled-dot buttons) backed by Dexie `entries.mood INTEGER NULL`. No averages displayed. See §Code Example 1, §Data Model. |
| ENT-02 | Daily entry captures energy on 1-5 ordinal scale | Same widget pattern and schema column as mood. Shares `ScaleDotPicker` component. |
| ENT-03 | Daily entry captures workload (light / moderate / heavy) | 3-button segmented control, stored as TEXT enum `'light'|'moderate'|'heavy'` or null. See §Code Example 1. |
| ENT-04 | Daily entry captures alone-vs-social split (3-step ordinal) | Same segmented-control widget as workload; stored as INTEGER 1/2/3 (ordinal) per D-06. |
| ENT-05 | People tags with autocomplete from prior entries (normalised table, not free-text) | `tags` + `entry_tags` tables in Dexie; case-insensitive match on `lower_key` index; `TagChipPicker` component. See §Data Model, §Anti-Patterns. |
| ENT-06 | User can edit or backfill prior entries via date picker, without guilt framing | Date chip in form header + Popover-hosted Calendar; form re-hydrates from `entries.where('local_date').equals(date)`; CTA becomes "Update". No "missed" UI (D-14). |
| ENT-07 | Configurable evening notification deep-links directly to the entry form | `settings.reminder_time` row in Dexie; notification scheduled via in-app timer when app is open (best-effort); `notificationclick` handler in service worker calls `clients.openWindow('/?date=today')`. See §Pitfall "Notification scheduling" for platform limits. |
| ENT-08 | PWA / Add-to-Home-Screen support with `navigator.storage.persist()` called on first open | `@vite-pwa/sveltekit` generates manifest + service worker; `navigator.storage.persist()` called in onboarding step 1 (silently, per D-16); iOS install banner per D-18. |
| DAT-01 | Offline-first local persistence via IndexedDB (Dexie), survives Safari 7-day eviction policy | Dexie 4.4.2; `navigator.storage.persist()` opt-in; installed PWA heuristic causes WebKit to grant persistence automatically. See §Pitfall "Safari storage eviction". |

Each requirement maps to at least one concrete task input in the Standard Stack, Architecture Patterns, or Code Examples sections below.
</phase_requirements>

## Architectural Responsibility Map

Phase 1 is a **client-only** app — all business logic runs in the browser tab or service worker. There is no backend tier yet (Turso arrives no earlier than v2; CONTEXT.md locks Phase 1 to local-only).

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Entry form rendering & input | Browser / Client | SvelteKit SSR (initial HTML) | Form is the home route; SSR produces the empty form shell, client hydration wires the runes-backed draft state. |
| Entry persistence (write) | Browser / Client (Dexie → IndexedDB) | — | No server DB in Phase 1. SvelteKit form action runs client-side via `use:enhance` to call `db.entries.put(...)` and then invalidate. |
| Entry read / reactive list | Browser / Client (Dexie `liveQuery`) | — | All reads hit the in-browser IndexedDB; reactive updates via `liveQuery` → `$state`. |
| PWA manifest & service worker | Browser / Client | SvelteKit static (served from `/`) | `@vite-pwa/sveltekit` generates both; served as static assets at build time. |
| Storage persistence grant | Browser / Client | — | `navigator.storage.persist()` is a browser API; no server role. |
| Evening notification trigger | Browser / Client (in-app timer while open) + Service Worker (best-effort while installed) | — | No VAPID push server in Phase 1. See §Pitfall "Notification scheduling" for the honest scope. |
| Notification click → deep link | Service Worker | Browser / Client | `notificationclick` handler calls `clients.openWindow('/?date=today')`; the client route reads the query param and sets the date chip. |
| Onboarding first-open flow | Browser / Client | — | Purely UI state; no server role. |

**Tier misassignment to watch for:** Any plan that introduces a SvelteKit server-side endpoint for entry persistence in Phase 1 is a tier error. The form action should run entirely client-side via `use:enhance`. Keeping the persistence tier boundary clean now makes the Phase 2+ sync layer (when it arrives) a drop-in addition, not a refactor.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.57.1 | Meta-framework: routing, SSR, service-worker module | `[VERIFIED: npm view @sveltejs/kit version]` Locked by STACK.md §Core Technologies. Mobile bundle size advantage vs Next.js. `$service-worker` module wires cleanly with vite-plugin-pwa. |
| Svelte | 5.55.4 | UI compiler + runes | `[VERIFIED: npm view svelte version]` Runes (`$state`, `$derived`) usable in `.svelte.ts` modules — ideal for the draft-entry store and reactive Dexie reads. `[CITED: github.com/sveltejs/svelte /documentation/docs/01-introduction/04-svelte-js-files.md]` |
| Tailwind CSS | 4.2.2 | Utility styling (zero-config via Vite plugin) | `[VERIFIED: npm view tailwindcss version]` No `tailwind.config.js`; `@theme` token block in a single CSS file drives the shadcn-svelte design tokens. Locked in STACK.md + UI-SPEC.md. |
| `@tailwindcss/vite` | 4.2.2 | Tailwind v4 Vite integration | `[VERIFIED: npm view @tailwindcss/vite version]` Same version track as Tailwind core in v4. |
| Dexie | 4.4.2 | IndexedDB wrapper, schema versioning, liveQuery | `[VERIFIED: npm view dexie version — published 2026-04-16]` 4 days old at research time, on the `dev`+`latest` dist-tag. Handles Safari quirks, compound indexes, upgrade migrations. `[CITED: context7 /dexie/dexie.js]` |
| `@vite-pwa/sveltekit` | 1.1.0 | SvelteKit integration for vite-plugin-pwa | `[VERIFIED: npm view @vite-pwa/sveltekit version]` Zero-config SvelteKit PWA plugin; wraps `vite-plugin-pwa` 1.2.0; generates the service worker + manifest with SvelteKit-aware routing. `[CITED: github.com/vite-pwa/sveltekit README]` |
| `vite-plugin-pwa` | 1.2.0 | Underlying Workbox integration | `[VERIFIED: npm view vite-plugin-pwa version]` Brought in transitively by `@vite-pwa/sveltekit`; install explicitly to pin. |
| shadcn-svelte | latest (Svelte 5 branch) | Copy-in UI primitives (not npm dep) | Locked by STACK.md + UI-SPEC.md. `npx shadcn-svelte@latest init --base-color neutral`. Components used in Phase 1: `Button`, `Input`, `Label`, `Popover`, `Calendar`, `Sonner` (toast), `Toggle`/`ToggleGroup`. |
| lucide-svelte | 1.0.1 | Icon set (SVG tree-shakeable) | `[VERIFIED: npm view lucide-svelte version]` Locked by UI-SPEC.md. Zero-network (no CDN font), PITFALLS #12 compliant. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bits-ui | 2.18.0 | Primitives powering shadcn-svelte Popover/Calendar/Toggle | `[VERIFIED: npm view bits-ui version]` Installed transitively when you run `shadcn-svelte@latest add calendar`; do not install manually first. |
| sonner-svelte | 0.3.3 | Toast library used by shadcn-svelte Sonner block | `[VERIFIED: npm view sonner-svelte version]` UI-SPEC.md allows choice; this is the default shadcn-svelte picks. Tiny, no dependencies. |
| vitest | 4.1.4 | Unit test runner (ships in SvelteKit scaffold) | `[VERIFIED: npm view vitest version]` Default when you pick Vitest in `npm create svelte`. Wave 0 install step. |
| fake-indexeddb | 6.2.5 | IndexedDB polyfill for Node-based tests | `[VERIFIED: npm view fake-indexeddb version]` Required for testing Dexie code in Vitest without a real browser. Import `fake-indexeddb/auto` in a setup file. |
| @playwright/test | 1.59.1 | E2E tests for service worker / PWA install | `[VERIFIED: npm view @playwright/test version]` Optional for Phase 1 — useful for the "install banner visible on non-installed iOS" smoke test. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `liveQuery()` + small Svelte 5 wrapper | `dexie-svelte-query` (v1.0.0, published 2025-12-17) | `[ASSUMED]` The new package gives you `stateQuery(() => db.entries.toArray(), () => [deps])` directly. Version 1.0.0 with a single release four months old is a reliability risk for a personal app that must not drop data. Recommendation: write a 10-line wrapper using `liveQuery()` + `$state` (see §Code Example 3). |
| shadcn-svelte `Calendar` (popover-hosted) | Native `<input type="date">` | Native input is 0 KB and accessible by default, but styling to match the shadcn-svelte tokens is impossible (mobile browsers render it as a wheel picker). UI-SPEC.md allows either. Recommend `Calendar` for consistency with the rest of Phase 1's tokens. |
| Vitest + fake-indexeddb (unit) | Playwright only (real browser + real IndexedDB) | Playwright is slower, heavier, and needs a real service worker to test offline paths. Keep Vitest for the schema + store tests; reserve Playwright for the 1-2 PWA install smoke tests. |
| `vite-plugin-pwa` direct | `workbox-cli` | vite-plugin-pwa is the maintained Workbox integration for Vite ecosystems; workbox-cli is legacy and not SvelteKit-aware. No reason to consider. |

**Installation (one-time, run from Phase 1 task):**
```bash
# Scaffold
npm create svelte@latest moodlog   # pick: SvelteKit skeleton, TypeScript, Vitest (Playwright optional), Prettier, ESLint
cd moodlog
npm install

# Tailwind v4
npm install -D tailwindcss @tailwindcss/vite

# shadcn-svelte init (interactive — pick neutral base, CSS vars)
npx shadcn-svelte@latest init

# Add the Phase 1 components
npx shadcn-svelte@latest add button input label popover calendar sonner toggle-group

# Storage
npm install dexie

# PWA
npm install -D @vite-pwa/sveltekit vite-plugin-pwa

# Icons (ships with shadcn-svelte but pin explicitly)
npm install lucide-svelte

# Test toolchain (for Dexie specs)
npm install -D fake-indexeddb
```

**Package manager note:** STACK.md recommends `pnpm`, but `pnpm` is **not installed** in the current environment. The planner must either (a) add a Wave 0 task to install pnpm (`npm install -g pnpm`), or (b) scaffold with `npm`. Either is fine; the commands above use `npm` as the lowest-friction path given the environment audit below.

**Version verification table** (as of 2026-04-20):
| Package | Latest | Published | Notes |
|---------|--------|-----------|-------|
| @sveltejs/kit | 2.57.1 | ~10 days ago | HIGH confidence — verified npm |
| svelte | 5.55.4 | — | HIGH confidence |
| tailwindcss | 4.2.2 | Feb 2026 | HIGH confidence |
| dexie | 4.4.2 | 2026-04-16 (4 days ago) | HIGH confidence; check for patch releases at scaffold time |
| @vite-pwa/sveltekit | 1.1.0 | 2025-11-27 | HIGH confidence |
| vite-plugin-pwa | 1.2.0 | — | HIGH confidence |
| bits-ui | 2.18.0 | — | HIGH confidence |
| sonner-svelte | 0.3.3 | — | MEDIUM — newer major may exist; re-check at scaffold |
| lucide-svelte | 1.0.1 | — | HIGH confidence |
| vitest | 4.1.4 | — | HIGH confidence |
| fake-indexeddb | 6.2.5 | — | HIGH confidence |

## Architecture Patterns

### System Architecture Diagram

```
                   ┌───────────────────────────────────────────┐
                   │               User's Phone                │
                   │                                           │
  ┌─ cold open ────┤       Safari / Chrome / PWA shell         │
  │                │                                           │
  │                │   ┌───────────────────────────────────┐   │
  │                │   │      SvelteKit Client Bundle      │   │
  │                │   │                                   │   │
  │                │   │  /+page.svelte  (entry form)      │   │
  │                │   │     ▲        ▲                    │   │
  │                │   │     │        │ reactive reads     │   │
  │                │   │     │        │ (liveQuery →       │   │
  │ type-filter ───┼──►│  TagPicker   │  $state)           │   │
  │ tag chip       │   │                                   │   │
  │                │   │     │        │                    │   │
  │ Save tap ──────┼──►│  use:enhance POST action          │   │
  │                │   │     │                             │   │
  │                │   │     ▼                             │   │
  │                │   │  db/local.ts (Dexie 4)            │   │
  │                │   │  entries / tags / entry_tags      │   │
  │                │   │  settings                         │   │
  │                │   │     │                             │   │
  │                │   │     ▼                             │   │
  │                │   │  IndexedDB "moodlog" v1           │   │
  │                │   │                                   │   │
  │                │   └───────────────────────────────────┘   │
  │                │                                           │
  │                │   ┌───────────────────────────────────┐   │
  │                │   │       Service Worker (sw.js)      │   │
  │ notification   │   │   generated by vite-plugin-pwa    │   │
  │ tap ───────────┼──►│                                   │   │
  │                │   │   · precache app shell            │   │
  │                │   │   · notificationclick →           │   │
  │                │   │        clients.openWindow(        │   │
  │                │   │          '/?date=today')          │   │
  │                │   └───────────────────────────────────┘   │
  │                │                                           │
  │ install prompt │   ┌───────────────────────────────────┐   │
  │ (iOS banner)   │   │      manifest.webmanifest         │   │
  │ (A2HS)         │   │      + navigator.storage          │   │
  │                │   │        .persist()                 │   │
  │                │   └───────────────────────────────────┘   │
  │                │                                           │
  └────────────────┤   ┌───────────────────────────────────┐   │
                   │   │   In-app reminder timer           │   │
  reminder time    │   │   (window-open only — best-       │   │
  from settings ──►│   │    effort until VAPID push in v2) │   │
                   │   └───────────────────────────────────┘   │
                   └───────────────────────────────────────────┘
```

**Data flow for a save:**
1. User taps Save in `/+page.svelte`.
2. `use:enhance` intercepts the POST; the form action body calls `db.entries.put({ local_date, mood, energy, ... })` and `db.entry_tags.bulkPut(...)`.
3. `liveQuery` observing today's entry emits; `$state` updates; Sonner toast shows "Logged."
4. No network request. No redirect. The UI returns focus to the date chip.

### Recommended Project Structure

```
src/
├── routes/
│   ├── +layout.svelte              # App shell; registers service worker; renders InstallBanner on non-installed iOS
│   ├── +layout.ts                  # export const ssr = true (needed for initial HTML); client hydrates
│   ├── +page.svelte                # Entry form (home screen per D-02)
│   ├── +page.ts                    # export const ssr = false (form is fully client-reactive)
│   └── onboarding/
│       └── +page.svelte            # First-open 2-step flow (D-15); redirects to / when done
├── lib/
│   ├── db/
│   │   ├── local.ts                # Dexie instance + schema v1 (entries, tags, entry_tags, settings)
│   │   ├── queries.ts              # High-level reads (getEntry(date), listTags, getSettings)
│   │   └── mutations.ts            # saveEntry, upsertTag, setReminderTime
│   ├── state/
│   │   ├── draft.svelte.ts         # Svelte 5 runes: draft entry state for the form
│   │   ├── settings.svelte.ts      # Reactive settings (reminder time, onboarded flag)
│   │   └── liveEntry.svelte.ts     # liveQuery → $state wrapper (§Code Example 3)
│   ├── components/
│   │   ├── ui/                     # shadcn-svelte output (button, input, popover, calendar, sonner, toggle-group)
│   │   ├── entry/
│   │   │   ├── ScaleDotPicker.svelte
│   │   │   ├── SegmentedControl.svelte
│   │   │   ├── TagChipPicker.svelte
│   │   │   └── DateChip.svelte
│   │   ├── onboarding/
│   │   │   └── OnboardingSheet.svelte
│   │   └── InstallBanner.svelte
│   ├── notifications/
│   │   ├── scheduler.ts            # In-app timer; computes next-fire from settings.reminder_time
│   │   └── permission.ts           # Notification.requestPermission() wrapper
│   └── pwa/
│       └── persist.ts              # navigator.storage.persist() + iOS standalone detection
├── service-worker.ts               # Generated by vite-plugin-pwa; add notificationclick handler
├── app.html                        # SvelteKit template
├── app.css                         # Tailwind v4 @theme tokens + shadcn-svelte CSS vars
└── tests/
    ├── db.test.ts                  # Dexie schema + saveEntry (fake-indexeddb)
    ├── tagpicker.test.ts           # Tag case-insensitive matching (fake-indexeddb)
    └── timezone.test.ts            # local_date handling (see Pitfall 8)
```

### Pattern 1: SvelteKit Form Action → Client-Side Dexie Save

**What:** The entry form posts to its own `+page.server.ts` action conceptually — but because Phase 1 has no backend, the action body is skipped on the server and the full save runs client-side via `use:enhance`.

**When to use:** Any write in Phase 1. Pattern is deliberately identical to what a future server-backed version would use, so Phase 2+ can add a server call without refactoring the form markup.

**Example:**
```svelte
<!-- src/routes/+page.svelte (abridged) -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { saveEntry } from '$lib/db/mutations';
  import { draft } from '$lib/state/draft.svelte';
  import { toast } from 'svelte-sonner';

  // `[CITED: svelte.dev/docs/kit/form-actions]`
</script>

<form
  method="POST"
  use:enhance={() => {
    return async ({ update }) => {
      await saveEntry({
        local_date: draft.date,
        mood: draft.mood,
        energy: draft.energy,
        workload: draft.workload,
        social_split: draft.socialSplit,
        tagIds: draft.tagIds
      });
      toast('Logged.');
      await update({ reset: false });
    };
  }}
>
  <!-- fields -->
</form>
```

No `+page.server.ts` action is needed. `use:enhance` intercepts, runs the local function, and the POST never leaves the browser (because there is no server endpoint to accept it). If a Phase 2 adds a sync endpoint, only the `saveEntry` internals change — the form markup stays.

### Pattern 2: Svelte 5 Runes Module for Draft State

**What:** The entry form's draft state lives in a `.svelte.ts` module and is imported by the form. Persisting to Dexie is an explicit call, not a reactive `$effect` — this keeps the write path inspectable and testable.

**When to use:** Any page that collects multi-field input that should survive route changes within the session (e.g., tap the date chip, change the date, keep the mood already tapped if it applies).

**Example:**
```typescript
// src/lib/state/draft.svelte.ts
// `[CITED: svelte.dev/docs/runes/$state#sharing-across-modules]`

type Draft = {
  date: string;           // local_date YYYY-MM-DD
  mood: 1|2|3|4|5 | null;
  energy: 1|2|3|4|5 | null;
  workload: 'light'|'moderate'|'heavy' | null;
  socialSplit: 1|2|3 | null;
  tagIds: string[];
};

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const draft = $state<Draft>({
  date: today(),
  mood: null,
  energy: null,
  workload: null,
  socialSplit: null,
  tagIds: []
});

export function resetDraft(date: string = today()) {
  draft.date = date;
  draft.mood = null;
  draft.energy = null;
  draft.workload = null;
  draft.socialSplit = null;
  draft.tagIds = [];
}
```

### Pattern 3: Dexie liveQuery Wrapped in Svelte 5 $state

**What:** A 10-line helper converts Dexie's `liveQuery` observable into a reactive `$state` that Svelte components can read directly. Avoids adding a new dependency (`dexie-svelte-query`), keeps the integration transparent.

**When to use:** Every reactive read of Dexie data in Phase 1 — "entry for this date", "all tags starting with X", "current settings".

**Example:**
```typescript
// src/lib/state/liveEntry.svelte.ts
// `[CITED: context7 /dexie/dexie.js — liveQuery]`
// Alternative: dexie-svelte-query v1.0.0 (flagged LOW confidence — 4 months old)
import { liveQuery, type Observable } from 'dexie';
import { onDestroy } from 'svelte';

export function useLiveQuery<T>(query: () => Promise<T>, initial: T) {
  let current = $state<T>(initial);
  const obs: Observable<T> = liveQuery(query);
  const sub = obs.subscribe({
    next: (v) => (current = v),
    error: (e) => console.error('liveQuery error', e)   // never log entry values
  });
  onDestroy(() => sub.unsubscribe());
  return {
    get current() { return current; }
  };
}
```

Usage in a component:
```svelte
<script lang="ts">
  import { useLiveQuery } from '$lib/state/liveEntry.svelte';
  import { db } from '$lib/db/local';

  let { date } = $props<{ date: string }>();
  const q = useLiveQuery(
    () => db.entries.where('local_date').equals(date).first(),
    undefined
  );
</script>

{#if q.current}
  <!-- pre-fill fields from q.current — switches CTA to "Update" -->
{/if}
```

### Pattern 4: Service Worker notificationclick → Deep Link

**What:** A service worker event handler turns a tapped notification into a focused browser tab at the entry form with today's date pre-selected.

**When to use:** Every notification the app surfaces — local or push, Phase 1 or later.

**Example:**
```typescript
// src/service-worker.ts (additions on top of the vite-pwa generated file)
// `[CITED: developer.mozilla.org Web/API/ServiceWorkerGlobalScope/notificationclick_event]`
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/?date=today';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});
```

The `/` route reads `date` from the URL; when value is `today` it sets `draft.date = today()`, which triggers the `liveQuery` and pre-fills any existing entry.

### Pattern 5: Progressive Enhancement for "No-JS Fallback"

**What:** SvelteKit's form action semantics mean the form is functional even before JS hydrates — but because persistence is IndexedDB (browser API), the pre-hydration path cannot save anything. The honest behaviour: the form renders (SSR), the Save button is disabled until hydration completes (or enabled but no-ops gracefully with a visible message).

**Recommendation:** Render the form with SSR so the first paint is fast, but gate Save behind `hydrated` state. The 30-second friction budget assumes a hydrated PWA — not a cold first paint over 4G with JS disabled — so this is acceptable.

### Anti-Patterns to Avoid

- **Storing `created_at` UTC only, no `local_date`.** Cited by PITFALLS #8. At 11:50 PM UTC+2 an entry would land on the "next" UTC day. Always store `local_date TEXT` and use it as the unique key for the entry-per-day constraint.
- **Free-text people field.** Cited by PITFALLS #9. Tag explosion kills insights. Normalise to `tags(id, display_name, lower_key)` + `entry_tags(entry_id, tag_id)` from day one.
- **`db.entries.put(...)` inside a Svelte `$effect(...)`.** Reactive side-effects into persistence create infinite loops as soon as `liveQuery` updates the read model. Persistence must be an explicit call, triggered by a user action (Save tap), not by a derived state change.
- **Opening multiple Dexie database instances.** Never `new Dexie('moodlog')` twice — export one instance from `$lib/db/local.ts` and import it everywhere. Hot-reload edge cases during dev can produce this; guard with `import.meta.hot` if needed.
- **Relying on `navigator.onLine` for offline detection.** Misleading on mobile tethering / captive portals. Phase 1 is offline-first by design — just always write to Dexie and never check online status.
- **`.env` secrets in the client bundle.** There are no secrets in Phase 1 (no server, no keys). Keep it that way; if Phase 2+ adds VAPID, the private key is server-only (`$env/static/private`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB schema + transactions | A custom `IDBDatabase` wrapper with version hooks | **Dexie 4** | IndexedDB's raw API leaks onblocked/onupgradeneeded complexity and is verbose to use with promises. Dexie collapses this to `db.version(1).stores({...})`. |
| Reactive DB reads | Custom observer pattern + manual unsubscribe in every component | **Dexie `liveQuery`** + the 10-line `useLiveQuery` helper | liveQuery handles transaction scope, cross-tab propagation (via BroadcastChannel), and cleanup. |
| PWA manifest + service worker + A2HS flow | Handwritten `manifest.webmanifest` + a custom `sw.js` | **`@vite-pwa/sveltekit`** | Handles Workbox precache manifest, versioning, update-on-reload, dev-mode SW toggle. UI-SPEC.md already targets it. |
| Calendar/date picker UI | Custom SVG/canvas calendar | **shadcn-svelte `Calendar`** (built on `bits-ui`) | Keyboard-nav, locale, disabled-dates, dark-mode — all solved. |
| Toast feedback | Svelte transition + custom timer | **shadcn-svelte `Sonner`** (`svelte-sonner`) | Accessibility (polite live region), stacking, reduced-motion — solved. |
| Typeahead / autocomplete for tags | Custom keyboard nav + filter logic | `bits-ui` Combobox (available via `shadcn-svelte add combobox`) OR a simple Svelte custom component — **choose based on complexity**; for Phase 1's case-insensitive-filter-plus-create pattern, the custom component is acceptable (<100 lines) since Combobox needs customisation anyway. |
| Timezone-to-local-date conversion | `toISOString().slice(0,10)` (wrong — UTC) | `Intl.DateTimeFormat` with explicit timezone, OR the pattern in §Code Example 1 | `toISOString` gives UTC. PITFALLS #8 requires local date. |
| UUIDs for entry IDs | `Math.random()` strings | `crypto.randomUUID()` (built-in, Node 19+ / all modern browsers) | No library needed. `[VERIFIED: MDN]` |
| Colorblind-safe mood palette | Pick red/green gradient | Single-hue stone/slate with filled-dot encoding (UI-SPEC.md already locks this) | PITFALLS #10. UI-SPEC has already chosen; the planner must not reopen. |

**Key insight:** Phase 1 touches four well-worn solved problems — IndexedDB persistence, reactive reads, PWA install, and touch-accessible pickers. Every one of these has a canonical library; custom implementations fail at edge cases discovered 4-12 weeks in (exactly the wrong failure mode for a habit-building app).

## Common Pitfalls

### Pitfall 1: Safari 7-day IndexedDB eviction

**What goes wrong:** On non-installed iOS Safari, after 7 days of no interaction with the origin, WebKit's Intelligent Tracking Prevention evicts IndexedDB. All entries disappear. User thinks the app ate their data.

**Why it happens:** Cited by PITFALLS #7 and confirmed by WebKit's own policy post. The 7-day clock only stops when either the user installs the PWA to Home Screen OR `navigator.storage.persist()` returns `true` (granted).

**How to avoid:**
- Call `navigator.storage.persist()` on every first-open and on every subsequent open. It's idempotent; retrying costs nothing.
- On iOS, `persist()` returns `true` only when the app is a Home Screen Web App or the user has high interaction history — hence D-18's iOS install banner.
- Log the return value (boolean) to a local `settings.storage_persistent` row so the onboarding can show the banner when `false`.
- Do NOT rely on `navigator.storage.estimate()` to verify persistence — it returns a usage/quota pair, not a grant status.

**Warning signs:**
- The service worker is registered but `navigator.storage.persist()` is never called.
- The install banner is only shown once; dismissing it permanently hides it even after 7 days without install.

**Sources:** `[CITED: webkit.org/blog/14403/updates-to-storage-policy/]`, `[CITED: web.dev/articles/persistent-storage]`, `[CITED: developer.mozilla.org Web/API/StorageManager/persist]`

### Pitfall 2: Notification scheduling is platform-fragmented

**What goes wrong:** The "9 PM every evening" reminder is significantly harder than it looks. Three constraints collide:
1. **Notification Triggers API (`showTrigger`) is abandoned** — Chrome never shipped it to stable and development ended. `[CITED: developer.chrome.com/docs/web-platform/notification-triggers]` — status "Launch to stable: Not started", origin trial complete.
2. **iOS requires the PWA to be installed to the Home Screen** for web push to work at all (iOS 16.4+, geographic restriction in EU). `[CITED: developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers]` (URL cited though full content was not fetchable in this session).
3. **Genuine background scheduling requires a push server with VAPID keys** — explicitly out of scope for Phase 1 (no backend yet).

**Why it happens:** Web push grew as a notification delivery channel, not a scheduling primitive. Scheduling has no standardised client-only API.

**How to avoid — honest Phase 1 scope:**
- **In-app scheduling while open:** Set a `setTimeout` (or use `setInterval(..., 60_000)` + clock check) in the client. When the app is open at the reminder time, show the notification via `registration.showNotification('Log today — how was it?')`. Works on all platforms, zero infrastructure.
- **Service-worker push path:** Stub the VAPID subscription code in Phase 1 so it's a drop-in task in Phase 2. Do NOT ship a push server in Phase 1.
- **iOS banner is the honest signal (D-18):** Explicitly tells the user that reminders require install. Matches platform reality.
- **Document the limitation in the settings screen:** copy can be "Reminders work while the app has been open today; for background reminders, install to Home Screen."

**Warning signs:**
- A task says "schedule notification via `showTrigger` API" — it will not work on any stable browser.
- A task says "schedule notification via server cron" — Phase 1 has no server.
- A task ships a notification flow that claims to work on non-installed iOS Safari.

**Sources:** `[CITED: developer.chrome.com/docs/web-platform/notification-triggers]`, `[CITED: magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide]`, `[CITED: developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers]` (URL only), `[CITED: css-tricks.com/creating-scheduled-push-notifications]`

### Pitfall 3: iOS Safari auto-zooms text inputs with font-size < 16px

**What goes wrong:** When the people-tag `<input>` is focused, iOS Safari zooms the viewport if the input font is smaller than 16px. The zoom-in is jarring and the zoom-out afterward leaves the page in an off-centre state — subtly breaking the 30-second flow.

**How to avoid:** UI-SPEC.md already locks `text-base` (16px) for every text input. The planner must pass this through to the executor; don't let a Wave 3 "make it smaller" tweak regress it.

**Warning signs:** `<Input class="text-sm">` anywhere in the tag picker. Automated E2E test: Playwright screenshot before and after focusing the input — viewport width must be unchanged.

### Pitfall 4: Dexie schema version must increase on any `.stores()` change

**What goes wrong:** Editing a `db.version(1).stores({...})` call to add a field silently fails to migrate on already-installed devices; Dexie throws `VersionError` on open. First user to hit it has to clear site data.

**How to avoid:**
- Every schema change gets a NEW `.version(N).stores({...}).upgrade(...)` call. Never mutate `version(1)` after any user has run the app.
- Phase 1 ships at `.version(1)`. Put `.version(2)` scaffolding in `db/local.ts` as a comment for the next phase's fields (e.g., `note TEXT`, `synced_at`).

**Sources:** `[CITED: context7 /dexie/dexie.js — schema versioning and migrations]`

### Pitfall 5: Dexie transactions die on `await` outside the transaction scope

**What goes wrong:** `await db.transaction('rw', db.entries, db.entry_tags, async () => { ... await somePromiseFromOutsideDexie(); ... })` — the external `await` can commit the transaction early, yielding a `TransactionInactiveError` on the next Dexie call inside the block.

**How to avoid:** Only `await` Dexie-returned promises (or the results of other Dexie transactions) inside a transaction block. For `saveEntry`, the only awaits are `db.entries.put()` and `db.entry_tags.bulkPut()` — no `fetch`, no `crypto.subtle`, no `setTimeout`.

**Warning signs:** Any `fetch`, third-party API call, or long-running promise inside a `db.transaction(...)` callback. Code review checks for this.

### Pitfall 6: Tag case-insensitive match leaks the user's typed case

**What goes wrong:** D-09 requires storing the display name the user typed but matching case-insensitively. A naive implementation lowercases on insert and loses the original. The chip row later shows "alice" when the user typed "Alice".

**How to avoid:** Two columns: `display_name TEXT NOT NULL` (user's original input) and `lower_key TEXT NOT NULL` (the stored lowercase + trimmed key, indexed). Matching queries use `lower_key`; UI reads `display_name`. Enforce the invariant `lower_key === display_name.trim().toLowerCase()` in `upsertTag` (see §Code Example 2).

### Pitfall 7: SvelteKit adapter mismatch when deploying later

**What goes wrong:** Phase 1 scaffolds with `adapter-auto` (default). When Phase 2 deploys to Cloudflare Pages, adapter must be switched to `@sveltejs/adapter-cloudflare`. If Phase 1 has baked in any node-specific server code (e.g., a `+page.server.ts` action that uses `fs`), the deploy fails.

**How to avoid:** Phase 1 has no server-side code (all persistence is client-side). Keeping `+page.server.ts` completely absent is the guardrail. The planner should explicitly forbid creating one in Phase 1 tasks.

### Pitfall 8: Service worker caching the entry form HTML across schema changes

**What goes wrong:** vite-plugin-pwa's default precache serves a stale `+page.svelte` HTML after a deploy. A user on iOS 17 with the installed PWA can keep seeing the pre-migration form for days.

**How to avoid:**
- Use `registerType: 'autoUpdate'` in the vite-plugin-pwa config (the default for `@vite-pwa/sveltekit`) so the SW self-updates on next app open.
- Pair with a "new version available, tap to update" toast in Phase 2 if needed; for Phase 1, autoUpdate is sufficient.

**Sources:** `[CITED: context7 /vite-pwa/sveltekit]`

### Pitfall 9: Test setup missing `fake-indexeddb/auto`

**What goes wrong:** Running a Vitest spec that imports `db/local.ts` in a Node environment throws `indexedDB is not defined`.

**How to avoid:** Create `tests/setup.ts` with `import 'fake-indexeddb/auto';` and reference it from `vitest.config.ts` via `test.setupFiles`. The full-suite command works on every runner.

**Sources:** `[CITED: github.com/dumbmatter/fakeIndexedDB README]` `[ASSUMED]`

### Pitfall 10: Streaks/gamification creep

**What goes wrong:** A well-intentioned Wave 3 task adds a "6/7 days logged" indicator to the form header and subtly gamifies the habit, violating PITFALLS #11 and CONTEXT.md D-14.

**How to avoid:** The plan MUST include a verification check that no numeric day-count, streak, or "don't miss today" copy appears anywhere in Phase 1 UI. UI-SPEC.md's banned-phrases list is the authoritative test.

## Runtime State Inventory

This is a greenfield phase — no prior runtime state exists to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DBs, no caches, no files in any datastore | None |
| Live service config | None — no external services exist for this project | None |
| OS-registered state | None — no Task Scheduler, systemd, launchd entries | None |
| Secrets/env vars | None — no `.env`, no SOPS keys; Phase 1 has no secrets | None |
| Build artifacts | None — no `node_modules`, no `dist/`, no `.svelte-kit/` | None (will be created by scaffold) |

**Nothing found in any category:** Verified by listing repo root (only `CLAUDE.md`, `.planning/`, `.claude/`, `.idea/` present — no `package.json`, no `src/`). Greenfield scaffold.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | SvelteKit, Vite, Vitest | ✓ | v22.22.0 | — (well above SvelteKit 2's min of 18.13) |
| npm | Package install (fallback path) | ✓ | 10.9.4 | — |
| pnpm | Preferred by STACK.md | ✗ | — | `npm install -g pnpm` as a Wave 0 task, OR use `npm` (adjust install commands) |
| git | Version control | (not verified — but commit_docs: true implies presence) | — | — |

**Missing dependencies with no fallback:** None — all blockers have fallbacks.

**Missing dependencies with fallback:**
- **pnpm:** Not installed. The planner should decide: install as Wave 0 (one task: `npm install -g pnpm`) OR use `npm` throughout. Using `npm` is lower risk (no global install, no version drift) and works fine for a single-developer personal app. Recommend: use `npm` for Phase 1; revisit pnpm when the project grows.

## Validation Architecture

> Phase-level tests for every ENT/DAT requirement. `nyquist_validation: true` is active in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 (scaffolded by `npm create svelte`) |
| Config file | `vitest.config.ts` (to be created by the scaffold task in Wave 0) |
| Quick run command | `npm run test:unit -- --run <spec>` (SvelteKit scaffold default) |
| Full suite command | `npm run test` |
| Setup file | `tests/setup.ts` with `import 'fake-indexeddb/auto';` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ENT-01 | mood 1-5 stored on Dexie `entries` row | unit | `npm run test:unit -- --run tests/db.test.ts -t "mood value persists"` | ❌ Wave 0 |
| ENT-02 | energy 1-5 stored on Dexie `entries` row | unit | `npm run test:unit -- --run tests/db.test.ts -t "energy value persists"` | ❌ Wave 0 |
| ENT-03 | workload enum stored as `'light'|'moderate'|'heavy'` | unit | `npm run test:unit -- --run tests/db.test.ts -t "workload enum"` | ❌ Wave 0 |
| ENT-04 | social_split ordinal 1/2/3 stored | unit | `npm run test:unit -- --run tests/db.test.ts -t "social split ordinal"` | ❌ Wave 0 |
| ENT-05 | tag case-insensitive matching; "Alice" + "alice" resolve to same tag | unit | `npm run test:unit -- --run tests/tagpicker.test.ts -t "case-insensitive"` | ❌ Wave 0 |
| ENT-06 | editing an existing date re-uses same PK; CTA becomes Update | unit + component | `npm run test:unit -- --run tests/entry.test.ts -t "edit preserves PK"` | ❌ Wave 0 |
| ENT-07 | notification-click deep-link URL is `/?date=today` | unit (service worker module function) | `npm run test:unit -- --run tests/sw.test.ts -t "notificationclick deep link"` | ❌ Wave 0 |
| ENT-08 | `navigator.storage.persist()` is called on first open | unit | `npm run test:unit -- --run tests/pwa.test.ts -t "storage.persist called"` | ❌ Wave 0 |
| DAT-01 | Dexie schema v1 survives open + put + reload cycle | unit (fake-indexeddb) | `npm run test:unit -- --run tests/db.test.ts -t "schema v1 round-trip"` | ❌ Wave 0 |
| DAT-01 (manual-only) | Real Safari 7-day eviction survival | manual | Smoke test on a physical iOS device with PWA installed | N/A — document in acceptance checklist |

Also required for completeness (non-requirement but cross-cutting):
- Timezone correctness (PITFALLS #8): `tests/timezone.test.ts — "entry at 23:50 local lands on the local day"` — unit.
- No-streaks check (PITFALLS #11, UI-SPEC banned phrases): `tests/copy.test.ts — "no forbidden tokens in rendered UI"` — unit (string grep on compiled `.svelte` output is acceptable).

### Sampling Rate
- **Per task commit:** `npm run test:unit -- --run tests/<area>.test.ts` (the spec closest to the edit, < 5s runtime)
- **Per wave merge:** `npm run test` (full Vitest suite)
- **Phase gate:** Full suite green + manual Safari install smoke test before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Scaffold Vitest config (`vitest.config.ts` with `setupFiles: ['tests/setup.ts']`)
- [ ] `tests/setup.ts` — `import 'fake-indexeddb/auto';`
- [ ] `tests/db.test.ts` — covers ENT-01..04, DAT-01 (Dexie schema + CRUD)
- [ ] `tests/tagpicker.test.ts` — covers ENT-05 (case-insensitive matching)
- [ ] `tests/entry.test.ts` — covers ENT-06 (edit round-trip)
- [ ] `tests/sw.test.ts` — covers ENT-07 (notificationclick handler)
- [ ] `tests/pwa.test.ts` — covers ENT-08 (persist API wrapper)
- [ ] `tests/timezone.test.ts` — covers PITFALLS #8
- [ ] `tests/copy.test.ts` — enforces UI-SPEC banned-phrase list
- [ ] Framework install: `npm install -D fake-indexeddb` (vitest already installed by scaffold)

## Security Domain

> `security_enforcement` is not explicitly set to `false` in config.json — treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no — Phase 1 has no auth gate; DAT-02 password gate is Phase 2 | deferred |
| V3 Session Management | no — no sessions; no cookies | n/a |
| V4 Access Control | no — single-user, no authz | n/a |
| V5 Input Validation | yes | Typescript types on mutation inputs + runtime guards (check `mood` in [1,5], `workload` in enum) before `db.entries.put`. No schema-validation library needed for Phase 1's 5-field surface. |
| V6 Cryptography | no — no sensitive fields encrypted client-side in Phase 1 | deferred (potential v2 work) |
| V10 Malicious Code / Supply Chain | yes | `npm ci` with lockfile, no third-party CDN scripts, strict CSP header set via `+layout.ts` `handle` hook OR deployment-level (Phase 2). Per PITFALLS #12, first-party only. |
| V14 Configuration (CSP/headers) | yes | Phase 1 deploys nowhere publicly yet (DAT-02 gate is Phase 2), but the CSP meta tag should be set in `app.html` from day one: `default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline';` |

### Known Threat Patterns for SvelteKit + Dexie + PWA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Third-party analytics leaking mood data | Information Disclosure | PITFALLS #12. No analytics, no CDN fonts, no Sentry cloud, no Mixpanel. CSP `default-src 'self'`. |
| Mood values in URL query string | Information Disclosure | All writes POST; route params must never encode mood/energy/workload values. The deep-link `/?date=today` is the only query param in Phase 1 (date only — not sensitive). |
| Console logging of entry payloads | Information Disclosure (dev leaks) | ESLint rule `no-console` set to `error` in prod build. Error paths log error.message and key, not payload. |
| Service worker receiving untrusted push | Tampering | Phase 1 has no push server → no push listener → no attack surface. Stub the `'push'` event handler with a no-op so it's explicit. |
| XSS via user-typed tag name | Tampering | Svelte auto-escapes all text interpolations. Do NOT use `{@html}` anywhere in Phase 1. |
| IndexedDB data on a lost/stolen device | Information Disclosure | Out of scope for Phase 1 (no OS-level encryption). DAT-02 password gate in Phase 2 addresses origin access, not at-rest encryption. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `dexie-svelte-query@1.0.0` is the only shipped reactive-query helper for Svelte 5 runes + Dexie (not counting our in-repo wrapper). | §Standard Stack — Alternatives | If a more mature alternative exists, we might be reinventing it. **Low impact** — our 10-line wrapper is simple and has no dependency risk. |
| A2 | iOS 16.4+ is the minimum for web push AND the user's target phone meets this bar. | §Pitfall 2, §Architectural Responsibility Map | If the user's phone is older, reminders never work even when installed. **Medium impact** — user owns the device, should confirm iOS version. |
| A3 | The user is not in the EU (web push is blocked for EU iOS users on iOS 17.4+ per magicbell.com). | §Pitfall 2 | The user's email domain is `@jobrad.org` (German company) — **flag for confirmation**. If the user is in the EU, iOS Home Screen web push may be unavailable and Phase 1's reminder behaviour degrades to "in-app timer only, even when installed". This changes what D-18's banner should promise. |
| A4 | The `tests/setup.ts` + `fake-indexeddb/auto` pattern is the current standard for Vitest + Dexie. | §Validation Architecture | Alternative: `jsdom` storage shims. Low impact — worst case we swap the setup file. |
| A5 | Dexie 4.4.2 on the `dev` dist-tag (also tagged `latest`) is safe for production. | §Version verification table | The package's dist-tag structure (`dev`, `canary`, `latest-3`, `latest-3.0.x`) suggests 4.x is still actively stabilising. Pin the exact version in `package.json` and monitor; if issues emerge, downgrade to `3.2.7` (`latest-3`) which has compatible schema semantics. |
| A6 | The `dexie-svelte-query` package being 4 months old and single-release is a maintenance risk worth avoiding. | §Alternatives Considered | Judgement call — a younger package is not automatically bad, but for a single-user personal app where data loss is expensive, the canonical Dexie API (`liveQuery`) is safer. |
| A7 | SvelteKit form action `use:enhance` with no server-side action body is semantically valid and doesn't throw a 404/405 on submit. | §Pattern 1 | **Verify at scaffold time** — if SvelteKit rejects POST without an action, add a no-op `export const actions = { default: async () => ({}) };` in `+page.server.ts`. Low impact. |
| A8 | PITFALLS #12's "no third-party scripts" extends to Google Fonts and similar CDN fonts — UI-SPEC already bans them, assumption confirmed. | §Security Domain | Verified against UI-SPEC.md which uses system font stack. Zero risk. |
| A9 | `crypto.randomUUID()` is available in all target browsers (iOS 15.4+, Chrome 92+). | §Don't Hand-Roll | Very low risk — Safari 15.4 was 2022. If supporting older, use `uuid` package as fallback. |

**Note on A3 (EU web push):** Given the user's email domain suggests a German employer, the planner should surface this via a one-line question during `/gsd-discuss-phase` follow-up OR accept the graceful degradation (in-app timer only) as the guaranteed Phase 1 behaviour and treat server push as unconditionally Phase 2.

## Open Questions

1. **Is the user's daily phone running iOS 16.4+, and is the user inside the EU?** (See A2, A3.)
   - What we know: Web push on iOS requires 16.4+ installed PWA and is blocked in EU on iOS 17.4+.
   - What's unclear: Device and location unconfirmed.
   - Recommendation: Surface during a quick discuss follow-up OR document D-18's banner copy as the guaranteed-correct fallback for all cases, so Phase 1 succeeds regardless.

2. **Should `pnpm` be installed as a Wave 0 step, or is `npm` acceptable for Phase 1?**
   - What we know: STACK.md recommends pnpm; environment has only npm.
   - What's unclear: User preference.
   - Recommendation: Default to `npm` (lowest friction, works fine), but flag to user: "install pnpm globally if you want to follow STACK.md strictly."

3. **Is it acceptable to use `+page.svelte` SSR with client-only hydration, given there is literally no server data to render?**
   - What we know: SvelteKit SSR renders the empty form shell; client hydrates and shows existing entry.
   - What's unclear: Whether Phase 1 should set `export const ssr = false` on the page or leave default SSR on.
   - Recommendation: Leave SSR on for the app shell (`+layout.svelte` with manifest link, install banner), set `export const ssr = false` on `/+page` so Dexie code (which references `indexedDB`) never runs on the server. This is Claude's Discretion per CONTEXT.md.

## Code Examples

### Example 1: Dexie v1 schema

```typescript
// src/lib/db/local.ts
// `[CITED: context7 /dexie/dexie.js — schema versioning, compound & multi-entry indexes]`
import Dexie, { type EntityTable } from 'dexie';

export type Entry = {
  id: string;                 // crypto.randomUUID()
  local_date: string;         // "YYYY-MM-DD" in the user's local timezone (PITFALLS #8)
  mood: 1 | 2 | 3 | 4 | 5 | null;
  energy: 1 | 2 | 3 | 4 | 5 | null;
  workload: 'light' | 'moderate' | 'heavy' | null;
  social_split: 1 | 2 | 3 | null;   // ordinal per D-06
  created_at: string;         // ISO-8601 UTC
  updated_at: string;
};

export type Tag = {
  id: string;
  display_name: string;       // user's original casing (D-09)
  lower_key: string;          // `display_name.trim().toLowerCase()`
  created_at: string;
};

export type EntryTag = { entry_id: string; tag_id: string };

export type Settings = {
  key: 'reminder_time' | 'onboarded' | 'install_banner_dismissed_at' | 'storage_persistent';
  value: string;              // stringified — small heterogeneous blob
  updated_at: string;
};

export const db = new Dexie('moodlog') as Dexie & {
  entries: EntityTable<Entry, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  entry_tags: EntityTable<EntryTag, never>;
  settings: EntityTable<Settings, 'key'>;
};

db.version(1).stores({
  // `&local_date` — unique index (one entry per local day)
  // `local_date` also plain-indexed for range queries
  entries: 'id, &local_date, updated_at',
  tags: 'id, &lower_key, display_name',
  // compound primary key
  entry_tags: '[entry_id+tag_id], entry_id, tag_id',
  settings: 'key'
});

// Future phases: db.version(2).stores({ entries: '...note...' }).upgrade(trans => ...);
```

### Example 2: Tag upsert with case-insensitive match (ENT-05, D-09)

```typescript
// src/lib/db/mutations.ts
import { db } from './local';
import type { Tag } from './local';

export async function upsertTag(rawName: string): Promise<Tag> {
  const display_name = rawName.trim();
  const lower_key = display_name.toLowerCase();
  if (!display_name) throw new Error('empty tag');

  // `[CITED: context7 /dexie/dexie.js — transaction, put, where().equals()]`
  return db.transaction('rw', db.tags, async () => {
    const existing = await db.tags.where('lower_key').equals(lower_key).first();
    if (existing) return existing;
    const now = new Date().toISOString();
    const tag: Tag = {
      id: crypto.randomUUID(),
      display_name,
      lower_key,
      created_at: now
    };
    await db.tags.put(tag);
    return tag;
  });
}
```

### Example 3: liveQuery → $state reactive wrapper

See Pattern 3 above. Inlined here for the code-examples section.

```typescript
// src/lib/state/liveEntry.svelte.ts
import { liveQuery, type Observable } from 'dexie';
import { onDestroy } from 'svelte';

export function useLiveQuery<T>(query: () => Promise<T>, initial: T) {
  let current = $state<T>(initial);
  const obs: Observable<T> = liveQuery(query);
  const sub = obs.subscribe({
    next: (v) => (current = v),
    error: (e) => console.error('liveQuery error', e?.name ?? 'unknown')  // no payload logged (PITFALLS #12)
  });
  onDestroy(() => sub.unsubscribe());
  return { get current() { return current; } };
}
```

### Example 4: `@vite-pwa/sveltekit` minimal config

```typescript
// vite.config.ts
// `[CITED: github.com/vite-pwa/sveltekit README]`
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      registerType: 'autoUpdate',          // Pitfall 8
      manifest: {
        name: 'MoodLog',
        short_name: 'MoodLog',
        theme_color: '#FAFAF9',
        background_color: '#FAFAF9',
        display: 'standalone',              // required for iOS push
        start_url: '/',
        icons: [
          // populated by pwa-assets-generator in a follow-up task
        ]
      }
    })
  ]
});
```

### Example 5: Persistent storage + iOS detection

```typescript
// src/lib/pwa/persist.ts
// `[CITED: developer.mozilla.org Web/API/StorageManager/persist]`
export async function requestPersistence(): Promise<boolean> {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) return false;
  const alreadyPersistent = await navigator.storage.persisted();
  if (alreadyPersistent) return true;
  return await navigator.storage.persist();
}

export function isInstalledPWA(): boolean {
  // standalone display mode (iOS + Android when installed)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari legacy
    (navigator as any).standalone === true
  );
}

export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}
```

### Example 6: SvelteKit form action with use:enhance

See Pattern 1 above. The form in `/+page.svelte` does not need a `+page.server.ts` in Phase 1 (A7).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `showTrigger` Notification Triggers API | Best-effort in-app timer + install prompt + future push server | Chrome development ended (stable launch "not started") | No zero-infra scheduling; Phase 1 reminders are best-effort. |
| Svelte stores (`writable`, `readable`) | Svelte 5 runes (`$state`, `$derived`) in `.svelte.ts` | Svelte 5 stable | Draft state is plain objects, not stores — simpler to test, no subscribe boilerplate. `[CITED: svelte.dev/docs/runes]` |
| Tailwind v3 with `tailwind.config.js` | Tailwind v4 with `@theme` in CSS | v4 stable (Jan 2025) | No JS config file; tokens defined in `app.css`. `[CITED: STACK.md — Tailwind CSS v4 notes]` |
| React charting via island | N/A — charts arrive in Phase 3 | — | Phase 1 has no charts. |
| `toISOString().slice(0,10)` | Explicit local-date construction (see Example 1 helper) | PITFALLS #8 | Never `toISOString` the local date. |
| vite-plugin-pwa with manual SvelteKit glue | `@vite-pwa/sveltekit` | Package matured 2023+ | Zero-glue SvelteKit integration. |

**Deprecated/outdated:**
- Notification Triggers API (`showTrigger` + `TimestampTrigger`): development ended in Chrome; not shipped in Safari/Firefox. Do not use.
- `localStorage` for app data on mobile: evicted faster than IndexedDB; no schema guarantees. Use Dexie.
- `Math.random()`-based IDs: not collision-safe across rapid saves or future sync. Use `crypto.randomUUID()`.

## Project Constraints (from CLAUDE.md)

**Global (~/.claude/CLAUDE.md):**
- Prefer simplest solution first; don't switch libraries or add dependencies when a config change suffices.
- When asked to plan, produce a plan. When asked to implement, produce code.
- Verify TypeScript types after editing TS files via project type-check command. **Implication:** Phase 1's scaffold task must wire `svelte-check` or `tsc --noEmit` as a gate; any task editing `.ts`/`.svelte` runs `npm run check` before completion.
- When tests fail, fix production code (unless the test itself is wrong); don't fix the test to match broken behavior.
- Write concise focused tests; avoid elaborate mocking.

**Project (./CLAUDE.md):**
- Declares Project = MoodLog, technology stack = the (truncated) contents of STACK.md — reiterates SvelteKit 2 + Svelte 5 + Tailwind v4 + Dexie + vite-plugin-pwa as the locked stack.

**Research implications:**
- Do NOT recommend adding a new framework or ORM-alternative.
- Do NOT recommend a second state library (keep it to runes + Dexie).
- Every plan task MUST include a type-check verification step.

## Sources

### Primary (HIGH confidence)
- Context7 `/dexie/dexie.js` — schema versioning, upgrade migrations, compound indexes, liveQuery, transactions, upsert patterns
- Context7 `/sveltejs/svelte` — runes in `.svelte.js`/`.svelte.ts`, module-scoped $state, cross-module sharing rules
- Context7 `/websites/svelte_dev_kit` — `use:enhance`, `+page.server.ts` form actions, service worker integration
- Context7 `/vite-pwa/sveltekit` — SvelteKitPWA plugin config, injectManifest strategy, manifest schema
- `[CITED: developer.chrome.com/docs/web-platform/notification-triggers]` — Notification Triggers API development ended, never shipped to stable
- `[CITED: webkit.org/blog/14403/updates-to-storage-policy/]` — Safari storage eviction, Home Screen Web App quota exception
- `[CITED: npm registry]` — verified versions: dexie 4.4.2, @sveltejs/kit 2.57.1, svelte 5.55.4, tailwindcss 4.2.2, @vite-pwa/sveltekit 1.1.0, vite-plugin-pwa 1.2.0, bits-ui 2.18.0, sonner-svelte 0.3.3, lucide-svelte 1.0.1, vitest 4.1.4, fake-indexeddb 6.2.5

### Secondary (MEDIUM confidence)
- `[CITED: magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide]` — iOS 16.4+ web push requirement, installed-to-home-screen, EU geographic restriction, 50 MB cache limit
- `[CITED: developer.mozilla.org Web/API/StorageManager/persist]` — persist() API semantics
- `[CITED: web.dev/articles/persistent-storage]` — persist() cross-browser behaviour, heuristics
- `[CITED: developer.mozilla.org Web/API/ServiceWorkerGlobalScope/notificationclick_event]` — notification click handler, openWindow, focus pattern
- WebSearch verified against WebKit blog: 60%/15% quota split, silent grant heuristic on home-screen apps

### Tertiary (LOW confidence / needs validation)
- `[CITED: developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers]` — URL cited; content not fully fetchable in this research session; claims cross-validated against magicbell.com and Apple Developer Forums search results
- `[ASSUMED]` dexie-svelte-query 1.0.0 release recency as a reliability risk — judgement, not verified against GitHub issues/downloads
- `[ASSUMED]` A8 (PITFALLS #12 covers CDN fonts) — confirmed against UI-SPEC.md system font stack, zero actual risk

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified via `npm view`; all core libraries locked in STACK.md and UI-SPEC.md.
- Architecture: HIGH — patterns drawn from Context7 first-party docs.
- Pitfalls: HIGH for storage/schema/timezone (well-documented); MEDIUM for notifications (platform fragmentation is real).
- Test architecture: HIGH — Vitest + fake-indexeddb is the canonical pattern.
- Environment: HIGH — directly probed node/npm/pnpm.
- Assumptions: MEDIUM — A3 (EU location) and A5 (Dexie dist-tag semantics) would benefit from quick confirmation.

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (30 days — stable ecosystem for the locked stack; re-check Dexie dist-tags and iOS web-push EU policy if Phase 1 implementation starts after that)
