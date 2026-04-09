---
phase: 5
slug: hours-comparison
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + pnpm typecheck (types) + supabase db reset (schema) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm typecheck && pnpm supabase:reset` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm typecheck && pnpm supabase:reset`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HCMP-05 | — | RLS enforced via org_id | schema | `pnpm supabase:reset` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | HCMP-01 | — | N/A | type | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | HCMP-01, HCMP-02 | — | N/A | type | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | HCMP-04 | — | N/A | visual | Manual: check amber/red highlighting | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | HCMP-03 | — | N/A | type + visual | `pnpm typecheck` + Manual: expand row | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — vitest, typecheck, and supabase:reset are already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Variance amber/red highlighting | HCMP-04 | Visual CSS styling | Load comparison grid, verify amber cells for small variance, red for >4h |
| Detail row daily breakdown | HCMP-03 | Visual + interactive | Click a row, verify daily schedule data appears with correct columns |
| Pay period filter scoping | HCMP-02 | Interactive | Switch pay periods, verify grid data changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
