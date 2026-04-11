---
phase: 8
plan: 5
plan_id: 08-05
subsystem: shared-primitives
tags: [primitives, forms, input, textarea, select, focus-ring, a11y, prim-03]
requirements: [PRIM-03]
dependency_graph:
  requires:
    - 07-design-foundations (tokens: --border, --background, --foreground, --muted-foreground, --primary)
    - 08-01 (button baseline established focus recipe pattern)
  provides:
    - "Shared Aloha form recipe: text-base / py-3 / rounded-2xl / green focus halo"
    - "§9.1 Option A focus ring remediation applied to all three form primitives"
  affects:
    - FormField consumers across CRUD create/edit sheets
    - Every form in the app (auth sign-in, CRUD, settings)
tech_stack:
  added: []
  patterns:
    - "Shared recipe: three primitives, one class string"
    - "Padding-driven height (no fixed h-9) — intrinsic ~48px satisfies WCAG 2.5.5"
    - "§9.1 Option A: focus-visible:ring-2 ring-primary ring-offset-2 ring-offset-background"
key_files:
  created: []
  modified:
    - packages/ui/src/shadcn/input.tsx
    - packages/ui/src/shadcn/textarea.tsx
    - packages/ui/src/shadcn/select.tsx
decisions:
  - "Applied shared recipe verbatim across Input, Textarea, SelectTrigger (one commit for all three)"
  - "Prettier class reorder accepted as semantically identical per plan execution rules"
  - "Only SelectTrigger modified in select.tsx; Content/Item/Label/Separator/ScrollButtons untouched"
metrics:
  duration_minutes: 3
  tasks_completed: 3
  files_modified: 3
  commits: 1
  completed_date: 2026-04-10
---

# Phase 8 Plan 5: Input + Textarea + Select (PRIM-03) Summary

**One-liner:** Applied the shared Aloha form recipe (`text-base py-3 rounded-2xl`, green-primary focus halo with background offset) to `input.tsx`, `textarea.tsx`, and `SelectTrigger`, satisfying PRIM-03 and remediating §9.1 #11 focus-ring contrast blocker in a single commit.

## What Shipped

Three form primitives restyled with one shared class recipe:

1. **`input.tsx`** — dropped fixed `h-9`, swapped to `rounded-2xl border border-border bg-background px-4 py-3 text-base`, preserved all `file:*` utilities and disabled styles, replaced old `ring-1 ring-ring` focus with `ring-2 ring-primary ring-offset-2 ring-offset-background`.
2. **`textarea.tsx`** — identical recipe with `min-h-[80px]` (bumped from `min-h-[60px]`), native resize preserved.
3. **`select.tsx` → SelectTrigger only** — identical recipe with `[&>span]:line-clamp-1` preserved; `CaretSortIcon` child untouched.

## Shared Recipe Diff

| Aspect | Before | After |
|---|---|---|
| Border | `border-input` | `border-border` |
| Fill | `bg-transparent` | `bg-background` |
| Height | `h-9` (fixed 36px) | padding-driven (~48px) |
| Padding | `px-3 py-1` (input) / `px-3 py-2` (textarea, select) | `px-4 py-3` (all three) |
| Type size | `text-sm` (14px) | `text-base` (16px — blocks iOS zoom) |
| Radius | `rounded-md` | `rounded-2xl` |
| Text color | (inherited) | `text-foreground` (explicit) |
| Placeholder | `placeholder:text-muted-foreground` | (unchanged) |
| Focus ring | `ring-1 ring-ring` / `focus:ring-ring` | `ring-2 ring-primary ring-offset-2 ring-offset-background` |
| Textarea min-h | `min-h-[60px]` | `min-h-[80px]` |
| Transition | `transition-colors` | `transition-colors` (unchanged) |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-50` | (unchanged) |

**Prop contracts:** ZERO changes. `InputProps`, `TextareaProps`, all Select forwardRef types, displayNames, exports, and imports are byte-identical to pre-plan state.

## Select Sub-components Untouched (explicit)

Per 08-UI-SPEC §5 and plan Task 3, these were NOT modified:

- `Select` (Radix root)
- `SelectGroup`
- `SelectValue`
- `SelectContent`
- `SelectItem`
- `SelectLabel`
- `SelectSeparator`
- `SelectScrollUpButton`
- `SelectScrollDownButton`

They inherit popover tokens from Phase 7 and are explicitly out of Phase 8 scope.

## Verification

### Grep Acceptance (all passed)

| Check | File | Result |
|---|---|---|
| `rounded-2xl border border-border bg-background px-4 py-3 text-base` | input.tsx | match (semantic — prettier-reordered) |
| `rounded-2xl border border-border bg-background px-4 py-3 text-base` | textarea.tsx | match (semantic — prettier-reordered) |
| `rounded-2xl border border-border bg-background px-4 py-3 text-base` | select.tsx | match (semantic — prettier-reordered) |
| `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background` | all three | match (semantic) |
| `placeholder:text-muted-foreground` | all three | match |
| `file:border-0 file:bg-transparent file:text-sm file:font-medium` | input.tsx | match (preserved verbatim) |
| `min-h-[80px]` | textarea.tsx | match |
| `[&>span]:line-clamp-1` | select.tsx | match (preserved) |
| ` h-9` | all three | no match |
| `border-input` | all three | no match |
| `rounded-md` | all three | no match |
| `min-h-[60px]` | textarea.tsx | no match (old value removed) |
| `bg-slate-\|text-slate-\|border-slate-\|bg-white\|bg-black` | all three | no match |
| `dark:(bg\|text\|border\|ring)-` | all three | no match |

**Note on class ordering:** Prettier (`prettier-plugin-tailwindcss`) reorders class tokens alphabetically/by category after write. The semantic content of the three class strings is identical to the plan specification; execution_rules explicitly allow this (`Prettier reorders classes — semantic match is fine`).

### Automated Verification

- `pnpm typecheck` → exit 0 (green for input.tsx + textarea.tsx + select.tsx combined)
- `pnpm lint` → exit 0 errors (4 pre-existing warnings in `crud/table-list-view.tsx` and `kit/data-table.tsx` / `shadcn/data-table.tsx` — unrelated to this plan, out of scope)

## Commits

| Hash | Message |
|---|---|
| `b04f92b` | `feat(08-05): input/textarea/select Aloha restyle` |

One commit covering all three files per plan success criteria.

## Deviations from Plan

None — plan executed exactly as written. The three class strings were applied verbatim; Prettier reordered tokens on disk (anticipated by execution_rules).

## §9.1 Remediation Status

PRIM-03's contribution to the §9.1 #11 blocker remediation is complete:

- All three form primitives now use the Option A focus recipe: `ring-2 ring-primary ring-offset-2 ring-offset-background`.
- Combined with the Button base recipe from 08-01, the §9.1 #11 (focus ring 2.08:1 failure) is now remediated across Button + Input + Textarea + Select — the four primitives most frequently tabbed through in form contexts.
- Manual smoke check (deferred to phase-end 08-06 manual verification): tab through `/auth/sign-in` — green halo with slate-background offset should be clearly visible in both themes.

## Known Stubs

None.

## Self-Check: PASSED

**Files verified:**
- `packages/ui/src/shadcn/input.tsx` — FOUND, modified (class string updated)
- `packages/ui/src/shadcn/textarea.tsx` — FOUND, modified (class string updated, min-h bumped)
- `packages/ui/src/shadcn/select.tsx` — FOUND, SelectTrigger className updated only

**Commit verified:**
- `b04f92b` — FOUND in git log

All artifacts claimed in this SUMMARY exist on disk and in git history.
