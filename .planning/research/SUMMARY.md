# Project Research Summary

**Project:** MoodLog
**Domain:** Single-user mobile-first personal mood/energy/context tracker (web app)
**Researched:** 2026-04-20
**Confidence:** HIGH

## Executive Summary

MoodLog is a personal habit-and-insight tool, not a multi-user product. The closest analogues are Daylio and Exist.io, but the design deliberately diverges from both: no gamification, no streaks, no evaluative framing, and a hard 30-second entry contract. The success bar is producing one non-obvious insight after ~30 days of data — which means the logging habit must form before any insight surface is built. Architecture and phase ordering follow directly from this: get logging in the user's hands on day one, build cross-device sync next, only then build views and insights.

**Recommended stack: SvelteKit 2 + Turso (LibSQL) + Drizzle ORM + Cloudflare Pages, with Dexie.js for local offline queue.** The two research streams (STACK.md recommending Turso/SvelteKit, ARCHITECTURE.md recommending Supabase/React/Zustand) were written independently and reflect different tradeoff preferences. After reconciling them for a single-user project, Turso wins on simplicity: it is SQLite with edge replication, so cross-device sync is structural rather than a layer you build. Supabase is the right call for multi-tenant Postgres apps; here it adds a pausing free tier, RLS policy authoring, and Postgres overhead with no benefit over SQLite at one user and ~365 rows/year. The ARCHITECTURE.md patterns — offline-first write path, pure correlation engine, normalised tag schema — apply unchanged with Turso as the remote. SvelteKit replaces the React + Zustand client described in ARCHITECTURE.md; Svelte 5 runes are an adequate substitute for a Zustand store at this scale.

The dominant risk is not technical — it is habit failure. Every pitfall that threatens the core value either kills the logging habit (friction, notification mismatch, Safari storage eviction) or corrupts the data before it can produce insights (free-text tags, ordinal-as-interval arithmetic, spurious correlations on small N). Both categories must be addressed in Phase 1 at the data model and entry UX level, because they are either impossible or very costly to fix retroactively.

## Key Findings

### Recommended Stack

SvelteKit 2 is the right framework choice: 65% smaller bundles than Next.js on comparable pages, mobile-first progressive enhancement via form actions, and the simplest full-stack DX for a solo project with no SEO requirement. Tailwind CSS v4 (zero-config, CSS-native) and shadcn-svelte (owned component code, correct 44px touch targets) handle styling. Drizzle ORM provides type-safe schema management and a native LibSQL dialect.

For charting, the recommended libraries (Recharts, react-activity-calendar) are React components. The pragmatic approach is a React island via `onMount` — React + ReactDOM adds ~42 KB gzipped, loaded only on chart routes, never on the entry form. If React as a dependency is unacceptable, LayerCake (Svelte-native, ~15 KB) substitutes with ~2-3 days of extra chart work.

**Core technologies:**

- **SvelteKit 2 (Svelte 5.55.x / SvelteKit 2.57.x):** full-stack framework — smallest bundle of any mainstream meta-framework; form actions give progressive enhancement for free
- **Turso (LibSQL, @libsql/client 0.17.x):** cloud SQLite — cross-device sync is structural; free tier covers the use case completely (5 GB, 500M reads/month); no Postgres operational overhead
- **Drizzle ORM (0.45.x):** type-safe queries and migrations — native LibSQL dialect; lightweight vs Prisma; `npx sv add drizzle` wires it automatically
- **Dexie.js:** IndexedDB wrapper for offline write queue — write-through local cache before remote sync; required to survive Safari's 7-day eviction policy and unreliable mobile networks
- **Tailwind CSS v4 (4.2.x):** utility styling — zero-config, 5x faster builds, CSS-native `@theme`
- **shadcn-svelte:** owned UI components — correct touch targets, no npm dependency lock-in
- **vite-plugin-pwa:** PWA / Add to Home Screen — required for Safari persistent storage grant
- **@simplewebauthn/browser + server:** passkey auth — Face ID/Touch ID on enrolled devices; iCloud Keychain syncs to second device automatically (MEDIUM confidence — custom SvelteKit glue required)
- **Cloudflare Pages + @sveltejs/adapter-cloudflare:** deployment — unlimited bandwidth free tier; automatic HTTPS required for WebAuthn

**Why not Supabase:** Supabase free tier pauses after 1 week inactivity; Postgres has no marginal benefit over SQLite at one user; RLS policy authoring is wasted effort for a single-user app. The offline-first architecture patterns from ARCHITECTURE.md apply equally to Turso.

### Expected Features

**Must have (table stakes):**

