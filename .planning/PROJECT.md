# MoodLog

## What This Is

A mobile-first web app for tracking daily mood and energy alongside the work and
social context of the day. Single-user — built for me — with a 30-second evening
check-in and insight views designed to surface patterns between how I feel and
what I did/who I was with.

## Core Value

Surface at least one non-obvious pattern between work/social context and my
mood or energy that I can actually act on. If the app only captures data without
ever producing a real insight, it has failed.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Daily evening check-in with mood and energy on a quick scale
- [ ] Log workload intensity for the day (light / moderate / heavy)
- [ ] Tag people I spent time with (reusable tags across entries)
- [ ] Capture alone vs social split for the day (rough estimate)
- [ ] Full entry completable in ~30 seconds on phone
- [ ] Calendar heatmap view (color-coded by mood and/or energy)
- [ ] Weekly review screen summarising the past 7 days
- [ ] Correlation callouts surfacing patterns (e.g. workload vs mood, specific people vs energy)
- [ ] Raw-data table/chart view I can filter and explore
- [ ] Single-user only — no sharing, no multi-tenant concerns
- [ ] Single-password auth gate on public deployment URL

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Multiple user accounts — single-user product, no signup flows or tenant isolation
- Public signup / sharing — private to me, keep scope and privacy simple
- Cross-device sync (phone ↔ desktop) — deferred to v2; v1 is phone-first, single-device
- Passkey / WebAuthn auth — deferred to v2; v1 uses a simple single-password gate
- Native mobile app — mobile-first web is enough, avoids app-store overhead
- Sleep / food / exercise tracking — explicitly deprioritised; work & social are the suspected drivers
- Multiple check-ins per day — one evening entry keeps friction low
- Rich journaling — 30-second entry is the contract; prose belongs elsewhere
- Third-party integrations (calendars, wearables) — manual logging only for v1

## Context

- Built solo for personal use. Operator and user are the same person.
- Mobile-first web means the phone is where daily logging happens; desktop is for deeper review.
- Insight quality is the point. A beautiful logger with no pattern surfacing would miss the goal.
- The 30-day / first-real-insight bar is the honest success check — not uptime, not feature count.
- No existing data to migrate; starts empty.

## Constraints

- **Friction**: Daily entry must complete in ~30 seconds on mobile — Friction kills habit, habit is the whole game
- **Scope**: Single-user only, no auth/multi-tenant for v1 — Keeps surface area small so insight work isn't crowded out
- **Form factor**: Mobile-first web — Covers phone logging and desktop review without native-app overhead
- **Evaluation bar**: Must produce a real, non-obvious insight after ~30 days — Core Value is pattern surfacing, not data collection

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mobile-first web (not native) | Covers both phone logging and desktop review with one codebase; no app-store overhead for a solo project | — Pending |
| Single evening check-in only | Keeps total daily friction near 30s; multiple check-ins add friction without clear pattern-spotting benefit | — Pending |
| Track work & social context only (not sleep/food/exercise) | User believes these are the likely drivers; staying narrow keeps entry fast and insights interpretable | — Pending |
| Single-password auth gate (not passkey) | v1 is deployed to a public URL; single password is the simplest gate that keeps mood data private without Passkey/WebAuthn complexity | — Pending |
| Cross-device sync deferred to v2 | v1 is phone-first and single-device; skipping sync removes Turso, auth roaming, and conflict resolution complexity from the MVP | — Pending |
| Success = 30 days logged + one real insight | Honest bar — pattern-surfacing is the goal, not logging as an end in itself | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 after initialization*
