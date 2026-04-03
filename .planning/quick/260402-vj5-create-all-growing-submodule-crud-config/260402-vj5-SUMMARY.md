---
id: 260402-vj5
type: quick
description: Create CRUD configs for all growing submodules (seed_batches, harvests) and register them
completed: "2026-04-02"
duration: ~5 minutes
tasks_completed: 2
files_created: 2
files_modified: 1
commits:
  - 61bf9d3
  - 4082fda
---

# Quick Task 260402-vj5 Summary

**One-liner:** Two growing CRUD configs (grow_seed_batch with 5-state workflow + grow_harvest_weight) wired to the generic factory via 9-entry registry.

## What Was Done

### Task 1: Create grow-seed-batch.config.ts and grow-harvest-weight.config.ts

Created two CRUD config files following the established pattern (matching invnt-onhand.config.ts and hr-time-off.config.ts):

**grow-seed-batch.config.ts** (`seed_batches` slug):
- Maps to `grow_seed_batch` table with UUID PK
- 5-state workflow: planned (default) → seeded → transplanted → harvesting → harvested
- 18 form fields including 8 FK references (org_farm, org_site, grow_seed_mix, invnt_item, grow_cycle_pattern, grow_trial_type, invnt_lot, sys_uom)
- Status filter with all 5 workflow states
- Zod schema with enum status defaulting to 'planned'

**grow-harvest-weight.config.ts** (`harvests` slug):
- Maps to `grow_harvest_weight` table with UUID PK
- No workflow (harvest records are terminal)
- 10 form fields including 5 FK references (grow_seed_batch, org_farm, org_site, grow_grade, sys_uom, grow_harvest_container)
- Uses `batch_code` as FK label column for grow_seed_batch

### Task 2: Register growing configs in CRUD registry

Updated `app/lib/crud/registry.ts` to add:
- `['seed_batches', growSeedBatchConfig]`
- `['harvests', growHarvestWeightConfig]`

Registry now has 9 entries (was 7).

## Commits

| Hash | Message |
|------|---------|
| 61bf9d3 | feat(260402-vj5): create grow-seed-batch and grow-harvest-weight CRUD configs |
| 4082fda | feat(260402-vj5): register seed_batches and harvests in CRUD registry |

## Verification

- `pnpm typecheck` passes cleanly after both tasks
- Pre-existing lint errors in unrelated files (sub-module routes, mcp-server, ui packages) — out of scope for this task

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/lib/crud/grow-seed-batch.config.ts` — FOUND
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/lib/crud/grow-harvest-weight.config.ts` — FOUND
- Commit 61bf9d3 — FOUND
- Commit 4082fda — FOUND
- Registry has 9 entries — VERIFIED
