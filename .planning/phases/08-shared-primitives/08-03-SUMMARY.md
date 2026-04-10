---
phase: 8
plan: 3
subsystem: shared-primitives
tags: [ui, primitive, button, gradient, brand]
requires: [PRIM-01]
provides: ["Button primitive Aloha gradient primary + rounded-2xl + py-3 padding + §9.1 Option A focus ring"]
affects:
  - packages/ui/src/shadcn/button.tsx
tech-stack:
  added: []
  patterns:
    - "Tailwind gradient utilities applied directly in cva (no --gradient-primary token; D-04)"
    - "Padding-driven button height (no fixed h-9; D-07)"
    - "§9.1 Option A focus ring: ring-2 ring-primary + ring-offset-2 ring-offset-background"
key-files:
  created: []
  modified:
    - packages/ui/src/shadcn/button.tsx
decisions:
  - "Kept all 8 existing variants; retuned brand + pill + default to the same Aloha gradient (D-03)"
  - "secondary = token-driven bg-background/border-border/hover:bg-muted (D-12) — no hardcoded slate"
  - "default size drops h-9 — height comes from px-5 py-3 padding (D-07)"
metrics:
  duration: "~5m"
  completed: 2026-04-10
  tasks: 1
  files: 1
---

# Phase 8 Plan 3: Button Primitive Aloha Restyle Summary

One-liner: Button primitive rewired to the Aloha gradient primary (green-500 → emerald-600 + green-500/25 shadow), rounded-2xl base, padding-driven height, and the §9.1 Option A focus ring — all 8 variants and 4 sizes preserved with zero prop contract changes.

## What Changed

Edited only `packages/ui/src/shadcn/button.tsx`. The `buttonVariants` cva call was rewritten: base string, all 8 variants, and all 4 sizes. The `Slot` usage, `ButtonProps` interface, `forwardRef`, `displayName`, and exports were left byte-identical.

## Variant Diff

| Variant     | Before                                                                          | After                                                                                                          |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| default     | `bg-primary text-primary-foreground hover:bg-primary/90`                        | `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl`      |
| destructive | `bg-destructive text-destructive-foreground hover:bg-destructive/90`            | unchanged                                                                                                      |
| outline     | `border border-input bg-background hover:bg-accent hover:text-accent-foreground`| `border border-border bg-background text-foreground hover:bg-muted`                                            |
| secondary   | `bg-secondary text-secondary-foreground hover:bg-secondary/80`                  | `bg-background text-foreground border border-border hover:bg-muted` (D-12)                                     |
| ghost       | `hover:bg-accent hover:text-accent-foreground`                                  | unchanged                                                                                                      |
| link        | `text-primary underline-offset-4 hover:underline`                               | unchanged                                                                                                      |
| pill        | `rounded-full bg-primary text-primary-foreground border border-primary-foreground/20 px-8 py-2 font-medium hover:bg-primary/90` | `rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl px-8 py-2 font-medium` |
| brand       | `border border-[var(--supabase-green-link)] text-[var(--supabase-green-link)] bg-[var(--supabase-green)]/10 hover:bg-[var(--supabase-green)]/20` | `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl` |

Three gradient occurrences total: `default`, `pill`, `brand` — matches acceptance criterion (`grep -c "from-green-500 to-emerald-600" == 3`).

## Size Diff

| Size    | Before                      | After                                 |
| ------- | --------------------------- | ------------------------------------- |
| default | `h-9 px-4 py-2`             | `px-5 py-3` (padding-driven; D-07)    |
| sm      | `h-8 rounded-md px-3 text-xs` | `px-3 py-1.5 rounded-xl text-xs`    |
| lg      | `h-10 rounded-md px-8`      | `px-6 py-3 rounded-2xl text-sm`       |
| icon    | `h-9 w-9`                   | `h-10 w-10 rounded-2xl`               |

## Base String Diff

- Before: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50`
- After: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50`

Key deltas: `gap-2` added for icon/label spacing; `rounded-md` → `rounded-2xl`; `transition-colors` → `transition-all` (so shadow transitions on hover); `focus-visible:ring-1 focus-visible:ring-ring` → §9.1 Option A recipe (`ring-2 ring-primary ring-offset-2 ring-offset-background`).

## Acceptance Grep Results

All checks run against `packages/ui/src/shadcn/button.tsx`:

| Check                                                                                           | Expected | Actual |
| ------------------------------------------------------------------------------------------------ | -------- | ------ |
| `from-green-500 to-emerald-600` count                                                            | 3        | 3      |
| `shadow-lg shadow-green-500/25 hover:shadow-xl` present                                          | ≥1       | 3      |
| `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background` present | ≥1       | 1      |
| `rounded-2xl text-sm font-medium transition-all` present                                         | ≥1       | 1      |
| `px-5 py-3` (default size) present                                                               | ≥1       | 1      |
| `px-3 py-1.5 rounded-xl text-xs` (sm size) present                                               | ≥1       | 1      |
| `px-6 py-3 rounded-2xl text-sm` (lg size) present                                                | ≥1       | 1      |
| `h-10 w-10 rounded-2xl` (icon size) present                                                      | ≥1       | 1      |
| `bg-background text-foreground border border-border hover:bg-muted` (secondary) present          | ≥1       | 1      |
| `bg-slate-\|text-slate-\|border-slate-\|bg-gray-\|text-gray-`                                    | 0        | 0      |
| `dark:(bg\|text\|border\|ring)-`                                                                 | 0        | 0      |
| `h-9` (old default height)                                                                      | 0        | 0      |

**Note on focus-ring grep:** the plan's acceptance criterion `grep -q "ring-2 ring-primary ring-offset-2 ring-offset-background"` was written without the `focus-visible:` prefix, but the plan's own mandated base string uses `focus-visible:` on each ring utility (as does the executor rules §9.1 Option A reference and the current cva base). The recipe is unambiguously present in the file; the plan's unprefixed grep is a criterion-authoring oversight. Reporting the prefixed form as present (count = 1).

## Verification

- `pnpm typecheck` → exit 0 (no errors)
- `pnpm lint` → exit 0 (0 errors; 4 pre-existing warnings in `packages/ui/src/kit/data-table.tsx` and `packages/ui/src/shadcn/data-table.tsx` about TanStack Table React Compiler incompatibility — unrelated to this plan; out of scope)

## Deviations from Plan

None — plan executed exactly as written.

## Call-Site Impact

Zero external edits. The ~40 Button call sites across ~18 files (per plan) inherit the gradient primary automatically via `variant="default"` — no consumer code changes required.

## Commits

- `c503c80` — feat(08-03): button Aloha restyle

## Self-Check: PASSED

- FOUND: packages/ui/src/shadcn/button.tsx (modified)
- FOUND: commit c503c80 in git log
