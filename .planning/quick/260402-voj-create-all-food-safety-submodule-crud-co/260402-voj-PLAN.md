---
type: quick
description: Create CRUD configs for food safety submodules (inspections, incidents) and register them
files_modified:
  - app/lib/crud/fsafe-result.config.ts
  - app/lib/crud/fsafe-test-hold.config.ts
  - app/lib/crud/registry.ts
---

<objective>
Create CRUD config files for the two food safety submodules (`inspections` mapped to `fsafe_result` table, `incidents` mapped to `fsafe_test_hold` table) and register them in the CRUD registry.

Purpose: Enable the food safety module's submodule pages to render list/detail/form views via the generic CRUD factory.
Output: Two new config files + updated registry (11 total entries).
</objective>

<context>
@app/lib/crud/types.ts
@app/lib/crud/registry.ts
@app/lib/crud/grow-harvest-weight.config.ts (reference pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create fsafe-result.config.ts (inspections) and fsafe-test-hold.config.ts (incidents)</name>
  <files>app/lib/crud/fsafe-result.config.ts, app/lib/crud/fsafe-test-hold.config.ts</files>
  <action>
Create two CRUD config files following the exact pattern in grow-harvest-weight.config.ts.

**fsafe-result.config.ts** (inspections submodule):
- tableName: 'fsafe_result', pkType: 'uuid', pkColumn: 'id', orgScoped: true
- views: list and detail both 'fsafe_result'
- Zod schema fields (all required unless noted):
  - fsafe_lab_test_id: z.string().min(1)
  - farm_id: z.string().optional()
  - site_id: z.string().optional()
  - fsafe_test_hold_id: z.string().optional()
  - fsafe_lab_id: z.string().optional()
  - test_method: z.string().optional()
  - initial_retest_vector: z.enum(['initial','retest','vector']).optional()
  - status: z.enum(['pending','in_progress','completed']).default('pending')
  - result_enum: z.string().optional()
  - result_numeric: z.number().optional()
  - result_pass: z.boolean().optional()
  - warning_message: z.string().optional()
  - fail_code: z.string().optional()
  - notes: z.string().optional()
  - sampled_at: z.string().optional()
  - sampled_by: z.string().optional()
- columns: fsafe_lab_test_id (Lab Test, sortable), status (Status, type workflow, sortable), result_pass (Pass, type boolean), result_numeric (Result, type number), farm_id (Farm, sortable), sampled_at (Sampled, type datetime, sortable), created_at (Created, type datetime, sortable)
- search: columns ['fsafe_lab_test_id', 'notes'], placeholder 'Search inspections...'
- workflow config:
  - statusColumn: 'status'
  - states: pending (Pending, default), in_progress (In Progress, warning), completed (Completed, success)
  - transitions: pending->['in_progress'], in_progress->['completed','pending'], completed->['pending']
  - transitionFields: in_progress: { started_at: 'now' }, completed: { completed_at: 'now' }
- formFields: fsafe_lab_test_id (fk to fsafe_lab_test, labelColumn 'id', required), farm_id (fk to org_farm, labelColumn 'name'), site_id (fk to org_site, labelColumn 'name'), fsafe_test_hold_id (fk to fsafe_test_hold, labelColumn 'id'), fsafe_lab_id (fk to fsafe_lab, labelColumn 'name'), test_method (text), initial_retest_vector (select, options ['initial','retest','vector']), status (select, options ['pending','in_progress','completed'], required), result_enum (text), result_numeric (number), result_pass (boolean), warning_message (text), fail_code (text), notes (textarea), sampled_at (date), sampled_by (fk to hr_employee, labelColumn 'first_name')

**fsafe-test-hold.config.ts** (incidents submodule):
- tableName: 'fsafe_test_hold', pkType: 'uuid', pkColumn: 'id', orgScoped: true
- views: list and detail both 'fsafe_test_hold'
- Zod schema fields:
  - farm_id: z.string().min(1, 'Farm is required')
  - pack_lot_id: z.string().min(1, 'Pack lot is required')
  - sales_customer_group_id: z.string().optional()
  - sales_customer_id: z.string().optional()
  - fsafe_lab_id: z.string().optional()
  - lab_test_id: z.string().optional()
  - notes: z.string().optional()
  - delivered_to_lab_on: z.string().optional()
- columns: farm_id (Farm, sortable), pack_lot_id (Pack Lot, sortable), fsafe_lab_id (Lab), lab_test_id (Lab Test), delivered_to_lab_on (Delivered to Lab, type date, sortable), created_at (Created, type datetime, sortable)
- search: columns ['farm_id', 'notes'], placeholder 'Search incidents...'
- formFields: farm_id (fk to org_farm, labelColumn 'name', required), pack_lot_id (fk to pack_lot, labelColumn 'id', required), sales_customer_group_id (fk to sales_customer_group, labelColumn 'name'), sales_customer_id (fk to sales_customer, labelColumn 'name'), fsafe_lab_id (fk to fsafe_lab, labelColumn 'name'), lab_test_id (text), notes (textarea), delivered_to_lab_on (date)
  </action>
  <verify>
    <automated>ls app/lib/crud/fsafe-result.config.ts app/lib/crud/fsafe-test-hold.config.ts && pnpm typecheck 2>&1 | tail -5</automated>
  </verify>
  <done>Both config files exist and pass typecheck with correct CrudModuleConfig typing</done>
</task>

<task type="auto">
  <name>Task 2: Register food safety configs in registry</name>
  <files>app/lib/crud/registry.ts</files>
  <action>
Update app/lib/crud/registry.ts:
1. Add imports for fsafeResultConfig from './fsafe-result.config' and fsafeTestHoldConfig from './fsafe-test-hold.config'
2. Add two entries to the registry Map:
   - ['inspections', fsafeResultConfig]
   - ['incidents', fsafeTestHoldConfig]
3. Keep imports alphabetically sorted (fsafe entries go after the existing grow-* imports)
4. Keep registry entries in a logical order — add food safety after the growing entries

Registry should have 11 total entries after this change.
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tail -5</automated>
  </verify>
  <done>Registry has 11 entries. Inspections and incidents submodule slugs resolve to their configs.</done>
</task>

</tasks>

<verification>
pnpm typecheck passes with no errors. Registry contains 11 entries mapping all submodule slugs to configs.
</verification>

<success_criteria>
- fsafe-result.config.ts exists with full column/form/workflow config for inspections
- fsafe-test-hold.config.ts exists with full column/form config for incidents
- registry.ts maps 'inspections' and 'incidents' slugs to configs (11 total entries)
- pnpm typecheck passes
</success_criteria>
