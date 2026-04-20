# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 01-foundation
**Areas discussed:** Entry form layout & widgets, Social-split field & people tags, Backfill / edit flow, First-open onboarding & notifications

---

## Entry form layout & widgets

### Q: How should the 30-second check-in form be laid out?

| Option | Description | Selected |
|--------|-------------|----------|
| Single screen, vertical scroll (Recommended) | All fields on one page, save at bottom. Fewer taps, no step-transition delay. | ✓ |
| Stepper / wizard | One field per screen with Next. Conflicts with 30-second bar. | |
| Two-screen split | Mood+energy on screen 1; context on screen 2. | |

**User's choice:** Single screen, vertical scroll
**Notes:** None.

### Q: How should the 1-5 mood and energy scales be input?

| Option | Description | Selected |
|--------|-------------|----------|
| 5 buttons, filled dot for selected (Recommended) | Discrete taps, thumb-friendly, honest ordinal. | ✓ |
| 5 emoji faces | Fun but imply evaluative framing. | |
| Slider / continuous | Drag to pick; creates interval illusion (PITFALLS #4). | |
| 5 vertical labels | Clear labels but larger vertical space. | |

**User's choice:** 5 discrete buttons with filled-dot indicator
**Notes:** None.

### Q: How should workload (light / moderate / heavy) be input?

| Option | Description | Selected |
|--------|-------------|----------|
| 3-button segmented control (Recommended) | Horizontal row, big tap targets, text labels. | ✓ |
| 3 emoji buttons | Moralising risk. | |
| 3 labeled cards / pills | Richer but larger. | |

**User's choice:** 3-button segmented control
**Notes:** None.

### Q: What should fields default to when the form opens?

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing pre-selected, no required validators (Recommended) | Saves nulls; matches PITFALLS #1. | ✓ |
| Middle value pre-selected | One-tap save but creates anchoring bias. | |
| Last entry's values pre-filled | Faster but filler entries / carry-over bias. | |

**User's choice:** Nothing pre-selected, save always enabled
**Notes:** None.

---

## Social-split field & people tags

### Q: ENT-04 says 3-step ordinal for alone-vs-social split. What are the 3 steps?

| Option | Description | Selected |
|--------|-------------|----------|
| Mostly alone / Mixed / Mostly with others (Recommended) | Descriptive, no moralising. | ✓ |
| Alone / Some people / Many people | Emphasises count. | |
| Solo day / Half-and-half / Social day | Punchier but "social day" loaded. | |

**User's choice:** Mostly alone / Mixed / Mostly with others
**Notes:** None.

### Q: How should the people tag picker work inside the entry form?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline input with autocomplete + chip row (Recommended) | Type-to-filter, tap chip to toggle, create new inline. | ✓ |
| Separate full-screen picker | Screen transition fights 30-second bar. | |
| Dropdown / select menu | Poor for multi-select. | |

**User's choice:** Inline autocomplete with chip row
**Notes:** None.

### Q: How should duplicate-prevention work when creating a new tag?

| Option | Description | Selected |
|--------|-------------|----------|
| Case-insensitive match + trim whitespace (Recommended) | Stored lowercase key, preserved display name. | ✓ |
| Case-insensitive + fuzzy (Levenshtein) | Overkill for low-dozens of tags. | |
| Exact match only | Guarantees duplicates over time. | |

**User's choice:** Case-insensitive match + trim whitespace
**Notes:** None.

### Q: Do you want in-app tag management (rename/merge/delete) in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| No — defer to later phase (Recommended) | Case-insensitive matching should prevent cruft. | ✓ |
| Yes — minimal management screen | List + delete + rename. | |
| Yes — full merge/rename UI | Too much scope for Phase 1. | |

**User's choice:** Defer to later phase
**Notes:** None.

---

## Backfill / edit flow

### Q: When today already has an entry and the user opens the app, what shows?

| Option | Description | Selected |
|--------|-------------|----------|
| Same form, pre-filled + "Update" button (Recommended) | Zero-friction edit, no separate screen. | ✓ |
| Summary screen with edit button | Extra tap; celebratory risk. | |
| Compact form with tap-to-expand | Clever but more UX work. | |

**User's choice:** Same form pre-filled with Save → Update
**Notes:** None.

### Q: How does the user reach a past day to backfill or edit?

| Option | Description | Selected |
|--------|-------------|----------|
| Date chip in entry form header (Recommended) | Tappable chip → calendar picker → form re-loads for that date. | ✓ |
| Separate "History" screen with a list | Closer to Phase 3 history list — wait and don't do it twice. | |
| "Missed yesterday?" chip only | Limits feature. | |

**User's choice:** Date chip in form header
**Notes:** None.

### Q: Any limit on how far back the user can backfill?

| Option | Description | Selected |
|--------|-------------|----------|
| No limit — any past date, no future dates (Recommended) | Consistent with no-guilt framing. | ✓ |
| Last 7 days only | Feels punishing. | |
| Last 30 days only | Arbitrary compromise. | |

**User's choice:** No past limit; future dates blocked
**Notes:** None.

### Q: If user taps a past day that has no entry yet, what's the UI framing?

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral: empty form with date chip showing that date (Recommended) | No "missed" badge, no red, no streak. | ✓ |
| "Add entry for [date]" | Slightly heavier. | |
| "You didn't log this day — fill it in" | Contradicts PITFALLS #11. | |

**User's choice:** Neutral empty form
**Notes:** None.

---

## First-open onboarding & notifications

### Q: What should happen the very first time the app is opened?

| Option | Description | Selected |
|--------|-------------|----------|
| Short 2-step setup — install PWA, then set reminder (Recommended) | Install explainer + persist() → reminder + permission → entry form. | ✓ |
| Straight to entry form — settings discoverable later | Minimal friction but users may never enable notifications. | |
| Onboarding carousel | Too heavy. | |

**User's choice:** 2-step setup
**Notes:** None.

### Q: When should navigator.storage.persist() be called?

| Option | Description | Selected |
|--------|-------------|----------|
| Called silently on first open (Recommended) | Fire-and-forget; browser handles prompt if needed. | ✓ |
| Called after first entry saved | Unlucky timing could wipe data before first save. | |
| Called when user taps "Install" | Tied to install action; iOS has no programmatic install. | |

**User's choice:** Silent call on first open
**Notes:** None.

### Q: If the user opens the app in iOS Safari WITHOUT installing it, what's the notification story?

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit banner: "Install to Home Screen to enable reminders" (Recommended) | Persistent (dismissible) banner on non-standalone iOS. | ✓ |
| Silently disable notification UI | Less educational. | |
| Try to request permission anyway | Silent failure on iOS Safari. | |

**User's choice:** Dismissible banner on non-installed iOS
**Notes:** None.

### Q: How should the reminder time be configured and what does the notification say?

| Option | Description | Selected |
|--------|-------------|----------|
| User picks time; default 21:00; "Log today" (Recommended) | Local TZ, editable later; deep-links to entry form. | ✓ |
| Hardcoded 21:00, no configurability | Violates REQ ENT-07. | |
| Personalised message | Overkill for single-user. | |

**User's choice:** User-picked time, default 21:00, "Log today — how was it?"
**Notes:** None.

---

## Claude's Discretion

- Tailwind utility classes, spacing, font scale
- Toast / inline feedback implementation
- Service worker configuration inside `vite-plugin-pwa`
- Dexie schema version numbering
- Calendar-picker mechanism (native `<input type="date">` vs component library vs custom)
- Tag chip visual treatment
- Notification scheduling mechanism (service worker push vs `showTrigger` API vs local in-app)
- Reminder settings screen layout

## Deferred Ideas

- Tag management screen (rename / merge / delete) — future phase
- Delete entry support — future consideration
- Entry `note` field — v2 requirement INS+03
- Weekly / monthly review on entry screen — Phase 3
- Multiple check-ins per day — out of scope (PROJECT.md)
- Rich note / journaling — out of scope (PROJECT.md)
- Streak or completion stats anywhere in the UI — forbidden (PITFALLS #11)
