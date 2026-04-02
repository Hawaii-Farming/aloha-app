---
phase: 02-light-theme-component-theming
plan: 02
subsystem: ui
tags: [shadcn, tailwind, css, components, button, tabs, pill, shadow]

# Dependency graph
requires:
  - phase: 01-foundation-dark-theme
    provides: CSS token architecture and shadow removal via @layer base
provides:
  - Zero shadow-xs in all 14 Shadcn component files (18 occurrences removed)
  - Pill button variant accessible via variant="pill" in buttonVariants CVA
  - Global pill-shaped tabs with green active indicator via sidebar-primary token
affects: [02-03-light-theme-css, 03-enhancement-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pill shape via rounded-full in CVA variant — no new props, additive pattern"
    - "Global tab shape override — changes TabsList/TabsTrigger defaults, no variant needed at call sites"
    - "sidebar-primary token for green active state in tabs — consistent with sidebar green accent"

key-files:
  created: []
  modified:
    - packages/ui/src/shadcn/button.tsx
    - packages/ui/src/shadcn/tabs.tsx
    - packages/ui/src/shadcn/input.tsx
    - packages/ui/src/shadcn/textarea.tsx
    - packages/ui/src/shadcn/select.tsx
    - packages/ui/src/shadcn/checkbox.tsx
    - packages/ui/src/shadcn/switch.tsx
    - packages/ui/src/shadcn/input-otp.tsx
    - packages/ui/src/shadcn/badge.tsx
    - packages/ui/src/shadcn/calendar.tsx
    - packages/ui/src/shadcn/navigation-menu.tsx
    - packages/ui/src/shadcn/command.tsx
    - packages/ui/src/shadcn/button-group.tsx
    - packages/ui/src/shadcn/input-group.tsx

key-decisions:
  - "D-09 applied at component level: shadow-xs removed from all 14 files individually rather than relying solely on CSS @layer override — belt and suspenders approach"
  - "Pill variant is additive to CVA — does not change existing variant behavior, backward compatible"
  - "Tabs use global override (no variant) per D-06 — all tab instances get pill shape automatically"
  - "table.tsx confirmed untouched — COMP-03 fulfilled by token inheritance from Plan 01"

patterns-established:
  - "New button variants: add to CVA variant object in button.tsx — no prop changes needed"
  - "Global shape changes for Radix components: modify default class strings in forwardRef wrappers"

requirements-completed: [COMP-03, COMP-04, COMP-05, COMP-06]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 02 Plan 02: Shadow Removal + Pill Variants Summary

**18 shadow-xs occurrences removed across 14 Shadcn components, pill button variant added to CVA, and tabs globally converted to pill shape with Supabase green active indicator**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T21:08:38Z
- **Completed:** 2026-04-02T21:11:44Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Removed all 18 shadow-xs occurrences from 14 Shadcn component files, completing the border-depth system at component level
- Added pill button variant (`variant="pill"`) to buttonVariants CVA — rounded-full, generous horizontal padding, primary colors, subtle border
- Converted TabsList to rounded-full container and TabsTrigger to rounded-full pill with green active state via `--sidebar-primary` token
- Verified table.tsx requires no changes (COMP-03 fulfilled by token inheritance from Plan 01 `:root` overrides)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove shadow-xs from all 14 Shadcn component files** - `7178ea1` (fix)
2. **Task 2: Add pill button variant and convert tabs to global pill shape** - `ca2685b` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `packages/ui/src/shadcn/button.tsx` - Removed 4 shadow-xs; added pill variant to CVA
- `packages/ui/src/shadcn/tabs.tsx` - Removed shadow-xs and shadow-sm; TabsList rounded-full; TabsTrigger pill with sidebar-primary active state
- `packages/ui/src/shadcn/input.tsx` - Removed 1 shadow-xs
- `packages/ui/src/shadcn/textarea.tsx` - Removed 1 shadow-xs
- `packages/ui/src/shadcn/select.tsx` - Removed 2 shadow-xs (SelectTrigger + SelectItem)
- `packages/ui/src/shadcn/checkbox.tsx` - Removed 1 shadow-xs
- `packages/ui/src/shadcn/switch.tsx` - Removed 1 shadow-xs
- `packages/ui/src/shadcn/input-otp.tsx` - Removed 1 shadow-xs
- `packages/ui/src/shadcn/badge.tsx` - Removed 2 shadow-xs (default + destructive variants)
- `packages/ui/src/shadcn/calendar.tsx` - Removed 1 shadow-xs (dropdown_root)
- `packages/ui/src/shadcn/navigation-menu.tsx` - Removed 1 shadow-xs (Viewport)
- `packages/ui/src/shadcn/command.tsx` - Removed 1 shadow-xs (CommandItem)
- `packages/ui/src/shadcn/button-group.tsx` - Removed 1 shadow-xs (ButtonGroupText)
- `packages/ui/src/shadcn/input-group.tsx` - Removed 1 shadow-xs (InputGroup wrapper)

## Decisions Made

- D-09 enforced at component level: removing shadow-xs directly from component files is belt-and-suspenders alongside the CSS @layer base override from Plan 01. Both layers now clean.
- Pill variant is purely additive — ghost, link, default, destructive, outline, secondary unchanged. Button CVA now has 7 variants total.
- Tabs global override pattern: no variant prop added. All tab instances across the app automatically render pill-shaped with green active indicator after this change.
- `table.tsx` confirmed as no-op for COMP-03: uses only `bg-muted/50`, `text-muted-foreground`, `border-b` — all semantic classes that inherit from `:root` token overrides set in Plan 01.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-02 is complete. All shadow-xs removed, pill variants in place.
- Plan 02-03 (light theme CSS) can proceed — it operates on `app/styles/shadcn-ui.css` tokens, not component files.
- No blockers. The pill button and pill tabs are live and usable via `variant="pill"` and default tab rendering.

---
*Phase: 02-light-theme-component-theming*
*Completed: 2026-04-02*
