---
phase: 2
slug: scheduler
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm typecheck && pnpm lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm typecheck && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SCHED-01 | — | N/A | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SCHED-02 | — | N/A | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SCHED-03 | — | N/A | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | SCHED-04 | — | OT rows highlighted, not editable | unit | `pnpm vitest run app/components/ag-grid/__tests__/row-class-rules.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SCHED-05 | — | N/A | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SCHED-06 | T-02-01 | Org-scoped insert only | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | SCHED-07 | — | N/A | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | SCHED-08 | — | N/A | E2E | `pnpm --filter e2e playwright test scheduler` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Week start date computation utility — unit testable with Vitest
- [ ] E2E tests require seed data in `ops_task_schedule` for the test org

*Existing infrastructure covers framework setup (Vitest, Playwright already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OT row visual styling | SCHED-04 | CSS conditional styling requires visual inspection | Open scheduler, verify amber/red highlight on OT rows in both dark and light themes |
| Week navigation date display | SCHED-02 | Date format and label position are visual | Navigate weeks, verify date range label updates correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
