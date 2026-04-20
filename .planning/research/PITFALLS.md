# Pitfalls Research

**Domain:** Mobile-first personal mood/energy tracker with insight surfacing
**Researched:** 2026-04-20
**Confidence:** HIGH (research-backed, multiple independent sources per claim)

---

## Critical Pitfalls

### Pitfall 1: Friction-Induced Abandonment (the silent habit killer)

**What goes wrong:**
The daily entry flow starts at 30 seconds but accumulates micro-friction over time: an extra confirmation tap, a required field that lacks a "skip" path, a slow initial load on mobile, a scroll to reach the form. None of these alone kills the habit, but they compound. Users stop around day 7-14 not because they decided to quit but because "it's annoying tonight" wins three evenings in a row.

**Why it happens:**
Builders test the flow on a fast WiFi desktop with no cognitive load. Real use is on a phone at 10 pm after a tiring day. Perceived friction is much higher in that state. Required fields and confirmation dialogs that feel defensive in development feel punishing in use.

**How to avoid:**
- The entry form must be the landing page on mobile, not a dashboard with a button to open it.
- All fields except one (mood or energy) must be skippable without a tap path that implies failure.
- No confirmation dialogs or success modals — log and exit, no ceremony.
- Target < 4 taps from app open to entry saved.
- Test the flow with one hand, in portrait, without looking at a full-size screen.

**Warning signs:**
- The Figma/prototype flow has more than 3 screens before the entry is saved.
- Any field has a "required" validator.
- There is a "submit" confirmation step.
- Entry form is reached via a navigation item rather than being the default view.

**Phase to address:** Entry form phase (Phase 1 / core check-in). Must be solved before any other feature.

---

### Pitfall 2: Notification Timing Mismatch

**What goes wrong:**
A fixed-time evening reminder (say, 9 PM) works for the first week, then becomes background noise. Within 30 days users either disable it or tap-dismiss it reflexively without opening the app. The reminder becomes evidence of skipping rather than a trigger for logging.

**Why it happens:**
Fixed-time reminders ignore that the user's "wind-down" window varies by day. A reminder fired mid-meeting or during dinner gets swiped away and the habit breaks. Broken streaks increase abandonment because streaks create an all-or-nothing psychological framing.

**How to avoid:**
- Make reminder time user-configurable at setup, defaulting to 9 PM but with explicit guidance to pick their actual wind-down time.
- No streaks or streak-break punishments. Missing a day should look neutral in the UI, not red or broken.
- The reminder should deep-link directly to the entry form, not the app home screen.

**Warning signs:**
- Reminder time is hardcoded.
- App shows a "streak broken" message or changes the heatmap color for missed days in a punishing way.
- Tapping the notification lands on a dashboard.

**Phase to address:** Phase 1 (core check-in). Notification deep-link must work on day one.

---

### Pitfall 3: Recency Bias Baked Into the Data

**What goes wrong:**
Asking "how was your mood today?" at 10 PM produces an answer heavily weighted toward the last 2-3 hours. Research confirms that recall bias in self-report is substantial when the recall window exceeds 4 hours, and a full-day recall at evening is likely dominated by the most recent and most emotionally intense events. This means early-morning context (a good start, a productive block) is systematically underweighted in the data.

**Why it happens:**
Peak-end rule: humans remember the peak intensity and the most recent moment, not the time-averaged experience. A difficult afternoon meeting can make a great morning disappear from the rating.

**How to avoid:**
- In the UI, the prompt should frame the entry as "overall day" not "right now" — explicit framing reduces but does not eliminate the bias.
- Optionally add a "morning was different" toggle that lets the user override if their day had two distinct halves, without adding another required field.
- In insight views, acknowledge this in copy: "evening entries may reflect your late-day mood more than the full day."
- Do not treat mood data as precise or interval-scale. Use ordinal comparisons (higher/lower), not arithmetic differences.

**Warning signs:**
- The check-in prompt says "How do you feel?" (present moment) instead of "How was today overall?"
- The insight copy says "Your average mood score was 6.4" — this treats ordinal data as interval.
- No acknowledgment of the evening-only limitation anywhere in the app.

