---
phase: 4
slug: payroll-views
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.3 + pnpm typecheck |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm typecheck && pnpm lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm typecheck && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PCMP-06, PMGR-04, PDAT-01 | — | RLS policies enforce org-scoped access | schema | `pnpm supabase:reset` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | PCMP-01, PCMP-02, PCMP-03 | — | N/A | typecheck | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | PMGR-01, PMGR-02, PMGR-03 | — | N/A | typecheck | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | PDAT-01, PDAT-02, PDAT-03, PDAT-04, PDAT-05 | — | N/A | typecheck | `pnpm typecheck` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| View toggle between by-task/by-employee | PCMP-03 | Visual interaction | Toggle between views, verify data changes |
| Pinned totals row displays correctly | PCMP-05 | Visual rendering | Check bottom row shows sum totals |
| Column groups collapse/expand | PDAT-02 | Visual interaction | Click column group headers, verify collapse |
| Manager selector filters data | PMGR-02 | Visual + data flow | Select different managers, verify grid updates |
| CSV export includes visible columns | PDAT-05 | File output | Export CSV, verify column headers match visible grid columns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
