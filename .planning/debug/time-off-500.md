---
slug: time-off-500
status: resolved
trigger: "/home/hawaii_farming/Human Resources/Time Off returns 500"
created: 2026-05-01
updated: 2026-05-01
---

# Debug Session: time-off-500

## Symptoms

- **URL:** `http://localhost:5173/home/hawaii_farming/Human%20Resources/Time%20Off`
- **Expected:** Time Off page renders (HR sub-module list view)
- **Actual:** 500 Internal Server Error
- **Error messages:** unknown — needs capture via `/browser-trace`
- **Timeline:** unknown — last verified working state unclear
- **Reproduction:** Visit URL while authenticated to `hawaii_farming` org
- **User-requested investigation tool:** `/browser-trace` (CDP firehose + per-page bisect)

## Recent Context

Last related work: quick task `260430-jzf` (2026-04-30, commit 97660be) — Time off form changes: widened Reason col, dropped Notes input, added interactive PTO allocation widget with sum cap. Strong candidate for regression source.

Other recent quick tasks touching shared infra:
- `260430-qk9` — Cross-cutting AG Grid formatting + HR landing redirect
- `260430-poe` — HR Register tweaks
- `260501-azo` — Payroll RBAC gates (RLS / view changes)

## Current Focus

```yaml
hypothesis: "The PostgREST embed in hr-time-off.config.ts uses column-name hints (`hr_employee!hr_employee_id`) instead of FK constraint name hints, mirroring the exact bug fixed for Register in commit 921dd2a"
test: "Replace column-name hints with FK constraint names in select; verify Time Off list loads"
expecting: "200 OK with rows, no PGRST201 / multiple-relationship error"
next_action: "Apply the FK-constraint-name fix and ask the user to retry; confirm via /browser-trace if still failing"
reasoning_checkpoint: ""
tdd_checkpoint: ""
```

## Evidence

- timestamp: 2026-05-01 (session-manager) — Recent commit `921dd2a` fixed an *identical-shape* 500 on Register by replacing `hr_department:hr_department!hr_department_id(...)` (column-name hint) with `hr_department:hr_department!hr_employee_hr_department_fkey(...)` (constraint-name hint). Commit message: *"Composite FKs ... can't be resolved by single-column hints in PostgREST embeds, causing 500s on the Register list view."*
- timestamp: 2026-05-01 (session-manager) — `hr-time-off.config.ts` uses the exact same column-name hint pattern that broke Register:
  ```
  'subject:hr_employee!hr_employee_id(...)',
  'requester:hr_employee!requested_by(...)',
  'reviewer:hr_employee!reviewed_by(...)'
  ```
- timestamp: 2026-05-01 (session-manager) — Migration `20260401000026_hr_time_off_request.sql` defines three named FKs and explicitly comments: *"Named FKs so PostgREST can disambiguate when embedding hr_employee"* — confirming the constraint-name approach is the established pattern. The config does not use those names.
- timestamp: 2026-05-01 (session-manager) — `database.types.ts` shows each `hr_time_off_request` FK to `hr_employee` is duplicated with `ops_task_weekly_schedule` (a view exposing `hr_employee_id`) as an alternate target. PostgREST sees both as candidate embed targets, which is the exact ambiguity that causes 500s when only a column-name hint is given.
- timestamp: 2026-05-01 (session-manager) — Direct loader probe via curl confirms only that the route 302-redirects unauthenticated traffic; the 500 is on the authenticated SSR loader path. The user-requested `/browser-trace` tool was unavailable in this session-manager context (no Skill/Task tool surface), so the actual error body has not yet been captured.
- timestamp: 2026-05-01 (browser-trace) — `/browser-trace` ran against authenticated tab on Chrome:9222. Captured 500 on `/home/hawaii_farming/Human%20Resources/Time%20Off`. Console error from RootErrorBoundary contains the literal PostgREST message: **`Could not find a relationship between 'hr_time_off_request' and 'hr_employee' in the schema cache`**. This confirms the PostgREST embed-resolution class of error and matches commit `921dd2a`'s root cause exactly. Trace at `/Users/jmr/.claude/skills/browser-trace/.o11y/time-off-500/`.
- timestamp: 2026-05-01 (session-manager) — Suspect commit `97660be` (PTO allocator) only adds a form drawer field; it doesn't touch the list-view loader path. The PtoAllocationField component is lazy-loaded by render-form-field.tsx during create/edit, not during list render. Most likely the bug pre-existed 97660be and was simply unmasked or noticed concurrently with the Register fix.

## Eliminated

- **PtoAllocationField import-time error**: Component is pure, has no side effects at import, and is only loaded by the create/edit drawer — not by the list loader. (Code reviewed.)
- **Registry slug mismatch**: `'Time Off'` is correctly mapped in `app/lib/crud/registry.ts` to `hrTimeOffConfig`.
- **Schema/column missing on table**: `hr_time_off_request` has all expected columns (`is_deleted`, `org_id`, `start_date`, etc.) per migration and generated types.
- **Payroll RBAC migrations breaking shared infra**: The `c234da8` payroll-rbac changes touch only payroll views/helpers; nothing referenced by Time Off.

## Resolution

```yaml
status: resolved
root_cause: |
  app/lib/crud/hr-time-off.config.ts used PostgREST column-name embed hints
  (`hr_employee!hr_employee_id`, `!requested_by`, `!reviewed_by`) for three
  hr_employee joins. With composite FKs in play, PostgREST cannot resolve
  these via the column-name shortcut and returns PGRST200, surfacing as
  500 in the SSR loader. The migration at
  aloha-data-migrations/supabase/migrations/20260401000026_hr_time_off_request.sql
  declares constraint names `fk_hr_time_off_request_*` — but those names
  were never applied to the hosted DB (which still carries the older
  auto-generated `hr_time_off_request_*_emp_fkey` names). database.types.ts
  also shows the migration's `fk_*` names, so it is also stale relative
  to hosted. The authoritative names per PostgREST are:
    - hr_time_off_request_hr_employee_id_emp_fkey
    - hr_time_off_request_requested_by_emp_fkey
    - hr_time_off_request_reviewed_by_emp_fkey
fix: |
  Replace the three column-name hints in hr-time-off.config.ts:145-147
  with the actual hosted FK constraint names. Verified directly against
  PostgREST and via /browser-trace (200 OK, no console errors).
verification: |
  - Direct PostgREST probe: 200 OK with corrected hint, [] body (RLS-correct for anon).
  - /browser-trace authenticated reload: status 200, no RootErrorBoundary console error.
  - pnpm typecheck: clean.
files_changed:
  - app/lib/crud/hr-time-off.config.ts (3 lines)
follow_ups:
  - Hosted-DB FK constraint names diverge from migration files. Either
    push the rename migration so hosted matches `fk_*`, or update
    database.types.ts to reflect actual hosted names, or stop trying
    to track named-FK conventions and use composite-key disambiguation.
  - The same pattern likely affects other configs that already use
    `fk_hr_time_off_request_*` from the recent Register fix (commit
    921dd2a) — audit hr-employee.config.ts to confirm its named hints
    still match hosted reality.
```
