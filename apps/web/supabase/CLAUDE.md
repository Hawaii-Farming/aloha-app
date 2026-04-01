# Supabase Database Schema

## Schema Files

Schemas are numbered files in `schemas/` — numbers set dependency order:

| File | Content |
|------|---------|
| `00-privileges.sql` | DB role setup for RLS |
| `01-enums.sql` | Custom enum types |
| `02-config.sql` | Configuration tables |
| `03-accounts.sql` | Auth accounts (Supabase Auth anchor) |
| `04-consumer-dev-tables.sql` | All app tables: org, hr_employee, modules, access control |
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

## Conventions

- **Soft delete**: Set `is_deleted = true`, never hard DELETE
- **Audit columns**: `created_by`, `updated_by` reference `hr_employee(id)`
- **Timestamps**: `created_at`, `updated_at` with `TIMESTAMPTZ`
- **PK types**: TEXT for human-readable IDs, UUID for system-generated
- **org_id**: Every business table has `org_id TEXT REFERENCES org(id)`
- **No `app_permissions` enum** — permissions are in `hr_module_access` (can_edit, can_delete, can_verify)

## TypeScript Types

```typescript
import type { Tables, Enums } from '@aloha/supabase/database';

type Org = Tables<'org'>;
type Employee = Tables<'hr_employee'>;
type Product = Tables<'inv_product'>;
```

## Commands

```bash
pnpm supabase:web:start     # Start Supabase locally
pnpm supabase:web:reset     # Reset with latest schema
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase:db:diff -f migration-name  # Create migration
```
