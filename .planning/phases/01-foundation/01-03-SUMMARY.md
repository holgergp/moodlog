---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [svelte5, runes, components, ui, a11y, entry-form, dexie, bindable]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: shadcn-svelte primitives (Popover, Calendar) + Tailwind v4 @theme tokens + svelte-check/vitest harness
  - phase: 01-foundation-02
    provides: db singleton + types (Entry, Tag, SettingKey) + listTagsPrefixed/upsertTag/localDate
provides:
  - Module-scoped $state draft with resetDraft + hydrateDraftFromEntry (D-11 edit + D-14 neutral backfill)
  - useLiveQuery wrapper: Dexie liveQuery → Svelte 5 $state with onDestroy cleanup; error path scrubs payload
  - Reactive settings helpers (useReminderTime / useOnboarded / useStoragePersistent)
  - ScaleDotPicker — 5-button mood/energy radiogroup with filled-dot selected state (D-04)
  - SegmentedControl — generic 3-button radiogroup for workload (D-05) and social (D-06)
  - TagChipPicker — chip row + autocomplete input with case-insensitive filter + "+ Create" row (D-07, D-09)
  - DateChip — tappable date label opening shadcn Calendar; future dates blocked at two layers (D-11, D-12, D-13)
affects: [phase-01-plan-04-layout-form, phase-01-plan-05-pwa-notifications, phase-03-history-views]

# Tech tracking
tech-stack:
  added: []  # No new deps — bits-ui Calendar / @internationalized/date already installed in Plan 01
  patterns:
    - "Svelte 5 $bindable props: `let { value = $bindable(null), label }: Props = $props()` — widgets mutate the bound value directly; Plan 04 page wires via `bind:value={draft.mood}`"
    - "Reactive $effect for data FETCHES only: TagChipPicker reads DB via listTagsPrefixed in $effect, never writes — writes belong to explicit user-action handlers (RESEARCH §Anti-Patterns)"
    - "Double-layer future-date guard: Calendar maxValue={today(tz)} as UI-level block + onValueChange string comparison (`if (nextStr > todayStr) return`) as correctness floor (D-13 belt-and-braces)"
    - "Module-scoped runes: `.svelte.ts` files let $state live outside components; importers mutate the object fields directly (draft.mood = 3) which triggers reactivity in every subscribed widget"
    - "useLiveQuery cleanup contract: must be called inside a component script — onDestroy registration requires component scope; documented in settings.svelte.ts header"

key-files:
  created:
    - "src/lib/state/draft.svelte.ts — Draft type + module-scoped $state + resetDraft + hydrateDraftFromEntry"
    - "src/lib/state/liveEntry.svelte.ts — useLiveQuery(query, initial): liveQuery → $state wrapper"
    - "src/lib/state/settings.svelte.ts — useReminderTime / useOnboarded / useStoragePersistent"
    - "src/lib/components/entry/ScaleDotPicker.svelte — 5-button radiogroup (mood/energy)"
    - "src/lib/components/entry/SegmentedControl.svelte — 3-button radiogroup (workload/social)"
    - "src/lib/components/entry/TagChipPicker.svelte — chip row + autocomplete + create row"
    - "src/lib/components/entry/DateChip.svelte — Popover + Calendar (bits-ui)"
    - "tests/state.test.ts — 3 draft-state smoke tests"
  modified: []

key-decisions:
  - "Phase 01 Plan 03: Selected-state fill uses `var(--color-primary)` (shadcn token) not `var(--color-accent)` — app.css banner comment pins UI-SPEC 'accent' CTA role to shadcn's --primary (#0F172A), while --accent is the stone-muted hover role (#F5F5F4). The plan's snippet used --color-accent which would have rendered muted stone, not the slate-900 CTA."
  - "Phase 01 Plan 03: DateChip uses @internationalized/date (CalendarDate) not native JS Date — bits-ui Calendar expects DateValue; `parseDate(YYYY-MM-DD)` builds the value, `today(getLocalTimeZone())` builds the maxValue, `{year, month, day}` fields reconstruct the YYYY-MM-DD string on change."
  - "Phase 01 Plan 03: `$effect` in TagChipPicker is read-only — async IIFE fetches matches + allTags. Writes (toggleTag, createAndSelect) are user-event handlers only, never inside $effect (RESEARCH §Anti-Patterns)."
  - "Phase 01 Plan 03: TagChipPicker input bound directly to `query` state (not an intermediate handler) — `bind:value={query}` + $effect on query triggers listTagsPrefixed. No debounce in Phase 1 (fake-indexeddb is ~1ms; real IndexedDB ~5ms — acceptable without debounce for a single-user app)."

