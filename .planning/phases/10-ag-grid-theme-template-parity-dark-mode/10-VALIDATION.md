---
phase: 10
slug: ag-grid-theme-template-parity-dark-mode
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-10
---

# Phase 10 — Validation Strategy

> Per-phase validation contract. Populated during planning; consumed during execution and sign-off.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1 (unit) + Playwright 1.57 (E2E) |
| **Config file** | `vitest.config.ts`, `e2e/playwright.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm test:unit` |
| **Targeted E2E command** | `pnpm --filter e2e exec playwright test --grep @phase10` |
| **Full suite command** | `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm --filter e2e exec playwright test` |
| **Estimated quick runtime** | ~20 seconds |
| **Estimated full runtime** | ~3-5 minutes |

---

## Sampling Rate

- **After every task commit:** `pnpm typecheck && pnpm test:unit` (< 30s)
- **After every plan wave:** `pnpm --filter e2e exec playwright test --grep @phase10` (targeted subset)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** < 60s for quick command

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-T1 | 01 | 0 | BUG-01, BUG-02 | T-10-01 | No console.log leak | manual + grep | `test -f .../10-BUG-REPRO.md && grep -q "BUG-01 Observed"` | ❌ new | ⬜ pending |
| 10-01-T2 | 01 | 0 | GRID-01, PARITY-03 | — | Test skeletons red | unit | `pnpm vitest run app/lib/workspace/__tests__/get-org-initials.test.ts app/components/ag-grid/__tests__/ag-grid-theme.test.ts` (expect FAIL) | ❌ new | ⬜ pending |
| 10-01-T3 | 01 | 0 | all GRID/DARK/PARITY/BUG | — | E2E skeletons red via test.fail() | e2e | `pnpm --filter e2e exec playwright test --grep @phase10 --list` (expect ≥ 10) | ❌ new | ⬜ pending |
| 10-02-T1 | 02 | 1 | GRID-01 | — | Theme hex match | unit | `pnpm vitest run app/components/ag-grid/__tests__/ag-grid-theme.test.ts` | ✅ (Plan 01) | ⬜ pending |
| 10-02-T2 | 02 | 1 | GRID-02 | T-10-03 | Grid fills container | e2e | `pnpm --filter e2e exec playwright test --grep @grid-sizing` | ✅ (Plan 01) | ⬜ pending |
| 10-02-T3 | 02 | 1 | GRID-03 | T-10-04 | Toolbar search rounded-md | e2e | `pnpm --filter e2e exec playwright test --grep @toolbar-search` | ✅ (Plan 01) | ⬜ pending |
| 10-03-T1 | 03 | 2 | DARK-02, DARK-03, PARITY-05 | T-10-05 | Dark surfaces distinct | e2e | `pnpm --filter e2e exec playwright test --grep "@dark-surfaces\|@scrollbar\|@theme-toggle"` | ✅ (Plan 01) | ⬜ pending |
| 10-03-T2 | 03 | 2 | PARITY-01, PARITY-04 | — | Sidebar parity structure | e2e | `pnpm --filter e2e exec playwright test --grep @sidebar-parity` | ✅ (Plan 01) | ⬜ pending |
| 10-03-T3 | 03 | 2 | PARITY-01 (i18n) | T-10-06 | i18n keys present | unit | `node -e "require('./public/locales/en/common.json').shell.sidebar.nav_section"` | ❌ new inline | ⬜ pending |
| 10-04-T1 | 04 | 3 | PARITY-03 | T-10-07 | getOrgInitials pure + XSS-safe | unit + e2e | `pnpm vitest run app/lib/workspace/__tests__/get-org-initials.test.ts && pnpm --filter e2e exec playwright test --grep @avatar-initials` | ✅ (Plan 01) | ⬜ pending |
| 10-04-T2 | 04 | 3 | BUG-01 | T-10-09 | Active pill immediate + no useEffect | e2e + grep | `pnpm --filter e2e exec playwright test --grep @bug-01-active-pill && ! grep -q useEffect app/components/sidebar/module-sidebar-navigation.tsx` | ✅ (Plan 01) | ⬜ pending |
| 10-04-T3 | 04 | 3 | BUG-02 | T-10-08 | cmdk navigation reliable | e2e | `pnpm --filter e2e exec playwright test --grep @bug-02-palette-nav` | ✅ (Plan 01) | ⬜ pending |
| 10-05-T1 | 05 | 4 | (SC #8) | T-10-11 | WCAG audit ≥ 17 rows | grep | `awk '/^\\|/ && !/---/' 10-WCAG-AUDIT.md \| wc -l` | ❌ new | ⬜ pending |
| 10-05-T2 | 05 | 4 | PARITY-02 + full regression | T-10-10 | Full suite green + manual smoke | checkpoint | `pnpm --filter e2e exec playwright test --grep @phase10` + manual | ✅ (Plan 01) | ⬜ pending |
| 10-05-T3 | 05 | 4 | (project bookkeeping) | — | STATE/ROADMAP/REQUIREMENTS updated | grep | `grep -q "Phase 10 complete" .planning/STATE.md` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity check:** No 3 consecutive tasks without an automated verify. Every task above has an `<automated>` command or a Wave 0 dependency. ✅

---

## Wave 0 Requirements

- [x] Manual repro + log capture for BUG-01 (Plan 01 Task 1)
- [x] Manual repro + log capture for BUG-02 (Plan 01 Task 1)
- [x] `ag-grid-theme.test.ts` assertion skeleton — new hex expectations (Plan 01 Task 2)
- [x] `get-org-initials.test.ts` unit test skeleton (Plan 01 Task 2)
- [x] Ten `@phase10` Playwright spec files with `test.fail()` markers (Plan 01 Task 3)
- [ ] Playwright visual snapshot baseline (optional — deferred unless requested)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WCAG AA contrast audit (light + dark) | SC #8 | Subjective contrast + documentation deliverable | Plan 05 Task 1 — static checklist with ≥ 17 rows |
| BUG-01 / BUG-02 root cause confirmation | BUG-01, BUG-02 | Runtime symptom confirmation before fix | Plan 01 Task 1 — capture in 10-BUG-REPRO.md |
| Visual smoke on Register/Scheduler/Time Off in both themes | PARITY-01..05, DARK-02/03 | Visual parity is subjective | Plan 05 Task 2 — checkpoint:human-verify |
| PARITY-02 verification (PanelLeft leftmost) | PARITY-02 | Code already shipped in Phase 9 | Plan 05 Task 2 — visual check + @navbar-toggle E2E |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s for quick command
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner-signed 2026-04-10