- Single-screen 30-second entry: mood (1-5), energy (1-5), workload (3-option), social split (3-option), people tags with autocomplete — all visible on one scrollable card
- Entry edit/backfill with date picker — no guilt framing
- Calendar heatmap (month view, colour by mood) — standard genre expectation; primary visual feedback loop
- Basic history list — trust and data verification
- Evening push notification at user-configurable time, deep-linking directly to entry form
- CSV export — data safety escape hatch
- Entry storage with structured numeric fields — required from day one for correlations to be possible at all

**Should have (differentiators):**

- Correlation callouts gated at N≥30 days, showing directional counts ("on 12 of 18 heavy-workload days mood was lower"), with hedged language and no causal framing
- People-tag autocomplete (type-to-filter existing tags, create explicitly) — without this, the social field is the slowest part of entry and will be skipped
- Workload as first-class structured field (light/moderate/heavy), not a note
- Weekly review screen — 7-day summary in text callouts; "X of 7 days logged" denominator always visible
- "Minimum data" progress bar visible in UI — progress toward 30-entry threshold, not a streak counter

**Defer (v2+):**

- Energy-focused heatmap variant
- Correlation trend over time (strengthening/weakening as data grows)
- Optional single-line note field
- History filter/search (add only when history is long enough to need navigation)

### Architecture Approach

The architecture has four clean layers: (1) a SvelteKit view layer with a write-path entry form and read-path insight/calendar views, (2) a reactive Svelte 5 store as single source of truth for entries and tags, (3) a pure client-side `InsightEngine` that accepts `Entry[]` and returns typed insight objects with zero store or network dependencies, and (4) a persistence layer that writes through to Dexie.js (IndexedDB) immediately and syncs to Turso in the background. All business logic lives in `engine/` as pure functions — trivially testable without the store or network. Views never touch the DB directly.

**Major components:**

1. **Entry Form** — write path; must be the default landing screen; ≤4 taps from app open to saved entry; no required-field validators
2. **Entry Store (Svelte 5 `$state`)** — single source of truth; triggers persistence; never imports the engine
3. **InsightEngine (`engine/correlations.ts`, `engine/aggregates.ts`)** — pure functions; Pearson r via simple-statistics; tag frequency and mean per tag; gated on N≥30
4. **Persistence Layer (`db/local.ts` Dexie + `db/remote.ts` Turso)** — write-through: IndexedDB first, Turso in background; last-write-wins via `updated_at`; `navigator.storage.persist()` called on first open
5. **Calendar/Weekly Views** — read-only from store; colorblind-safe palette; missing days as visually distinct "no data" cells, not neutral-mood cells
6. **Correlation/Insight Views** — render InsightEngine output; hedged language enforced at component level

**Data model non-negotiables (must exist from Phase 1):**

- `date TEXT NOT NULL UNIQUE` (ISO-8601 local date, not UTC datetime) + `updated_at` for conflict resolution
- `mood INTEGER` and `energy INTEGER` on 1-5 scale (NOT 1-10) — never compute `AVG()` in display code
- `workload TEXT` as `'light' | 'moderate' | 'heavy'`
- `social_split INTEGER` (0-100 or 3-step ordinal)
- Separate `tags` table + `entry_tags` junction — no comma-separated strings; case-insensitive at storage layer

### Critical Pitfalls

1. **Safari IndexedDB eviction (7-day rule)** — Safari evicts IndexedDB for non-installed origins after 7 days of non-interaction. Call `navigator.storage.persist()` on first open; prompt for Home Screen install if not granted; never use localStorage for entry data. Must be in Phase 1 — retrofitting an offline sync queue is painful.

2. **Friction-induced abandonment** — Entry form must be the landing page; ≤4 taps from app open to saved entry; no confirmation dialogs; no required-field validators. Test on phone, one-handed, simulating 10 PM tiredness.

3. **Free-text tags produce unusable insight data** — Tags stored as free text split signal across "Alice", "alice", "Alice B", destroying tag-level correlations. Tags must be a normalised entity with FK from day one. Unrecoverable without a migration.

4. **Spurious correlations on small N** — Pearson r on 30 points across 5 dimensions finds noise. Gate insight callouts at N≥30 globally, N≥5 per tag. Use directional counts, not r values. Never surface only the strongest of multiple correlations (implicit p-hacking).

5. **Ordinal data treated as interval** — A 1-5 mood scale is ordinal. Computing `AVG(mood)` and displaying "6.4 this week" is a statistical error. Display as "higher/lower than usual"; use median or rank-based comparisons in insight logic.

6. **Timezone drift corrupts day boundaries** — Store `local_date TEXT` (YYYY-MM-DD) alongside `created_at` UTC. Group heatmap and insights by `local_date`, not derived UTC date. Impossible to fix retroactively without a migration.

7. **Privacy leak via third-party scripts** — Mood + workload + social context is sensitive personal data. No third-party analytics, no CDN fonts that phone home, no cloud Sentry with form breadcrumbs. Enforce strict CSP. Audit DevTools Network on entry submission — zero third-party requests.

