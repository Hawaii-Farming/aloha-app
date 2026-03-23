# Aloha App — Schema Conventions

These rules apply to every schema change in this project. All contributors must follow them.

---

## 1. Modules

| Prefix    | Module          | Migration range | Doc # |
|-----------|-----------------|-----------------|-------|
| `system_` | System (`org_uom`, `system_access_level`, `system_module`, `system_sub_module`) | 001–004 | 01 |
| `org_`    | Org (`org`, `org_module`, `org_sub_module`, `org_farm`, `org_site`, `org_equipment`) | 005–010 | 02 |
| `grow_`   | Grow (`grow_variety`, `grow_grade`) | 011–012 | 02 |
| `invnt_`  | Inventory       | 013–020 | 03 |
| `hr_`     | Human Resources | 021–026 | 04 |
| `ops_`    | Operations      | 027–039 | 05 |
| `pack_`   | Pack            | 040–055 | 06 |
| `sales_`  | Sales           | 040–055 | 07 |
| `maint_`  | Maintenance     | 056–057 | 08 |
| `fsafe_`  | Food Safety     | 058–063 | 09 |
| (deferred)| Future          | —       | 10 |

Sales & Pack migration ranges are interleaved (040–055) due to cross-module FK dependencies.

Tables designed but not yet ready for deployment go in `supabase/migrations_future/` and are documented in the `_09_future.md` schema doc.

---

## 2. Org Scoping & RLS

### 2.1 org_id

Every org-scoped table must have:

```sql
org_id TEXT NOT NULL REFERENCES org(id)
```

### 2.2 farm_id inheritance

For convenience, when a parent table has `farm_id`, all its child tables also include `farm_id` with the same nullability. This avoids joining back to the parent when filtering by farm.

### 2.3 Row Level Security

RLS policies use:
- **`org_id`** — isolates data by organization. A helper function maps `auth.uid()` → `hr_employee` → `org_id` to determine which org the current user belongs to.
- **`is_deleted`** — filters out soft-deleted rows so they are invisible to all queries.

### 2.4 Auth

`hr_employee.user_id UUID REFERENCES auth.users(id)` connects a Supabase login to an employee record, which determines org membership and access level. No other table references `auth.users` directly — all user identity flows through `hr_employee`.

---

## 3. Table & Column Design

### 3.1 Primary keys

- **TEXT** — lookup and reference tables where the ID is human-readable and derived from the name column (e.g. `org`, `org_farm`, `org_site`, `hr_employee`, `ops_task`)
- **UUID** (`gen_random_uuid()`) — transactional tables where records are created at runtime (e.g. `ops_task_tracker`, `invnt_po`, `maint_request`)

### 3.2 FK naming

FK columns are named `{referenced_table}_id`:

```
ops_task_id       → ops_task(id)
invnt_vendor_id   → invnt_vendor(id)
sales_customer_id → sales_customer(id)
```

Exceptions:

- **Scoping columns** — `farm_id`, `site_id`, and `equipment_id` keep their short names even though the tables are `org_farm`, `org_site`, and `org_equipment`
- **Workflow columns** — role-based names referencing `hr_employee(id)` (see 3.8)
- **Self-referencing FKs** — use a semantic suffix so the domain prefix is preserved (e.g. `fsafe_emp_result_id_original` in `fsafe_emp_result`, not `original_fsafe_emp_result_id`)
- **Multiple FKs to the same table** — use a semantic suffix (e.g. `site_id_storage` in `invnt_item`, `site_id_housing` in `hr_employee`)

### 3.3 No CASCADE

`ON DELETE CASCADE` is never used. All FK constraints use the default `RESTRICT` behavior. Since no records are physically deleted (soft delete via `is_deleted`), cascade is unnecessary and dangerous.

### 3.4 TEXT

All text columns use `TEXT`, no `VARCHAR(n)`. Frontend handles length validation.

### 3.5 CHECK constraints

Use `TEXT` with a `CHECK` constraint whenever a column has a fixed, developer-defined set of allowed values. Never use PostgreSQL `ENUM` types — CHECK constraints can be added or removed in a single transactional migration; ENUM types cannot.

Common use cases:

- **Status/workflow** — `status CHECK (status IN ('draft', 'approved', 'fulfilled'))` — tracks where a record is in its lifecycle
- **Type/classification** — `request_type CHECK (request_type IN ('inventory_item', 'non_inventory_item'))` — determines which columns or behavior apply to a record
- **Categorical** — `zone CHECK (zone IN ('zone_1', 'zone_2', 'zone_3', 'zone_4'))` — fixed classification that rarely changes
- **Configuration** — `pay_structure CHECK (pay_structure IN ('hourly', 'salary'))`, `recurring_frequency CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly'))` — system behavior driven by the value

