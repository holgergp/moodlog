# Requirements: MoodLog

**Defined:** 2026-04-20
**Core Value:** Surface at least one non-obvious pattern between work/social context and my mood/energy that I can actually act on.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Entry

<!-- The 30-second evening check-in. Friction budget is the whole game. -->

- [ ] **ENT-01**: Daily entry captures mood on 1-5 ordinal scale
- [ ] **ENT-02**: Daily entry captures energy on 1-5 ordinal scale
- [ ] **ENT-03**: Daily entry captures workload (light / moderate / heavy)
- [ ] **ENT-04**: Daily entry captures alone-vs-social split (3-step ordinal)
- [ ] **ENT-05**: People tags with autocomplete from prior entries (normalised table, not free-text)
- [ ] **ENT-06**: User can edit or backfill prior entries via date picker, without guilt framing
- [ ] **ENT-07**: Configurable evening notification deep-links directly to the entry form
- [ ] **ENT-08**: PWA / Add-to-Home-Screen support with `navigator.storage.persist()` called on first open

### Data

<!-- Persistence, auth, and export. Offline-first is non-negotiable. -->

- [ ] **DAT-01**: Offline-first local persistence via IndexedDB (Dexie), survives Safari 7-day eviction policy
- [ ] **DAT-02**: Single-password auth gate protects data on the public deployment URL
- [ ] **DAT-03**: CSV export of all entries (structured, analysis-ready)
- [ ] **DAT-04**: Markdown export — one file per entry (`YYYY-MM-DD.md` with frontmatter for structured fields)

### Views

<!-- Make data visible during the 30-day wait for insights. -->

- [ ] **VUE-01**: Calendar heatmap (month view, colorblind-safe single-hue palette, missing days visually distinct from logged days)
- [ ] **VUE-02**: Weekly review screen — last 7 days with X/7 logged-days denominator, dominant workload, people seen
- [ ] **VUE-03**: History list with tap-to-edit
- [ ] **VUE-04**: Insight-threshold progress indicator ("N of 30 days logged") while below N=30

### Insights

<!-- Deliver the core value. Built last, depends on N≥30 real entries. -->

- [ ] **INS-01**: Correlation callouts gated at N≥30 days, directional counts (never r-values or causal language)
- [ ] **INS-02**: Scatter view alongside each correlation callout for transparency
- [ ] **INS-03**: Missing-day/MNAR warning surfaced when entries skew disproportionately by workload category
- [ ] **INS-04**: Raw data table with filtering — user can explore patterns themselves

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Sync

- **SYN-01**: Cross-device sync (phone ↔ desktop) via Turso or equivalent
- **SYN-02**: Passkey / WebAuthn auth (Face ID / Touch ID, iCloud Keychain roaming)

### Insights+

- **INS+01**: Energy-focused heatmap variant
- **INS+02**: Correlation trend over time (strengthening/weakening as data grows)
- **INS+03**: Optional single-line note field on entries

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-user accounts | Single-user product — built for me, no signup flows or tenant isolation |
| Public signup / sharing | Private data; keep scope and privacy surface small |
| Native mobile app | Mobile-first web is sufficient; avoids app-store overhead for a solo project |
| Sleep / food / exercise tracking | Explicitly deprioritised — work & social are the suspected drivers |
| Multiple check-ins per day | Single evening entry keeps daily friction at ~30 seconds |
| Rich journaling / long-form notes | 30-second entry is the contract; prose belongs elsewhere |
| Third-party integrations (calendars, wearables) | Manual logging only for v1 |
| Streak counters / gamification | Documented harm in mood-tracking context — filler entries, all-or-nothing abandonment |
| Mood "scores" as moralising numbers | Observational tool, not optimisation target |
| Third-party analytics / cloud error tracking with form breadcrumbs | Mood data is sensitive PII; self-hosted or zero-analytics only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENT-01 | TBD | Pending |
| ENT-02 | TBD | Pending |
| ENT-03 | TBD | Pending |
| ENT-04 | TBD | Pending |
| ENT-05 | TBD | Pending |
| ENT-06 | TBD | Pending |
| ENT-07 | TBD | Pending |
| ENT-08 | TBD | Pending |
| DAT-01 | TBD | Pending |
| DAT-02 | TBD | Pending |
| DAT-03 | TBD | Pending |
| DAT-04 | TBD | Pending |
| VUE-01 | TBD | Pending |
| VUE-02 | TBD | Pending |
| VUE-03 | TBD | Pending |
| VUE-04 | TBD | Pending |
| INS-01 | TBD | Pending |
| INS-02 | TBD | Pending |
| INS-03 | TBD | Pending |
| INS-04 | TBD | Pending |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 0 (populated during roadmap creation)
- Unmapped: 20 ⚠️

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after initial definition*