**Phase to address:** Phase 1 (check-in copy and prompt design). Phase 3 (insight copy and framing).

---

### Pitfall 4: Scale Ambiguity and Ordinal-as-Interval Errors

**What goes wrong:**
A 1-10 mood scale creates the illusion of mathematical precision. Users don't have a consistent internal reference for what "6" means vs "7". Over time, personal baselines drift: a "7" in week 1 may equal a "5" in month 3 once the user calibrates. When the app then displays "your average mood is 6.4 this week vs 5.9 last week", it is treating ordinal labels as interval measurements — a statistical error that produces meaningless arithmetic.

Additionally, research shows that users cluster in the middle of numeric scales (3-7 on a 10-point scale) and avoid extremes, reducing effective resolution. A 5-point scale or a labeled qualitative scale (e.g., rough / okay / good / great) often captures more honest variation.

**Why it happens:**
Numeric scales feel more "data-like" and produce nicer-looking charts. Developers naturally reach for 1-10. The interval assumption sneaks in when displaying averages and trend lines.

**How to avoid:**
- Use a 5-point labeled scale (1-5 with adjective labels, not just numbers). This is what research supports for mood self-report.
- Never display decimal-precision averages from this data. Use medians or modal values.
- In insight views, frame comparisons as "higher/lower than usual" not as arithmetic differences.
- In code, store the raw ordinal value but avoid computing means in the insight layer — use rank-based comparisons.

**Warning signs:**
- The scale is 1-10 with no labels.
- Any query or component computes `AVG(mood_score)` and displays it with a decimal.
- Trend lines treat the ordinal value as a continuous quantity.

**Phase to address:** Phase 1 (scale design, must be right at data model creation). Phase 3 (insight query layer — enforce rank-based logic).

---

### Pitfall 5: Spurious Correlations on Sub-30-Day Data

**What goes wrong:**
With 30 data points across 5 tracked dimensions (mood, energy, workload, people, solo/social), the combinatorial space of possible correlations is large. Statistical power for detecting a true correlation of r=0.5 requires approximately 30 observations for 80% power. For weaker correlations (r=0.3, which is realistic for lifestyle factors on mood), you need ~80 observations. The app will find patterns at 30 days that are noise. The risk is not just wrong insights — it is specifically wrong insights that feel personally meaningful and may drive behavior change based on coincidence.

**Why it happens:**
Any system that computes correlations across multiple variable pairs and surfaces the "top" result is doing implicit multiple comparisons. Even without formal p-hacking, the practice of "show the strongest correlation" on 5+ variable pairs is multiple testing without correction.

**How to avoid:**
- Do not display correlation-based insights until at least 30 days of data exist. Gate the insight view explicitly.
- When surfacing a correlation callout, show the sample size (n=X days) alongside it.
- Use hedged language: "On days with heavy workload, mood tends to be lower (seen on 12 of 18 tracked days)" — not "heavy workload causes lower mood."
- For the MVP, surface directional patterns with counts, not correlation coefficients. "Low mood occurred on 8 of your 9 heavy-workload days" is both statistically honest and more interpretable than r=-0.72.
- Do not rank or sort multiple correlations and surface only the top one — this is implicit p-hacking.

**Warning signs:**
- The insight engine runs before day 30.
- Correlations are displayed with r values or percentages that imply precision.
- The insight copies says "workload causes..." or "people who drain you..."
- Multiple correlations are computed and only the strongest is shown without acknowledging the comparison.

**Phase to address:** Phase 3 (insight engine design — the most critical statistical risk in the project).

---

### Pitfall 6: Missing-Day Data Skews Trend Comparisons

**What goes wrong:**
Missed entries are not random. Users skip logging on their worst days (too tired, too low) and their most chaotic days (too busy). This creates systematic bias: the dataset overrepresents moderate and good days. Trend lines and weekly averages then look better than reality. When the user uses this data to assess "did workload affect my mood?", the heavy-workload days that were skipped (because they were also terrible-mood days) make the correlation appear weaker than it is.

