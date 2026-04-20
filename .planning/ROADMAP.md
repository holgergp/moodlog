# Roadmap: MoodLog

## Overview

Four phases deliver a working personal mood tracker from first log entry to real
pattern insights. Phase 1 gets logging in the user's hands on day one, with all
data model decisions that are expensive to reverse locked in from the start.
Phase 2 secures the public deployment and makes data portable. Phase 3 makes the
accumulating data visible through calendar and weekly views, sustaining the
logging habit during the 30-day wait. Phase 4 delivers the core value: surfacing
non-obvious correlations between work/social context and mood or energy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Entry form, local IndexedDB persistence, PWA install, and evening notification — user can log tonight
- [ ] **Phase 2: Security & Export** - Single-password auth gate and CSV/Markdown export — safe to deploy publicly and data is portable
- [ ] **Phase 3: Views** - Calendar heatmap, weekly review, history list, and insight-threshold progress indicator — data is visible during the 30-day wait
- [ ] **Phase 4: Insights** - Correlation callouts, scatter views, MNAR warnings, and raw data table — core value delivered after N≥30 entries

## Phase Details

### Phase 1: Foundation
**Goal**: User can log a complete 30-second evening check-in from their phone, with data persisting reliably in local storage and the app installable as a PWA
**Depends on**: Nothing (first phase)
**Requirements**: ENT-01, ENT-02, ENT-03, ENT-04, ENT-05, ENT-06, ENT-07, ENT-08, DAT-01
**Success Criteria** (what must be TRUE):
  1. User can open the app, fill in mood, energy, workload, social split, and people tags, and save a complete entry in roughly 30 seconds on a phone
  2. User can edit a past entry or backfill a missed day using a date picker, with no guilt-framing in the UI
  3. User receives an evening push notification at a configured time and tapping it opens the entry form directly
  4. User can install the app to the Home Screen and entries survive a Safari restart without data loss (navigator.storage.persist() granted)
  5. Data persists reliably in IndexedDB via Dexie across sessions, including after 7+ days without opening the app on an installed PWA
**Plans**: TBD
**UI hint**: yes

### Phase 2: Security & Export
**Goal**: The app is safe to deploy to a public URL and all logged data can be extracted in analysis-ready formats
**Depends on**: Phase 1
**Requirements**: DAT-02, DAT-03, DAT-04
**Success Criteria** (what must be TRUE):
  1. Visiting the public deployment URL presents a password prompt; an incorrect password is rejected and all entry data is inaccessible without the correct password
  2. User can export all entries as a CSV file with structured numeric fields, one row per entry, ready for analysis in a spreadsheet or script
  3. User can export all entries as individual Markdown files (YYYY-MM-DD.md) with YAML frontmatter containing the structured fields
**Plans**: TBD

### Phase 3: Views
**Goal**: User can see their accumulated data through a calendar, weekly summary, and history list, giving visual feedback and maintaining the logging habit during the 30-day wait for insights
**Depends on**: Phase 2
**Requirements**: VUE-01, VUE-02, VUE-03, VUE-04
**Success Criteria** (what must be TRUE):
  1. User can view a month-view calendar heatmap where each logged day shows a colorblind-safe color intensity for mood, missing days are visually distinct from logged days, and no day is colored as if it were a low-mood entry when it is simply unlogged
  2. User can view a weekly review screen showing the past 7 days with an explicit X/7 logged-days denominator, dominant workload for the week, and the people seen — all described in words, not decimal averages
  3. User can see a scrollable history list of all entries and tap any entry to edit it
  4. User can see a progress indicator toward the 30-entry insight threshold ("N of 30 days logged") whenever they have fewer than 30 entries, with no streak counter or gamification framing
**Plans**: TBD
**UI hint**: yes

### Phase 4: Insights
**Goal**: After accumulating 30 or more entries, the app surfaces at least one non-obvious, directionally honest correlation between work/social context and mood or energy
**Depends on**: Phase 3
**Requirements**: INS-01, INS-02, INS-03, INS-04
**Success Criteria** (what must be TRUE):
  1. With 30 or more logged entries, the user sees correlation callouts in hedged, directional language ("on X of Y heavy-workload days, mood tended to be lower") with no r-values, no causal framing, and no callout surfaced for any tag seen fewer than 5 times
  2. Each correlation callout is accompanied by a scatter view showing the raw spread of data points, so the user can judge the pattern themselves
  3. If entries are disproportionately missing for a particular workload category (e.g., heavy-workload days are systematically un-logged), the user sees an explicit MNAR warning alongside any correlations involving that category
  4. User can open a raw data table showing all entries with filtering by date range and field value, allowing independent exploration of patterns
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/5 | In progress | - |
| 2. Security & Export | 0/TBD | Not started | - |
| 3. Views | 0/TBD | Not started | - |
| 4. Insights | 0/TBD | Not started | - |
