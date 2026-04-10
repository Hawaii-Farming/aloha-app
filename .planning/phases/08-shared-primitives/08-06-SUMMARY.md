---
phase: 8
plan: 6
subsystem: shared-primitives
tags: [ui, primitives, sheet, restyle, aloha-theme]
requires: [07-design-foundations]
provides:
  - "Sheet primitive with Aloha card surface, deeper shadow, leading-corner radius, and form-field header/footer spacing"
affects:
  - packages/ui/src/shadcn/sheet.tsx
tech-stack:
  added: []
  patterns:
    - "cva base + per-side variants"
    - "Token-driven borders (border-border) + semantic surface (bg-card)"
key-files:
  created: []
  modified:
    - packages/ui/src/shadcn/sheet.tsx
decisions:
  - "Applied leading-corner-only radius per D-14 (right=rounded-l-2xl, left=rounded-r-2xl, top=rounded-b-2xl, bottom=rounded-t-2xl)"
  - "Swapped bg-background→bg-card and shadow-lg→shadow-xl per D-15"
  - "SheetOverlay left untouched per D-16 (retains bg-glass-surface)"
  - "Prettier reordered Tailwind classes (tailwindcss plugin); semantic match preserved"
metrics:
  duration: "~5m"
  completed: "2026-04-10"
  tasks: 1
  files_changed: 1
---

# Phase 8 Plan 6: Sheet Aloha Restyle Summary

One-liner: Sheet primitive restyled with `bg-card` surface, `shadow-xl`, leading-corner `rounded-{l,r,b,t}-2xl` per side, and divider-padded header/footer for form-field spacing.

## Scope

PRIM-06 from 08-UI-SPEC §8: restyle `packages/ui/src/shadcn/sheet.tsx` so the CRUD create/edit panels (and all other Sheet callers) inherit the Aloha prototype's side-sheet visual. Pure className edits — zero prop contract drift, zero changes to Radix wiring, zero touches to `SheetOverlay` (D-16).

## Changes

### `sheetVariants` cva base

| Field    | Before                  | After                      |
| -------- | ----------------------- | -------------------------- |
| Surface  | `bg-background`         | `bg-card`                  |
| Shadow   | `shadow-lg`             | `shadow-xl`                |

Positioning, padding (`p-6`), gap (`gap-4`), animation/transition utilities all preserved.

### Per-side variants (leading-corner radius + token borders)

| Side   | Border             | Radius          | Notes                       |
| ------ | ------------------ | --------------- | --------------------------- |
| top    | `border-b border-border` | `rounded-b-2xl` | leading edge = bottom       |
| bottom | `border-t border-border` | `rounded-t-2xl` | leading edge = top          |
| left   | `border-r border-border` | `rounded-r-2xl` | `sm:max-w-sm` preserved     |
| right  | `border-l border-border` | `rounded-l-2xl` | `sm:max-w-sm` preserved, CRUD create/edit sheets inherit |

`defaultVariants: { side: 'right' }` unchanged.

### `SheetHeader`

- Before: `flex flex-col gap-y-3 text-center sm:text-left`
- After: `flex flex-col gap-y-4 pb-4 border-b border-border text-center sm:text-left`
- Delta: `gap-y-3 → gap-y-4`, added `pb-4 border-b border-border` divider

### `SheetFooter`

- Before: `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`
- After: `flex flex-col-reverse pt-4 border-t border-border sm:flex-row sm:justify-end sm:space-x-2`
- Delta: added `pt-4 border-t border-border` divider

### `SheetTitle`

- Before: `text-foreground text-lg font-medium`
- After: `text-lg font-semibold text-foreground`
- Delta: `font-medium → font-semibold`

### Untouched

- `SheetOverlay` — retains `bg-glass-surface fixed inset-0 z-50 ...` per D-16
- `SheetDescription` — retains `text-muted-foreground text-sm`
- `SheetContent` JSX body, `SheetPrimitive.Close` button, portal wiring, forwardRef/displayName — no changes
- `sm:max-w-sm` width cap on left/right — not widened (deferred per 08-CONTEXT risk flag)

## Acceptance Criteria Verification

Grep probes (post-Prettier class reordering; semantic equivalents present):

- `bg-card` → match (base)
- `shadow-xl` → match (base)
- `rounded-l-2xl` → match (right — CRUD pattern)
- `rounded-r-2xl` → match (left)
- `rounded-b-2xl` → match (top)
- `rounded-t-2xl` → match (bottom)
- `border-l border-border` → match (right side, Prettier-reordered as `border-border ... border-l`)
- `border-r border-border` → match (left side)
- `gap-y-4 ... pb-4 ... border-b ... border-border` → match (SheetHeader, reordered)
- `pt-4 ... border-t ... border-border` → match (SheetFooter, reordered)
- `text-lg font-semibold text-foreground` → match (SheetTitle, Prettier reordered to `text-foreground text-lg font-semibold`)
- `sm:max-w-sm` → match (preserved width)
- `bg-glass-surface` → match (SheetOverlay intact)
- `shadow-lg` → no match (old shadow removed)
- No hardcoded slate/white/black classes, no `dark:` overrides

## Verification Status

- `pnpm typecheck` → PASSED (exit 0)
- `pnpm lint` → PASSED (4 pre-existing warnings unrelated to sheet.tsx: `table-list-view.tsx`, `data-table.tsx` × 2, baseline-browser-mapping advisory)

## Deviations from Plan

None beyond the expected Prettier class reordering (flagged in execution rules as fine — semantic match is the contract).

### Auto-fixed Issues

None.

## Commits

- `c6f9daf` feat(08-06): sheet Aloha restyle

## Downstream Impact

- CRUD `create-panel.tsx` / `edit-panel.tsx` — existing `cn()` + `tailwind-merge` dedupe handles caller overrides of `border-b` / `pb-4` on SheetHeader cleanly; no caller edits required.
- Phase 9 (shell chrome): Mobile drawer and any future Sheet-based UIs automatically inherit the new surface/shadow/radius.
- Smoke check deferred to phase end (per 08-CONTEXT D-22 step 4): open HR employee "Add" to confirm rounded leading edge + card surface + header/footer dividers render correctly in dark and light.

## Self-Check: PASSED

- File exists: `packages/ui/src/shadcn/sheet.tsx` — FOUND
- Commit: `c6f9daf` — FOUND in `git log`
- `pnpm typecheck` exit 0 — verified
- `pnpm lint` exit 0 — verified (warnings only, none in sheet.tsx)