**Why it happens:**
Missing-not-at-random (MNAR) is the hardest missing data problem. Apps treat gaps as neutral — they simply have no data point. But the gap is itself informative.

**How to avoid:**
- Never impute missing days silently. Gaps in the heatmap should look like gaps (neutral/grey), not interpolated values.
- Weekly summaries should show "X of 7 days logged" prominently, not hide the denominator.
- Insight callouts should only run over contiguous streaks or explicitly show their N. "Based on 22 of 30 days" is the minimum disclosure.
- Do not present trend lines through missing data points — either show them as broken lines or surface a "too many gaps to show trend" state.
- Explicitly note in insights if the data is sparse: the insight engine should check for MNAR-likely patterns (e.g., if high-workload days have disproportionately more missing entries, flag this).

**Warning signs:**
- Weekly averages are computed as `SUM / 7` rather than `SUM / days_logged`.
- The heatmap interpolates or shows a neutral-mood color for missing days rather than a visually distinct "no data" state.
- Trend charts draw a continuous line through missing days.

**Phase to address:** Phase 2 (heatmap and weekly view). Phase 3 (insight engine must check logging completeness before surfacing callouts).

---

### Pitfall 7: Offline Data Loss on Mobile

**What goes wrong:**
User logs an entry on a low-signal train, app appears to save, but the entry never reaches the server and was only held in memory or a transient state. User doesn't notice. Or: user logs in Safari (iOS) without adding the app to the home screen, and Safari's 7-day storage eviction policy wipes IndexedDB data for the origin — all local entries disappear after a week of non-interaction.

**Why it happens:**
Safari enforces aggressive storage eviction: IndexedDB, localStorage, and Cache API data for a web origin is eligible for deletion after 7 days of no interaction unless the app is installed to the home screen (added to Home Screen as a PWA) or `navigator.storage.persist()` has been granted. This is specific to Safari/iOS and catches developers by surprise because Chrome on desktop does not have this behavior.

**How to avoid:**
- Use a server-first write strategy for the entry form: optimistic UI is acceptable, but the entry must be queued durably (in IndexedDB or a service worker background sync queue) before showing confirmation.
- Call `navigator.storage.persist()` on first open and prompt the user to install to Home Screen if not granted.
- Show a clear "saved to server" vs "saved locally, will sync" status on the entry confirmation.
- On startup, always attempt to sync any queued local entries before showing the UI.
- Do not use localStorage for entry data — use IndexedDB with a defined sync queue schema.

**Warning signs:**
- Entry form uses a simple `fetch()` with no offline queue.
- No service worker background sync registered.
- App never calls `navigator.storage.persist()`.
- There is no visual distinction between "synced" and "pending sync" states.

**Phase to address:** Phase 1 (entry form must include offline queue from day one — retrofitting this is painful).

---

### Pitfall 8: Timezone Drift Corrupts the Day Boundary

**What goes wrong:**
User travels across timezones. The evening check-in at 10 PM local time is stored as a UTC timestamp. When the insight engine groups entries by "day", it uses the stored UTC timestamp. A check-in at 10 PM in UTC+2 stores as 20:00 UTC on day D. After travel to UTC-5, a 10 PM entry stores as 03:00 UTC on day D+1. The heatmap now shows two entries on "day D+1" (the travel-day entry attributed to D+1 and the post-travel entry on D+1), and "day D" appears to have no entry. Calendar heatmaps look wrong; the user thinks they missed a day.

**Why it happens:**
Storing UTC and grouping by UTC date is the naive server-side approach. It is correct for events with a single universal moment (a transaction) but wrong for "which day did this feel like to me?" records.

**How to avoid:**
- Store both UTC timestamp AND the local date string (YYYY-MM-DD) and local timezone at entry creation time.
- Group entries by the stored local date string, not by derived UTC date.
- Display the local date in all views; use UTC only for conflict resolution if two entries share the same local date string.