## Implications for Roadmap

Based on combined research, a 4-phase structure is recommended. The ordering is driven by one constraint: the logging habit must be established before any insight surface is built.

### Phase 1: Foundation — Log and Persist

**Rationale:** The project succeeds only if 30 days of data are captured. All data model decisions that are expensive to change retroactively must be locked here: `local_date` field, 1-5 ordinal scale, normalised tag table, offline sync queue with `navigator.storage.persist()`. Ship this and start logging before building anything else.

**Delivers:** Working entry form → local IndexedDB persistence → push notification (deep-linked to form) → CSV export. User can log tonight.

**Addresses:** Single-screen 30s entry, people-tag autocomplete, entry edit/backfill, evening notification, CSV export, structured-field entry storage.

**Avoids:** Friction-induced abandonment (entry is landing page, ≤4 taps), Safari eviction (storage.persist() + PWA install prompt from day one), free-text tag trap (normalised tag entity), timezone drift (local_date in schema), privacy leaks (no third-party scripts at setup), ordinal scale error (5-point labeled scale).

**Research flag:** Standard patterns — SvelteKit form actions, Dexie.js schema, `navigator.storage.persist()` all well-documented. Skip phase research. Exception: verify iOS web push deep-link behaviour for non-installed origins at implementation time.

### Phase 2: Sync — Cross-Device

**Rationale:** Phone logs data; desktop must be able to review it. Cross-device sync must be working before significant data accumulates — restoring from scratch later is demoralising. Turso write-through sync is the natural next step after local-only Phase 1.

**Delivers:** Write-through sync to Turso; cross-device hydration on startup (last-write-wins via `updated_at`); auth gate (passkey via @simplewebauthn or bcrypt hash in SvelteKit hooks); Cloudflare Pages deployment with TURSO_DATABASE_URL env vars. Sync status indicator ("synced / pending sync").

**Uses:** @libsql/client, Drizzle ORM schema migration to Turso, @simplewebauthn or bcrypt alternative, Cloudflare Pages + adapter-cloudflare.

**Avoids:** Blocking UI on sync (IndexedDB first, Turso in background — non-blocking); Supabase anon key exposure pattern (not applicable).

**Research flag:** Passkey SvelteKit integration has no fully-integrated template — recommend a spike or `/gsd-research-phase` specifically on the auth pattern. Document the bcrypt fallback as the escape hatch. Turso + Drizzle sync queue: well-documented, skip research.

### Phase 3: Views — Make Data Visible

**Rationale:** After 7-14 days of logging, the calendar heatmap becomes the primary feedback loop. Building it here means the user can see patterns forming visually during the 30-day wait for the correlation engine. Weekly review surfaces data in scannable text. Raw table gives data verification confidence.

**Delivers:** Calendar heatmap (month view, colorblind-safe single-hue palette, missing days visually distinct from logged days), weekly review (X of 7 days logged, dominant workload, descriptive not decimal), basic history list with edit.

**Implements:** React island for react-activity-calendar (or LayerCake Svelte-native alternative); missing-day "no data" cell styling; colorblind palette (Viridis or single-hue sequential, not red-green).

**Avoids:** Missing-day skew (X/7 denominator always shown, never AVG/7), colorblind heatmap (run Coblis deuteranopia simulation before shipping), streaks introduced via heatmap framing (missing days are neutral grey, not red).

**Research flag:** React island `ssr=false` pattern in SvelteKit 2 + Svelte 5 — establish the pattern in Phase 1 or early Phase 3 before committing to react-activity-calendar. Standard otherwise.

### Phase 4: Insights — Deliver Core Value

**Rationale:** This is the whole point. Build last because it depends on N≥30 real data points. The correlation engine is purely functional (pure functions over `Entry[]`) — easy to test independently of the stack. The 30-day gate is a feature, not a constraint.

**Delivers:** Correlation callout cards (workload×mood, tag×energy, social split×mood), gated at N≥30 globally and N≥5 occurrences per tag; directional counts in hedged language; no causal framing; scatter view alongside each callout showing raw spread. Progress bar toward insight threshold while below 30 days.

**Uses:** simple-statistics (`sampleCorrelation`, ~40 KB ESM); `engine/correlations.ts` and `engine/aggregates.ts` as pure functions; `useInsights`-equivalent hook bridging store to engine.

**Avoids:** Spurious correlations (30-day gate, count display, no sorted-top-1 ranking without multiple-comparison acknowledgment), false precision (no r values in display, no decimal averages), causal language ("on days with X, Y tended to be lower" — not "X causes Y"), missing-data blindness (callouts check logging completeness and surface MNAR flag if heavy-workload days have disproportionate gaps).

