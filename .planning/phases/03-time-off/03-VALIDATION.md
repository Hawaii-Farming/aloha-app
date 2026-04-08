---
phase: 3
slug: time-off
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), playwright (E2E) |
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
| 03-01-01 | 01 | 1 | TOFF-01 | T-03-01 / — | RLS prevents cross-org data access | typecheck | `pnpm typecheck` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | TOFF-02 | — | N/A | typecheck | `pnpm typecheck` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | TOFF-03 | T-03-02 | Status transitions enforce workflow rules | typecheck | `pnpm typecheck` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | TOFF-04 | — | Denial reason required before deny action completes | typecheck | `pnpm typecheck` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 2 | TOFF-05 | — | N/A | typecheck | `pnpm typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual grid renders correctly in dark/light theme | TOFF-01 | Visual verification | Open time off grid, toggle theme, verify columns display correctly |
| Status filter tabs update grid | TOFF-02 | UI interaction | Click each tab (All/Pending/Approved/Denied), verify grid filters |
| Inline approve/deny buttons work | TOFF-03 | UI interaction | Click approve on a pending request, verify status updates |
| Denial reason popover blocks deny without reason | TOFF-04 | UI interaction | Click deny, attempt to submit without reason, verify blocked |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