patterns-established:
  - "Analog authority for state modules: src/lib/state/draft.svelte.ts — module-scoped $state declaration, type-first definition, `localDate()` as default date initializer"
  - "Analog authority for liveQuery subscription: src/lib/state/liveEntry.svelte.ts — error path logs err.name only, onDestroy cleanup required (call site must be a component)"
  - "Analog authority for custom entry components: src/lib/components/entry/ScaleDotPicker.svelte — Svelte 5 $bindable props, radiogroup a11y pattern, 44×44 touch targets, --color-primary for selected state"
  - "Analog authority for autocomplete + create-new pattern: src/lib/components/entry/TagChipPicker.svelte — chip row above input, $effect read-only filter, explicit hasExactMatch() gate before rendering + Create row"

requirements-completed: [ENT-01, ENT-02, ENT-03, ENT-04, ENT-05, ENT-06]

# Metrics
duration: 29min
completed: 2026-04-20
---

# Phase 01 Plan 03: Reactive state + entry-form components summary

**Module-scoped `$state` draft + `useLiveQuery` wrapper + reactive settings helpers + four bindable entry-form components (ScaleDotPicker, SegmentedControl, TagChipPicker, DateChip) wired to UI-SPEC tokens, radiogroup a11y, 44×44 touch targets, and two-layer future-date block.**

## Performance

- **Duration:** ~29 min
- **Started:** 2026-04-20T11:37:41Z
- **Completed:** 2026-04-20T12:07:13Z
- **Tasks:** 2 / 2
- **Files created:** 8 (3 state modules + 4 components + 1 test)
- **Files modified:** 0 (all new — no regressions)

## Accomplishments

- Reactive state surface complete: `draft` is a module-scoped `$state` object that any widget can mutate via `bind:value`; `useLiveQuery` subscribes on component mount and cleans up on destroy; three settings helpers expose `{ readonly current }` read-handles for reminder_time / onboarded / storage_persistent.
- Four custom entry widgets land with full a11y contracts: radiogroup roles, per-button `aria-label`, 44×44 touch targets, `focus-visible:ring-2 focus-visible:ring-slate-900/40` rings, `text-base` inputs (Pitfall 3).
- Tag autocomplete landed with case-insensitive filter (via `listTagsPrefixed`), explicit "+ Create "{typed}"" gate (only shown when no exact match), and `upsertTag` on creation — chip toggles are pure local state, no DB writes from `$effect`.
- DateChip adapts the bits-ui Calendar API correctly: `CalendarDate`/`DateValue` from `@internationalized/date`, `maxValue={today(tz)}` UI block, plus `onValueChange` string comparison as correctness floor.
- Test count: 17 passing / 2 todo (up from 14/2) — 3 new state-smoke tests (reset, hydrate from entry, hydrate from undefined preserves date).
- `npm run check` exits 0 across 940 files (up from 932); `tests/copy.test.ts` still GREEN (no banned phrases introduced by new components).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create state modules (draft, liveEntry, settings)** — `5e5af03` (feat)
2. **Task 2: Build ScaleDotPicker, SegmentedControl, TagChipPicker, DateChip** — `052d52b` (feat)

**Plan metadata:** (pending — final commit at end of execute-plan flow)

## Public API (authoritative contracts)

### State module signatures

```typescript
// src/lib/state/draft.svelte.ts
export type Draft = {
  date: string;                                        // YYYY-MM-DD local TZ
  mood: 1 | 2 | 3 | 4 | 5 | null;
  energy: 1 | 2 | 3 | 4 | 5 | null;
  workload: 'light' | 'moderate' | 'heavy' | null;
  socialSplit: 1 | 2 | 3 | null;
  tagIds: string[];
};
export const draft: Draft;                             // $state — import and mutate
export function resetDraft(date?: string): void;
export function hydrateDraftFromEntry(e: Entry | undefined, tagIds: string[]): void;

// src/lib/state/liveEntry.svelte.ts
export function useLiveQuery<T>(
  query: () => Promise<T>,
  initial: T
): { readonly current: T };

// src/lib/state/settings.svelte.ts
export function useReminderTime(): { readonly current: string };       // "21:00" default
export function useOnboarded(): { readonly current: boolean };
export function useStoragePersistent(): { readonly current: boolean | null };  // null = unknown
```