**Research flag:** simple-statistics Pearson r API trivially documented — skip research. Correlation rendering UX (hedged language wording, scatter view layout, MNAR detection heuristic) are design decisions not covered by a single source — recommend a short design spike before coding.

### Phase Ordering Rationale

- Phase 1 before everything: habit must start forming immediately; data model decisions are expensive to reverse
- Phase 2 before Phase 3: sync must be in place before meaningful data volume accumulates
- Phase 3 before Phase 4: visual feedback maintains the habit during the 30-day wait; also validates data correctness before running statistics
- Phase 4 last: depends on dataset size, not on Phase 3; InsightEngine can be developed in parallel with Phase 3 but should not be shipped early

### Research Flags

Needs deeper research during planning:

- **Phase 2 (auth):** Passkey/WebAuthn + SvelteKit integration — no fully-integrated template; spike recommended with bcrypt fallback documented
- **Phase 4 (insight UX):** Correlation rendering design — hedged language patterns, scatter view layout, MNAR detection heuristic — short design spike before implementation

Standard patterns (skip research):

- **Phase 1:** SvelteKit form actions, Dexie.js schema, `navigator.storage.persist()` — well-documented
- **Phase 2 (sync):** Turso + Drizzle write-through queue — official docs sufficient
- **Phase 3:** React island in SvelteKit, react-activity-calendar API — well-documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack verified via Context7 and official docs. Version compatibility table confirmed. Stack conflict resolved with clear rationale. |
| Features | HIGH (table stakes + anti-features) / MEDIUM (differentiator detail) | Table stakes grounded in PMC research and competitor analysis. Correlation rendering details inferred from Exist.io model. |
| Architecture | HIGH | Component boundaries and patterns well-established for this app category. Data model constraints non-controversial. |
| Pitfalls | HIGH | Multiple independent sources per claim. Safari eviction from WebKit blog. Statistical pitfalls from academic sources. Privacy risks from FTC actions and PMC research. |

**Overall confidence:** HIGH

### Gaps to Address

- **Passkey SvelteKit integration:** MEDIUM confidence; custom glue code required; no template exists. Spike in Phase 2 with documented bcrypt fallback.
- **Correlation rendering UX:** Specific hedged language wording, scatter view layout, MNAR heuristic are design decisions not covered by existing sources. Design spike before Phase 4 coding.
- **iOS web push deep-link for non-installed origins:** Exact behaviour when notification is tapped on iOS Safari without Home Screen install — verify during Phase 1 implementation.
- **React island SSR behaviour in SvelteKit 2 + Svelte 5:** `export const ssr = false` / `{#if browser}` patterns are established but should be verified against the current version combination before committing to the React chart libraries.

## Sources

### Primary (HIGH confidence)

- Context7 `/sveltejs/kit` — SvelteKit forms/actions, hooks, adapter patterns
- Context7 `/recharts/recharts` — ResponsiveContainer, LineChart API
- https://github.com/sveltejs/kit/releases — SvelteKit 2.57.1 confirmed latest (Apr 9 2026)
- https://github.com/sveltejs/svelte/releases — Svelte 5.55.4 confirmed latest
- https://turso.tech/pricing — Free tier limits verified: 5 GB, 500M row reads/month
- https://github.com/grubersjoe/react-activity-calendar — v3.2, last publish Apr 15 2026
- https://orm.drizzle.team/ — Drizzle 0.45.x stable
- https://www.npmjs.com/package/@libsql/client — 0.17.2
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/ — official guide
- WebKit Blog, "Updates to Storage Policy" — Safari 7-day eviction policy
- web.dev, "Persistent storage" — `navigator.storage.persist()` API
- PMC8387890 — user friction and abandonment in mood tracking apps
- PMC9643945 — third-party SDK data collection in mental health apps

### Secondary (MEDIUM confidence)

- https://kb.exist.io/article/37-what-are-correlations — correlation rendering model
- WebSearch: SvelteKit vs Next.js bundle size benchmarks 2026 — multiple sources agree
- WebSearch: Turso vs D1 comparison 2026 — multiple sources agree
- WebSearch: passkey/WebAuthn single-user app patterns — verified against @simplewebauthn docs
- ScienceDirect: "At what sample size do correlations stabilize?" — N≥30 threshold
- Mark Koester, "An Experiment in Mood Tracking" — scale ambiguity, data vs insight gap

### Tertiary (LOW confidence — validate during implementation)

- Passkey SvelteKit full integration — inferred from @simplewebauthn server guide; no SvelteKit template verified
- React island `ssr=false` in SvelteKit 2 + Svelte 5 — pattern established but exact API needs verification at implementation time

---
*Research completed: 2026-04-20*
*Ready for roadmap: yes*
