# Supabase Database Schema

## Schema Files

Schemas are numbered files in `schemas/` — numbers set dependency order:

| File | Content |
|------|---------|
| `00-privileges.sql` | DB role setup for RLS |
| `01-enums.sql` | Custom enum types |
| `02-config.sql` | Configuration tables |
| `03-accounts.sql` | Auth accounts (Supabase Auth anchor) |
| `04-tables.sql` | All app tables: org, hr_employee, modules, access control |
| `05-view-contracts.sql` | Auth views: `app_org_context`, `app_user_orgs` |
| `06-nav-view-contracts.sql` | Sidebar views: `app_nav_modules`, `app_nav_sub_modules` |

## Multi-Tenant Model

Tenancy is `org` + `hr_employee`, NOT the template's accounts/memberships:

- `org` — tenant (e.g., a farm)
- `hr_employee` — links `auth.users` to an org with an access level
- `sys_access_level` — 5-tier hierarchy: employee < team_lead < manager < admin < owner
- `hr_module_access` — per-employee per-module CRUD permissions (can_edit, can_delete, can_verify)
- `org_module` / `org_sub_module` — feature toggles per org

## RLS Patterns

All app tables use org-scoped RLS via `hr_employee` membership:

```sql
-- Standard org-scoped read policy
CREATE POLICY "tablename_read" ON public.tablename
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = tablename.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));
```

System lookup tables (sys_access_level, sys_module, sys_sub_module) are readable by any authenticated user:

```sql
CREATE POLICY "sys_table_read" ON public.sys_table
  FOR SELECT TO authenticated USING (true);
```

## Table Creation Pattern

New tables should follow this pattern:

```sql
CREATE TABLE IF NOT EXISTS public.new_table (
  id TEXT PRIMARY KEY,                          -- or UUID with DEFAULT gen_random_uuid()
  org_id TEXT NOT NULL REFERENCES public.org(id),
  name TEXT NOT NULL,
  -- domain fields...
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT REFERENCES public.hr_employee(id),
  updated_by TEXT REFERENCES public.hr_employee(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Read: org employees only
CREATE POLICY "new_table_read" ON public.new_table
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = new_table.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

-- Write: org employees only (CRUD permissions enforced in app layer via hr_module_access)
CREATE POLICY "new_table_write" ON public.new_table
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = new_table.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

CREATE POLICY "new_table_update" ON public.new_table
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = new_table.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

GRANT SELECT, INSERT, UPDATE ON public.new_table TO authenticated;
-- No DELETE grant — use soft delete (is_deleted = true)
```

## Named FK Constraints (Required When 2+ FKs Point to Same Table)

When a table has **two or more foreign keys pointing to the same target table**, the constraints must be explicitly named so PostgREST can disambiguate them in embedded resource selects (e.g. `requester:hr_employee!fk_xxx_requested_by(...)`).

If you use the inline `REFERENCES` shorthand, PostgreSQL auto-generates names like `tablename_columnname_fkey` — those work for SQL but PostgREST's embed syntax can't pick between two of them.

**Pattern:** declare the column as a bare type, then add a `CONSTRAINT fk_<table>_<purpose>` clause at the end of the table.

```sql
CREATE TABLE IF NOT EXISTS hr_time_off_request (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          TEXT NOT NULL REFERENCES org(id),

  -- Multiple FKs to hr_employee — declare bare, name explicitly below
  hr_employee_id  TEXT NOT NULL,
  requested_by    TEXT NOT NULL,
  reviewed_by     TEXT,

  -- ... other columns ...

  -- Named FKs so PostgREST can disambiguate when embedding hr_employee
  CONSTRAINT fk_hr_time_off_request_employee
    FOREIGN KEY (hr_employee_id) REFERENCES hr_employee(id),
  CONSTRAINT fk_hr_time_off_request_requested_by
    FOREIGN KEY (requested_by) REFERENCES hr_employee(id),
  CONSTRAINT fk_hr_time_off_request_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES hr_employee(id)
);
```

**Naming convention:** `fk_<source_table>_<column_purpose>`. The purpose is usually the column name minus `_id` or a meaningful suffix (`employee`, `requested_by`, `team_lead`, `compensation_manager`).

**When you only have ONE FK to a target table**, the inline `REFERENCES` shorthand is fine — PostgREST has no ambiguity to resolve.

**Self-referential FKs always need naming**, even if there's only one — PostgREST treats `parent` and `child` lookups against the same table as separate operations and needs an explicit constraint to follow.

**If you discover this issue on an existing hosted table**, the fix is a one-shot patch migration that uses `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ...` wrapped in `pg_constraint` existence checks for idempotency. After applying to hosted, fold the named constraints into the original `CREATE TABLE` migration and mark the patch as reverted in remote history (`supabase migration repair --status reverted <ts>`).

## Conventions

- **Soft delete**: Set `is_deleted = true`, never hard DELETE
- **Audit columns**: `created_by`, `updated_by` reference `hr_employee(id)`
- **Timestamps**: `created_at`, `updated_at` with `TIMESTAMPTZ`
- **PK types**: TEXT for human-readable IDs, UUID for system-generated
- **org_id**: Every business table has `org_id TEXT REFERENCES org(id)`
- **Named FKs**: Required when 2+ FKs point to the same target table (see section above)
- **No `app_permissions` enum** — permissions are in `hr_module_access` (can_edit, can_delete, can_verify)

## TypeScript Types

```typescript
import type { Tables, Enums } from '@aloha/supabase/database';

type Org = Tables<'org'>;
type Employee = Tables<'hr_employee'>;
type Item = Tables<'invnt_item'>;
```

## Commands

```bash
pnpm supabase:start         # Start Supabase locally
pnpm supabase:reset         # Reset with latest schema
pnpm supabase:typegen       # Generate TypeScript types
pnpm supabase db diff -f migration-name  # Create migration
```