### Component prop contracts

```typescript
// ScaleDotPicker — mood & energy 1-5 picker
{ value?: 1 | 2 | 3 | 4 | 5 | null; label: string; }    // value is $bindable

// SegmentedControl — generic 3-option radiogroup
{
  value?: string | number | null;                        // $bindable
  options: Array<{ value: string | number; label: string }>;
  label: string;
}

// TagChipPicker — people tags
{ tagIds?: string[]; }                                   // $bindable

// DateChip — tappable date with Calendar popover
{ date?: string; }                                       // $bindable "YYYY-MM-DD"
```

### Hard-coded verbatim copy (sourced from UI-SPEC §Copywriting)

| Component | String | Source |
|-----------|--------|--------|
| `ScaleDotPicker` | `aria-label={`${label} ${n} of 5`}` | UI-SPEC Accessibility Contract |
| `TagChipPicker` | `No one yet` | UI-SPEC Copy — "People — empty chip row hint" |
| `TagChipPicker` | `Add a person…` (unicode `…`) | UI-SPEC Copy — "People prompt" |
| `TagChipPicker` | `+ Create "{query.trim()}"` | UI-SPEC Copy — "People — create new row" |
| `DateChip` | `Today` | UI-SPEC Copy — "Date chip label" |
| `DateChip` | `Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })` | UI-SPEC Copy — "Date chip label … past format" |

`SegmentedControl` deliberately ships **no** hard-coded labels — the parent passes them via `options` so the workload (Light/Moderate/Heavy) vs social (Mostly alone/Mixed/Mostly with others) labels land verbatim in Plan 04's `+page.svelte`.

## Decisions Made

1. **`--color-primary` vs `--color-accent`** — The plan's snippets referenced `var(--color-accent)` for selected-state fill, but `src/app.css` maps `--accent` to `#F5F5F4` (the shadcn muted-hover role) and maps `--primary` to `#0F172A` (the UI-SPEC "accent" CTA role). Using `--color-accent` would have rendered selected buttons in muted stone, not the intended slate-900 CTA. All selected states use `var(--color-primary)` + `var(--color-primary-foreground)`. Documented inline in Task 2 commit message.

2. **DateChip API adaptation to `@internationalized/date`** — The plan's snippet used native `new Date(date)` and `maxValue={new Date(todayStr)}`, but bits-ui `Calendar` (via shadcn-svelte `calendar.svelte`) requires `DateValue` (= `CalendarDate | CalendarDateTime | ZonedDateTime`) from `@internationalized/date`. Replaced with `parseDate(date)` (→ CalendarDate) for value, `today(getLocalTimeZone())` for maxValue, and `{year, month, day}` fields to reconstruct the YYYY-MM-DD string on change. Future-date guard preserved at both layers.

3. **`$effect` for DB reads only** — TagChipPicker uses two `$effect` blocks: one resolves selected tag rows from `tagIds`, the other filters via `listTagsPrefixed(query, 20)` and probes "any tag exists" for the `No one yet` hint. Both are read-only. Writes (`toggleTag`, `createAndSelect`) are user-event handlers. This matches RESEARCH §Anti-Patterns: "Never call db.entries.put(...) inside a $effect."

4. **No debounce on tag filter** — Plan didn't mandate debouncing, and fake-indexeddb returns in ~1ms while real IndexedDB is ~5ms per query. For a single-user personal app the query-per-keystroke cost is invisible. Re-evaluate only if user-observable jank surfaces in real-device testing (Plan 04 visual verification).

