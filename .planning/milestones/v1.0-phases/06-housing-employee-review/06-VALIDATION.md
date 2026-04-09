---
phase: 6
slug: housing-employee-review
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 + Playwright 1.57.x |
| **Config file** | `vitest.config.ts`, `e2e/playwright.config.ts` |
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
| 06-01-01 | 01 | 1 | HOUS-04 | T-06-01 | RLS on org_site enforced | migration | `pnpm supabase db push` | N/A | ⬜ pending |
| 06-01-02 | 01 | 1 | EREV-05 | T-06-02 | RLS on hr_employee_review enforced | migration | `pnpm supabase db push` | N/A | ⬜ pending |
| 06-02-01 | 02 | 2 | HOUS-01 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-02-02 | 02 | 2 | HOUS-02 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-02-03 | 02 | 2 | HOUS-03 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-03-01 | 03 | 2 | EREV-01 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-03-02 | 03 | 2 | EREV-02 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-03-03 | 03 | 2 | EREV-03 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-03-04 | 03 | 2 | EREV-04 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |
| 06-03-05 | 03 | 2 | EREV-06 | — | N/A | smoke/manual | `pnpm typecheck` | N/A - visual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed for this phase (follows established pattern of Phases 2-5 which had no dedicated unit tests for grid views).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Housing grid renders with correct columns | HOUS-01 | Visual/AG Grid rendering | Navigate to housing submodule, verify columns: name, max beds, tenant count, available beds |
| Detail row shows tenant list | HOUS-02 | Visual/interactive | Click a housing row, verify employee list appears |
| Housing create/edit form | HOUS-03 | Visual/form interaction | Click create, fill form, verify save works |
| Review grid with scores | EREV-01 | Visual/AG Grid rendering | Navigate to employee_review, verify score columns with color coding |
| Year-Quarter filter | EREV-02 | Visual/filter interaction | Change year/quarter, verify grid updates |
| Review form with 1-3 selects | EREV-03 | Visual/form interaction | Click create, verify dropdowns offer 1-3 values |
| Locked reviews prevent edit | EREV-04 | Visual/behavioral | Lock a review, verify form fields are disabled |
| Review detail row | EREV-06 | Visual/interactive | Click a review row, verify full details shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