**Warning signs:**
- The entry schema has only a `created_at` UTC timestamp and no `local_date` field.
- The "which day is this?" logic is computed server-side from UTC without a timezone offset.

**Phase to address:** Phase 1 (data model — impossible to fix retroactively without a migration).

---

### Pitfall 9: Tag Explosion from Free-Text People Entry

**What goes wrong:**
The "people I spent time with" field starts as free text or open-ended input. Within two weeks the user has: "Alice", "alice", "Alice B", "Alice from work", "work team", "team". These are effectively five tags for the same person. The correlation engine sees no pattern because the signal is split across five low-frequency variants. The insight surface becomes noise.

**Why it happens:**
Free text feels faster at entry time. The normalization cost only becomes visible when trying to query "days with Alice" and getting 3 results instead of 12.

**How to avoid:**
- People (and any other categorical context) must be a bounded vocabulary from day one: type-to-filter an existing tag, create new tags explicitly.
- On tag creation, show similar existing tags to prevent near-duplicates.
- Tags must be case-insensitive at the storage/query layer.
- No free text for any field that will be used as a grouping dimension in insights.

**Warning signs:**
- The people field is a text input, not a tag selector with autocomplete.
- The database stores people as a raw string column rather than a foreign-keyed tag table.
- There is no "manage tags / merge duplicates" pathway in the UI.

**Phase to address:** Phase 1 (data model must have a tag entity with a FK reference). The entry UI must use a tag picker, not a text field.

---

### Pitfall 10: Heatmap Color Choice Excludes Colorblind Users

**What goes wrong:**
The classic mood heatmap uses a red (low) to green (high) gradient. Roughly 8% of men have red-green color vision deficiency (deuteranopia or protanopia). For them, the heatmap is entirely unreadable — all cells look the same brownish-yellow regardless of value. This is discovered late, if ever, because the developer is not colorblind.

**Why it happens:**
Red-bad, green-good is the instinctive encoding. It matches cultural convention. Developers pick it by default.

**How to avoid:**
- Use a blue-to-yellow sequential palette (e.g., Viridis) or a diverging palette with a neutral midpoint (e.g., purple-white-orange).
- Test the palette with a colorblind simulator (Coblis, Color Oracle, or browser devtools accessibility overlay) before committing.
- Consider using both color AND lightness encoding: the darkest cells should be extreme values regardless of hue, ensuring lightness alone communicates the data even if hues are indistinguishable.
- GitHub's contribution graph uses a single-hue sequential palette (light-to-dark green) — workable because only one hue is needed.

**Warning signs:**
- The heatmap uses `#ff0000` to `#00ff00` or any red-green range.
- No colorblind simulation was run during design review.

**Phase to address:** Phase 2 (heatmap/calendar view implementation). Palette must be chosen at design time, not as a later polish item.

---

### Pitfall 11: Streaks and Gamification Cause Dishonest Entries

**What goes wrong:**
A visible streak counter creates strong loss-aversion pressure. Users who notice they are about to break a 14-day streak will log a throwaway "meh/okay" entry just to preserve the counter, even if they have nothing meaningful to report. This corrupts the dataset in a specific way: streak-preservation entries cluster at modal/neutral values and tend to appear on days the user was not going to log organically. The very days most likely to be skipped (bad days, chaotic days) now get a neutral entry that conceals the skipping pattern.

**Why it happens:**
Streaks are a well-known engagement mechanic. They increase day-over-day retention in the short term. The data quality cost is invisible until you start analyzing patterns.

**How to avoid:**
- No streak counter anywhere in the app.
- No achievement badges or completion celebrations tied to logging frequency.
- The heatmap should show density as a useful data signal, not as a reward/failure system.
- Consider a "logging consistency" stat in the weekly review that is framed descriptively ("you logged 6 of 7 days"), not evaluatively ("you're on a 6-day streak!").

**Warning signs:**
- There is a `current_streak` field in the data model or a streak display in the UI.
- App shows a "Don't break your streak!" message.
- Missing-day coloring in the heatmap is red or uses a shame-signaling color.