5. **`useLiveQuery` cleanup contract documented in settings.svelte.ts** — `onDestroy(...)` requires a component context. Settings helpers are documented as "must be called inside a component script" in the file header to prevent misuse from top-level module code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Swapped `var(--color-accent)` → `var(--color-primary)` for selected-state fill**
- **Found during:** Task 2 (post-write review against app.css banner comment)
- **Issue:** The plan's snippets referenced `bg-[var(--color-accent)] text-[var(--color-accent-foreground)]` for the selected state of ScaleDotPicker, SegmentedControl, and TagChipPicker. In `src/app.css` (Plan 01), `--color-accent` is mapped to `#F5F5F4` (the shadcn muted-hover token) while `--color-primary` is mapped to `#0F172A` (the UI-SPEC "accent" CTA). The scaffold banner comment explicitly pins this: `UI-SPEC "accent" (CTA) -> --primary`. Using `--color-accent` would have rendered selected buttons in muted stone, which fails UI-SPEC §Color "Accent reserved for … Primary CTA button fill".
- **Fix:** All selected-state classes now use `bg-[var(--color-primary)] text-[var(--color-primary-foreground)]` (ScaleDotPicker, SegmentedControl, TagChipPicker chip). Unselected state uses `text-[var(--color-primary)]` for the segmented-control text fill.
- **Files modified:** `src/lib/components/entry/ScaleDotPicker.svelte`, `src/lib/components/entry/SegmentedControl.svelte`, `src/lib/components/entry/TagChipPicker.svelte`
- **Verification:** `npm run check` 0 errors; no emoji / no raw-HTML / no console.log in components; copy.test.ts still GREEN.
- **Committed in:** `052d52b` (Task 2 commit)

