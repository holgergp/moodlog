# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 27 (all new — greenfield scaffold)
**Analogs found:** 0 / 27 (greenfield — no in-repo analogs exist)

> **Greenfield notice:** No source code exists in this repo yet. The only files
> present at the project root are `CLAUDE.md`, `.planning/`, `.claude/`, and
> `.idea/`. There is no `src/`, no `package.json`, no prior `.svelte` or `.ts`
> to copy from.
>
> **Seed-pattern strategy:** All "patterns" in this document are transcribed
> verbatim from Phase 1 RESEARCH.md (code examples 1–6, architecture patterns
> 1–5) and UI-SPEC.md (copy contract, token table, component inventory). The
> planner must treat the first file created in each category as the
> **authoritative analog** — every subsequent file in the same category copies
> its import style, error handling, and structure from that file.
>
> Once the scaffold is written, PATTERNS.md for Phase 2+ can reference concrete
> line numbers in the Phase 1 output.

---

## File Classification

### Configuration & Scaffold (7 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `package.json` | config | n/a | — | greenfield — see RESEARCH §Installation |
| `vite.config.ts` | config | n/a | — | greenfield — see RESEARCH §Code Example 4 |
| `svelte.config.js` | config | n/a | — | greenfield — SvelteKit scaffold default |
| `tsconfig.json` | config | n/a | — | greenfield — SvelteKit scaffold default |
| `src/app.html` | config | n/a | — | greenfield — SvelteKit scaffold default + CSP meta per RESEARCH §Security Domain V14 |
| `src/app.css` | config | n/a | — | greenfield — Tailwind v4 `@theme` tokens per UI-SPEC §Color, §Typography, §Spacing |
| `vitest.config.ts` | config | n/a | — | greenfield — see RESEARCH §Validation Architecture |

### Data Layer (3 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/db/local.ts` | model (schema) | CRUD | — | greenfield — see RESEARCH §Code Example 1 |
| `src/lib/db/queries.ts` | service (read) | CRUD | — | greenfield — see RESEARCH §Pattern 3 + Architectural Responsibility Map "read" row |
| `src/lib/db/mutations.ts` | service (write) | CRUD | — | greenfield — see RESEARCH §Code Example 2 |

### Reactive State (3 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/state/draft.svelte.ts` | store (runes) | event-driven | — | greenfield — see RESEARCH §Pattern 2 |
| `src/lib/state/liveEntry.svelte.ts` | store (runes + liveQuery) | pub-sub | — | greenfield — see RESEARCH §Pattern 3 / Code Example 3 |
| `src/lib/state/settings.svelte.ts` | store (runes) | pub-sub | `src/lib/state/liveEntry.svelte.ts` (once written) | seed-pattern — same liveQuery wrapping |

### Routes (4 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/routes/+layout.svelte` | component (shell) | request-response | — | greenfield — SvelteKit shell + InstallBanner |
| `src/routes/+layout.ts` | config (route) | n/a | — | greenfield — `export const ssr = true` |
| `src/routes/+page.svelte` | component (entry form) | request-response | — | greenfield — see RESEARCH §Pattern 1 + UI-SPEC §Component Inventory |
| `src/routes/+page.ts` | config (route) | n/a | — | greenfield — `export const ssr = false` (Dexie is client-only) |
| `src/routes/onboarding/+page.svelte` | component (flow) | request-response | `src/routes/+page.svelte` (once written) | seed-pattern — same form-action idiom |

