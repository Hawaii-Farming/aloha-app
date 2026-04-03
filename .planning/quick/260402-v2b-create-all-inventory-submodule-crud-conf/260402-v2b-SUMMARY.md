---
type: quick
description: Create CRUD configs for warehouses and stock_counts inventory submodules
completed: "2026-04-02"
tasks_completed: 2
tasks_total: 2
commits:
  - hash: 90ac955
    message: "feat(260402-v2b): create CRUD configs for warehouses (org_site) and stock_counts (invnt_onhand)"
  - hash: e2574e5
    message: "feat(260402-v2b): register warehouses and stock_counts in CRUD registry"
files_created:
  - app/lib/crud/org-site.config.ts
  - app/lib/crud/invnt-onhand.config.ts
files_modified:
  - app/lib/crud/registry.ts
---

# Quick Task 260402-v2b Summary

## One-liner

Two new CRUD configs wiring the `org_site` (warehouses) and `invnt_onhand` (stock_counts) tables into the registry, completing all three inventory submodules.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Create org-site.config.ts and invnt-onhand.config.ts | 90ac955 |
| 2 | Register warehouses and stock_counts in registry.ts | e2574e5 |

## What Was Built

**org-site.config.ts** — CRUD config for the `org_site` table (warehouses submodule):
- Text PK (`id`), orgScoped, list/detail view on `org_site`
- Zone select filter with options: `zone_1`, `zone_2`, `zone_3`, `zone_4`
- `is_food_contact_surface` boolean field
- `id` shows on create only (showOnCreate: true, showOnEdit: false)

**invnt-onhand.config.ts** — CRUD config for the `invnt_onhand` table (stock_counts submodule):
- UUID PK (auto-generated) — id excluded from Zod schema and form fields per plan
- FK fields: `invnt_item_id` → `invnt_item.name`, `onhand_uom` → `sys_uom.id`, `invnt_lot_id` → `invnt_lot.id`
- Date column type on `onhand_date`, number type on `onhand_quantity` and `burn_per_onhand`

**registry.ts** — Updated to include:
- `['warehouses', orgSiteConfig]`
- `['stock_counts', invntOnhandConfig]`
- Registry now covers 7 submodules total

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: app/lib/crud/org-site.config.ts
- FOUND: app/lib/crud/invnt-onhand.config.ts
- FOUND: app/lib/crud/registry.ts
- FOUND: commit 90ac955
- FOUND: commit e2574e5