**Phase to address:** Phase 2 (weekly review and heatmap design). Avoid introducing streaks in Phase 1 even as a temporary feature — they are hard to remove once users have formed expectations around them.

---

### Pitfall 12: Privacy Leak via Third-Party Analytics or Error Tracking

**What goes wrong:**
A standard setup — Google Analytics, Sentry, or a CDN-delivered error monitoring script — runs in the browser and silently captures page URLs, form interaction events, or network errors. If any of these include mood-related identifiers (URL paths like `/entry/mood=3&workload=heavy`, console logs of entry data, or Sentry breadcrumbs containing form values), sensitive personal mood data is transmitted to a third party's servers. Research found that 67% of analytics/SDK third parties in mental health apps actively collect and analyze user data, and the FTC has fined companies $7M for similar leaks via tracking pixels.

**Why it happens:**
Analytics and error tracking are added early in development as infrastructure defaults. Developers don't think of mood data as sensitive in the same category as health records, but mood + workload + social context is deeply personal and could reveal mental health states, relationship stress, or work performance issues.

**How to avoid:**
- No third-party analytics, ad trackers, or behavioural tracking scripts. Period.
- If error monitoring is needed, use a self-hosted Sentry instance or configure data scrubbing rules that exclude all request bodies, form data, and any URL parameter that encodes user-entered values.
- CSP (Content Security Policy) headers should explicitly block any script not on an allowlist.
- Never log mood values, workload values, or any entry field to the console or to error payloads.
- Conduct a periodic audit: check `network` tab in browser devtools for any outbound requests to non-first-party domains during an entry submission.

**Warning signs:**
- `google-analytics.com`, `googletagmanager.com`, `sentry.io` (cloud), `mixpanel.com`, or similar domains appear in outbound network requests.
- Error reports in Sentry (cloud) contain `breadcrumbs` with form field values.
- URL routing encodes entry data as query parameters.

