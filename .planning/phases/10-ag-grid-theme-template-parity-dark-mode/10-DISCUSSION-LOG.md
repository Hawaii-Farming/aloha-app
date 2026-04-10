# Phase 10: AG Grid Theme, Template Parity & Dark Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 10-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 10-ag-grid-theme-template-parity-dark-mode
**Mode:** `--auto` (Claude selected recommended defaults for all gray areas)
**Areas discussed:** AG Grid Theme Recipe, Grid Sizing Fix Location, Sidebar Parity Strategy, Dark-Mode Nav Surface, Avatar Initials Source, Scrollbar Theming Scope, Bug Fix Investigation, WCAG Audit Methodology

---

## AG Grid Theme Recipe (GRID-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite param values in place, keep API | Edit `ag-grid-theme.ts` `withParams` hexes to Aloha tokens; keep `getAgGridTheme()` export | ✓ |
| Extract a token-to-AG-Grid mapper | New helper reads CSS vars at runtime and feeds them into `withParams` | |
| Split light/dark into separate files | Two exports, two themes, caller picks | |

**Claude's choice:** Rewrite in place (recommended).
**Rationale:** AG Grid theme params are plain hex strings (CSS var refs unsupported inside `withParams`). Keeping the existing chain + export minimizes churn across 9 HR list views. Captured as D-01..D-04.

---

## Grid Sizing Fix Location (GRID-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Fix common ancestor (workspace layout or page shell) | Trace parents from `AgGridWrapper` up; add `h-full min-h-0 flex flex-col` where missing | ✓ |
| Per-list-view fix | Edit every HR list-view file individually | |
| Rewrite `AgGridWrapper` to force ResizeObserver-based sizing | Heavier fix, would wrap grid in its own sizer | |

**Claude's choice:** Common ancestor fix (recommended). Researcher traces parent chain first.
**Rationale:** `AgGridWrapper` already uses `h-full w-full`; the collapse is a parent issue. Centralized fix covers all 9 grids. Captured as D-05, D-06.

---

## Toolbar Search Squaring (GRID-03)

| Option | Description | Selected |
|--------|-------------|----------|
| `rounded-md` in shared `ag-grid-list-view.tsx` | Single-point edit propagates to all grids that use the shared toolbar | ✓ |
| `rounded-lg` shared | Slightly softer corner | |
| Leave pill, tighten padding | Keep current shape, shrink size | |

**Claude's choice:** `rounded-md` in shared component.
**Rationale:** Matches prototype toolbar, single edit point. Captured as D-07, D-08.

---

## Sidebar Structural Parity (PARITY-01, PARITY-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Port onto existing `module-sidebar-navigation.tsx` | Augment with section headers, chevron, separator, footer | ✓ |
| New `aloha-sidebar.tsx` alongside existing | Copy prototype, leave existing file untouched | |
| Rewrite Shadcn sidebar primitive | Touch `packages/ui/src/shadcn/sidebar.tsx` | |

**Claude's choice:** Port onto existing component.
**Rationale:** PARITY-01 names structural elements, not a new file. Shadcn primitive is read-only this phase (Phase 9 precedent). Captured as D-09..D-14.

**Sub-decision — inline collapse affordance:**
Options: (a) add chevron-top collapse button in sidebar; (b) omit (navbar already owns the toggle).
**Chose (b) — omit.** Two toggles for the same action is worse UX than the parity gap. Documented deviation. D-10.

**Sub-decision — "Focused" footer:**
Options: (a) render disabled/no-op for visual parity; (b) omit entirely; (c) implement real "All Apps" dual-mode nav.
**Chose (a) — render disabled.** Cheapest path to visual parity; (c) is a future phase. D-14.

---

## Dark-Mode Nav Surface (DARK-03)

| Option | Description | Selected |
|--------|-------------|----------|
| New `--color-chrome` token in Phase 7 palette | Navbar + sidebar consume `bg-chrome`; light=card, dark=elevated slate | ✓ (primary) |
| `dark:bg-slate-900` literal override | One-line exception to "tokens only" rule; documented | ✓ (fallback) |
| Hardcode hex | Worst option | |

**Claude's choice:** Token first, literal fallback.
**Rationale:** Planner picks after reviewing Phase 7 token surface — if adding a token is cheap, prefer it; otherwise document the literal. Captured as D-17, D-17b, D-18, D-19.

---

## Avatar Initials Source (PARITY-03)

| Option | Description | Selected |
|--------|-------------|----------|
| `currentOrg.display_name` split + first 2 letters | "Hawaii Farming" → "HF" — matches the roadmap example verbatim | ✓ |
| Account slug first letter | Current hack; loses info | |
| User email initials | Conflates user identity with org identity | |

**Claude's choice:** org display_name splitter.
**Rationale:** Matches PARITY-03 example, centralized pure helper, testable. Fallback chain covers edge cases. D-20..D-22.

---

## Scrollbar Theming Scope (PARITY-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Global CSS rules in `app/styles/` keyed off tokens | `::-webkit-scrollbar` + Firefox `scrollbar-width/color` | ✓ |
| Per-component scrollbar styles | Scoped to sidebar + main only | |
| Third-party scrollbar library | Overkill | |

**Claude's choice:** Global rules keyed off tokens.
**Rationale:** Prototype does it globally; one file change covers all scrollable surfaces in both themes. D-15, D-16.

---

## Bug Fix Investigation Depth (BUG-01, BUG-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Hypothesize + manual repro + targeted fix + Playwright regression | Standard workflow: research, fix, lock in with test | ✓ |
| Fix by pattern matching without repro | Faster but risky | |
| Add tests first (TDD) | Slower; these are polish bugs, not spec-driven features | |

**Claude's choice:** Hypothesize + repro + fix + regression test.
**Rationale:** BUG-01 code symmetry hypothesis (expanded vs collapsed branch) is strong enough to start; BUG-02 needs a manual repro because the code **looks** correct. D-27..D-29.

---

## WCAG AA Audit Methodology (Success Criterion #8)

| Option | Description | Selected |
|--------|-------------|----------|
| Static checklist using declared hexes | Table of surface/fg/bg/ratio/pass-fail in phase verification doc | ✓ |
| Runtime sampling via Playwright | Launch app, sample computed styles, compute ratios | |
| Browser extension audit (axe-core) | Good for a11y but noisier and slower | |

**Claude's choice:** Static checklist.
**Rationale:** We control every hex in the tokens and the AG Grid theme; static check is reproducible and tooling-free. D-24..D-26.

---

## Claude's Discretion

- Exact hex values in the new AG Grid theme params (derived from Phase 7 resolved tokens).
- Whether D-17 or D-17b wins for the dark chrome surface.
- Exact copy for sidebar section labels ("NAVIGATION" vs "Navigation" vs "MENU").
- Whether scrollbar thumb uses `--border` or `--muted` tokens.
- Whether the "Focused" footer renders disabled or is omitted entirely (default: render disabled).

---

## Deferred Ideas

- Geist → Inter font migration.
- Real command palette with recent history and keyboard hints.
- Profile menu relocation from sidebar footer → navbar dropdown.
- "Focused" / "All Apps" dual-mode sidebar nav (functional, not just visual).
- Mobile-specific AG Grid responsive layout.
- AG Grid Enterprise features.