### Custom Components (6 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/components/entry/ScaleDotPicker.svelte` | component | event-driven | — | greenfield — UI-SPEC §Component Inventory, §Interaction Contract #8 |
| `src/lib/components/entry/SegmentedControl.svelte` | component | event-driven | `ScaleDotPicker.svelte` (once written) | seed-pattern — same radiogroup pattern |
| `src/lib/components/entry/TagChipPicker.svelte` | component | event-driven + CRUD | — | greenfield — UI-SPEC §Interaction Contract #7 + RESEARCH §Code Example 2 |
| `src/lib/components/entry/DateChip.svelte` | component | event-driven | — | greenfield — UI-SPEC §Interaction Contract #5 |
| `src/lib/components/InstallBanner.svelte` | component | event-driven | — | greenfield — UI-SPEC §Copywriting + CONTEXT D-18 |
| `src/lib/components/onboarding/OnboardingSheet.svelte` | component | event-driven | — | greenfield — UI-SPEC §Copywriting "Onboarding step" rows |

### PWA / Platform (3 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/pwa/persist.ts` | utility | request-response | — | greenfield — see RESEARCH §Code Example 5 |
| `src/lib/notifications/permission.ts` | utility | request-response | `src/lib/pwa/persist.ts` (once written) | seed-pattern — same browser-API-wrapper style |
| `src/lib/notifications/scheduler.ts` | service | event-driven | — | greenfield — RESEARCH §Pitfall 2 "honest Phase 1 scope" |
| `src/service-worker.ts` | service (SW) | event-driven | — | greenfield — see RESEARCH §Pattern 4 |

### Tests (7 files)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `tests/setup.ts` | test | n/a | — | greenfield — `import 'fake-indexeddb/auto';` (RESEARCH §Pitfall 9) |
| `tests/db.test.ts` | test | CRUD | — | greenfield — covers ENT-01..04, DAT-01 |
| `tests/tagpicker.test.ts` | test | CRUD | `tests/db.test.ts` (once written) | seed-pattern — same Dexie test harness |
| `tests/entry.test.ts` | test | CRUD | `tests/db.test.ts` (once written) | seed-pattern |
| `tests/sw.test.ts` | test | event-driven | — | greenfield — pure handler function |
| `tests/pwa.test.ts` | test | request-response | — | greenfield — navigator.storage wrapper |
| `tests/timezone.test.ts` | test | n/a (pure) | — | greenfield — PITFALLS #8 |
| `tests/copy.test.ts` | test | n/a (static) | — | greenfield — UI-SPEC banned-phrase grep |

---

## Pattern Assignments

### `src/lib/db/local.ts` (model, CRUD — Dexie schema)

**Analog:** None (greenfield seed — this file becomes the analog for all future `db/*.ts`).
**Source pattern:** RESEARCH.md §Code Example 1 (lines 742–791).

**Imports pattern:**
```typescript
import Dexie, { type EntityTable } from 'dexie';
```

**Core schema pattern:**
```typescript
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
  value: string;
  updated_at: string;
};

export const db = new Dexie('moodlog') as Dexie & {
  entries: EntityTable<Entry, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  entry_tags: EntityTable<EntryTag, never>;
  settings: EntityTable<Settings, 'key'>;
};

db.version(1).stores({
  entries: 'id, &local_date, updated_at',
  tags: 'id, &lower_key, display_name',
  entry_tags: '[entry_id+tag_id], entry_id, tag_id',
  settings: 'key'
});
```

