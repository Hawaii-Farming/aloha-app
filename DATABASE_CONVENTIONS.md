# Aloha App — Schema Conventions

These rules apply to every schema change in this project. All contributors must follow them.

---

## 1. Schema Change Process

Every schema change requires four steps in this order:

1. **Update the SQL migration file** — the `.sql` file is the source of truth
2. **Update the module `.md` doc** — column descriptions must exactly match `COMMENT ON COLUMN` in the SQL
3. **Update `README.md`** — if tables are added, removed, or renamed
4. **Renumber migration files** — keep sequential order by module (see File Naming below)

---

## 2. SQL ↔ MD Sync Rule

Column descriptions in `.md` docs must **exactly match** the text in `COMMENT ON COLUMN` in the corresponding `.sql` file — word for word, one-to-one. No paraphrasing.

When you update a `COMMENT ON COLUMN`, update the `.md` description in the same change. When you update a `.md` description, update the `COMMENT ON COLUMN` in the same change.

---

## 3. File Naming

### Date prefix rule
The `YYYYMMDD` prefix on all migration files, schema docs, and process docs must be updated to **today's date** on every commit. This applies to files in `supabase/migrations/`, `supabase/migrations_future/`, `docs/schemas/`, and `docs/processes/`.

### Migration files
```
supabase/migrations/YYYYMMDD_NNN_module_tablename.sql
```
Numbered sequentially by module in this order:

| Range       | Module       |
|-------------|--------------|
| 001–002, 006–009 | Core    |
| 012–020     | Inventory    |
| 021–025     | Human Resources |
| 026–038     | Operations   |
| 039–042     | Sales (fob → donation_recipient) |
| 043         | Pack (packaging_type) |
| 044–047     | Sales (product → po_line) |
| 048–049     | Pack (lot, lot_item)  |
| 050         | Sales (po_fulfillment)|
| 051–054     | Pack (shelf life)     |
| 055–056     | Maintenance  |
| 057–058     | Food Safety  |

> Note: Core range has gaps at 003–005 and 010–011 after sales tables were moved to the Sales module. Pack and Sales migrations are interleaved (039–054) due to cross-module FK dependencies.

### Schema doc files
```
docs/schemas/YYYYMMDD_NN_module.md
```

| File | Module |
|------|--------|
| `20260319_01_core.md` | Core |
| `20260319_02_invnt.md` | Inventory |
| `20260319_03_hr.md` | Human Resources |
| `20260319_04_ops.md` | Operations |
| `20260319_05_pack.md` | Pack |
| `20260319_06_sales.md` | Sales |
| `20260319_07_maint.md` | Maintenance |
| `20260319_08_fsafe.md` | Food Safety |
| `20260319_09_future.md` | Deferred / Future |

---

## 4. Primary Keys

- **TEXT PK** — lookup and reference tables where the ID is human-readable and derived from the name field (e.g. `org`, `farm`, `site`, `hr_employee`, `ops_task`, `invnt_vendor`, `invnt_category`, `ops_template`, etc.)
- **UUID PK** (`gen_random_uuid()`) — transactional tables where records are created at runtime (e.g. `ops_task_tracker`, `invnt_po`, `ops_response`, `maint_request`, etc.)

---

## 5. Foreign Keys — Workflow vs Audit Fields

These two types of person-reference fields are handled differently:

### Workflow fields
Fields that identify a specific employee involved in a business process (e.g. `requested_by`, `reviewed_by`, `assigned_to`, `fixer_id`, `sampled_by`, `reported_by`) **must use**:
```sql
TEXT REFERENCES hr_employee(id)
```

### Audit fields
`created_by` and `updated_by` store the **email** of the Supabase Auth user who made the change. They are plain `TEXT` with no FK constraint — they are not joined to, just logged:
```sql
created_by  TEXT
updated_by  TEXT
```

**Never use** `UUID REFERENCES auth.users(id)` for any of these fields.

The **only** exception is `hr_employee.user_id UUID REFERENCES auth.users(id)` — this is the intentional link between an employee record and Supabase Auth. Do not change this.

---

## 6. Audit Fields

Standard audit fields on all tables:
```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
created_by  TEXT
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_by  TEXT
```

For tables that represent a submitted request or event, use a semantic name **instead of** `created_at`/`created_by` — never both. The name should reflect the action (e.g. `requested_at`/`requested_by`, `received_at`/`received_by`). Tables currently using this pattern: `invnt_po` (`requested_at/by`), `invnt_po_received` (`received_at/by`), `hr_time_off_request` (`requested_at/by`), `maint_request` (`requested_at/by`).

---

## 7. Data Types

- All text fields use **`TEXT`** — no `VARCHAR(n)`. Frontend handles length validation.
- Exception: `util_uom.code` uses `TEXT` as PK; all unit FK columns reference `util_uom(code)` as `TEXT`.
- Status and type fields use **`TEXT` with a `CHECK` constraint** — never PostgreSQL `ENUM` types.

---

## 8. Column Ordering

Columns must follow this order:

```
id
org_id
farm_id              (if applicable)
site_id              (if applicable)
... business fields ...
is_active
created_at / requested_at
created_by / requested_by
... workflow fields (e.g. verified_at, verified_by) ...
updated_at
updated_by
```

Workflow fields are fields that capture a named person performing a step in the record's lifecycle (e.g. `verified_by`, `approved_by`, `reviewed_by`), along with their companion timestamp. They sit between `created_by` and `updated_at` so that `updated_at`/`updated_by` always close the column list.

---

