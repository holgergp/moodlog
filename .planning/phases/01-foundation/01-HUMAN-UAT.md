---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md]
started: "2026-04-21T14:45:00.000Z"
updated: "2026-04-21T14:45:00.000Z"
---

## Current Test

[awaiting Phase 1.5 deployed URL + real iPhone]

## Tests

### 1. Real-device evening notification delivery + deep-link (ENT-07 / SC #3)

expected: On a real device with the app installed, notification permission granted, and `reminder_time` ~2 minutes in the future, an OS-level notification fires with body `Log today — how was it?`. Tapping it opens the entry form at `/?date=today`. The URL param is consumed and stripped from history by the layout handler.

result: [pending — delegated to Phase 1.5 Plan 03 Block 3]

### 2. Real iOS Safari Add-to-Home-Screen + entries survive Safari restart (ENT-08 / SC #4)

expected: On iPhone iOS Safari, visiting the deployed app URL, Share → Add to Home Screen, opening the Home Screen icon (standalone mode), saving a mood entry, force-quitting Safari, and re-opening from the Home Screen: the saved entry is still present in IndexedDB.

result: [pending — delegated to Phase 1.5 Plan 03 Block 7]

### 3. 7+ day Safari eviction survival on installed PWA (DAT-01 / SC #5)

expected: Install the app to Home Screen, log an entry, do not open the app for 7 or more days, then re-open from the Home Screen icon. The logged entry is still present.

result: [pending — calendar-bound; schedule ~7 days after Phase 1.5 deploy]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

None identified. All three items have complete, unit-tested code paths; what's missing is the external observation channel (deployed HTTPS URL + real iPhone + calendar time), which Phase 1.5 is explicitly scoped to provide.
