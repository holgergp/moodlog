# Phase 1: Foundation - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

User can log a complete 30-second evening check-in from their phone: mood, energy, workload, social split, and people tags. The entry persists reliably in local IndexedDB (via Dexie) and survives Safari's 7-day eviction. The app is installable as a PWA, with an evening push notification deep-linking to the entry form. Past entries can be edited and missed days can be backfilled.

In scope: entry form (ENT-01..05), edit/backfill (ENT-06), configurable evening notification (ENT-07), PWA + `navigator.storage.persist()` (ENT-08), local persistence via Dexie (DAT-01).

Out of scope: any remote sync, password gate, CSV/Markdown export, calendar heatmap, weekly review, history list, insight callouts, raw-data table. These belong to Phases 2-4.

</domain>

<decisions>
## Implementation Decisions

### Entry form layout

- **D-01:** Single-screen vertical scroll. All fields visible at once, single Save button at the bottom. No stepper, no multi-screen wizard.
- **D-02:** The entry form IS the app home screen — no dashboard, no landing page before it (PITFALLS #1).
- **D-03:** No confirmation modal on save. Show a brief inline toast ("Logged") that auto-dismisses; no tap required to continue.

### Input widgets

- **D-04:** Mood (1-5) and energy (1-5): 5 discrete buttons, filled-dot indicator for the selected value. No emoji faces (avoids moralising framing). No slider (avoids ordinal-as-interval illusion).
- **D-05:** Workload (light / moderate / heavy): 3-button horizontal segmented control with text labels. No emoji.
- **D-06:** Social split (3-step ordinal): labels "Mostly alone", "Mixed", "Mostly with others". Stored as ordinal 1 / 2 / 3. Same 3-button segmented control pattern as workload.
- **D-07:** People tags: inline autocomplete input with chip row above. Typing filters existing tags; tapping a chip toggles it. "+ Create new" appears at the bottom of the filtered list when no exact match exists.

### Field defaults & required-ness

- **D-08:** No fields have pre-selected values. Save is always enabled. Empty fields save as `null`. No required-field validators, no "please select" errors (PITFALLS #1).

### Tag handling

- **D-09:** Tag duplicate-prevention: case-insensitive match + whitespace trim on a stored lowercase key. The display name the user typed is preserved on the tag row. Typing `alice` surfaces existing `Alice` in the filter list (PITFALLS #9).
- **D-10:** No in-app tag management (rename / merge / delete) in Phase 1 — deferred. Case-insensitive matching prevents duplicates; a management screen can come later if genuine cruft accumulates.

### Edit & backfill flow

- **D-11:** When an entry already exists for the target date, the form pre-fills with the saved values and the Save button reads "Update". Same screen, same layout — no separate edit view.
- **D-12:** The form header shows a tappable date chip (defaulting to today). Tapping it opens a calendar picker; selecting a date re-loads the form for that date. Single surface for both backfill and edit.
- **D-13:** No limit on how far back the user can backfill. Future dates are blocked in the date picker.
- **D-14:** A past day with no entry shows the same neutral empty form — no "missed" badge, no red/grey negative styling, no "fill in the gap" prompt (PITFALLS #11, no guilt framing per REQ ENT-06).

### First-open onboarding

- **D-15:** Two-step setup on first open:
  1. "Add to Home Screen" explainer (how-to, per-platform) + `navigator.storage.persist()` called silently in parallel.
  2. Reminder time picker (default 21:00, local timezone) + notification permission request.
  Then land on the empty entry form.
- **D-16:** `navigator.storage.persist()` is called silently on first open regardless of whether the user proceeds with the explainer (PITFALLS #7).
- **D-17:** Onboarding is skippable — "Skip for now" goes straight to the entry form. The reminder-time picker lives in a settings screen for later configuration.

### iOS fallback

- **D-18:** On non-installed iOS Safari (display-mode: not standalone AND user-agent detection), show a dismissible banner at the top of the entry form: "Install to Home Screen to enable reminders." Banner dismissal persists per-session; re-appears on next open until dismissed again or install detected. This is the honest surface for the iOS web-push limitation.

### Notifications

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

### Folded Todos

None — no pending todos matched Phase 1 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §Phase 1 — Goal, success criteria, required requirements coverage
- `.planning/REQUIREMENTS.md` §Entry (ENT-01..08) and §Data (DAT-01) — Acceptance criteria for each requirement
- `.planning/PROJECT.md` §Constraints, §Key Decisions — Friction budget, mobile-first, single-user, single-device v1

### Stack and architecture

- `.planning/research/STACK.md` — Locked stack (SvelteKit 2.57.x, Svelte 5.55.x, Tailwind 4.2.x, Dexie, vite-plugin-pwa). Installation commands and what NOT to use.
- `.planning/research/STACK.md` §Version Compatibility — Pin ranges for svelte/kit/tailwind/drizzle
- `.planning/research/ARCHITECTURE.md` §Data Model — `entries` / `tags` / `entry_tags` schema. **NOTE:** the architecture doc references Supabase for sync; Phase 1 is Dexie/IndexedDB only. The sync/remote parts of ARCHITECTURE.md are out of scope for Phase 1.
- `.planning/research/ARCHITECTURE.md` §Pattern 2 — Write-through local cache pattern (the Phase 1 version skips the remote queue)

### Pitfalls — these are hard constraints for Phase 1

- `.planning/research/PITFALLS.md` §Pitfall 1 (Friction abandonment) — ≤4 taps, no required fields, entry form is home
- `.planning/research/PITFALLS.md` §Pitfall 2 (Notification timing) — Configurable time, deep-link to form, no streaks
- `.planning/research/PITFALLS.md` §Pitfall 4 (Scale ambiguity) — 1-5 labeled scale, no AVG/decimals stored
- `.planning/research/PITFALLS.md` §Pitfall 7 (Offline data loss on Safari) — call `navigator.storage.persist()`, prompt install
- `.planning/research/PITFALLS.md` §Pitfall 8 (Timezone drift) — store local_date, not UTC date
- `.planning/research/PITFALLS.md` §Pitfall 9 (Tag explosion) — normalised tag table, case-insensitive matching, no free text
- `.planning/research/PITFALLS.md` §Pitfall 11 (Streaks/gamification) — absolutely no streak counter, no achievement badges, missing-day colour must be neutral
- `.planning/research/PITFALLS.md` §Pitfall 12 (Privacy leak via analytics) — no third-party scripts, no Sentry cloud, strict CSP
- `.planning/research/PITFALLS.md` §"Looks Done But Isn't" Checklist — use as acceptance gates before Phase 1 is marked done

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- None — greenfield project. No `src/`, no `package.json`, no existing components. Phase 1 scaffolds the project.

### Established Patterns

- None in-repo yet. Patterns will come from:
  - SvelteKit 2 form actions for the entry save path (progressive-enhancement default)
  - Svelte 5 runes (`$state`, `$derived`) for the draft/entry reactive model
  - shadcn-svelte copy-in primitives (not npm dep) for buttons, dialog, calendar
  - Tailwind v4 `@theme` CSS-native config (no `tailwind.config.js`)

### Integration Points

- Project scaffold command from STACK.md §Installation: `pnpm create svelte@latest moodlog` then Drizzle (NOT used in Phase 1 — local IndexedDB only, no Turso yet), Tailwind v4, shadcn-svelte, vite-plugin-pwa.
- Dexie schema lives in `src/db/local.ts` (or equivalent). Schema version 1 = Phase 1.
- Service worker generated by `vite-plugin-pwa` — Phase 1 needs it for "installable" status and offline app-shell caching, not yet for background sync.

</code_context>

<specifics>
## Specific Ideas

- "The entry form IS the home screen when no entry exists for today" — lifted from PITFALLS #1, treated as a hard rule.
- "Log today — how was it?" is the exact notification body.
- Form header date chip: tappable, defaults to today, opens calendar picker on tap. This is the single entry point for backfill/edit — no separate History screen in Phase 1.
- Social-split labels: "Mostly alone" / "Mixed" / "Mostly with others" (verbatim).
- Non-installed iOS Safari banner: "Install to Home Screen to enable reminders" (verbatim).

</specifics>

<deferred>
## Deferred Ideas

- **Tag management screen** (rename / merge / delete) — Deferred. Revisit in a later phase only if case-insensitive matching proves insufficient in real use.
- **Delete entry** — Not discussed; assume not in Phase 1. If needed, add a "clear this entry" affordance on the edit form in a later phase.
- **Weekly / monthly review on entry screen** — Explicitly Phase 3.
- **Multiple check-ins per day** — Out of scope per PROJECT.md.
- **Rich note field on entries** — Out of scope per PROJECT.md (would violate the 30-second bar). `note TEXT` column in ARCHITECTURE.md is a v2 possibility (INS+03), not Phase 1.
- **Streak / heatmap / completion stats in Phase 1** — Explicitly forbidden by PITFALLS #11 and PROJECT.md "no gamification".

### Reviewed Todos (not folded)

None — no pending todos matched Phase 1 scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-20*
