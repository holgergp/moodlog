# Architecture Research

**Domain:** Single-user personal mood/energy tracker (mobile-first web)
**Researched:** 2026-04-20
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        View Layer (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Entry Form  │  │ Calendar /   │  │  Insight / Correlation │ │
│  │  (check-in)  │  │ Weekly View  │  │       Callouts         │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘ │
│         │                 │                      │               │
├─────────┴─────────────────┴──────────────────────┴───────────────┤
│                    Aggregate / Analysis Layer                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  InsightEngine (client-side, pure functions)              │   │
│  │  · Pearson r for scalar pairs (workload×mood etc.)        │   │
│  │  · Tag frequency & mean energy/mood per tag               │   │
│  │  · Alone/social split vs mood/energy mean                 │   │
│  └───────────────────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────────┤
│                       Entry Store (Zustand)                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  entries[]  ·  tags[]  ·  draft state  ·  sync status      │  │
│  └─────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                     Persistence / Sync Layer                      │
│  ┌─────────────────────┐        ┌──────────────────────────────┐  │
│  │  Local: IndexedDB   │ ←sync→ │  Remote: Supabase (Postgres) │  │
│  │  (Dexie.js)         │        │  Single-user, anon auth key  │  │
│  └─────────────────────┘        └──────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Entry Form | Capture daily check-in (mood/energy/workload/tags/social split). Must complete in ~30 s on mobile. | Entry Store (write) |
| Entry Store | Single source of truth for all entry and tag data. Exposes entries[], tags[], draftEntry. Triggers persistence. | View Layer (read), Persistence Layer (write), InsightEngine (read) |
| InsightEngine | Pure compute: Pearson correlations, tag aggregates, summary stats. No side effects. Accepts entries[] and tags[], returns insight objects. | Entry Store (read), Insight Views (render) |
| Calendar / Weekly View | Render heatmap and weekly summary using aggregated data. Read-only from store. | Entry Store (read), InsightEngine (read) |
| Insight / Correlation Views | Display callouts ("on heavy-workload days your mood averages 2.1 pts lower"). | InsightEngine (read) |
| Raw-data Table | Filterable/sortable table over entries[]. | Entry Store (read) |
| Persistence Layer | Write-through to IndexedDB; background sync to Supabase. Handles conflict resolution (last-write-wins by updated_at). | Entry Store (subscribe), Supabase API |
| Tag Manager | CRUD for reusable people/context tags. Shared across entries. | Entry Store (write), Entry Form (suggest) |

## Recommended Project Structure

```
src/
├── components/
│   ├── entry/              # Entry form, field widgets (sliders, tag picker)
│   ├── views/
│   │   ├── CalendarHeatmap.tsx
│   │   ├── WeeklyReview.tsx
│   │   ├── InsightCallouts.tsx
│   │   └── RawDataTable.tsx
│   └── ui/                 # Shared primitives (Button, Card, etc.)
├── store/
│   ├── entryStore.ts       # Zustand store — entries, tags, draft
│   └── syncStore.ts        # Sync status, conflict log
├── engine/
│   ├── correlations.ts     # Pearson r, tag aggregates, social split stats
│   ├── aggregates.ts       # Weekly/monthly summaries for views
│   └── types.ts            # Shared insight types
├── db/
│   ├── local.ts            # Dexie.js schema + migrations
│   └── remote.ts           # Supabase client, RPC helpers
├── hooks/
│   ├── useEntries.ts       # Reads from entryStore, triggers sync
│   └── useInsights.ts      # Runs engine over current entries
├── types/
│   └── domain.ts           # Entry, Tag, EntryTag, WorkloadLevel etc.
└── app/                    # Route definitions (React Router or Next.js pages)
    ├── log/                # /log — entry form (default on mobile)
    ├── calendar/           # /calendar — heatmap view
    ├── week/               # /week — weekly review
    ├── insights/           # /insights — correlation callouts
    └── data/               # /data — raw table
```

### Structure Rationale

- **engine/:** Separated from store so insight logic is purely functional and trivially testable without DOM or network. Functions take `Entry[]` and return typed insight objects — no store imports.
- **db/:** Isolates persistence concerns. The store never calls Supabase directly; it calls `db/remote.ts`. Swapping backends requires only this layer.
- **store/:** Zustand is intentionally thin — it holds data and exposes actions; business logic lives in `engine/` not reducers.
- **views/ vs components/entry/:** Entry form is write-path; views are read-path. They never share state directly.

## Data Model

### Core Schema (SQLite / Postgres compatible)

```sql
-- One row per day. The grain is always date-level.
CREATE TABLE entries (
  id           TEXT PRIMARY KEY,          -- UUID v4
  date         TEXT NOT NULL UNIQUE,      -- ISO-8601 date e.g. "2026-04-20"
  mood         INTEGER NOT NULL,          -- 1–5 scale
  energy       INTEGER NOT NULL,          -- 1–5 scale
  workload     TEXT NOT NULL,             -- 'light' | 'moderate' | 'heavy'
  social_split INTEGER NOT NULL,          -- 0–100 (% of day social vs alone)
  note         TEXT,                      -- optional short freetext (<140 chars)
  created_at   TEXT NOT NULL,             -- ISO-8601 datetime
  updated_at   TEXT NOT NULL             -- ISO-8601 datetime, used for sync
);

-- Reusable tags (people, contexts). User-managed list.
CREATE TABLE tags (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  color TEXT                              -- optional hex, for UI colour-coding
);

-- Many-to-many: which tags were present on a given day
CREATE TABLE entry_tags (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);
```

### TypeScript Domain Types

```typescript
type WorkloadLevel = 'light' | 'moderate' | 'heavy';

interface Entry {
  id:          string;
  date:        string;       // "YYYY-MM-DD"
  mood:        1 | 2 | 3 | 4 | 5;
  energy:      1 | 2 | 3 | 4 | 5;
  workload:    WorkloadLevel;
  socialSplit: number;       // 0–100
  note?:       string;
  createdAt:   string;
  updatedAt:   string;
}

interface Tag {
  id:    string;
  name:  string;
  color?: string;
}

// Materialised at query time — not stored
interface EntryWithTags extends Entry {
  tags: Tag[];
}
```

### Why date UNIQUE (not datetime)?

One entry per day is a hard constraint. Enforcing uniqueness at the DB level prevents duplicates from sync races. Updated_at drives last-write-wins conflict resolution.

## Architectural Patterns

### Pattern 1: Client-Side Correlation Engine

**What:** All analytics run in the browser as pure functions over the in-memory `entries[]` array. No server-side computation.

**When to use:** Dataset size is 30–365 rows. Pearson r on 365 integer pairs takes < 1 ms in JavaScript. There is no meaningful performance reason to send this to a server.

**Trade-offs:** Simple to implement, easy to test, works offline. Does not scale to multi-year datasets with complex regressions — but that is explicitly out of scope.

**Example:**
```typescript
// engine/correlations.ts
import { sampleCorrelation } from 'simple-statistics';

export function workloadMoodCorrelation(entries: Entry[]): number | null {
  if (entries.length < 7) return null; // too few data points
  const workloadNums = entries.map(e =>
    e.workload === 'light' ? 1 : e.workload === 'moderate' ? 2 : 3
  );
  const moods = entries.map(e => e.mood);
  return sampleCorrelation(workloadNums, moods);
}

export function tagMeanMood(entries: EntryWithTags[], tagId: string): number | null {
  const tagged = entries.filter(e => e.tags.some(t => t.id === tagId));
  if (tagged.length < 5) return null;
  return tagged.reduce((sum, e) => sum + e.mood, 0) / tagged.length;
}
```

### Pattern 2: Write-Through Local Cache + Background Sync

**What:** Every write goes to IndexedDB (Dexie.js) first, immediately returns to the UI, then syncs to Supabase in the background. Reads always come from the in-memory store (hydrated from IndexedDB on startup).

**When to use:** Mobile-first apps where network is unreliable. Phone users should not see a spinner when tapping "Save" after a 30-second check-in.

**Trade-offs:** Slightly more complex than direct API calls. Conflict resolution is simple (last-write-wins via `updated_at`) because single user eliminates concurrent edits across users. The only real race is editing the same day on two devices simultaneously — low probability, acceptable loss.

**Example:**
```typescript
// store/entryStore.ts (Zustand action)
async function saveEntry(draft: EntryInput) {
  const entry = { ...draft, id: uuid(), createdAt: now(), updatedAt: now() };
  // 1. Write to local DB immediately
  await db.local.entries.put(entry);
  // 2. Update in-memory store
  set(state => ({ entries: upsert(state.entries, entry) }));
  // 3. Sync to remote in background (non-blocking)
  syncQueue.enqueue(() => db.remote.upsertEntry(entry));
}
```

### Pattern 3: Supabase with Single-User Anonymous Auth

**What:** Use Supabase with a single dedicated user account (email/password, logged in once on device setup) and RLS policies that scope all rows to that user's auth.uid(). No public signup. The app's "auth" is just "I signed in with my credentials once."

**When to use:** Personal apps that need cross-device sync but no multi-tenant complexity.

**Trade-offs:** Marginally more setup than raw API key with no auth. RLS provides meaningful defence-in-depth if the Supabase project URL is ever leaked. Supabase anon key + no RLS is a known attack vector — 170+ apps were found exposed in January 2025.

**Example:**
```sql
-- RLS policy: only the owner can see/write their own rows
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner only"
  ON entries
  FOR ALL
  USING (auth.uid() = '<<your-fixed-user-uuid>>'::uuid);
```

## Data Flow

### Entry Submission (write path)

```
User taps "Save" on Entry Form
    ↓
entryStore.saveEntry(draft)
    ↓
① Local: dexie.entries.put(entry)    → IndexedDB (sync, <5ms)
② Store: set({ entries: [...] })     → UI re-renders immediately
③ Queue: syncQueue.enqueue(...)      → Non-blocking background
    ↓ (async, background)
Supabase.from('entries').upsert(entry)
    ↓
syncStore.markSynced(entry.id)       → UI sync indicator updates
```

### App Startup / Cross-Device Hydration

```
App mounts
    ↓
dexie.entries.toArray()              → Hydrate store from IndexedDB
    ↓
UI is usable immediately (offline-capable)
    ↓ (async)
supabase.from('entries').select()    → Fetch remote entries
    ↓
Merge: prefer higher updated_at (last-write-wins)
    ↓
dexie.entries.bulkPut(merged)        → Persist merged state locally
set({ entries: merged })             → Store and UI reflect latest
```

### Insight Computation (read path)

```
entryStore.entries changes
    ↓
useInsights() hook re-runs
    ↓
InsightEngine.computeAll(entries, tags)
    ↓
Returns: CorrelationResult[], TagAggregate[], WeeklySummary[]
    ↓
Insight views render callouts / charts
```

## Suggested Build Order

**Goal: reach "30-day habit can start" as fast as possible, before insight views exist.**

```
Phase 1: Log (Habit Foundation)
──────────────────────────────
Entry form (mood + energy + workload + social split + tags)
  → Local persistence (IndexedDB via Dexie)
  → Basic entry list / "did I log today?" indicator

  Ship this. Start logging. Data accumulates while Phase 2 is built.

Phase 2: Sync
─────────────
Supabase schema + RLS
Background sync (write-through queue)
Cross-device hydration on startup
  → Phone logs, desktop can see the same data

Phase 3: Views
──────────────
Calendar heatmap
Weekly review screen
Raw-data table (filter/sort)
  → Data is visible; patterns are emerging visually

Phase 4: Insights
─────────────────
Correlation engine (simple-statistics, Pearson r)
Callout cards: workload×mood, tag×energy, social split×mood
Threshold: surface callout only when n ≥ 14 entries with that tag
  → First non-obvious patterns surfaced; core value achieved
```

**Rationale for this order:**

- Phases 1 and 2 are the minimum to build the habit. Insights are useless without data.
- The insight engine should not block logging. A user who waits 30 days for insights is a user who must have 30 days of data — that only happens if logging is in their hands by day 1.
- Phase 4 is deliberately last because it depends on dataset size, not on Phase 3. A raw-data table (Phase 3) is optional — insights can be the second thing shipped after sync.

## Cross-Device Persistence Strategy

**Chosen: Write-through IndexedDB + Supabase sync (thin BaaS approach)**

| Strategy | Pros | Cons | Fit |
|----------|------|------|-----|
| Local-only (IndexedDB) | Zero backend, instant | No cross-device | Fails requirement |
| Supabase direct (no local cache) | Simpler code | Needs network on save, poor mobile UX | Breaks 30-second UX bar |
| Local-first + Supabase sync | Offline-capable, fast writes, cross-device | Slightly more code | Best fit |
| PocketBase self-hosted | SQLite, real-time | Must self-host and maintain a server | Operational overhead for a solo tool |
| Turso embedded replicas | True local-first SQLite sync | Not browser-native; works in Node/native, not web | Wrong runtime for web |

**Decision: Thin BaaS (Supabase) with local IndexedDB cache.** Supabase is browser-native (REST/JS SDK), has a generous free tier, and RLS lets us lock the single-user row securely. IndexedDB via Dexie handles offline and fast writes. The sync layer is <100 lines of code for this scale.

## Anti-Patterns

### Anti-Pattern 1: Insight Engine in the Store

**What people do:** Compute correlations inside Zustand actions or selectors alongside state mutations.

**Why it's wrong:** Mixes side-effecting state management with pure analysis logic. Makes the engine impossible to unit-test without instantiating the store. Coupling grows as insights become more complex.

**Do this instead:** Keep `engine/` as pure functions. The store holds data; the engine consumes it. A custom hook (`useInsights`) bridges them.

### Anti-Pattern 2: Blocking UI on Remote Sync

**What people do:** `await supabase.upsert(entry)` before updating local state, so the "Save" button shows a spinner until the network responds.

**Why it's wrong:** Destroys the 30-second UX contract. One slow cell network evening and the habit breaks.

**Do this instead:** Write to IndexedDB first, update UI, sync in background. Show a subtle "syncing" indicator, not a blocking spinner.

### Anti-Pattern 3: Tag Proliferation Without Normalisation

**What people do:** Store tag names as a comma-separated string on the entry row.

**Why it's wrong:** "Alice, Bob" and "Alice,Bob" are different strings. Aggregating by tag (tag×mood correlation) requires string parsing that is fragile and produces wrong results.

**Do this instead:** Normalise tags into a separate table with a junction table (entry_tags). This is the standard approach and enables clean `GROUP BY tag_id` aggregations.

### Anti-Pattern 4: Surfacing Correlations Too Early

**What people do:** Show a "Heavy workload days → lower mood" callout after 3 entries.

**Why it's wrong:** Pearson r on 3 points is statistically meaningless and erodes trust when the callout reverses a week later.

**Do this instead:** Gate callout rendering on a minimum sample threshold (n ≥ 14 for global scalars, n ≥ 5 occurrences for tag-specific callouts). Show a "logging X more days will unlock insights" progress bar in the meantime.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase | REST via `@supabase/supabase-js`, one-time auth on device setup | Use RLS with fixed single-user UID policy |
| simple-statistics | Imported as ESM module, runs in browser | ~40 kB, no dependencies, sufficient for Pearson r |
| Dexie.js | Browser IndexedDB wrapper | Schema versioning handles future migrations |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| View Layer ↔ Entry Store | Zustand selectors (reactive) | Views never write directly to DB |
| Entry Store ↔ Persistence Layer | Store actions call `db/` functions | DB layer is never imported by views |
| Entry Store ↔ InsightEngine | Engine functions imported in `useInsights` hook | Engine has no store dependency |
| InsightEngine ↔ View Layer | Via `useInsights` hook return values | Engine output is typed, view is a renderer |

## Sources

- [Turso Local-First SQLite, Cloud-Connected with Embedded Replicas](https://turso.tech/blog/local-first-cloud-connected-sqlite-with-turso-embedded-replicas)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [simple-statistics GitHub](https://github.com/simple-statistics/simple-statistics)
- [react-calendar-heatmap npm](https://www.npmjs.com/package/react-calendar-heatmap)
- [MoodMo open-source mood tracker (architecture reference)](https://github.com/dnlzrgz/moodmo)
- [Offline-First Apps Made Simple: Supabase + PowerSync](https://www.powersync.com/blog/offline-first-apps-made-simple-supabase-powersync)
- [PocketBase — Open Source backend in 1 file](https://pocketbase.io/faq/)

---
*Architecture research for: MoodLog — single-user personal mood/energy tracker*
*Researched: 2026-04-20*
