---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 08
subsystem: app-shell/mobile
tags: [mobile, drawer, a11y, gap-closure, uat]
wave: 1
gap_closure: true
closes_gaps:
  - test: 8
    truth: "Mobile drawer has a discoverable way to close (explicit X button inside the drawer in addition to backdrop/Escape)"
requires:
  - 09-03 (WorkspaceMobileDrawer component + onClose wiring)
  - 09-02 (AlohaLogoSquare primitive)
  - 08 (@aloha/ui/button primitive)
provides:
  - app/components/workspace-shell/workspace-mobile-drawer.tsx (header row with X close button)
affects:
  - UAT Test 8 (mobile drawer close discoverability)
tech-stack:
  added: []
  patterns:
    - header row as sibling of firstNavRef (not child) to preserve focus-on-open
    - Shadcn Button variant=ghost size=icon with lucide X icon
    - aria-label on icon-only close button for screen readers
key-files:
  created: []
  modified:
    - app/components/workspace-shell/workspace-mobile-drawer.tsx
decisions:
  - Branding (AlohaLogoSquare + "Aloha" wordmark) included in header left cluster for visual consistency with WorkspaceMobileHeader; the plan allowed an empty spacer alternative, but included branding was the stated preference.
  - Header placed as a SIBLING of firstNavRef (not a child) so the existing focus-on-open query (`firstNavRef.current?.querySelector('a, button')`) still resolves to the first nav link, not the new close button.
  - No changes to the two existing useEffect blocks (Escape listener + focus management / WR-02 focus return) — purely additive UI.
metrics:
  duration: ~4min
  tasks: 1
  files: 1
  completed: 2026-04-10
requirements: [DRAWER-04, DRAWER-05]
---

# Phase 9 Plan 8: Mobile Drawer Close Button Gap Closure Summary

Closes UAT gap 4 (Test 8) by giving the mobile drawer an explicit, discoverable X close button inside a new header row, while preserving every a11y guarantee already shipped in Plan 09-03 (focus-on-open → first nav link, focus-return-on-close → hamburger, Escape close, backdrop close).

## What Shipped

- **Header row added as the FIRST direct child of `<motion.nav>`**, before the existing `<div ref={firstNavRef}>`. Classes: `border-border flex h-14 shrink-0 items-center justify-between border-b px-3` — matches the 56px height of `WorkspaceMobileHeader` so the drawer feels like a visual extension of the mobile navbar.
- **Left cluster** — `<AlohaLogoSquare size="sm" />` + `<span>Aloha</span>` wordmark (`text-foreground text-base font-semibold`).
- **Right cluster** — `<Button variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation menu" data-test="workspace-mobile-drawer-close">` wrapping `<X className="size-5" />` from `lucide-react`.
- **Import additions** — `Button` from `@aloha/ui/button`, `X` from `lucide-react`, and `AlohaLogoSquare` from `./aloha-logo-square`. (Prettier's import-sort plugin reorganized the final ordering, as expected.)
- **Zero prop/state/effect changes** — no new `useState`, no new `useEffect`, no new props. `onClose` was already threaded through from the workspace layout.

## How It Satisfies the Requirements

- **DRAWER-04 (drawer dismissable)** — Now dismissable via FOUR discoverable paths: (1) X button, (2) backdrop tap, (3) Escape key, (4) nav link tap (`onNavigate={onClose}`). Previously only paths 2–4 existed, and path 4 only after the user picked a destination.
- **DRAWER-05 (single nav source)** — Untouched. The drawer body still renders `<ModuleSidebarNavigation forceExpanded …>` as the sole navigation source.
- **a11y (D-27, D-28)** — `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile navigation"` unchanged on the panel. The new close button has `aria-label="Close navigation menu"` for screen-reader accessibility since the X icon is icon-only.
- **WR-02 (focus return on open→closed only)** — Preserved. The two existing `useEffect` blocks are untouched; the close button is in a sibling container of `firstNavRef`, so `firstNavRef.current?.querySelector('a, button')` still resolves to the first nav link on open, not the X button.

## UAT Gap Closed

- **Test 8 (a11y / drawer discoverability)** — Previously ISSUE: "no way to close drawer" (tester did not discover backdrop/Escape paths). Now: the X button is visible in the top-right of the drawer panel the moment it slides in, matching standard mobile nav drawer conventions.

## Commits

| Task | Name                                                | Commit  |
| ---- | --------------------------------------------------- | ------- |
| 1    | Add header row + X close button to mobile drawer   | 19d9049 |

## Deviations from Plan

**1. [Prettier import-sort plugin] Import ordering adjusted automatically**
- **Found during:** Task 1 pre-commit lint-staged.
- **Issue:** The plan grouped `lucide-react` with `framer-motion` and `@aloha/ui/button` in the `@aloha/*` block. `@trivago/prettier-plugin-sort-imports` reorganized to: `framer-motion` + `lucide-react` (third-party), then `@aloha/ui/button` (scoped package), then `~/` imports, then relative `./aloha-logo-square`.
- **Impact:** None — all imports resolve, typecheck and lint pass. This is the codebase-wide convention driven by the Prettier plugin (same behavior observed in Plans 09-01/09-02/09-03).
- **Fix:** None required.
- **File:** `app/components/workspace-shell/workspace-mobile-drawer.tsx`
- **Commit:** 19d9049

No other deviations. The plan executed exactly as written.

## Verification

- `pnpm typecheck` → exits 0 (clean).
- `pnpm lint` → 0 errors; 4 pre-existing warnings in `packages/ui/src/shadcn/data-table.tsx` (`react-hooks/incompatible-library` on TanStack Table), unchanged by this plan.
- `pnpm format:fix && pnpm lint:fix` → 0 errors after cleanup.
- `grep "workspace-mobile-drawer-close" app/components/workspace-shell/workspace-mobile-drawer.tsx` → 1 match.
- `grep "from 'lucide-react'" app/components/workspace-shell/workspace-mobile-drawer.tsx` → 1 match.
- `grep "from '@aloha/ui/button'" app/components/workspace-shell/workspace-mobile-drawer.tsx` → 1 match.
- Visual check of file structure: header `<div>` is the FIRST direct child of `<motion.nav>`, immediately followed by the existing `<div ref={firstNavRef}>` as a sibling. Focus-on-open query scope is unchanged.
- Manual browser verification at ≤768px (`pnpm dev`): deferred to user UAT re-run per the gap-closure workflow; the component-level change is mechanically proven by the ref/sibling ordering above.

## Known Stubs

None. No placeholder data, no mock content. `onClose` is wired live to the workspace layout's drawer state setter (shipped in Plan 09-04).

## Self-Check: PASSED

- FOUND: app/components/workspace-shell/workspace-mobile-drawer.tsx (modified)
- FOUND: commit 19d9049
- FOUND: data-test="workspace-mobile-drawer-close" in file
- FOUND: `X` import from lucide-react
- FOUND: `Button` import from @aloha/ui/button
- FOUND: `AlohaLogoSquare` import from ./aloha-logo-square
- FOUND: header `<div>` as first direct child of `<motion.nav>`, sibling of `firstNavRef` div
- FOUND: onClick={onClose} on the X Button
- FOUND: aria-label="Close navigation menu" on the X Button
- FOUND: both existing useEffect blocks (Escape, focus management) untouched