**Error handling pattern:**
- Do NOT catch `Dexie.VersionError` — let it bubble (Pitfall 4 requires new `.version(N)` on any change).
- Never log the returned row values (PITFALLS #12 — no entry payload in console).

**Hard rules (from PITFALLS / CONTEXT):**
- Phase 1 is `version(1)` only. Never mutate it once shipped.
- `&local_date` unique index enforces one-entry-per-day (ENT-06 edit uses same PK).
- Instantiate `db` exactly once in this module; import everywhere else.

---

### `src/lib/db/mutations.ts` (service, CRUD — write path)

**Analog:** None. **Source pattern:** RESEARCH.md §Code Example 2 (lines 795–819) for tag upsert; §Pitfall 5 (lines 557–563) for transaction hygiene.

**Imports pattern:**
```typescript
import { db } from './local';
import type { Tag, Entry } from './local';
```

**Core mutation pattern (tag upsert, ENT-05, D-09):**
```typescript
export async function upsertTag(rawName: string): Promise<Tag> {
  const display_name = rawName.trim();
  const lower_key = display_name.toLowerCase();
  if (!display_name) throw new Error('empty tag');

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

**Transaction hygiene rule (Pitfall 5):**
Inside `db.transaction('rw', ...)`, only await Dexie-returned promises. No `fetch`, no `crypto.subtle`, no `setTimeout` — these kill the transaction scope.

**`saveEntry` pattern (to be written, ENT-01..06):**
- Accept a typed `DraftEntry` object (mood/energy/workload/social_split/tagIds).
- Single transaction over `db.entries` + `db.entry_tags`.
- Upsert by `local_date` (unique index) — same PK on edit per ENT-06.
- `created_at` set only when inserting; `updated_at` always set to now.
- Runtime guard: `mood in {1..5,null}`, `energy in {1..5,null}`, `workload in enum|null`, `social_split in {1,2,3,null}` (RESEARCH §Security V5).

---

### `src/lib/db/queries.ts` (service, CRUD — read path)

**Analog:** None. **Source pattern:** RESEARCH.md §Architecture Diagram + §Pattern 3.

**Core query pattern:**
```typescript
import { db } from './local';

export async function getEntryForDate(local_date: string) {
  return db.entries.where('local_date').equals(local_date).first();
}

export async function listTagsPrefixed(lowerPrefix: string, limit = 50) {
  return db.tags
    .where('lower_key').startsWith(lowerPrefix)
    .limit(limit).toArray();
}

export async function getSetting<T extends string>(key: T) {
  return db.settings.get(key);
}
```

**Reactive-read rule:** These functions are invoked inside `liveQuery(() => ...)` (see `liveEntry.svelte.ts`). They must be idempotent and side-effect-free.

---

### `src/lib/state/liveEntry.svelte.ts` (store, pub-sub — reactive DB reads)

**Analog:** None. **Source pattern:** RESEARCH.md §Pattern 3 / §Code Example 3 (lines 397–417, 822–841).

**Full file pattern:**
```typescript
// `[CITED: context7 /dexie/dexie.js — liveQuery]`
import { liveQuery, type Observable } from 'dexie';
import { onDestroy } from 'svelte';

export function useLiveQuery<T>(query: () => Promise<T>, initial: T) {
  let current = $state<T>(initial);
  const obs: Observable<T> = liveQuery(query);
  const sub = obs.subscribe({
    next: (v) => (current = v),
    error: (e) => console.error('liveQuery error', e?.name ?? 'unknown')
    // never log entry payload (PITFALLS #12)
  });
  onDestroy(() => sub.unsubscribe());
  return { get current() { return current; } };
}
```

**Usage pattern (for any component that reads Dexie reactively):**
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

**Hard rule (RESEARCH §Anti-Patterns):** Never call `db.entries.put(...)` inside a `$effect(...)`. Persistence is always an explicit user-action-triggered call; reading is reactive, writing is not.

---

### `src/lib/state/draft.svelte.ts` (store, event-driven — form draft)

**Analog:** None. **Source pattern:** RESEARCH.md §Pattern 2 (lines 347–389).

**Full file pattern:**
```typescript
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

**Timezone hard rule (PITFALLS #8):** `today()` must build the YYYY-MM-DD string from `getFullYear`/`getMonth`/`getDate` — **never** `toISOString().slice(0,10)` (that's UTC, wrong on any non-UTC timezone near midnight).

---

### `src/routes/+page.svelte` (component, request-response — entry form)

**Analog:** None. **Source patterns:**
- Form action: RESEARCH.md §Pattern 1 (lines 306–345)
- Copy: UI-SPEC.md §Copywriting Contract
- Interaction: UI-SPEC.md §Interaction Contract (1–12)
- Spacing/typography: UI-SPEC.md §Spacing Scale, §Typography

**Imports pattern:**
```typescript
import { enhance } from '$app/forms';
import { saveEntry } from '$lib/db/mutations';
import { draft } from '$lib/state/draft.svelte';
import { useLiveQuery } from '$lib/state/liveEntry.svelte';
import { db } from '$lib/db/local';
import { toast } from 'svelte-sonner';
import ScaleDotPicker from '$lib/components/entry/ScaleDotPicker.svelte';
import SegmentedControl from '$lib/components/entry/SegmentedControl.svelte';
import TagChipPicker from '$lib/components/entry/TagChipPicker.svelte';
import DateChip from '$lib/components/entry/DateChip.svelte';
```

**Core form pattern (use:enhance, client-only):**
```svelte
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
      toast(existing ? 'Updated.' : 'Logged.');   // per D-03, UI-SPEC Copy
      await update({ reset: false });
    };
  }}
>
  <!-- fields: DateChip, ScaleDotPicker(mood), ScaleDotPicker(energy),
       SegmentedControl(workload), SegmentedControl(social), TagChipPicker,
       Button(Save|Update) -->
</form>
```

**Hard rules:**
- **No `+page.server.ts` in Phase 1** (Pitfall 7 — adapter mismatch hedge; RESEARCH Architectural Responsibility Map "tier misassignment" note).
- **Save always enabled** (D-08). No required-field gate.
- **No confirmation modal** (D-03). Toast auto-dismisses ~1.5s.
- **`export const ssr = false`** in `+page.ts` — Dexie imports `indexedDB` which does not exist server-side (A7 / Open Question 3).
- **CTA label toggles** on `q.current` presence: "Save" → "Update" per D-11 / UI-SPEC Copy.
- **4-tap budget** (PITFALLS #1): open → mood → energy → Save.

**Copy rules (UI-SPEC banned phrases):**
No "streak", no "good day"/"bad day", no "average", no "How do you feel?", no "Missed!", no exclamation marks in system feedback.

---

### `src/service-worker.ts` (service, event-driven — SW)

**Analog:** None. **Source pattern:** RESEARCH.md §Pattern 4 (lines 437–464).

**notificationclick pattern (ENT-07 deep-link):**
```typescript
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

**Push stub (RESEARCH §Security — explicit no-op):**
```typescript
self.addEventListener('push', () => {
  // Phase 1 has no push server. No-op on purpose to make attack surface explicit.
});
```

**Hard rule:** Do NOT ship VAPID code in Phase 1 (Pitfall 2). In-app `setTimeout` + `registration.showNotification(...)` is the only reminder path while the app is open.

---

### `src/lib/pwa/persist.ts` (utility, request-response — browser-API wrapper)

**Analog:** None. **Source pattern:** RESEARCH.md §Code Example 5 (lines 880–905).

**Full file pattern:**
```typescript
// `[CITED: developer.mozilla.org Web/API/StorageManager/persist]`
export async function requestPersistence(): Promise<boolean> {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) return false;
  const alreadyPersistent = await navigator.storage.persisted();
  if (alreadyPersistent) return true;
  return await navigator.storage.persist();
}

export function isInstalledPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
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

**Hard rules (Pitfall 1, CONTEXT D-16):**
- Call `requestPersistence()` on **every** first-open, and on **every** subsequent open (idempotent).
- Persist silently regardless of onboarding continuation.
- Log return value to `settings.storage_persistent` so the iOS banner can render when `false`.

---

### `vite.config.ts` (config — PWA wiring)

**Analog:** None. **Source pattern:** RESEARCH.md §Code Example 4 (lines 845–876).

```typescript
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
      registerType: 'autoUpdate',          // Pitfall 8 — avoid stale shell
      manifest: {
        name: 'MoodLog',
        short_name: 'MoodLog',
        theme_color: '#FAFAF9',            // matches UI-SPEC stone-50
        background_color: '#FAFAF9',
        display: 'standalone',             // required for iOS push
        start_url: '/',
        icons: [ /* populated by pwa-assets-generator */ ]
      }
    })
  ]
});
```

---

### `src/lib/components/entry/ScaleDotPicker.svelte` (component — 1–5 scale)

**Analog:** None. This file becomes the analog for `SegmentedControl.svelte`.
**Source:** UI-SPEC.md §Component Inventory + §Interaction Contract #8 + §Accessibility Contract.

**Contract:**
- 5 buttons, each ≥ 44×44px (UI-SPEC Touch targets).
- Selected: filled dot in accent (`#0F172A` light / `#F1F5F9` dark).
- Unselected: outline only. **No red for low mood** (UI-SPEC negative-affect neutrality / PITFALLS #11).
- `aria-label="Mood {n} of 5"` per button; wrapper is `role="radiogroup"`.
- Focus visible: `focus-visible:ring-2 focus-visible:ring-slate-900/40`.
- Shape also changes on select (outline → filled) — colour-blind safe (UI-SPEC §Accessibility "No colour-only signal").

**Prop shape:**
```typescript
let { value = $bindable<1|2|3|4|5|null>(null), label }: { value: 1|2|3|4|5|null; label: string } = $props();
```

---

### `src/lib/components/entry/TagChipPicker.svelte` (component — tag autocomplete)

**Analog:** None. **Source:** UI-SPEC.md §Interaction Contract #7 + §Copywriting rows "People…" + RESEARCH §Code Example 2.

**Contract:**
- Input `<Input class="text-base">` (Pitfall 3 — 16px min to suppress iOS auto-zoom).
- Filter existing tags by `lower_key` via `db.tags.where('lower_key').startsWith(typed.toLowerCase()).toArray()`.
- "+ Create "{typed text}"" row appears at list bottom only when no case-insensitive exact match.
- On create: call `upsertTag(rawName)` from `$lib/db/mutations`; chip immediately toggles on.
- Chip row is above input, not below (UI-SPEC §Component Inventory).
- Empty chip row + no tags in whole DB → show "No one yet" hint (UI-SPEC Copy).
- Placeholder: "Add a person…" (UI-SPEC Copy).

---

### `tests/db.test.ts` (test — Dexie schema + CRUD)

**Analog:** None. This file becomes the analog for all subsequent Dexie tests.
**Source:** RESEARCH.md §Validation Architecture + §Pitfall 9.

**Setup pattern (tests/setup.ts):**
```typescript
import 'fake-indexeddb/auto';
```

**Test pattern:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/local';
import { saveEntry } from '$lib/db/mutations';

beforeEach(async () => {
  await db.entries.clear();
  await db.tags.clear();
  await db.entry_tags.clear();
});

describe('ENT-01 mood value persists', () => {
  it('stores mood 1-5 ordinal', async () => {
    await saveEntry({ local_date: '2026-04-20', mood: 3, energy: null, workload: null, social_split: null, tagIds: [] });
    const row = await db.entries.where('local_date').equals('2026-04-20').first();
    expect(row?.mood).toBe(3);
  });
});
```

**Hard rules (CLAUDE.md global):**
- Concise tests — no elaborate mocking.
- When a test fails, fix the production code, not the test (unless the test itself is wrong).
- Every file edit ends with `npm run check` + `npm run test` before merge.

---

### Remaining file stubs (structure only, same rules)

The following files each follow one of the analog patterns above. The planner should reference the analog directly rather than expanding this document:

| File | Analog Pattern (section above) |
|------|-------------------------------|
| `src/lib/state/settings.svelte.ts` | `liveEntry.svelte.ts` pattern + `getSetting` query |
| `src/routes/+layout.svelte` | Imports `InstallBanner`, registers SW, mounts Sonner `<Toaster />` |
| `src/routes/+layout.ts` | `export const ssr = true;` |
| `src/routes/+page.ts` | `export const ssr = false;` |
| `src/routes/onboarding/+page.svelte` | `+page.svelte` form idiom + UI-SPEC Onboarding copy rows + `requestPersistence()` call |
| `src/lib/components/entry/SegmentedControl.svelte` | `ScaleDotPicker.svelte` pattern; 3 buttons; `role="radiogroup"`; verbatim labels "Mostly alone"/"Mixed"/"Mostly with others" (D-06) and "Light"/"Moderate"/"Heavy" (D-05) |
| `src/lib/components/entry/DateChip.svelte` | Tappable label → `Popover` + shadcn `Calendar`; `disabled={isFuture}` per D-13; default label "Today", past = "Tue, 16 Apr" |
| `src/lib/components/InstallBanner.svelte` | Visible when `isIOSSafari() && !isInstalledPWA()`; copy: "Install to Home Screen to enable reminders." (verbatim); session-dismissible (D-18) |
| `src/lib/components/onboarding/OnboardingSheet.svelte` | Two-step flow per D-15; step 1 calls `requestPersistence()` silently; step 2 writes `settings.reminder_time` default "21:00" |
| `src/lib/notifications/permission.ts` | `persist.ts` wrapper pattern; wraps `Notification.requestPermission()` |
| `src/lib/notifications/scheduler.ts` | In-app `setInterval(..., 60_000)` + clock check; fires `registration.showNotification('Log today — how was it?')` (verbatim per D-20) |
| `tests/tagpicker.test.ts` | `db.test.ts` pattern; asserts `upsertTag('Alice')` then `upsertTag('alice')` returns same row |
| `tests/entry.test.ts` | `db.test.ts` pattern; asserts edit round-trip preserves `id` by `local_date` |
| `tests/sw.test.ts` | Unit test the exported handler function; mock `clients.matchAll` |
| `tests/pwa.test.ts` | Mock `navigator.storage` and assert `requestPersistence` return values |
| `tests/timezone.test.ts` | Asserts 23:50 local on 20 Apr produces `local_date = '2026-04-20'` (not UTC next-day) |
| `tests/copy.test.ts` | Grep compiled `.svelte` / `.ts` output for banned phrases (UI-SPEC list) — fail on match |
| `src/app.html` | SvelteKit default + CSP meta: `default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline';` |
| `src/app.css` | Tailwind v4 `@import 'tailwindcss';` + `@theme { --color-background: … }` tokens per UI-SPEC Color table (light + dark via `:root` / `.dark`) |
| `vitest.config.ts` | `test: { setupFiles: ['tests/setup.ts'], environment: 'node' }` |

---

## Shared Patterns

### Error handling (cross-cutting)

**Source:** RESEARCH.md §Security Domain + §Anti-Patterns.
**Applies to:** All `db/*.ts`, state modules, utilities.

**Rules:**
- `console.error` logs receive `err?.name ?? 'unknown'` only — **never** entry payloads (PITFALLS #12, no data exfil).
- Runtime input guards before any `db.*.put`: `mood in {1..5, null}`, `energy in {1..5, null}`, `workload in enum|null`, `social_split in {1,2,3,null}` (RESEARCH §Security V5).
- Dexie `VersionError` is uncaught on purpose — it signals a schema-version bug that must surface loudly.

### Import conventions

**Applies to:** Every TS/Svelte file.

```typescript
// Svelte framework
import { ... } from 'svelte';
import { enhance } from '$app/forms';

// Project aliases — always use $lib, never relative ../
import { db } from '$lib/db/local';
import { saveEntry } from '$lib/db/mutations';
import { draft } from '$lib/state/draft.svelte';
import Component from '$lib/components/entry/Component.svelte';

// Third-party UI
import { toast } from 'svelte-sonner';
import { Calendar as CalendarIcon } from 'lucide-svelte';
```

**Hard rule:** Never open a second Dexie instance. Always `import { db } from '$lib/db/local'` — never `new Dexie(...)` anywhere else.

### Typescript verification gate

**Source:** `~/.claude/CLAUDE.md` "Always verify types after editing TypeScript files".
**Applies to:** Every plan action that edits `.ts` or `.svelte`.

Every task closes with:
```bash
npm run check && npm run test
```

### Accessibility baseline

**Source:** UI-SPEC.md §Accessibility Contract + §Interaction Contract.
**Applies to:** Every custom component.

- 44×44px minimum touch target.
- `focus-visible:ring-2 focus-visible:ring-slate-900/40` on every focusable control.
- Inputs: `class="text-base"` (16px min) to suppress iOS auto-zoom (Pitfall 3).
- `role="radiogroup"` on segmented / scale pickers; `aria-label="{label} {n} of 5"` per button.
- Reduced-motion path on every transition (<120ms opacity fade when `prefers-reduced-motion`).
- Auto-escape only — **no `{@html}`** anywhere (RESEARCH §Security "XSS via user-typed tag name").

### Copy-discipline gate

**Source:** UI-SPEC.md §Copywriting Contract banned phrases.
**Applies to:** Every `.svelte` file and every string in `*.ts`.

Banned: "streak", "X-day streak", "don't break", "keep it up", "good day", "bad day", "great", "rough", "average mood", "avg", "How do you feel?", "Missed!", "You skipped", "Fill in the gap", any exclamation mark in system feedback.

Enforced by `tests/copy.test.ts` (static grep of compiled output).

### Timezone discipline

**Source:** RESEARCH.md §Pitfall 8 + §Anti-Patterns.
**Applies to:** Every `local_date` string construction.

```typescript
// CORRECT — local date
const d = new Date();
const local_date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// WRONG — UTC, silently wrong near midnight
const local_date = new Date().toISOString().slice(0,10);
```

### CSP / privacy discipline

**Source:** RESEARCH.md §Security Domain V10/V14 + PITFALLS #12.
**Applies to:** `src/app.html` + every new dependency decision.

- `default-src 'self'` — no third-party CDN, no Google Fonts, no analytics, no Sentry cloud.
- ESLint `no-console` = error in prod build.
- No `.env` secrets in Phase 1 (no server, no keys).
- System font stack only.
- Registry allowlist for shadcn-svelte: official only. Any addition triggers vetting gate (UI-SPEC Registry Safety).

---

## No Analog Found

All 27+ files fall into this category because the project is greenfield. The planner should:

1. Treat the RESEARCH.md and UI-SPEC.md excerpts quoted above as the seed patterns.
2. Assign the Wave 0 scaffold tasks to establish `local.ts`, `draft.svelte.ts`, `liveEntry.svelte.ts`, `+page.svelte`, and `persist.ts` **first** — these become the analog authorities for all subsequent Phase 1 files.
3. For Phase 2+, PATTERNS.md can cite concrete line numbers in these now-written files.

---

## Metadata

**Analog search scope:** Entire repository root (`/Users/h.grosse-plankermann/development/sideprojects/gsd/`).
**Files scanned:** 0 source files (none exist).
**Directories present:** `.claude/`, `.git/`, `.idea/`, `.planning/`.
**Files present at root:** `CLAUDE.md` only.
**Pattern extraction date:** 2026-04-20.
**Seed sources:**
- `.planning/phases/01-foundation/01-RESEARCH.md` §Code Examples 1–6, §Architecture Patterns 1–5, §Common Pitfalls, §Security Domain, §Validation Architecture
- `.planning/phases/01-foundation/01-UI-SPEC.md` §Design System, §Typography, §Color, §Copywriting Contract, §Component Inventory, §Interaction Contract, §Accessibility Contract
- `.planning/phases/01-foundation/01-CONTEXT.md` D-01..D-21
