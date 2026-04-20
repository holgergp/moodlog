---
phase: 1
slug: foundation
status: active
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- <spec-path>` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds (9 specs, mostly unit-level) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- <spec-path>`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | scaffold | T-01-01, T-01-02, T-01-03 | CSP locked; pinned deps | smoke | `npm run check` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | scaffold | T-01-05 | shadcn first-party only | smoke | `npm run check` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | Nyquist stubs | T-01-04 | all 9 specs exist as RED | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | PITFALLS #8 | T-01-06 | localDate uses local getters | unit | `npm run test -- tests/timezone.test.ts` | ✅ | ⬜ pending |
| 01-02-02 | 02 | 2 | ENT-01..05, ENT-06, DAT-01 | T-01-06, T-01-07, T-01-09, T-01-10 | runtime guards, tx scope | unit | `npm run test -- tests/db.test.ts tests/tagpicker.test.ts tests/entry.test.ts` | ✅ | ⬜ pending |
| 01-03-01 | 03 | 3 | state primitives | T-01-15 | module-scoped $state | unit | `npm run test -- tests/state.test.ts` | ✅ | ⬜ pending |
| 01-03-02 | 03 | 3 | ENT-01..05 widgets | T-01-11, T-01-12, T-01-13, T-01-14 | no {@html}, focus rings, 44px | smoke | `npm run check && npm run test` | ✅ | ⬜ pending |
| 01-04-01 | 04 | 4 | layout shell | T-01-16, T-01-19 | deep-link handler; no payload logs | smoke | `npm run check` | ✅ | ⬜ pending |
| 01-04-02 | 04 | 4 | ENT-01..06 UI | T-01-17, T-01-18, T-01-20 | no +page.server.ts; toast on fail | smoke | `npm run check && npm run test -- tests/copy.test.ts` | ✅ | ⬜ pending |
| 01-04-03 | 04 | 4 | human-verify | — | 30s flow feel test | manual | n/a — human checkpoint | ✅ | ⬜ pending |
| 01-05-01 | 05 | 5 | ENT-07, ENT-08 | T-01-21, T-01-22, T-01-23, T-01-27 | persist + SW routing | unit | `npm run test -- tests/pwa.test.ts tests/sw.test.ts` | ✅ | ⬜ pending |
| 01-05-02 | 05 | 5 | onboarding + banner | T-01-24, T-01-25, T-01-26 | D-15/D-16/D-17/D-18 | smoke | `npm run check && npm run test && npm run build` | ✅ | ⬜ pending |
| 01-05-03 | 05 | 5 | human-verify | — | install + notification delivery | manual | n/a — human checkpoint | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/db.test.ts` — stubs for ENT-01..04 + DAT-01
- [x] `tests/tagpicker.test.ts` — stub for ENT-05
- [x] `tests/entry.test.ts` — stub for ENT-06
- [x] `tests/sw.test.ts` — stub for ENT-07
- [x] `tests/pwa.test.ts` — stub for ENT-08
- [x] `tests/timezone.test.ts` — stub for PITFALLS #8
- [x] `tests/copy.test.ts` — banned-phrase gate (IMPLEMENTED in Wave 0, not a stub)
- [x] `tests/setup.ts` — fake-indexeddb polyfill
- [x] `vitest.config.ts` — references setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 30-second flow on iPhone | PITFALLS #1 | Feel cannot be asserted | Plan 04 Task 3 |
| Notification delivery on real device | ENT-07 | Real-device required | Plan 05 Task 3 |
| 7-day Safari eviction survival | ENT-08 | Empirical, time-based | Post-Phase-1 followup |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
