# Aloha App — Schema Conventions

These rules apply to every schema change in this project. All contributors must follow them.

---

## 1. Modules

One table defines all modules, their prefixes, file numbering, and doc numbering:

| Prefix    | Module          | Migration range | Doc # |
|-----------|-----------------|-----------------|-------|
| (none)    | Core (`util_uom`, `org`, `farm`, `site`) | 001–009 | 01 |
| `grow_`   | Core crop data (`grow_variety`, `grow_grade`) | (within Core) | 01 |
| `invnt_`  | Inventory       | 012–020 | 02 |
| `hr_`     | Human Resources | 021–025 | 03 |
| `ops_`    | Operations      | 026–038 | 04 |
| `pack_`   | Pack            | 039–054 | 05 |
| `sales_`  | Sales           | 039–054 | 06 |
| `maint_`  | Maintenance     | 055–056 | 07 |
| `fsafe_`  | Food Safety     | 057–062 | 08 |
| (deferred)| Future          | —       | 09 |

Sales & Pack migration ranges are interleaved (039–054) due to cross-module FK dependencies.

Tables designed but not yet ready for deployment go in `supabase/migrations_future/` and are documented in the `_09_future.md` schema doc.

---

## 2. Standard Fields

Every table includes these fields. They are omitted from `.md` column tables for brevity and do not receive `COMMENT ON COLUMN` descriptions.

```sql
is_deleted  BOOLEAN     NOT NULL DEFAULT false
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
created_by  TEXT
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_by  TEXT
```

- `is_deleted` — soft delete flag. No records are physically deleted. Queries filter on `WHERE is_deleted = false`.
- `created_by` / `updated_by` — Supabase Auth email (TEXT, no FK). These are audit fields, not workflow fields.
- `updated_at` / `updated_by` always close the column list.
- `ON DELETE CASCADE` is never used. All FK constraints use the default `RESTRICT` behavior.

### Workflow fields

Workflow fields capture a named person performing a step in a record's lifecycle. They are distinct from audit fields:

| Type | Column examples | Datatype | FK? | Purpose |
|------|-----------------|----------|-----|---------|
| Workflow | `verified_by`, `reviewed_by`, `requested_by`, `sampled_by`, `ordered_by`, `approved_by`, `uploaded_by`, `assigned_to`, `fixer_id`, `reported_by` | TEXT | FK → `hr_employee(id)` | Identifies a specific employee in a business process |
| Audit | `created_by`, `updated_by` | TEXT | No FK | Logs the Supabase Auth email of who made the change |

Workflow field rules:
- Timestamp always precedes person: `verified_at` before `verified_by`
- Ordered by lifecycle stage: `requested_at/by` → `reviewed_at/by` → `approved_at/by` → `ordered_at/by` → `verified_at/by`
- Use `_at` (TIMESTAMPTZ) when exact time matters; use `_on` (DATE) when only the date matters (e.g. `sampled_on`, `delivered_to_lab_on`)
- Workflow fields sit between `created_by` and `updated_at` in column order
- They are additional — they do not replace `created_at`/`created_by`

The **only** `auth.users` FK in the project is `hr_employee.user_id UUID REFERENCES auth.users(id)`.

---

## 3. Column Ordering

```
id
org_id
farm_id              (if applicable)
site_id              (if applicable)
... business fields ...
is_deleted
created_at
created_by
... workflow fields (e.g. requested_at, requested_by, verified_at, verified_by) ...
updated_at
updated_by
```

---

## 4. Table Design

### Primary keys

- **TEXT PK** — lookup and reference tables where the ID is human-readable and derived from the name field (e.g. `org`, `farm`, `site`, `hr_employee`, `ops_task`)
- **UUID PK** (`gen_random_uuid()`) — transactional tables where records are created at runtime (e.g. `ops_task_tracker`, `invnt_po`, `maint_request`)

### Data types

- All text fields use **`TEXT`** — no `VARCHAR(n)`. Frontend handles length validation.
- Status and type fields use **`TEXT` with a `CHECK` constraint** — never PostgreSQL `ENUM` types. CHECK constraints can be added or removed in a single transactional migration; ENUM types cannot.

### Multi-tenancy

Every org-scoped table must have:

```sql
org_id TEXT NOT NULL REFERENCES org(id)
```