**Phase to address:** Phase 1 (infrastructure setup — the data model and routing design must treat entry data as opaque from the start). Ongoing: verify at each phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store entries with UTC timestamp only (no local_date) | Simpler schema, no timezone logic | Timezone drift corrupts heatmap; unfixable without data migration | Never — add local_date from day one |
| Free-text people/tag field instead of tag entity | Faster to build | Tag explosion makes insights meaningless; normalization requires a migration and user cleanup | Never for fields used as grouping dimensions |
| localStorage for entry data | Simpler than IndexedDB | Safari evicts after 7 days; no offline queue support; sync impossible | Never for persistent app data |
| 1-10 numeric scale, no labels | Looks precise in charts | Interval arithmetic errors in insights; scale drift over time; reduced honest variation | Never — use 5-point labeled scale |
| Show correlations before day 30 | Provides early value | Surfaces spurious patterns; trains users to trust noise; undermines trust when contradicted by later data | Never for correlation claims; acceptable for simple descriptive stats (logging counts, modal values) |
| Streak counter for retention | Short-term engagement bump | Corrupts dataset with neutral-value filler entries; moralizes missing days | Never |
| `AVG(mood_score)` in insight queries | One SQL line | Treats ordinal as interval; decimal precision implies false exactness | Never in insight copy; acceptable as an internal sort key only |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Browser storage (Safari/iOS) | Assume IndexedDB is durable like a server database | Call `navigator.storage.persist()` on first load; prompt for Home Screen install; queue writes durably before showing confirmation |
| Push notifications (web) | Use a fixed 9 PM server-side push | Store user's preferred reminder time; send notification that deep-links directly to the entry form |
| Cross-device sync | Rely on a single write and assume replication | Treat every entry as an event with a client-generated UUID and created_at + local_date; last-write-wins is acceptable for a single-user app |
| Service worker cache | Cache HTML/JS aggressively, including the entry form | Bust cache on deploy; stale service worker can serve an outdated form schema that rejects new fields |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Computing all pairwise correlations on every insight page load | Sluggish insight view on mobile after 90+ days | Pre-compute correlation stats incrementally on write; cache results | ~60-100 entries |
| Loading full entry history for heatmap render | Long initial load; janky scroll on mobile | Load only date + mood_value for heatmap; lazy-load full entry on tap | ~200+ entries |
| Re-running insight queries on every render | Redundant computation; battery drain | Memoize insight results; recompute only when new entries are added | Any time |
| Unindexed `local_date` field in queries | Slow day-grouping queries as dataset grows | Index `local_date` from day one in the schema | ~500+ entries |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Mood data in URL query parameters | Data in browser history, server logs, referrer headers | Use POST body for all entry writes; UI routing should not encode field values in URLs |
| Third-party scripts (analytics, CDN fonts, error tracking) running in the app context | Exfiltration of mood/workload/social data to third parties | No third-party scripts; self-host any needed assets; enforce strict CSP |
| No export/backup mechanism | Total data loss if the server or database is unavailable | Build CSV/JSON export in Phase 2 at latest; user should always be able to retrieve their own data |
| Console.log of entry objects during development left in production | Sensitive data visible in DevTools; risk if browser extensions read console | Lint rule to ban console.log in production; strip in build |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "How do you feel?" prompt (present tense) | Captures the moment of logging, not the day — amplifies recency bias | "How was today overall?" with an optional "my morning was very different" modifier |
| Decimal precision in insight copy ("avg: 6.4 this week") | Implies false mathematical precision; treats ordinal data as interval | "Higher than usual" / "lower than usual" with day counts: "7 of 9 heavy-workload days had lower mood" |
| Red/green heatmap | Unreadable for ~8% of male users; "red = bad" framing moralizes low mood days | Single-hue sequential palette (light to dark) or colorblind-safe diverging palette |
| "Bad day" / "good day" language | Moralizes emotional states; can increase negative self-perception on logging bad days | Neutral language: "lower energy", "higher workload", "mood: rough" — avoid evaluative adjectives |
| Streak counter visible in the UI | Creates filler entries on streak-break days; shame on missing days | No streak counter; log density shown descriptively ("6 of 7 days logged") in weekly review only |
| Confirmation modal after entry | Adds one unnecessary tap on mobile after an already-completed interaction | Log and exit; show a brief inline toast ("Logged") that disappears without requiring a tap |
| Entry form behind navigation (not the landing page) | Extra taps before logging; reduces completion rate on tired evenings | Entry form IS the home screen when no entry exists for today |

---

## "Looks Done But Isn't" Checklist

