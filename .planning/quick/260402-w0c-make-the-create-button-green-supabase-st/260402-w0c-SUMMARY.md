---
task_id: 260402-w0c
description: Make the + Create button green Supabase style in sub-module list pages
completed: "2026-04-02"
duration: <1m
commits:
  - hash: 6c6aadc
    message: "feat(260402-w0c): add brand variant and apply to Create button"
files_modified:
  - packages/ui/src/shadcn/button.tsx
  - app/routes/workspace/sub-module.tsx
---

# Quick Task 260402-w0c Summary

**One-liner:** Added `brand` button variant using `--supabase-green` CSS variable and applied it to the Create button on all sub-module list pages.

## Changes Made

1. **`packages/ui/src/shadcn/button.tsx`** — Added `brand` variant to `buttonVariants` cva definition after `pill`, using `bg-[var(--supabase-green)]` with white text and a subtle shadow.

2. **`app/routes/workspace/sub-module.tsx`** — Changed `<Button asChild size="sm">` to `<Button asChild size="sm" variant="brand">` on the Create button (line 159).

## Verification

- `pnpm typecheck` — passed
- `pnpm format:fix` — all files match Prettier code style

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `packages/ui/src/shadcn/button.tsx` — exists with `brand` variant
- `app/routes/workspace/sub-module.tsx` — exists with `variant="brand"`
- Commit `6c6aadc` — verified in git log
