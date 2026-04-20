# Feature Research

**Domain:** Personal mood / energy / context tracker (single-user, mobile-first web)
**Researched:** 2026-04-20
**Confidence:** HIGH (table stakes, anti-features); MEDIUM (differentiators — interaction detail sparse from public sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users of any mood tracker assume exist. Absent ones make the product feel broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quick mood + energy rating on entry | Core reason to open the app; every mood tracker has this | LOW | Tap-to-pick or single drag. Daylio proved two taps is achievable. Avoid sliders — cognitive load; prefer fixed 5-point emoji/dot row |
| Single-screen daily entry | 30-second contract; anything requiring navigation kills it | LOW | All fields on one scrollable card: mood, energy, workload, social split, people tags. Progressive disclosure for rarely-changed fields |
| Evening push notification / reminder | Without it, logging rate drops sharply within 2 weeks | LOW | User-configurable time. Single daily notification. No "you haven't logged in 3 days!" guilt ping |
| Basic history view (list or table) | User needs to verify data was saved and correct mistakes | LOW | Chronological list, tap to edit. Simple is fine |
| Calendar heatmap view | Standard genre expectation after Daylio popularised it; users recognise the pattern immediately | MEDIUM | Month grid, color by mood or energy, tap a day to see entry detail. Works naturally for mobile-first |
| Entry edit / backfill | Life happens; user must be able to log yesterday | LOW | Date picker on entry screen. No guilt UX ("logging for yesterday") |
| Data persistence across devices | Phone logs; desktop reviews. Without sync, phone data is trapped | MEDIUM | Single-user doesn't mean single-device. Cloud sync or at minimum manual export/import |
| CSV export | Power users and self-researchers expect raw data access | LOW | Export all entries as CSV with columns: date, mood, energy, workload, social_split, people_tags |
| Settings for notification time | Respects different evening schedules | LOW | Simple time picker |

---

### Differentiators (Competitive Advantage)

Features that align with the project's Core Value: surface a non-obvious pattern. These are where MoodLog competes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Correlation callouts with honest uncertainty | Core value delivery. Most apps show charts; few surface "workload heavy days precede low energy two days later" in plain language | HIGH | Require minimum ~20 data points before showing any correlation. Display strength + confidence separately (see Exist model). Always include "this may be coincidence" caveat. Never show correlations as predictions |
| People-tag autocomplete with reuse | Typing names on mobile every day is the friction killer for social context. Autocomplete from past entries solves this | LOW | Free-form + autocomplete from prior entries. No controlled vocabulary — user defines their own names. Chips/pills on entry screen. Manage list in settings |
| Workload intensity as a first-class field | Most trackers focus on mood only. Work context is the suspected driver here; making it a primary field (not a note) enables programmatic correlation | LOW | Three-option picker: light / moderate / heavy. One tap. No free-text |
| Alone-vs-social split as quick slider | Social context is a known mood correlate; capturing it without a text field keeps entry fast | LOW | Could be a 3-step scale (mostly alone / mixed / mostly social) or a simple slider with end labels. Avoid percentage entry |
| Weekly review screen | Surfaces weekly patterns in a scannable summary without requiring the user to interpret raw charts | MEDIUM | 7-day summary: average mood, average energy, dominant workload, most-tagged people, any standout days. Text callouts preferred over more charts |
| Privacy-first local data model | Niche differentiator but high trust value for personal mental-state data. The user is also the operator — no third-party has legitimate access interest | LOW | Use IndexedDB / localStorage as primary store. Cloud sync is for personal use only (no third-party analytics, no telemetry). Transparent about what leaves the device |
| "Minimum data" insight philosophy | Counter-cultural in QS space: show nothing until there's enough data to say something. No fake insights on day 3 | LOW | Gate correlation screen until N >= 20 entries. Show progress toward that threshold ("14 more entries before patterns can surface") |

---

### Anti-Features (Deliberately NOT Building)

Features that appear in competitor apps that are inappropriate for this project's specific constraints: single-user, 30-second friction cap, insight-focused, honest/non-moralising.

| Feature | Why Requested | Why Problematic Here | Alternative |
|---------|---------------|----------------------|-------------|
| Streak counters / streak anxiety | Increases retention in multi-user commercial apps; creates sense of accountability | Punishes gaps rather than rewarding reflection. Research shows streak obsession → abandonment when streak breaks. For a 30-day insight goal, missing day 12 is noise, not failure. Evaluative framing ("3 days maintained") vs. observational framing is the wrong direction for honest self-knowledge | Show entry count toward insight threshold (neutral progress) instead of streak |
| Gamification (badges, XP, levels, achievements) | Adds novelty, increases short-term engagement | Single user — no competition. Introduces extrinsic motivation that displaces the intrinsic goal (insight). Research shows overjustification effect: adding rewards to self-motivated behaviour reduces engagement over time | The data itself and the insights are the reward |
| Social sharing / export to social media | Common in fitness tracking; satisfies social comparison drive | Out of scope (single-user). Mental state data shared publicly is a safety and regret risk. Adds scope and UI surface area with no value for this use case | CSV export covers legitimate sharing (therapist, personal analysis) |
| AI chatbot / journaling assistant | Trendy 2024-2025 feature; surface-level engagement | Violates 30-second contract. Converts a data-capture tool into a conversation tool. Prose journaling is explicitly out of scope in PROJECT.md | If text context is needed, an optional single-line note field on the entry (not prompted) |
| Mood "score" displayed as a single number with positive/negative framing | Most apps default to this ("Your mood score this week: 6.2 / 10") | Moralises the data. 6.2 is not worse than 8.0 — it is the data. Framing as a score to optimise creates evaluative anxiety and teaches users to manage their perceived score rather than notice genuine patterns | Show the raw scale value (e.g. "3" on a 1-5 scale) with no qualitative label. Use color coding neutrally |
| Wellbeing recommendations / advice | Apps like Reflectly push "try a gratitude exercise" after low mood entries | Unsolicited advice based on single data points is noise. Low mood after a heavy workload day is an insight; prescribing a remedy misses the point and adds paternalistic friction | Surface the pattern ("heavy workload days correlate with lower mood") and let the user draw conclusions |
| Multiple check-ins per day | Some trackers allow logging every few hours for granular data | Violates the single-evening-entry decision in PROJECT.md. Granularity adds cognitive load without a clear benefit when work/social context is the variable of interest | One evening entry, optionally backfilled if missed |
| Paid tier / subscription gate on insights | Revenue model for commercial apps; locks core features | Single-user personal tool; no monetisation needed. Feature gates add friction and split attention during development | No tiers |
| Wearable / third-party integrations (calendar, HR) | Powers automatic tracking in apps like Exist.io | Manual logging is the design choice; avoids scope creep in v1. Automatic data can mask signal by adding noise from passive capture | Revisit only if manual logging proves insufficient after 30 days |
| Password / biometric lock on app | Privacy feature users of clinical apps want | Single-user, single-device web app with no multi-user surface. Native device lock covers this. Adding in-app auth adds friction to the 30-second entry | Rely on device-level security |

---

## Feature Dependencies

```
People-tag autocomplete
    └──requires──> Tag persistence layer (saved tags list)
                       └──requires──> Entry storage layer

Correlation callouts
    └──requires──> Entry storage layer (N >= 20 entries)
    └──requires──> Workload field as structured data (not free-text)
    └──requires──> People-tag as structured data (not free-text)
    └──requires──> Mood as numeric data (not emoji-only)
    └──requires──> Energy as numeric data

Weekly review screen
    └──requires──> Entry storage layer
    └──requires──> At least 7 entries

Calendar heatmap
    └──requires──> Entry storage layer
    └──requires──> Mood or energy as numeric data

Data persistence across devices
    └──requires──> Entry storage layer (local)
    └──enhances──> CSV export (manual device-to-device path)

CSV export
    └──requires──> Entry storage layer
```

### Dependency Notes

- **Correlation callouts require structured numeric fields:** People tags as free-text strings will not produce correlations — they must be stored as a normalised list and counted. Mood must be stored as 1-5 integer, not emoji. This constrains the data model from day one.
- **Correlation callouts require entry count gate:** Showing correlations before ~20 entries produces spurious patterns. The gate itself is a feature, not a bug — it resets user expectations honestly.
- **Weekly review enhances correlation callouts:** Once correlations are computed, the weekly review is a curated surface for showing them contextually rather than in a separate analytics screen.
- **People-tag autocomplete is the key friction point for social context:** Without it, typing names on mobile makes the social field the slowest part of the entry and will be skipped. It must exist in v1 for the people-correlation insight to be achievable.

---

## MVP Definition

### Launch With (v1)

Minimum needed to reach the 30-day / first-real-insight success bar.

- [ ] Single-screen evening entry: mood (1-5), energy (1-5), workload (3-option), social split (3-option), people tags (autocomplete from past entries) — entry completable in 30s on mobile
- [ ] Entry edit / backfill with date picker
- [ ] Entry storage layer with structured numeric fields (required for correlations to be possible at all)
- [ ] Evening push notification at user-configurable time
- [ ] Calendar heatmap (month view, color by mood) — the primary visual feedback loop
- [ ] Basic history list — trust and data verification
- [ ] CSV export — data safety and escape hatch
- [ ] Correlation screen, gated until N >= 20 entries, showing strength + confidence, no spurious early results

### Add After Validation (v1.x)

Add once 30-day streak proves the entry loop works and there is real data to review.

- [ ] Weekly review screen — add when enough data exists to make it useful (trigger: 2+ weeks logged)
- [ ] Filter/search on history view — add when history is long enough to need navigation
- [ ] Device sync improvement — add if manual export proves cumbersome across phone/desktop

### Future Consideration (v2+)

Defer until post-insight evaluation.

- [ ] Energy-focused heatmap (second color dimension) — useful but calendar heatmap with mood is enough for v1
- [ ] Correlation trend over time (does pattern strengthen as more data arrives?) — requires significant data history
- [ ] Optional single-line note field — defer to avoid prose-creep into the 30s contract

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single-screen 30s entry | HIGH | LOW | P1 |
| People-tag autocomplete | HIGH | LOW | P1 |
| Entry storage with structured fields | HIGH | LOW | P1 |
| Evening push notification | HIGH | LOW | P1 |
| Calendar heatmap | HIGH | MEDIUM | P1 |
| CSV export | MEDIUM | LOW | P1 |
| History list + edit | MEDIUM | LOW | P1 |
| Correlation callouts (gated) | HIGH | HIGH | P1 (gated — build data model now, surface later) |
| Weekly review screen | MEDIUM | MEDIUM | P2 |
| Device sync | MEDIUM | MEDIUM | P2 |
| History filter/search | LOW | LOW | P3 |
| Energy heatmap variant | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch or for the data model that enables later features
- P2: Add after 2+ weeks of real data
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Daylio | Bearable | Exist.io | MoodLog approach |
|---------|--------|----------|----------|-----------------|
| Entry speed | 2 taps (mood + activities) | ~5 taps across multiple sections | Many integrations, less manual | Target 30s single-screen, all fields visible |
| Mood scale | 5-level emoji | 1-10 numeric | 1-9 numeric | 1-5 with color + optional emoji label (avoid pure emoji — hard to correlate) |
| People tagging | Activity tags (not people-specific) | "People" as a trackable factor | Manual custom tags | First-class people field with autocomplete |
| Correlation display | Basic stats in premium | Trend charts | Strength + confidence stars, honest about small n | Adopt Exist model: strength + confidence separated, minimum data gate |
| Calendar heatmap | Yes (core feature) | No | Yes | Yes, primary visual surface |
| Streak mechanic | Yes (premium) | Yes | No | Deliberately absent |
| AI / chatbot | No | No | No | Deliberately absent |
| Privacy model | Cloud default | Cloud default | Cloud (third-party integrations) | Local-first, explicit about what syncs |
| Export | CSV (premium) | CSV (premium) | CSV | CSV free, always available |

---

## Entry Flow: How to Hit 30 Seconds

Based on research into Daylio, Moodistory, and UX case studies, the following interaction pattern achieves sub-30s entry on mobile:

1. **Open app** via notification tap — lands directly on today's entry form, not a home screen
2. **Mood row** — 5 colored dots/icons in a single horizontal row. One tap. No label required
3. **Energy row** — same pattern, immediately below
4. **Workload** — 3-button segmented control (Light / Moderate / Heavy). One tap
5. **Social split** — 3-button segmented control (Mostly alone / Mixed / Mostly with others). One tap
6. **People** — tag chips; typing triggers autocomplete from past entries; tap to add; tap existing chip to remove
7. **Save** — large prominent button. No confirmation dialog

Steps 1-7 on a phone with autocomplete for one person takes approximately 15-25 seconds. The 30-second budget accommodates 2-3 people tags being typed/selected.

**Pattern: fixed vocabulary for structured fields (workload, social), free-form + autocomplete for people.** Structured fields keep them fast and correlation-friendly. People field stays flexible because the user defines their own social world.

---

## Correlation Rendering: Non-Misleading Patterns for Small N

The key tension: after 30 days (~30 data points), any correlation engine will find patterns. Most will be noise.

Honest rendering principles drawn from Exist.io model and statistical research:

1. **Minimum data gate** — show nothing before 20 entries. Display "N more entries until patterns surface" as progress, not a countdown
2. **Separate strength from confidence** — strength shows how consistent the pattern is in the available data; confidence shows how much data backs it up. A strong pattern on 5 data points has low confidence
3. **Causal language ban** — never say "causes", "leads to", "predicts". Use "on days with X, Y tended to be higher/lower"
4. **Surface 2-3 patterns maximum** — ranked by confidence. More patterns = more false positives shown
5. **Show the scatter** — alongside any callout, show the underlying scatter plot so the user can see the raw spread. Hides nothing
6. **Name the exceptions** — "This held on 18 of 24 matching days" is more honest than a correlation coefficient users won't interpret correctly

---

## Sources

- [Bearable vs Daylio comparison — bearable.app](https://bearable.app/bearable-vs-daylio-which-one-should-you-choose/)
- [What are correlations? — Exist Knowledge Base](https://kb.exist.io/article/37-what-are-correlations)
- [Mobile apps for mood tracking: analysis of features and user reviews — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5977660/)
- [Understanding People's Use of and Perspectives on Mood-Tracking Apps — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8387890/)
- [I've Tracked My Mood for Over 1000 Days: A Data Analysis — Medium/TDS](https://medium.com/data-science/ive-tracked-my-mood-for-over-1000-days-a-data-analysis-5b0bda76cbf7)
- [Gamification of social apps: streaks, badges and addiction — TheTechTrends](https://thetechtrends.tech/gamification-of-social-apps/)
- [Best Mood Tracker Apps 2025 — Lume Journal App comparison](https://lumejournalapp.com/the-best-mood-tracker-apps-in-2025/)
- [Mood Tracker UX Case Study — Musing App, Medium](https://medium.com/@samgg/musing-mood-tracking-app-3385629d66db)
- [Offline-First PWAs — DEV Community](https://dev.to/wellallytech/offline-first-pwas-build-resilient-apps-that-never-lose-data-ach)
- [moodtracker — serverless offline-first PWA reference — GitHub](https://github.com/benji6/moodtracker)

---
*Feature research for: MoodLog — personal mood/energy/context tracker*
*Researched: 2026-04-20*
