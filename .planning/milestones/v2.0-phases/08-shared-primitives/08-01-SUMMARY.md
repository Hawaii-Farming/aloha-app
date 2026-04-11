---
phase: 8
plan: 1
subsystem: shared-primitives
tags: [ui, primitives, card, restyle, phase-08]
requires: [PRIM-02]
provides: [card-restyled]
affects: [packages/ui/src/shadcn/card.tsx]
tech_stack_added: []
tech_stack_patterns:
  - "Phase 7 semantic tokens (bg-card, text-card-foreground, border-border) driving primitive surfaces"
  - "rounded-2xl hero radius + shadow-sm soft elevation per Aloha Supabase-inspired spec"
key_files_created: []
key_files_modified:
  - packages/ui/src/shadcn/card.tsx
decisions:
  - "D-13 anchor: Card = rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
  - "Touch root Card className only — zero changes to CardHeader/Title/Description/Content/Footer"
  - "No prop contract changes; no new imports; cn() pattern preserved"
metrics:
  tasks_completed: 1
  files_changed: 1
  duration_minutes: 3
  completed_date: 2026-04-10
---

# Phase 8 Plan 1: Card Primitive Restyle Summary

Restyled the Card root surface to match the Aloha Supabase-inspired spec (rounded-2xl, explicit border-border, shadow-sm) via a single className edit to `packages/ui/src/shadcn/card.tsx`, with all sub-component classNames and prop contracts left byte-identical.

## What Changed

### packages/ui/src/shadcn/card.tsx

**Before:**
```tsx
className={cn('bg-card text-card-foreground rounded-lg border', className)}
```

**After (post prettier-plugin-tailwindcss ordering):**
```tsx
className={cn(
  'bg-card text-card-foreground border-border rounded-2xl border shadow-sm',
  className,
)}
```

Class tokens applied (semantic/order-agnostic):
- `bg-card` (Phase 7 token)
- `text-card-foreground` (Phase 7 token)
- `border` + `border-border` (explicit token border)
- `rounded-2xl` (hero radius, Phase 7 `--radius: 1rem`)
- `shadow-sm` (soft elevation, unlocked in Phase 7)

Sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) are untouched — classNames, forwardRef types, displayName assignments, and exports are byte-identical to the pre-edit state.

## Verification

### Grep Acceptance Criteria

| Check | Expected | Actual |
|---|---|---|
| `rounded-2xl` present | ≥1 | 1 |
| `shadow-sm` present | ≥1 | 1 |
| `border-border` present | ≥1 | 1 |
| `bg-card` present | ≥1 | 1 |
| `rounded-lg border'` removed | 0 | 0 |
| Hardcoded slate/white/black | none | none (exit 1) |
| `dark:` overrides | none | none (exit 1) |

Note: The plan's literal exact-string grep (`"bg-card text-card-foreground rounded-2xl border border-border shadow-sm"`) would not match because `prettier-plugin-tailwindcss` (project convention enforced by pre-commit hook) reorders Tailwind classes to `bg-card text-card-foreground border-border rounded-2xl border shadow-sm`. Semantically identical — all required tokens present. This is the expected project formatting.

### Automated Gates

- `pnpm typecheck` → exit 0 (react-router typegen + tsc clean)
- `pnpm lint` → 0 errors, 4 warnings (all pre-existing in `data-table.tsx` files, unrelated to this plan — `react-hooks/incompatible-library` warnings from TanStack Table)

## Deviations from Plan

None — plan executed exactly as written. The only variation from the plan's literal text was the post-commit class reordering performed automatically by prettier-plugin-tailwindcss (project-wide convention), which is semantically equivalent and expected.

## Commits

| Task | Hash | Message |
|---|---|---|
| Task 1 | 95ebca8 | feat(08-01): card Aloha restyle |

## Threat Flags

None — className-only edit on a presentational primitive with no data, network, auth, or input surface.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: packages/ui/src/shadcn/card.tsx (edited, contains rounded-2xl + shadow-sm + border-border + bg-card)
- FOUND: commit 95ebca8 in git log
- FOUND: sub-components untouched (CardHeader/Title/Description/Content/Footer classNames byte-identical)
- FOUND: pnpm typecheck exit 0
- FOUND: pnpm lint exit 0 (pre-existing warnings unrelated)
