---
phase: 8
plan: 4
subsystem: shared-primitives
tags: [ui, primitives, avatar, cva, gradient]
requires: [07-design-foundations]
provides: [avatar-size-variants, avatar-gradient-fallback, avatarVariants-export]
affects: [packages/ui/src/shadcn/avatar.tsx]
tech_added: []
patterns: [cva-variant-extraction, additive-optional-prop]
key_files_created: []
key_files_modified:
  - packages/ui/src/shadcn/avatar.tsx
decisions:
  - "Avatar gains ONE additive optional prop `size` (sm/md/lg, default md)"
  - "Default `md` maps to prior `h-10 w-10` → byte-compatible with all existing callers"
  - "AvatarFallback gradient matches Button primary (green-500 → emerald-600) with white initials, `to-br` direction per prototype"
  - "`avatarVariants` exported to match buttonVariants/badgeVariants convention"
tasks_completed: 1
tasks_total: 1
duration: ~5m
completed: 2026-04-10
requirements_satisfied: [PRIM-05]
---

# Phase 8 Plan 4: Avatar Primitive Restyle Summary

Restyled the `Avatar` primitive to the Aloha design system: added an additive optional `size` variant prop (sm/md/lg, default md = prior dimensions) via a new `avatarVariants` cva block, and swapped the `AvatarFallback` background from `bg-muted` to the brand gradient (`bg-gradient-to-br from-green-500 to-emerald-600`) with white medium-weight initials. The default `md` size renders identically to the previous unparameterized `h-10 w-10`, guaranteeing byte-compatibility with every existing call site. This is the one sanctioned additive prop change for Phase 8.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add avatarVariants cva + gradient fallback | `cb9cb2f` | `packages/ui/src/shadcn/avatar.tsx` |

## Variant Table

| Size | Class string | Notes |
|------|--------------|-------|
| `sm` | `h-8 w-8 text-xs` | 32px — compact contexts |
| `md` (default) | `h-10 w-10 text-sm` | 40px — matches prior unparameterized Avatar exactly |
| `lg` | `h-12 w-12 text-base` | 48px — hero contexts |

**Base:** `relative flex shrink-0 overflow-hidden rounded-full`
**defaultVariants:** `{ size: 'md' }`

## Additive Prop Rationale

- The Avatar primitive previously hardcoded `h-10 w-10` directly in the className.
- `defaultVariants.size = 'md'` produces the exact same class string, so every existing call site (e.g., workspace header avatar) continues to render unchanged.
- The new `size?: 'sm' | 'md' | 'lg'` prop is a closed enum enforced at the TypeScript boundary via `VariantProps<typeof avatarVariants>` — no runtime validation surface, no injection vector.
- This aligns Avatar with the existing `buttonVariants` / `badgeVariants` export convention so consumers can compose className strings if needed.

## AvatarFallback Delta

**Before:** `bg-muted flex h-full w-full items-center justify-center rounded-full`
**After:** `flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 font-medium text-white`

(Prettier reordered `text-white font-medium` → `font-medium text-white`; semantic equivalence preserved.)

The `to-br` direction (135°) matches the prototype `aloha-design/prototype/src/components/shared/Avatar.tsx`; Button primary uses `to-r` (0°). Gradient is intentionally identical in light and dark themes per D-19/D-06.

## Preserved

- `'use client'` directive — unchanged
- `AvatarPrimitive` (Radix) import — unchanged
- `AvatarImage` component — unchanged
- All `displayName` assignments — unchanged
- Existing named exports `Avatar`, `AvatarImage`, `AvatarFallback` — all preserved
- `forwardRef` pattern — preserved

## Grep Acceptance Results

| Check | Result |
|-------|--------|
| `from-green-500 to-emerald-600` present | match (line 58) |
| Full gradient string `bg-gradient-to-br from-green-500 to-emerald-600 ... text-white` | match (semantic; prettier reordered to `font-medium text-white`) |
| `avatarVariants` defined AND exported | match (lines 10, 66) |
| `h-8 w-8 text-xs` (sm) | match (line 15) |
| `h-10 w-10 text-sm` (md) | match (line 16) |
| `h-12 w-12 text-base` (lg) | match (line 17) |
| `size: 'md'` defaultVariants | match (line 21) |
| `class-variance-authority` import | match (line 5) |
| Old `bg-muted flex h-full w-full` fallback removed | no match |
| Hardcoded slate/gray/black classes | no match |
| `dark:` utility overrides | no match |

## Verification

- `pnpm typecheck` → exit 0 (validates `VariantProps` extension type-safety + byte-compat with existing callers)
- `pnpm lint` → exit 0 errors (4 pre-existing, unrelated TanStack Table compiler-compat warnings in `data-table.tsx` files — out of scope)

## Deviations from Plan

None — plan executed exactly as written. Prettier class reorder on the AvatarFallback gradient string (`text-white font-medium` → `font-medium text-white`) is a documented expected formatter normalization, not a deviation.

## Success Criteria

- [x] PRIM-05 fully satisfied per 08-UI-SPEC §7
- [x] One additive optional prop added; zero breaking changes (default `md` = prior `h-10 w-10`)
- [x] `avatarVariants` exported to match the buttonVariants/badgeVariants convention
- [x] Single commit `feat(08-04): avatar Aloha restyle` after typecheck+lint pass

## Self-Check: PASSED

- FOUND: `packages/ui/src/shadcn/avatar.tsx` (modified)
- FOUND: commit `cb9cb2f`
- FOUND: `avatarVariants` export
- FOUND: gradient string with `from-green-500 to-emerald-600`
- FOUND: all three size class strings
- VERIFIED: typecheck + lint green
