---
phase: 01-foundation
plan: 02
subsystem: database
tags: [dexie, indexeddb, schema, data-layer, timezone, typescript, runtime-guards]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: SvelteKit scaffold, Vitest + fake-indexeddb harness, Nyquist Wave 0 RED stubs (5 in db.test.ts + 1 each in tagpicker / entry / timezone)
provides:
  - Dexie schema v1 (`entries`, `tags`, `entry_tags`, `settings`) with unique indexes on `entries.local_date` and `tags.lower_key`, compound PK `[entry_id+tag_id]` on `entry_tags`
  - Canonical `db` singleton — exactly one `new Dexie('moodlog')` in the whole codebase
  - Authoritative TS types `Entry`, `Tag`, `EntryTag`, `SettingKey`, `Settings` exported from `src/lib/db/local.ts`
  - Write-side API `saveEntry` / `upsertTag` / `setSetting` with runtime guards (assertDraft), atomic transactions, and tag-join replacement on edit
  - Read-side API `getEntryForDate` / `listTagsPrefixed` / `getEntryTagIds` / `getSetting` / `getAllEntries`
  - `localDate(d?)` helper that builds `YYYY-MM-DD` from local getters (never `toISOString`) — PITFALLS #8 compliant
  - 7 Nyquist stubs GREEN (ENT-01, ENT-02, ENT-03, ENT-04, ENT-05, ENT-06, DAT-01 + PITFALLS #8 timezone)
affects: [phase-01-plan-03-state-widgets, phase-01-plan-04-layout-form, phase-01-plan-05-pwa-notifications, phase-02-export]

# Tech tracking
tech-stack:
  added: []  # No new npm deps — Dexie 4.4.2 was pinned in Plan 01
  patterns:
    - "Dexie 4 compound-PK typing: `Table<EntryTag, [string, string]>` rather than `EntityTable<EntryTag, never>` (the `never` PK type breaks bulkDelete + transaction argument typing; the tuple matches the runtime `[entry_id+tag_id]` index form)"
    - "Runtime guards before Dexie writes: `assertDraft` uses `Set<unknown>` whitelists so the TS `unknown` key type accepts the runtime values without casts"
    - "Single-transaction edit+tag-replace pattern: `db.transaction('rw', db.entries, db.entry_tags, async () => {...})` reads existing entry, preserves id+created_at, bumps updated_at, bulk-deletes old entry_tag rows and bulk-puts new ones — no partial writes across failures"
    - "Upsert by unique-index pattern: `where('local_date').equals(x).first()` or `where('lower_key').equals(x).first()` — Dexie has no native upsert, so the pattern is explicit read-then-decide inside the transaction"
    - "Case-insensitive tag deduplication: store `display_name` (original casing) + `lower_key` (`display_name.trim().toLowerCase()`) with a unique index on `lower_key` (D-09)"

key-files:
  created:
    - "src/lib/db/local.ts — Dexie singleton, types (Entry/Tag/EntryTag/SettingKey/Settings), schema v1 stores"
    - "src/lib/db/mutations.ts — localDate, assertDraft, saveEntry, upsertTag, setSetting"
    - "src/lib/db/queries.ts — getEntryForDate, listTagsPrefixed, getEntryTagIds, getSetting, getAllEntries"
  modified:
    - "tests/timezone.test.ts — 3 passing assertions (from 1 todo)"
    - "tests/db.test.ts — 6 passing assertions (from 5 todos)"
    - "tests/tagpicker.test.ts — 2 passing assertions (from 1 todo)"
    - "tests/entry.test.ts — 2 passing assertions (from 1 todo)"

key-decisions:
  - "Dexie entry_tags typed as `Table<EntryTag, [string, string]>` (tuple PK) not `EntityTable<EntryTag, never>` — the scaffold-pattern used `never`, which broke svelte-check on `bulkDelete` + `db.transaction` argument positions"
  - "assertDraft uses `Set<unknown>` whitelists rather than discriminated-union Sets — keeps runtime cost O(1) lookup and allows the TS unknown-typed field access without `as any`"
  - "Timezone helper is in mutations.ts (not a separate util) — the only caller that needs it right now is the entry form's draft.date initialiser, and colocating it near saveEntry keeps the rule `never toISOString near local_date` visually obvious"

patterns-established:
  - "Analog authority for Phase 1: src/lib/db/local.ts — schema declaration style, compound-PK tuple typing, module-level Dexie singleton with ambient type intersection"
  - "Analog authority for Phase 1 mutations: src/lib/db/mutations.ts — runtime guards (assertDraft pattern), transaction hygiene (only Dexie awaits inside db.transaction), upsert-by-unique-index"
  - "Analog authority for Phase 1 queries: src/lib/db/queries.ts — Dexie where/equals/first/toArray idiom, idempotent side-effect-free functions that liveQuery can wrap"

requirements-completed: [ENT-01, ENT-02, ENT-03, ENT-04, ENT-05, ENT-06, DAT-01]

# Metrics
duration: 5min
completed: 2026-04-20
---

# Phase 01 Plan 02: Local Data Layer Summary

**Dexie v1 schema (`entries` / `tags` / `entry_tags` / `settings`) + runtime-guarded `saveEntry` / `upsertTag` / `setSetting` + timezone-safe `localDate` helper — 7 Nyquist Wave 0 stubs flipped from RED to GREEN (ENT-01..06, DAT-01, PITFALLS #8).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-20T11:04:55Z
- **Completed:** 2026-04-20T11:09:46Z
- **Tasks:** 2 / 2
- **Files created:** 3 (`src/lib/db/{local,mutations,queries}.ts`)
- **Files modified:** 4 (four test files; stubs → active assertions)

## Accomplishments

- Dexie schema v1 shipped: four stores, three unique/compound indexes, single `db` singleton imported everywhere
- Write path complete: `saveEntry` with runtime guards, atomic edit-preserves-PK semantics, tag-join replacement (not accumulation); `upsertTag` with case-insensitive dedupe + whitespace trim; `setSetting` with last-write-wins by `key`
- Read path complete: `getEntryForDate`, `listTagsPrefixed` (case-insensitive prefix), `getEntryTagIds`, `getSetting`, `getAllEntries`
- `localDate()` helper uses `getFullYear()/getMonth()/getDate()` exclusively — never `toISOString` — closing PITFALLS #8 at the data-layer boundary
- Test count: 14 passing / 2 todo (sw.test.ts + pwa.test.ts — owned by Plan 05). Up from 1 passing / 10 todo at Plan 01 close. Every Wave 0 stub that could be tested at the data layer is now GREEN.
- `npm run check` exits 0 across 932 files

## Task Commits

Each task was committed atomically:

1. **Task 1: Dexie schema + localDate helper** — `62ebcf0` (feat)
2. **Task 2: saveEntry/upsertTag/setSetting + queries; ENT-01..06 + DAT-01 GREEN** — `1bd7dab` (feat)

**Plan metadata:** (pending — final commit at end of execute-plan flow)

## Files Created / Modified

### Created

- `src/lib/db/local.ts` — Dexie singleton `new Dexie('moodlog')`, `db.version(1).stores({ entries: 'id, &local_date, updated_at', tags: 'id, &lower_key, display_name', entry_tags: '[entry_id+tag_id], entry_id, tag_id', settings: 'key' })`; exports types `Entry`, `Tag`, `EntryTag`, `SettingKey`, `Settings`. Comment at bottom documents future `db.version(2)` path (Pitfall 4).
- `src/lib/db/mutations.ts` — `localDate(d?: Date): string` (local-TZ `YYYY-MM-DD`); `assertDraft` runtime guard with `Set<unknown>` whitelists; `saveEntry(input): Promise<Entry>` (atomic tx, preserves `id`+`created_at` on edit, replaces `entry_tags` rows); `upsertTag(rawName): Promise<Tag>` (trim + lowercase dedupe); `setSetting(key, value): Promise<void>`. No `console.*` calls; no `fetch`/`setTimeout` inside transactions.
- `src/lib/db/queries.ts` — `getEntryForDate(local_date)`, `listTagsPrefixed(prefix, limit=50)` (empty prefix → order by display_name), `getEntryTagIds(entry_id)`, `getSetting(key)`, `getAllEntries()` (ordered by local_date).

### Modified

- `tests/timezone.test.ts` — 3 assertions: `23:50 local` / `00:10 local` / `localDate fn body does not contain toISOString`. GREEN.
- `tests/db.test.ts` — 6 assertions across 5 `it()` blocks: mood persist (ENT-01) · energy persist (ENT-02) · workload enum + chaotic-rejection (ENT-03) · social split + 0-rejection (ENT-04) · schema v1 round-trip (DAT-01) · empty-field null persistence (D-08). GREEN.
- `tests/tagpicker.test.ts` — 2 assertions: case-insensitive upsert with whitespace trim + empty-string rejection (ENT-05) · listTagsPrefixed lowercases query input. GREEN.
- `tests/entry.test.ts` — 2 assertions: edit preserves PK + frozen `created_at` + bumped `updated_at` + one-row-per-date invariant (ENT-06) · tag joins replaced (not accumulated) on re-save. GREEN.

## Function Signatures (authoritative contracts)

```ts
// src/lib/db/local.ts
export const db: Dexie & {
  entries: EntityTable<Entry, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  entry_tags: Table<EntryTag, [string, string]>;
  settings: EntityTable<Settings, 'key'>;
};

// src/lib/db/mutations.ts
export function localDate(d?: Date): string;
export async function saveEntry(input: {
  local_date: string;
  mood: 1|2|3|4|5 | null;
  energy: 1|2|3|4|5 | null;
  workload: 'light'|'moderate'|'heavy' | null;
  social_split: 1|2|3 | null;
  tagIds: string[];
}): Promise<Entry>;
export async function upsertTag(rawName: string): Promise<Tag>;
export async function setSetting(key: SettingKey, value: string): Promise<void>;

// src/lib/db/queries.ts
export async function getEntryForDate(local_date: string): Promise<Entry | undefined>;
export async function listTagsPrefixed(lowerPrefix: string, limit?: number): Promise<Tag[]>;
export async function getEntryTagIds(entry_id: string): Promise<string[]>;
export async function getSetting(key: SettingKey): Promise<Settings | undefined>;
export async function getAllEntries(): Promise<Entry[]>;
```

No deviations from the `<interfaces>` block other than the compound-PK store typing (see Deviation 1).

## Nyquist Test Stub State (before → after)

| Test file | Spec | Before | After | Requirement |
|-----------|------|--------|-------|-------------|
| `tests/db.test.ts` | `mood value persists` | RED (todo) | GREEN | ENT-01 |
| `tests/db.test.ts` | `energy value persists` | RED (todo) | GREEN | ENT-02 |
| `tests/db.test.ts` | `workload enum` | RED (todo) | GREEN (+ chaotic-rejection) | ENT-03 |
| `tests/db.test.ts` | `social split ordinal` | RED (todo) | GREEN (+ 0-rejection) | ENT-04 |
| `tests/db.test.ts` | `schema v1 round-trip` | RED (todo) | GREEN | DAT-01 |
| `tests/db.test.ts` | `empty-field save persists as null` | — (new) | GREEN | D-08 |
| `tests/tagpicker.test.ts` | `case-insensitive` | RED (todo) | GREEN | ENT-05 |
| `tests/tagpicker.test.ts` | `listTagsPrefixed is case-insensitive` | — (new) | GREEN | ENT-05 query |
| `tests/entry.test.ts` | `edit preserves PK` | RED (todo) | GREEN | ENT-06 |
| `tests/entry.test.ts` | `tag joins are replaced on edit` | — (new) | GREEN | D-11 |
| `tests/timezone.test.ts` | `23:50 local lands on local day` | RED (todo) | GREEN | PITFALLS #8 |
| `tests/timezone.test.ts` | `00:10 local lands on local day` | — (new) | GREEN | PITFALLS #8 sibling |
| `tests/timezone.test.ts` | `does not use toISOString` | — (new) | GREEN | PITFALLS #8 impl check |

**Remaining todos (owned by Plan 05):**

| Test file | Spec | State | Plan |
|-----------|------|-------|------|
| `tests/sw.test.ts` | `notificationclick deep link` | RED (todo) | Plan 05 |
| `tests/pwa.test.ts` | `storage.persist called` | RED (todo) | Plan 05 |

`npm run test` final output: `Test Files 5 passed | 2 skipped (7) / Tests 14 passed | 2 todo (16)`.

## Decisions Made

1. **Compound-PK tuple typing** — `entry_tags: Table<EntryTag, [string, string]>` rather than `EntityTable<EntryTag, never>` from the plan's interfaces block. The `never` primary-key type caused svelte-check to reject `bulkDelete([["id", "id"], ...])` and `db.transaction('rw', db.entry_tags, ...)` — `never` propagated through Dexie's `TableHooks` type into `hook: never[]`, which is not assignable to `any[]`. The tuple `[string, string]` matches Dexie's runtime compound-PK format and satisfies all surrounding API signatures. Runtime behaviour is identical.
2. **`localDate` colocated with mutations** — Not a separate `src/lib/util/date.ts`. Reasoning: the only planned caller in Phase 1 is `draft.svelte.ts`'s `today()` helper (Plan 03), and its proximity to `saveEntry` (which takes a pre-computed `local_date`) keeps the "never UTC near local_date" rule visually obvious at the call site.
3. **Runtime guards as `Set<unknown>`** — The plan specified `Set<...const>` with tight literals. Using `unknown` lets the guard accept the untyped input field without `as any` casts at the call site, keeps the O(1) lookup, and still catches every out-of-range value. Verified by `rejects.toThrow()` in db.test.ts for `'chaotic'` and `0`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Changed `entry_tags` store type from `EntityTable<EntryTag, never>` to `Table<EntryTag, [string, string]>`**
- **Found during:** Task 2 (post-test-green, during `npm run check`)
- **Issue:** The plan's interfaces block specified `entry_tags: EntityTable<EntryTag, never>`. With Dexie 4.4.2 typings, `never` as the TKey type parameter propagates into `TableHooks<T, never, ...>`, which is not assignable to the `TableHooks<any, any, any>` expected by `db.transaction(...)` and `bulkDelete(...)`. svelte-check failed with 2 errors:
  - `src/lib/db/mutations.ts:50:42` — `Argument of type 'EntityTable<EntryTag, never>' is not assignable to parameter of type 'string | Table<any, any, any>'`
  - `src/lib/db/mutations.ts:68:35` — `Argument of type '[string, string][]' is not assignable to parameter of type 'never[]'`
  Tests passed at runtime because `fake-indexeddb` does not care about TS types, but `npm run check` refused to compile.
- **Fix:** Imported `Table` alongside `EntityTable` from `dexie`; changed the ambient intersection to `entry_tags: Table<EntryTag, [string, string]>`. The tuple `[string, string]` matches the runtime primary-key shape (Dexie builds a `[entry_id, tag_id]` keypath for compound indexes). All downstream APIs — `where('entry_id').equals(...)`, `bulkDelete([[entryId, tagId], ...])`, `bulkPut({ entry_id, tag_id })` — type-check cleanly.
- **Files modified:** `src/lib/db/local.ts`
- **Verification:** `npm run check` exits 0 across 932 files; all 14 tests still GREEN.
- **Committed in:** `1bd7dab` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking — TypeScript type-check breakage)
**Impact on plan:** Zero on scope or deliverables. The interfaces block remains the authoritative runtime contract; only the TS type annotation shifted (`never` → `[string, string]`) to satisfy svelte-check. Runtime behaviour unchanged. All downstream plans (03/04/05) and Phase 2+ can still `import type { EntryTag } from '$lib/db/local'` without change.

## Issues Encountered

- **Dexie compound-PK TS typing friction (see Deviation 1):** runtime and types diverge when `never` is used for the PK type. Documented for future phases that add compound-PK stores.

## User Setup Required

None — no external service configuration required for this plan. The data layer is local-only (IndexedDB via Dexie) with no secrets, no env vars, no dashboards.

## Known Stubs

None introduced in this plan. Two pre-existing Wave 0 stubs remain RED, owned by Plan 05:

| Stub | File | Line | Turns GREEN in |
|------|------|------|----------------|
| ENT-07 `notificationclick deep link` | tests/sw.test.ts | 4 | Plan 05 |
| ENT-08 `storage.persist called` | tests/pwa.test.ts | 4 | Plan 05 |

## Next Phase Readiness

- **Ready for Plan 03 (reactive state + input widgets):** `$lib/db/local` exports the authoritative `Entry`/`Tag` types; `draft.svelte.ts` can use the same shape; `liveEntry.svelte.ts` can wrap `db.entries.where('local_date').equals(date).first()` in `liveQuery(...)` without importing anything else.
- **Ready for Plan 04 (layout + entry form):** `saveEntry`, `upsertTag`, `getEntryForDate` match the call shapes PATTERNS.md prescribes for `+page.svelte` form-action code. `localDate()` provides the today-string for the `DateChip` default. Runtime guards mean the form can rely on TypeScript at compile time and the data layer as the final correctness backstop.
- **Ready for Plan 05 (PWA + notifications):** `setSetting('reminder_time', ...)` and `getSetting('storage_persistent')` already exist and are typed. No additional data-layer work needed; Plan 05 just wires browser APIs into these functions.
- **Ready for Phase 2+ (export, sync):** `getAllEntries()` returns entries in `local_date` order for CSV/Markdown export. Any future sync layer can read via these queries without touching the schema.

No blockers carry forward.

## Self-Check: PASSED

- `test -f src/lib/db/local.ts` → OK
- `test -f src/lib/db/mutations.ts` → OK
- `test -f src/lib/db/queries.ts` → OK
- All 13 acceptance-criteria greps (Task 1 + Task 2) pass
- `grep -rn "new Dexie(" src/` → exactly 1 match (in `src/lib/db/local.ts`)
- `grep -n "toISOString" src/lib/db/mutations.ts` → appears only outside `localDate` (in `created_at`/`updated_at`/`setSetting`), never within `localDate` body
- Commit hashes `62ebcf0` and `1bd7dab` present in `git log --oneline --all`
- `npm run check` → 932 files, 0 errors, 0 warnings
- `npm run test` → 14 passed, 2 todo, 0 failing

---
*Phase: 01-foundation*
*Completed: 2026-04-20*
