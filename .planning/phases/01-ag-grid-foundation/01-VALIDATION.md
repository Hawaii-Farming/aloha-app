---
phase: 1
slug: ag-grid-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 (unit) + Playwright 1.57.x (E2E) |
| **Config file** | `vitest.config.ts` (unit), `e2e/playwright.config.ts` (E2E) |
| **Quick run command** | `pnpm test:unit -- --run` |
| **Full suite command** | `pnpm typecheck && pnpm test:unit -- --run && pnpm --filter e2e test` |
| **Estimated runtime** | ~30 seconds (unit), ~120 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm test:unit -- --run`
- **After every plan wave:** Run `pnpm typecheck && pnpm test:unit -- --run && pnpm --filter e2e test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (unit only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | GRID-01 | — | N/A | unit | `pnpm test:unit -- --run` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-02 | — | N/A | unit | `vitest run app/components/ag-grid/__tests__/ag-grid-wrapper.test.ts` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-03 | — | N/A | manual-only | Visual inspection (both themes) | N/A | ⬜ pending |
| TBD | 01 | 1 | GRID-04 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "detail row"` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-05 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "grid filter"` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-06 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "column resize"` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-07 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "pagination"` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-08 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "create panel"` | Partial | ⬜ pending |
| TBD | 01 | 1 | GRID-09 | — | N/A | unit | `vitest run app/components/ag-grid/__tests__/status-badge-renderer.test.ts` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-10 | — | N/A | unit | `vitest run app/components/ag-grid/__tests__/formatters.test.ts` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-11 | — | N/A | unit | `vitest run app/components/ag-grid/__tests__/avatar-renderer.test.ts` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-12 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "column state"` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-13 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "csv export"` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-14 | — | N/A | unit | `vitest run app/components/ag-grid/__tests__/row-class-rules.test.ts` | No — Wave 0 | ⬜ pending |
| TBD | 01 | 1 | GRID-15 | — | N/A | E2E | `pnpm --filter e2e test -- --grep "register"` | Partial | ⬜ pending |

*Status: ⬜ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/ag-grid/__tests__/ag-grid-wrapper.test.ts` — stubs for GRID-02
- [ ] `app/components/ag-grid/__tests__/formatters.test.ts` — covers GRID-10
- [ ] `app/components/ag-grid/__tests__/status-badge-renderer.test.ts` — covers GRID-09
- [ ] `app/components/ag-grid/__tests__/avatar-renderer.test.ts` — covers GRID-11
- [ ] `app/components/ag-grid/__tests__/column-mapper.test.ts` — covers GRID-08 column mapping
- [ ] `app/components/ag-grid/__tests__/column-state.test.ts` — covers GRID-12 persistence logic
- [ ] `app/components/ag-grid/__tests__/row-class-rules.test.ts` — covers GRID-14

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AG Grid theme matches DESIGN.md in both light/dark modes | GRID-03 | Visual comparison — color matching requires human judgment | Toggle dark/light mode, compare AG Grid header, row, border colors against DESIGN.md token values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
