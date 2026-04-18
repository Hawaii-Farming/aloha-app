---
id: 260417-wyc
type: quick
status: complete
---

# Quick Task 260417-wyc

## Objective

Housing detail view — inline the tenants count with Back + house name in the top bar, and drop the body padding so the tenants grid sits immediately below the header (edge-to-edge, matching the list view).

## Layout Target

```
← Back  |  🏠 House Name  |  Tenants (10)                  Edit  Delete
└──────────────────────────────────────────────────────────────────────┘
[ tenants AG Grid, full width, flex-fills remaining height ]
```

## Changes

File: `app/components/crud/housing-detail-view.tsx`

1. **Top bar (left cluster):** after the house name, add a divider + `Tenants (N)` label.
2. **Body:** remove `gap-6 px-8 py-6`. Drop the `<h2>Tenants (N)</h2>` + `<Separator>` above the grid — the count is now in the header. Notes collapses to a compact one-line bar under the header (shrinkable).
3. **Cleanup:** drop the now-unused `Separator` import.

## Verification

- `pnpm typecheck` clean.
- Detail page: tenants grid touches the top bar; no extra vertical space.
