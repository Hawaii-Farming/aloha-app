---
phase: 8
plan: 2
plan_id: 08-02
subsystem: shared-primitives
tags: [ui, primitives, badge, restyle, wcag]
requirements: [PRIM-04]
dependency_graph:
  requires:
    - Phase 7 semantic tokens (bg-semantic-{red,green,amber,blue}-{bg,fg}, bg-muted, text-muted-foreground)
  provides:
    - Pill-shaped Badge primitive with 7 retuned semantic variants
  affects:
    - app/components/**/StatusBadgeRenderer.tsx (AG Grid status pills)
    - All existing Badge call sites (visual-only change, no prop contract drift)
tech_stack:
  added: []
  patterns:
    - cva variant retune (class-string swap only)
key_files:
  created: []
  modified:
    - packages/ui/src/shadcn/badge.tsx
decisions:
  - Retuned `default` from `bg-primary text-primary-foreground` to `bg-muted text-muted-foreground` — remediates §9.1 #9 (2.28:1) WCAG AA contrast failure
  - Retuned `destructive` to semantic pastel (`bg-semantic-red-bg text-semantic-red-fg`) matching success/warning/info rhythm
  - Preserved all 7 existing variants verbatim (no additions, no removals, no aliases) per D-17/D-18 caller audit
  - Kept BadgeProps, forwardRef-free component body, and `VariantProps<typeof badgeVariants>` type byte-identical
metrics:
  duration: "~3min"
  completed_date: "2026-04-10"
  tasks_completed: 1
  files_modified: 1
---

# Phase 8 Plan 2: Badge Primitive Restyle Summary

Retuned `packages/ui/src/shadcn/badge.tsx` to a pill-shaped primitive with semantic Aloha color variants, fixing the §9.1 #9 contrast failure on `default` while preserving all 7 existing variants and the public prop contract.

## Scope

Single-file, className-only restyle of the Badge primitive (PRIM-04). No prop contract changes, no new variants, no removed variants, no hardcoded colors, no `dark:` overrides. The `Badge` component body, `BadgeProps` interface, and named exports remain byte-identical.

## Variant Diff

| Variant       | Before                                                                 | After                                             | Rationale                                            |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| *base*        | `rounded-md border px-2.5 py-0.5 text-xs font-medium` + `ring-ring`    | `rounded-full border-transparent px-3 py-1 text-xs font-medium` + `ring-primary` | Pill shape (D-09), Aloha focus ring |
| `default`     | `border-transparent bg-primary text-primary-foreground hover:bg-primary/80` | `bg-muted text-muted-foreground`                  | **§9.1 #9 remediation** (2.28:1 → passing)           |
| `secondary`   | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80` | `bg-muted text-muted-foreground`                  | Neutral slate pill per D-17                          |
| `destructive` | `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80` | `bg-semantic-red-bg text-semantic-red-fg`         | Semantic pastel consistency with success/warning/info |
| `outline`     | `text-foreground`                                                      | `bg-background text-foreground border border-border` | Explicit token-driven surface                     |
| `success`     | `border-transparent bg-semantic-green-bg text-semantic-green-fg`       | `bg-semantic-green-bg text-semantic-green-fg`     | Unchanged palette, base border removed               |
| `warning`     | `border-transparent bg-semantic-amber-bg text-semantic-amber-fg`       | `bg-semantic-amber-bg text-semantic-amber-fg`     | Unchanged palette, base border removed               |
| `info`        | `border-transparent bg-semantic-blue-bg text-semantic-blue-fg`         | `bg-semantic-blue-bg text-semantic-blue-fg`       | Unchanged palette, base border removed               |

All 7 variants preserved. Zero additions, zero removals, zero aliases.

## Grep Verification Results

| Check                                                                                             | Result |
| ------------------------------------------------------------------------------------------------- | ------ |
| `rounded-full border-transparent px-3 py-1 text-xs font-medium` present                           | PASS   |
| `bg-semantic-red-bg text-semantic-red-fg` present                                                 | PASS   |
| `bg-semantic-green-bg text-semantic-green-fg` present                                             | PASS   |
| `bg-semantic-amber-bg text-semantic-amber-fg` present                                             | PASS   |
| `bg-semantic-blue-bg text-semantic-blue-fg` present                                               | PASS   |
| `bg-muted text-muted-foreground` present (default + secondary)                                    | PASS   |
| `bg-primary text-primary-foreground` removed (§9.1 #9 remediation)                                | PASS   |
| No `bg-slate-*` / `text-slate-*` / `border-slate-*` / `bg-white` / `bg-black`                     | PASS   |
| No `dark:(bg\|text\|border\|ring)-` overrides                                                     | PASS   |

## Verification

- `pnpm typecheck` → exit 0
- `pnpm lint` → exit 0 errors (4 pre-existing warnings in unrelated files: `table-list-view.tsx`, `data-table.tsx`)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `521fa22` — feat(08-02): badge Aloha restyle

## Known Stubs

None — purely presentational restyle.

## Self-Check: PASSED

- File `packages/ui/src/shadcn/badge.tsx` exists and contains all required class strings
- Commit `521fa22` present in `git log`
- All 9 grep acceptance criteria pass
- `pnpm typecheck` and `pnpm lint` both green
