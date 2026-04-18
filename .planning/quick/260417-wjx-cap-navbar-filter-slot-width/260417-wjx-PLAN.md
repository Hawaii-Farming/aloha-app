---
id: 260417-wjx
type: quick
status: complete
---

# Quick Task 260417-wjx

## Objective

Guarantee a visible gap between the filter-slot cluster (Payroll toggle + Filters button with active chip summary) and the absolutely-centered search bar. Search must stay locked in center — gap comes from capping the filter slot's right edge.

## Geometry

- Search is centered via `absolute inset-x-0 flex justify-center` with `max-w-md` (448px / 28rem).
- Search left edge sits at `50% - 14rem`.
- Cap filter slot to `max-w-[calc(50%-15rem)]` → 1rem (16px) hard gap before the search's left edge.

## Change

File: `app/components/workspace-shell/workspace-navbar.tsx`

```diff
-  className="flex min-w-0 shrink items-center gap-2"
+  className="flex min-w-0 shrink items-center gap-2 max-w-[calc(50%-15rem)]"
```

Filters button's own `max-w-[520px]` + summary `truncate` now handle overflow cleanly — when the slot caps, the active chip summary truncates with an ellipsis instead of colliding with search.

## Verification

`pnpm typecheck` clean. Visual: Filters with active date range no longer touches search bar.