**2. [Rule 3 — Blocking] Adapted DateChip to bits-ui Calendar `DateValue` API**
- **Found during:** Task 2 (initial svelte-check of DateChip with plan's snippet)
- **Issue:** Plan's snippet used `value={new Date(date)}`, `onValueChange` receiving `Date | undefined`, and `maxValue={new Date(todayStr)}`. The installed `src/lib/components/ui/calendar/calendar.svelte` wraps `bits-ui` `CalendarPrimitive.Root`, which types `value` as `DateValue | undefined` (= `CalendarDate | CalendarDateTime | ZonedDateTime` from `@internationalized/date`) and `maxValue` as `DateValue`. Native `Date` would fail `svelte-check` and runtime comparison.
- **Fix:** Imported `parseDate`, `today`, `getLocalTimeZone`, and `type DateValue` from `@internationalized/date`. `const calendarValue = $derived(parseDate(date))` builds the CalendarDate for `value`; `const maxValue = $derived(today(tz))` builds the max. `onValueChange(next: DateValue | undefined)` reads `next.year / next.month / next.day` to reconstruct the `YYYY-MM-DD` string. The belt-and-braces `if (nextStr > todayStr) return` guard (D-13) is preserved below the maxValue UI-level block.
- **Files modified:** `src/lib/components/entry/DateChip.svelte`
- **Verification:** `npm run check` 0 errors across 940 files. No runtime test for DateChip in this plan (Calendar DOM requires jsdom — out of scope); Plan 04 visual verification will exercise the click path.
- **Committed in:** `052d52b` (Task 2 commit)

**3. [Rule 2 — Missing critical] Comment wording adjusted to avoid triggering `{@html` grep**
- **Found during:** Task 2 verification (`grep -n '{@html' src/lib/components/entry/`)
- **Issue:** Original TagChipPicker header comment said "NEVER use `{@html}` (T-01-11, XSS)". The plan's acceptance criterion grep `grep -n '{@html' src/lib/components/entry/` flags the literal sequence regardless of comment context, producing a false positive.
- **Fix:** Rewrote the comment to "NEVER use raw-HTML interpolation (T-01-11, XSS)". Threat-model mitigation unchanged; documentation intent preserved.
- **Files modified:** `src/lib/components/entry/TagChipPicker.svelte`
- **Verification:** `grep -n '{@html' src/lib/components/entry/` returns zero hits.
- **Committed in:** `052d52b` (Task 2 commit — wording is part of the initial file content)

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking, 1 Rule 2 missing critical)
**Impact on plan:** Zero on scope or deliverables. All three deviations were either (a) plan snippet drift from Plan 01's actual token mapping (deviation #1), (b) plan snippet assuming a different Calendar API than the shadcn-svelte + bits-ui one shipped in Plan 01 (deviation #2), or (c) grep-pattern avoidance to satisfy the plan's own acceptance criterion (deviation #3). Runtime contract, a11y surface, and copy-discipline all unchanged.

## Issues Encountered

- **Plan snippet referenced wrong token role (`--color-accent` vs `--color-primary`):** See Deviation 1. Root cause: the UI-SPEC semantic role "accent" maps to shadcn's `--primary`, a naming mismatch pinned by Plan 01's banner comment. Documented so Plan 04 and subsequent UI plans reach for `--color-primary` automatically for CTA fills.
- **Plan snippet assumed native `Date` for shadcn-svelte Calendar:** See Deviation 2. Root cause: shadcn-svelte Calendar is built on bits-ui + `@internationalized/date`, not a plain HTML date input. Documented so the verifier recognises the API adaptation is intentional and the UI-level + onValueChange double-guard for D-13 is preserved.
- No blockers carry forward.

## User Setup Required

None — no external service configuration required for this plan. All new code is internal Svelte modules with no network calls, no env vars, no secrets, no dashboards.

## Known Stubs

None introduced by this plan. The two pre-existing Wave 0 stubs (`tests/sw.test.ts`, `tests/pwa.test.ts`) remain RED as planned — owned by Plan 05 (PWA + notifications).

## Threat Flags

No new security-relevant surface outside the plan's `<threat_model>`. TagChipPicker XSS (T-01-11) mitigated via Svelte auto-escape (grep-verified no `{@html` anywhere in `src/lib/components/entry/`). DateChip future-date leak (T-01-12) mitigated at two layers (Calendar `maxValue` + `onValueChange` string comparison). No console logging in components (T-01-13 verified). TagChipPicker `$effect` scopes are read-only (T-01-14 verified).

## Next Phase Readiness

- **Ready for Plan 04 (layout + entry form):** All four entry components are importable from `$lib/components/entry/*.svelte` with Svelte 5 `$bindable` props. Wiring pattern for `+page.svelte`:

  ```svelte
  <DateChip bind:date={draft.date} />
  <ScaleDotPicker bind:value={draft.mood} label="Mood" />
  <ScaleDotPicker bind:value={draft.energy} label="Energy" />
  <SegmentedControl
    bind:value={draft.workload}
    label="Workload"
    options={[
      { value: 'light', label: 'Light' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'heavy', label: 'Heavy' }
    ]}
  />
  <SegmentedControl
    bind:value={draft.socialSplit}
    label="Social"
    options={[
      { value: 1, label: 'Mostly alone' },
      { value: 2, label: 'Mixed' },
      { value: 3, label: 'Mostly with others' }
    ]}
  />
  <TagChipPicker bind:tagIds={draft.tagIds} />
  ```

  `draft` (module-scoped `$state`) is imported directly from `$lib/state/draft.svelte`; the form-submit handler calls `saveEntry({ local_date: draft.date, mood: draft.mood, ..., tagIds: draft.tagIds })`.

- **Ready for Plan 05 (PWA + notifications):** `useStoragePersistent()` + `setSetting('storage_persistent', ...)` already wired — Plan 05 just adds the `requestPersistence()` wrapper call at onboarding time and reads `useStoragePersistent().current` from InstallBanner.

- **No blockers** carry forward from Plan 03.

## Self-Check: PASSED

- `test -f src/lib/state/draft.svelte.ts` → OK
- `test -f src/lib/state/liveEntry.svelte.ts` → OK
- `test -f src/lib/state/settings.svelte.ts` → OK
- `test -f src/lib/components/entry/ScaleDotPicker.svelte` → OK
- `test -f src/lib/components/entry/SegmentedControl.svelte` → OK
- `test -f src/lib/components/entry/TagChipPicker.svelte` → OK
- `test -f src/lib/components/entry/DateChip.svelte` → OK
- `test -f tests/state.test.ts` → OK
- Commit `5e5af03` present in `git log --oneline` (Task 1)
- Commit `052d52b` present in `git log --oneline` (Task 2)
- `npm run check` → 940 files, 0 errors, 0 warnings
- `npm run test` → 17 passed, 2 todo, 0 failing
- `grep -rn '{@html' src/` → zero hits
- `grep -rn 'console.log' src/lib/` → zero hits (only scrubbed `console.error` in liveEntry — payload-free)
- No emoji in `src/lib/components/entry/*.svelte` (Python regex scan: 4/4 clean)

---
*Phase: 01-foundation*
*Completed: 2026-04-20*
