# Schema Conventions

These rules apply to every schema change in this project. All contributors must follow them.

---

## 1. Modules

One table defines all modules, their prefixes, file numbering, and doc numbering:

| Prefix    | Module          | Migration range | Doc # |
|-----------|-----------------|-----------------|-------|
| `sys_`    | System          | 001–004 | 01 |
| `org_`    | Org             | 005–012 | 02 |
| `grow_`   | Grow            | 013–014, 045–066 | 06 |
| `invnt_`  | Inventory       | 015–022 | 03 |
| `hr_`     | Human Resources | 023–031 | 04 |
| `ops_`    | Operations      | 032–044, 092 | 05 |
| `sales_`  | Sales           | 067–073, 076 | 08 |
| `pack_`   | Pack            | 074–075, 077–084 | 07 |
| `maint_`  | Maintenance     | 085–086 | 09 |
| `fsafe_`  | Food Safety     | 087–091 | 10 |
| (deferred)| Future          | —       | 11 |

Sales & Pack migration ranges are interleaved (063–076) due to cross-module FK dependencies.

Tables designed but not yet ready for deployment go in `supabase/migrations_future/` and are documented in the `_11_future.md` schema doc.

---

## 2. Standard Fields

Every table includes these fields. They are omitted from `.md` column tables for brevity and do not receive `COMMENT ON COLUMN` descriptions.

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
created_by  TEXT
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_by  TEXT
is_deleted  BOOLEAN     NOT NULL DEFAULT false
```

- `is_deleted` — soft delete flag. No records are physically deleted. Queries filter on `WHERE is_deleted = false`.
- `created_by` / `updated_by` — Supabase Auth email (TEXT, no FK). These are audit fields, not workflow fields.
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
- Workflow fields sit between business fields and CRUD fields in column order
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
... workflow fields (e.g. requested_at, requested_by, verified_at, verified_by) ...
created_at
created_by
updated_at
updated_by
is_deleted
```

CRUD fields always close the column list in this exact order. Workflow fields sit between business fields and CRUD fields.

**UOM before measurement** — When a UOM column and its associated measurement columns appear together, the UOM column always comes first (e.g. `weight_uom` before `pack_net_weight`, `seeding_uom` before `number_of_units`, `application_uom` before `application_quantity`).

**display_order** — Always placed as the last business field, right before CRUD fields.

---

## 4. Table Design

### Primary keys

- **TEXT PK** — lookup and reference tables where the ID is human-readable and derived from the name field (e.g. `org`, `org_farm`, `org_site`, `hr_employee`, `ops_task`)
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

- **Scoping columns** — `farm_id`, `site_id`, and `equipment_id` keep their short names even though the tables are `org_farm`, `org_site`, and `org_equipment`
- **Workflow fields** — role-based names referencing `hr_employee(id)` (see Section 2)
- **Self-referencing FKs** — use a semantic suffix so the domain prefix is preserved (e.g. `fsafe_result_id_original` in `fsafe_result`, not `original_fsafe_result_id`)
- **Multiple FKs to the same table** — use a semantic suffix (e.g. `site_id_storage` in `invnt_item`, `site_id_housing` in `hr_employee`)
- **Cross-module FKs** — retain the referenced table's prefix (e.g. `ops_corrective_action_taken.fsafe_result_id`)

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

Every schema change requires these steps in this order:

1. **Ensure access** to this conventions doc, schema module `.md` files, and a Supabase connection
2. **Update conventions** — if the change introduces a new pattern or modifies an existing rule
3. **Update the module `.md`** — the `.md` is the source of truth for table design
4. **Update the SQL migration** — built from the `.md`
5. **Update `README.md`**

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

Add `COMMENT ON COLUMN` and `.md` descriptions for **all non-PK, non-audit fields whose purpose is not obvious from the column name alone**. The fields that do NOT get comments are:

- **PK**: `id`
- **CRUD audit**: `created_at`, `created_by`, `updated_at`, `updated_by`, `is_deleted`
- **Scoping**: `org_id`, `farm_id`
- **Self-descriptive columns**: fields where the name alone makes the purpose clear (e.g. `email`, `phone`, `address`, `name`, `description`, `notes`, `photos`, `caption`)

Everything else — business fields, workflow fields, FK references, status, dates, configuration fields, etc. — gets a comment. When in doubt, add the comment.

### Rich comments for source and calculation

Two types of information **must** be stored as `COMMENT ON COLUMN` in the schema (not in process docs or business rules):

1. **Column source / editability** — Where the data comes from and whether it's user-editable. This tells developers and AI how to populate the field.
   ```sql
   COMMENT ON COLUMN invnt_po.item_name IS 'Snapshot from invnt_item.name at order time; manually entered for non-inventory items';
   COMMENT ON COLUMN invnt_onhand.invnt_lot_id IS 'Sourced from invnt_lot at stock-in time';
   COMMENT ON COLUMN sales_product_price.farm_id IS 'Inherited from parent sales_product';
   ```

2. **Column calculation method** — How a computed or auto-populated value is derived.
   ```sql
   COMMENT ON COLUMN grow_harvest_weight.net_weight IS 'Auto-calculated: gross_weight - (grow_harvest_container.tare_weight × number_of_containers)';
   COMMENT ON COLUMN grow_monitoring_reading.is_out_of_range IS 'Auto-set by comparing reading against grow_monitoring_metric min/max values';
   ```

These comments stay in the schema because they are read directly from PostgreSQL catalog when building frontend forms, APIs, and AI-assisted development.

### Schema doc format

Each `.md` doc must include:

1. A module title and one-paragraph description
2. A standard audit field note at the top referencing the fields in Section 2
3. A Mermaid ERD — relationships only, no entity attribute blocks. Unquoted, lowercase labels with underscores. Every referenced core entity must appear with its full ownership chain (if `org_farm` appears, include `org ||--o{ org_farm : operates`; if `org_site` appears, include `org_farm ||--o{ org_site : contains`)
4. A table overview section
5. A section per table with:
   - One-paragraph description
   - A column table: `| Column | Type | Constraints | Description |`
   - No bold section header rows inside the column table