- [ ] **Entry form:** Verify it loads in under 2 seconds on a 3G-throttled mobile connection and requires no authentication redirect.
- [ ] **Offline save:** Verify an entry created with airplane mode enabled syncs to the server when connection is restored — without the user doing anything.
- [ ] **Timezone handling:** Log an entry at 11:50 PM, then check that the heatmap attributes it to the correct local date, not to the following UTC day.
- [ ] **Missing day display:** Verify that a day with no entry shows a visually distinct "no data" state in the heatmap, not a neutral-mood color that looks like a logged bad day.
- [ ] **Tag deduplication:** Create tag "Alice", then try to create "alice" — verify the picker surfaces the existing tag rather than creating a duplicate.
- [ ] **Insight gating:** Verify the correlation insight view does not show any callouts until at least 30 days of entries exist.
- [ ] **No decimal averages:** Search the codebase for `AVG(` and any `.toFixed(` calls in insight display code. Each one is a false-precision bug.
- [ ] **No third-party outbound requests:** Open DevTools Network tab, submit an entry, verify zero requests go to non-first-party domains.
- [ ] **Colorblind heatmap:** Run the heatmap through Coblis (deuteranopia simulation) and verify the low/high ends are still distinguishable.
- [ ] **persistent storage:** Verify `navigator.storage.persist()` is called and the result is logged; verify the app prompts to install to Home Screen if not granted.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timezone drift (no local_date stored) | HIGH | Write a migration to infer local_date from timezone metadata if available, else flag entries as ambiguous; heatmap will have known-bad period |
| Tag explosion (free-text people) | MEDIUM | Build a merge-tags UI; export all unique tags for manual review; re-associate entries with canonical tags |
| Spurious correlations shown early | LOW | Remove the insight callout; add the 30-day gate; add hedged language to remaining callouts |
| Streak counter introduced and now expected by user | MEDIUM | Remove streak counter; replace with descriptive logging stats; explain in UI copy why the change was made |
| Third-party analytics discovered to have been running | HIGH | Revoke API keys; purge data from third-party service if possible; audit what was transmitted; implement CSP; notify self (this is personal data) |
| Safari evicted IndexedDB (no persistent storage) | HIGH | Data is gone; implement persistent storage request + sync queue before re-onboarding |
| Ordinal data treated as interval throughout codebase | MEDIUM | Refactor insight queries to use median and rank-based comparisons; update all display copy to remove decimal averages |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Friction-induced abandonment | Phase 1: Entry form | Manually test: phone, one hand, 10 PM, tired. Count taps. Must be ≤ 4. |
| Notification timing mismatch | Phase 1: Entry form + notifications | Tap notification, verify it deep-links to entry form. Verify no streak counter. |
| Recency bias in prompts | Phase 1: Entry form copy | Audit all prompt text for present-tense "how do you feel?" language |
| Scale ambiguity + ordinal-as-interval | Phase 1: Data model | Search for AVG() in queries; verify scale is 1-5 with labels |
| Timezone drift | Phase 1: Data model | Schema review: must have local_date column. Add timezone test case. |
| Tag explosion | Phase 1: Data model + entry UI | Schema review: tags must be a separate entity with FK. Entry UI must use picker not free text. |
| Offline data loss (Safari) | Phase 1: Infrastructure | Test: submit entry in airplane mode; verify sync on reconnect; verify persistent storage request |
| Missing-day skew | Phase 2: Heatmap + weekly review | Verify heatmap shows visually distinct "no data" cells; weekly summary shows X/7 denominator |
| Colorblind heatmap | Phase 2: Heatmap design | Run Coblis deuteranopia simulation on heatmap screenshot |
| Streaks causing filler entries | Phase 2: Weekly review | Verify no streak counter exists anywhere in the app or data model |
| Spurious correlations | Phase 3: Insight engine | Verify insight callouts are gated at 30 days; verify hedged language; verify no sorted-top-1 pattern |
| Privacy leak via analytics | Phase 1 setup + every phase | DevTools network audit on entry submission: zero third-party requests |

---

## Sources

- JMIR Mental Health: "Understanding People's Use of and Perspectives on Mood-Tracking Apps" (PMC8387890) — user friction, avoidance of negative entries, lack of actionable insight
- Mark Koester, "An Experiment in Mood Tracking" (markwk.com) — scale ambiguity, low-variance data, tracking-is-easy-insight-is-hard
- k4m1tsuki, "5.5 Years of Mood Tracking: Why Data Doesn't Equal Insight" (Medium) — habituation without purpose, data collection vs comprehension gap
- NIH PMC, "Measuring bias in self-reported data" (PMC4224297) — recency and recall bias in self-report
- WebKit Blog, "Updates to Storage Policy" (webkit.org/blog/14403/) — Safari 7-day eviction policy for non-installed origins
- web.dev, "Persistent storage" (web.dev/articles/persistent-storage) — `navigator.storage.persist()` API and behavior
- Wistia Engineering, "Designing Color-Blind-Friendly Heatmaps" (wistia.com) — red-green problem, Viridis alternative
- PMC, "On the privacy of mental health apps" (PMC9643945) — third-party SDK data collection in mental health apps
- FTC action against Cerebral (multiple sources) — tracking pixel mood data leaks
- ScienceDirect, "At what sample size do correlations stabilize?" — sample size requirements for reliable correlations
- Simpson's Paradox in Psychological Science, PMC3740239 — subgroup filtering reversals in small datasets
- False precision, Wikipedia — ordinal-as-interval errors in wellness scoring

---
*Pitfalls research for: Mobile-first personal mood/energy tracker (MoodLog)*
*Researched: 2026-04-20*