## 9. Soft Deletes

No records are physically deleted. Every table has:
```sql
is_active BOOLEAN NOT NULL DEFAULT true
```

---

## 10. Photos and JSONB Arrays

Photos are stored as JSONB arrays of URLs when they are simple attachments with no per-photo metadata:
```sql
photos JSONB NOT NULL DEFAULT '[]'
```

When photos require individual metadata (e.g. caption, observation date, shelf life day), use a separate table with one row per photo instead. This allows per-photo querying, filtering, RLS, and audit fields. Example: `pack_shelf_life_photo`.

Never use numbered columns (`photo_01_url`, `photo_02_url`, etc.).

Use JSONB for flexible arrays (photos, enum option lists). Use proper FK columns for anything that is joined, filtered, or used in calculations.

---

## 11. Multi-Tenancy

Every org-scoped table must have:
```sql
org_id TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE
```

This column is used for Row Level Security (RLS) filtering.

### farm_id inheritance

If a parent/header table has `farm_id`, all its child tables must also include `farm_id` with the same nullability. The child's `farm_id` is inherited from the parent at insert time. This ensures every table in a parent-child hierarchy can be independently filtered by farm without joining back to the parent.

---

## 12. Module Table Prefixes

| Prefix    | Module       |
|-----------|--------------|
| (none)    | Core (`util_uom`, `org`, `farm`, `site`) |
| `grow_`   | Core crop data (`grow_variety`, `grow_grade`) |
| `sales_`  | Sales |
| `invnt_`  | Inventory |
| `hr_`     | Human Resources |
| `ops_`    | Operations |
| `maint_`  | Maintenance |
| `fsafe_`  | Food Safety (EMP testing only) |
| `pack_`   | Pack |

---

## 13. Schema Doc Format

Each `.md` doc must include:

1. A module title and one-paragraph description
2. An audit field note at the top
3. A Mermaid ERD — relationships only, no entity attribute blocks. Use unquoted, lowercase labels with underscores for multi-word phrases (e.g. `table1 ||--o{ table2 : has`, `table1 ||--o{ table2 : packed_in`). Every table with `farm_id` must have a `farm ||--o{ table : scoped` relationship in the ERD, and if `farm` appears, `org ||--o{ farm : operates` must also be present
4. A section per table with:
   - One-paragraph description
   - A column table: `| Column | Type | Constraints | Description |`
   - No bold section header rows inside the column table

---

## 14. Deferred Migrations

Tables that are designed but not yet ready for deployment go in:
```
supabase/migrations_future/
```
Document them in `docs/schemas/20260319_09_future.md`.

---

## 15. Foreign Key Column Naming

FK columns must carry the prefix of the **referenced** module. Name the column `{referenced_table}_id`.

| Referenced table                        | Column name                                |
|-----------------------------------------|--------------------------------------------|
| `hr_employee`                           | `hr_employee_id`                           |
| `invnt_vendor`                          | `invnt_vendor_id`                          |
| `invnt_category`                        | `invnt_category_id`                        |
| `invnt_item`                            | `invnt_item_id`                            |
| `ops_task`                              | `ops_task_id`                              |
| `ops_task_tracker`                      | `ops_task_tracker_id`                      |
| `ops_training`                          | `ops_training_id`                          |
| `ops_training_type`                     | `ops_training_type_id`                     |
| `ops_template_category`                 | `ops_template_category_id`                 |
| `ops_template`                          | `ops_template_id`                          |
| `ops_question`                          | `ops_question_id`                          |
| `ops_response`                          | `ops_response_id`                          |
| `ops_corrective_action_choice`          | `ops_corrective_action_choice_id`          |
| `fsafe_emp_test`                        | `fsafe_emp_test_id`                        |
| `fsafe_emp_result`                      | `fsafe_emp_result_id`                      |
| `sales_fob`                             | `sales_fob_id`                             |
| `sales_customer_group`                  | `sales_customer_group_id`                  |
| `sales_customer`                        | `sales_customer_id`                        |
| `sales_donation_recipient`              | `sales_donation_recipient_id`              |
| `sales_product`                         | `sales_product_id`                         |
| `sales_po`                              | `sales_po_id`                              |
| `sales_po_line`                         | `sales_po_line_id`                         |
| `pack_lot`                              | `pack_lot_id`                              |
| `pack_packaging_type`                   | `pack_packaging_type_id`                   |
| `pack_shelf_life_check`                 | `pack_shelf_life_check_id`                 |
| `pack_shelf_life_trial`                 | `pack_shelf_life_trial_id`                 |

**Exceptions** — workflow fields that name the person performing a role keep their role-based name even though they reference `hr_employee(id)`:
- `requested_by`, `reviewed_by`, `approved_by`, `verified_by`, `sampled_by`, `assigned_to`, `fixer_id`, `ordered_by`, `uploaded_by`

Self-referencing FK columns in the same table follow the same rule with an optional semantic prefix (e.g. `original_fsafe_emp_result_id` for the parent-test link in `fsafe_emp_result`, `team_lead_id` and `compensation_manager_id` in `hr_employee`).

**Multiple FKs to the same table** — when a table has more than one FK to the same referenced table, use a semantic suffix to distinguish them (e.g. `site_id_storage` and `maint_site_id_equipment` in `invnt_item`, `site_id_housing` in `hr_employee`).

Also note: `ops_corrective_action_taken.fsafe_emp_result_id` is an intentional cross-module FK from the Ops module to Food Safety — the column retains the `fsafe_` prefix to reflect the referenced table.