CHECK vs JSONB: use CHECK when the allowed values are defined by developers and change via migration. Use JSONB arrays (e.g. `enum_options`) when allowed values are user-configurable at runtime.

### 3.6 JSONB

Use JSONB for flexible arrays where individual items don't need to be queried, filtered, or joined:

- **Simple lists** — `photos` (URLs), `cc_emails` (addresses), `topics_covered` (strings), `trainer_names` (strings)
- **Option sets** — `enum_options`, `enum_pass_options`, `test_methods` (arrays of allowed values for UI dropdowns and validation)
- **Flexible metadata** — `metadata` (display-only key/value data that varies per record)

Use proper FK columns for anything that is joined, filtered, or used in calculations. If individual items need their own metadata (e.g. photos with captions), use a separate table instead (e.g. `pack_shelf_life_photo`).

### 3.7 Photos

Photos are stored as JSONB arrays of URLs when they are simple attachments with no per-photo metadata:

```sql
photos JSONB NOT NULL DEFAULT '[]'
```

When photos require individual metadata (e.g. caption, observation date), use a **separate table** with one row per photo instead (e.g. `pack_shelf_life_photo`).

Never use numbered columns (`photo_01_url`, `photo_02_url`, etc.).

### 3.8 Workflow columns

Workflow columns capture a named person performing a specific step in a record's lifecycle. They reference `hr_employee(id)` because they identify which employee performed a business action.

| Column examples | Datatype | FK? |
|-----------------|----------|-----|
| `verified_by`, `reviewed_by`, `requested_by`, `approved_by`, `assigned_to` | TEXT | FK → `hr_employee(id)` |

Rules:
- **`_at` vs `_on`** — use `_at` (TIMESTAMPTZ) when exact time matters; use `_on` (DATE) when only the date matters (e.g. `sampled_on`, `delivered_to_lab_on`)
- **Timestamp before person** — `verified_at` before `verified_by`

### 3.9 Audit columns

Every table includes these columns. They are omitted from `.md` column tables for brevity and do not receive `COMMENT ON COLUMN` descriptions.

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
created_by  TEXT
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_by  TEXT
is_deleted  BOOLEAN     NOT NULL DEFAULT false
```

- **`created_by` / `updated_by`** — auto-set from the Supabase Auth session email via a database trigger. TEXT with no FK because no lookup is needed at write time.
- **`is_deleted`** — soft delete flag. No records are physically deleted.

### 3.10 Column ordering

1. **id, org_id, farm_id**
2. **Narrowing FKs** — filter columns before the selection they narrow (e.g. `invnt_category_id` before `invnt_item_id`)
3. **Business columns** — group related columns together (e.g. `gender`, `date_of_birth` together; `overtime_threshold`, `wc` together)
4. **Workflow columns**
5. **Audit columns**

### 3.11 Column descriptions

Only add a `COMMENT ON COLUMN` and `.md` description when the column's purpose is not obvious from its name alone.

---

## 4. Schema Change Process

### 4.1 Change order

1. **Ensure access** to this conventions doc, schema module `.md` files, and a Supabase connection
2. **Update conventions** — if the change introduces a new pattern or modifies an existing rule
3. **Update the module `.md`** — the `.md` is the source of truth for table design
4. **Update the SQL migration** — built from the `.md`
5. **Update `README.md`**

### 4.2 File naming

**Migration files:**
```
supabase/migrations/YYYYMMDD_NNN_module_tablename.sql
```

**Schema doc files:**
```
docs/schemas/YYYYMMDD_NN_module.md
```

### 4.3 Date prefix rule

The `YYYYMMDD` prefix on all migration files, schema docs, and process docs must be updated to **today's date** on every commit.

---

## 5. Documentation

### 5.1 SQL ↔ MD sync rule

Column descriptions in `.md` docs must **exactly match** the text in `COMMENT ON COLUMN` in the corresponding `.sql` file — word for word. When you update one, update the other in the same change.

### 5.2 Schema doc format

Each `.md` doc must include:

1. A module title and one-paragraph description
2. A standard audit column note at the top referencing 3.9
3. A Mermaid ERD — relationships only, no entity attribute blocks. Unquoted, lowercase labels with underscores. Every referenced core entity must appear with its full ownership chain (if `org_farm` appears, include `org ||--o{ org_farm : operates`; if `org_site` appears, include `org_farm ||--o{ org_site : contains`)
4. A table overview section
5. A section per table with:
   - One-paragraph description
   - A column table: `| Column | Type | Constraints | Description |`
   - No bold section header rows inside the column table
