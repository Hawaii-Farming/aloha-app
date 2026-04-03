---
type: quick
description: Create CRUD configs for operations submodules (task_tracking, checklists) and register them
files_modified:
  - app/lib/crud/ops-task-tracker.config.ts
  - app/lib/crud/ops-template.config.ts
  - app/lib/crud/registry.ts
---

<objective>
Create CRUD configuration files for the two operations submodules — task_tracking (ops_task_tracker table) and checklists (ops_template table) — and register them in the CRUD registry.

Purpose: Complete operations module CRUD coverage so task tracking and checklists submodules render list/detail/form views.
Output: Two new config files + updated registry (11 -> 13 entries).
</objective>

<context>
@app/lib/crud/types.ts
@app/lib/crud/registry.ts
@app/lib/crud/fsafe-result.config.ts (pattern reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ops-task-tracker.config.ts and ops-template.config.ts</name>
  <files>app/lib/crud/ops-task-tracker.config.ts, app/lib/crud/ops-template.config.ts</files>
  <action>
Create two CRUD config files following the exact pattern in fsafe-result.config.ts.

**ops-task-tracker.config.ts** (submodule slug: task_tracking, table: ops_task_tracker):
- pkType: 'uuid', pkColumn: 'id', orgScoped: true
- views: list and detail both 'ops_task_tracker'
- Zod schema fields: ops_task_id (string, required), farm_id (string, optional), site_id (string, optional), start_time (string, required), stop_time (string, optional), is_completed (boolean, default false), notes (string, optional), verified_at (string, optional), verified_by (string, optional)
- Columns: ops_task_id (label "Task", sortable), is_completed (label "Completed", type boolean), start_time (label "Started", type datetime, sortable), stop_time (label "Stopped", type datetime, sortable), farm_id (label "Farm", sortable), created_at (label "Created", type datetime, sortable)
- Search: columns ['notes'], placeholder 'Search task tracking...'
- formFields: ops_task_id (fk to ops_task, fkLabelColumn 'name', required), farm_id (fk to org_farm, fkLabelColumn 'name'), site_id (fk to org_site, fkLabelColumn 'name'), start_time (date, required), stop_time (date), is_completed (boolean), notes (textarea), verified_by (fk to hr_employee, fkLabelColumn 'first_name')
- No workflow config needed.

**ops-template.config.ts** (submodule slug: checklists, table: ops_template):
- pkType: 'text', pkColumn: 'id', orgScoped: true
- views: list and detail both 'ops_template'
- Zod schema fields: id (string, required), name (string, required), farm_id (string, optional), ops_template_category_id (string, optional), description (string, optional), atp_site_count (number, optional), minimum_rlu_value (number, optional), maximum_rlu_value (number, optional), display_order (number, default 0)
- Columns: name (label "Name", sortable), ops_template_category_id (label "Category", sortable), farm_id (label "Farm", sortable), atp_site_count (label "ATP Sites", type number), display_order (label "Order", type number, sortable), created_at (label "Created", type datetime, sortable)
- Search: columns ['name', 'description'], placeholder 'Search checklists...'
- formFields: id (text, required — only showOnCreate: true), name (text, required), farm_id (fk to org_farm, fkLabelColumn 'name'), ops_template_category_id (fk to ops_template_category, fkLabelColumn 'name'), description (textarea), atp_site_count (number), minimum_rlu_value (number), maximum_rlu_value (number), display_order (number)
- No workflow config needed.

Export each config as a named export: opsTaskTrackerConfig, opsTemplateConfig.
  </action>
  <verify>pnpm typecheck 2>&1 | tail -5</verify>
  <done>Both config files exist with correct Zod schemas, column definitions, search configs, and form field definitions matching their database tables.</done>
</task>

<task type="auto">
  <name>Task 2: Register both configs in the CRUD registry</name>
  <files>app/lib/crud/registry.ts</files>
  <action>
Import and register the two new configs in registry.ts:

1. Add imports: opsTaskTrackerConfig from './ops-task-tracker.config', opsTemplateConfig from './ops-template.config'
2. Add two entries to the registry Map:
   - ['task_tracking', opsTaskTrackerConfig]
   - ['checklists', opsTemplateConfig]
3. Keep imports sorted alphabetically. Place new Map entries after existing ones, maintaining alphabetical order by slug.
  </action>
  <verify>pnpm typecheck 2>&1 | tail -5</verify>
  <done>Registry has 13 entries. getModuleConfig('task_tracking') and getModuleConfig('checklists') return their respective configs.</done>
</task>

</tasks>

<verification>
pnpm typecheck passes with no errors related to crud configs.
</verification>

<success_criteria>
- ops-task-tracker.config.ts and ops-template.config.ts exist with correct CrudModuleConfig implementations
- registry.ts imports and registers both configs (13 total entries)
- pnpm typecheck passes
</success_criteria>