This column is used for Row Level Security (RLS) filtering.

**farm_id inheritance** — if a parent/header table has `farm_id`, all its child tables must also include `farm_id` with the same nullability. The child's `farm_id` is inherited from the parent at insert time. This ensures every table in a parent-child hierarchy can be independently filtered by farm without joining back to the parent.

---

## 5. Foreign Keys

### Naming

FK columns are named `{referenced_table}_id`:

```
ops_task_id       → ops_task(id)
invnt_vendor_id   → invnt_vendor(id)
sales_customer_id → sales_customer(id)
```

Exceptions:

- **Workflow fields** — role-based names referencing `hr_employee(id)` (see Section 2)
- **Self-referencing FKs** — use a semantic prefix (e.g. `original_fsafe_emp_result_id` in `fsafe_emp_result`)
- **Multiple FKs to the same table** — use a semantic suffix (e.g. `site_id_storage` and `maint_site_id_equipment` in `invnt_item`, `site_id_housing` in `hr_employee`)
- **Cross-module FKs** — retain the referenced table's prefix (e.g. `ops_corrective_action_taken.fsafe_emp_result_id`)

---

## 6. Photos & JSONB

Photos are stored as JSONB arrays of URLs when they are simple attachments with no per-photo metadata:

```sql
photos JSONB NOT NULL DEFAULT '[]'
```

When photos require individual metadata (e.g. caption, observation date), use a **separate table** with one row per photo instead (e.g. `pack_shelf_life_photo`).

Never use numbered columns (`photo_01_url`, `photo_02_url`, etc.).

Use JSONB for flexible arrays (photos, enum option lists). Use proper FK columns for anything that is joined, filtered, or used in calculations.

---

## 7. Schema Change Process

Every schema change requires four steps in this order:

1. **Update the SQL migration file** — the `.sql` file is the source of truth
2. **Update the module `.md` doc** — column descriptions must exactly match `COMMENT ON COLUMN` in the SQL
3. **Update `README.md`** — if tables are added, removed, or renamed
4. **Renumber migration files** — keep sequential order by module (see Section 1)

### File naming

**Migration files:**
```
supabase/migrations/YYYYMMDD_NNN_module_tablename.sql
```

**Schema doc files:**
```
docs/schemas/YYYYMMDD_NN_module.md
```

**Date prefix rule** — the `YYYYMMDD` prefix on all migration files, schema docs, and process docs must be updated to **today's date** on every commit.

---

## 8. Documentation

### SQL ↔ MD sync rule

Column descriptions in `.md` docs must **exactly match** the text in `COMMENT ON COLUMN` in the corresponding `.sql` file — word for word. When you update one, update the other in the same change.

### Which columns get descriptions

Only add `COMMENT ON COLUMN` and `.md` descriptions for **business-specific columns**. Skip descriptions for standard fields (Section 2), workflow fields (Section 2), and any column whose purpose is obvious from its name alone:

- `id`, `org_id`, `farm_id`, `is_deleted`, `created_at`, `created_by`, `updated_at`, `updated_by`
- `verified_at/by`, `reviewed_at/by`, `sampled_at/by`, `approved_at/by`, `ordered_at/by`, `uploaded_at/by`, `completed_at`, `completed_on`, etc.
- `start_time`, `stop_time`, `pack_date`, `harvest_date`, `best_by_date`, `order_date`, `invoice_date`, etc.
- `name`, `description`, `notes`, `status`, `photos`, `display_order`, `caption`, etc.

Only add a description when the field's purpose is **not obvious** from its name alone (e.g. `initial_retest_vector`, `atp_site_count`, `enum_pass_options`).

### Schema doc format

Each `.md` doc must include:

1. A module title and one-paragraph description
2. A standard audit field note at the top referencing the fields in Section 2
3. A Mermaid ERD — relationships only, no entity attribute blocks. Unquoted, lowercase labels with underscores. Every referenced core entity must appear with its full ownership chain (if `farm` appears, include `org ||--o{ farm : operates`; if `site` appears, include `farm ||--o{ site : contains`)
4. A table overview section
5. A section per table with:
   - One-paragraph description
   - A column table: `| Column | Type | Constraints | Description |`
   - No bold section header rows inside the column table
