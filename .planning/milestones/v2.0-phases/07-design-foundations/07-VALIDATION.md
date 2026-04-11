---
phase: 7
slug: design-foundations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 7 is tokens-and-foundation only — no component/route changes. Validation is dominated by a WCAG contrast script + manual smoke check.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (existing) + custom Node script for WCAG |
| **Config file** | `vitest.config.ts` (existing); new `scripts/verify-wcag.mjs` (Wave 0) |
| **Quick run command** | `node scripts/verify-wcag.mjs` |
| **Full suite command** | `pnpm typecheck && pnpm lint && node scripts/verify-wcag.mjs` |
| **Estimated runtime** | ~15 seconds (typecheck ~8s, lint ~5s, wcag script ~1s) |

---

## Sampling Rate

- **After every task commit:** `node scripts/verify-wcag.mjs` (once the script exists — Wave 0)
- **After every plan wave:** `pnpm typecheck && pnpm lint && node scripts/verify-wcag.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green AND manual smoke check recorded
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

Per the research doc (§Implementation Order), tasks are grouped into 3 plans. This map will be finalized by the planner — entries below are the expected verification contract.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | DESIGN-01 | — | N/A | doc-grep | `grep -q "Inter" DESIGN.md && grep -q "green-500" DESIGN.md && ! grep -qi "supabase" DESIGN.md` | ✅ | ⬜ pending |
| 7-01-02 | 01 | 1 | DESIGN-02, DARK-01 | — | N/A | grep | `grep -q "slate-50\|#f8fafc" app/styles/shadcn-ui.css && grep -q "\.dark" app/styles/shadcn-ui.css` | ✅ | ⬜ pending |
| 7-02-01 | 02 | 2 | DESIGN-02 | — | N/A | grep | `grep -q "1rem" app/styles/theme.css && grep -q "Inter Variable" app/styles/theme.css` | ✅ | ⬜ pending |
| 7-02-02 | 02 | 2 | DESIGN-03 | — | N/A | grep | `grep -q "@fontsource-variable/inter" app/styles/global.css && ! grep -q "@fontsource-variable/geist/wght" app/styles/global.css` | ✅ | ⬜ pending |
| 7-02-03 | 02 | 2 | DESIGN-02 | — | N/A | grep | `! grep -q "\-\-shadow.*: none" app/styles/global.css` | ✅ | ⬜ pending |
| 7-02-04 | 02 | 2 | DESIGN-03 | — | N/A | package | `grep -q "@fontsource-variable/inter" package.json` | ✅ | ⬜ pending |
| 7-03-01 | 03 | 3 | DARK-01 | — | N/A | wcag-script | `node scripts/verify-wcag.mjs` (Wave 0 installs) | ❌ W0 | ⬜ pending |
| 7-03-02 | 03 | 3 | DESIGN-01..04, DARK-01 | — | N/A | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/verify-wcag.mjs` — Node script using `wcag-contrast@3.0.0` to verify the 12 foundation token pairs × 2 themes (24 assertions). Parses hex values from `app/styles/shadcn-ui.css` light + dark blocks and asserts ratios against WCAG AA thresholds (4.5:1 normal, 3:1 UI/large).
- [ ] Add `wcag-contrast` as a root devDependency (pnpm add -wD wcag-contrast@3.0.0).
- [ ] Optional: `scripts/verify-wcag.mjs` exits with non-zero status on any failure so it's CI-ready for Phase 10 reuse.

*Framework note:* Vitest is already installed; WCAG script is plain Node (ESM) because it only reads CSS text — no component rendering required in Phase 7.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Existing routes still render under new tokens (no layout breakage) | DESIGN-02, DARK-01 | Requires running dev server + visual inspection — no existing E2E snapshot coverage for shell chrome | `pnpm dev`, sign in, load `/home/:account` + `/home/:account/hr/employees` (register submodule). Toggle light↔dark via theme toggle. Confirm: no console errors, no missing CSS var warnings, sidebar/header/table/form panel visible with consistent spacing. |
| Inter font actually loads and renders (not fallback) | DESIGN-03 | Browser-only check | DevTools > Network > filter `inter` — confirm woff2 served. Computed Style on `body` shows `Inter Variable` before fallbacks. |
| Shadow unlock doesn't reveal unintended shadows elsewhere | DESIGN-02 | Visual regression | After shadow unlock, smoke-load home + register submodule — confirm no components suddenly show noisy shadows. |

*Full automated WCAG script covers the 12 token pairs in both themes — the ratio numbers are reproducible and don't need manual audit.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify command OR Wave 0 dependency resolved
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers `scripts/verify-wcag.mjs` + `wcag-contrast` devDependency
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
