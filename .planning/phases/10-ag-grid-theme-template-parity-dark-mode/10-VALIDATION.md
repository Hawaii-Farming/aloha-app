---
phase: 10
slug: ag-grid-theme-template-parity-dark-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated by gsd-planner from RESEARCH.md `## Validation Architecture` section.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1 (unit) + Playwright 1.57 (E2E) |
| **Config file** | `vitest.config.ts`, `e2e/playwright.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm lint` |
| **Full suite command** | `pnpm typecheck && pnpm lint && pnpm test && pnpm --filter e2e test` |
| **Estimated runtime** | ~TBD seconds (planner to fill) |

---

## Sampling Rate

- **After every task commit:** Run quick command
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** TBD seconds

---

## Per-Task Verification Map

*Planner populates during planning step. One row per task with automated verify command or Wave 0 dependency.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | — | TBD | TBD | TBD | ⬜ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Planner populates. Expected Wave 0 items per RESEARCH.md recommendations:*

- [ ] Manual repro + log capture for BUG-01 (active-module pill timing)
- [ ] Manual repro + log capture for BUG-02 (navbar command-palette module nav)
- [ ] `ag-grid-theme.test.ts` assertion skeleton (hex token expectations)
- [ ] `get-org-initials.test.ts` unit test skeleton
- [ ] Playwright visual snapshot baseline capture (optional, per planner)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WCAG AA contrast audit (light + dark) | DARK-02, DARK-03 | Subjective contrast + documentation deliverable | Compute token-pair ratios, record table in phase plan / DESIGN.md supplement |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s for quick command
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
