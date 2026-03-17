# Future Improvements

Planned tables and features that are designed but deferred from the MVP. Migration files are staged in `supabase/migrations_future/` and will be promoted to `supabase/migrations/` when ready to implement.

> **Standard audit fields:** Every table includes `created_at` (TIMESTAMPTZ, default now), `created_by` (TEXT, user email), `updated_at` (TIMESTAMPTZ, default now), and `updated_by` (TEXT, user email). These are omitted from the column listings below for brevity.

---

## Inventory — Deferred Tables

### invnt_sales_product_item

Junction table linking sales products to inventory items at pack or sale packaging levels. When a product is packed or sold, this mapping determines which inventory items are consumed and in what quantity.

Migration: `supabase/migrations_future/20260316_001_invnt_sales_product_item.sql`

| Column               | Type         | Constraints                           | Description                              |
|---------------------|--------------|---------------------------------------|------------------------------------------|
| id                  | UUID         | PK, auto-generated                    | Unique identifier                        |
| org_id              | TEXT         | NOT NULL, FK → org(id)                | The organization                         |
| farm_id             | TEXT         | FK → farm(id), nullable               | Optional farm scope                      |
| product_id          | TEXT         | NOT NULL, FK → sales_product(id)      | The sales product                        |
| invnt_item_id       | UUID         | NOT NULL, FK → invnt_item(id)         | The inventory item consumed              |
| packaging_level     | TEXT         | NOT NULL, CHECK                       | One of: pack, sale                       |
| sale_uom            | TEXT         | FK → util_uom(code), nullable         | Unit of measure for the sale quantity    |
| quantity_per_sale_uom | NUMERIC    | nullable                              | How much of this item is used per sale unit at this packaging level |
| is_active           | BOOLEAN      | NOT NULL, default true                | Soft-disable without deleting            |

Unique constraint on `(product_id, invnt_item_id, packaging_level)` — one link per item per packaging level per product.

---

### invnt_usage

Tracks inventory consumption linked back to the source module that triggered it. The `reference_table` and `reference_id` columns provide a generic FK to any table (e.g. grow_fertigation_schedule, harvest_batch) so usage can be traced to its origin.

Migration: `supabase/migrations_future/20260316_002_invnt_usage.sql`

| Column          | Type         | Constraints                   | Description                              |
|----------------|--------------|-------------------------------|------------------------------------------|
| id             | UUID         | PK, auto-generated            | Unique identifier                        |
| org_id         | TEXT         | NOT NULL, FK → org(id)        | The organization                         |
| farm_id        | TEXT         | FK → farm(id), nullable       | Optional farm scope                      |
| invnt_item_id  | UUID         | NOT NULL, FK → invnt_item(id) | Inventory item that was consumed         |
| reference_table| TEXT         | nullable                      | Source table that triggered the usage    |
| reference_id   | UUID         | nullable                      | Source record ID in the reference_table  |
| usage_date     | DATE         | NOT NULL                      | Date the consumption occurred            |
| burn_uom       | TEXT         | FK → util_uom(code), nullable | Unit of measure for the burn quantity    |
| quantity_burn  | NUMERIC      | NOT NULL                      | Quantity consumed in burn units          |
| is_active      | BOOLEAN      | NOT NULL, default true        | Soft-disable without deleting            |

---

## HR — Deferred Tables

### hr_travel_request

Employee travel requests with a simple approval workflow. Captures trip details, purpose, and dates alongside a pending → approved/denied status flow. Uses `requested_at` in place of the standard `created_at`/`created_by` audit fields.

Migration: `supabase/migrations_future/20260316_003_hr_travel_request.sql`

| Column             | Type         | Constraints                       | Description                              |
|-------------------|--------------|-----------------------------------|------------------------------------------|
| id                | UUID         | PK, auto-generated                | Unique identifier                        |
| org_id            | TEXT         | NOT NULL, FK → org(id)            | The organization                         |
| employee_id       | TEXT         | NOT NULL, FK → hr_employee(id)    | Employee submitting the request          |
| request_type      | TEXT         | nullable                          | Type of travel (e.g. Business Trip, Training, Conference, Site Visit) |
| travel_purpose    | TEXT         | nullable                          | Description of the purpose for the trip  |
| travel_from       | TEXT         | nullable                          | Departure location                       |
| travel_to         | TEXT         | nullable                          | Destination location                     |
| travel_start_date | DATE         | nullable                          | First day of travel                      |
| travel_return_date| DATE         | nullable                          | First day the employee returns           |
| status            | TEXT         | NOT NULL, default pending, CHECK  | One of: pending, approved, denied        |
| requested_by      | UUID         | NOT NULL, FK → auth.users(id)     | Auth user who submitted the request      |
| requested_at      | TIMESTAMPTZ  | NOT NULL, default now             | When the request was submitted           |
| denial_reason     | TEXT         | nullable                          | Reason provided when the request is denied |
| notes             | TEXT         | nullable                          | Additional notes about the request       |
| reviewed_by       | TEXT         | FK → hr_employee(id), nullable    | Employee who approved or denied          |
| reviewed_at       | TIMESTAMPTZ  | nullable                          | When the request was reviewed            |
| is_active         | BOOLEAN      | NOT NULL, default true            | Soft-disable without deleting            |

---

### hr_disciplinary_warning

Employee disciplinary warning records. Tracks the offense, action plan, and employee acknowledgment alongside a pending → reviewed workflow. Uses `reported_by`/`reported_at` in place of the standard `created_by`/`created_at` audit fields since they carry the same meaning here.

Migration: `supabase/migrations_future/20260316_004_hr_disciplinary_warning.sql`

| Column                          | Type         | Constraints                       | Description                              |
|--------------------------------|--------------|-----------------------------------|------------------------------------------|
| id                             | UUID         | PK, auto-generated                | Unique identifier                        |
| org_id                         | TEXT         | NOT NULL, FK → org(id)            | The organization                         |
| employee_id                    | TEXT         | NOT NULL, FK → hr_employee(id)    | Employee receiving the warning           |
| warning_date                   | DATE         | nullable                          | Date the warning was issued              |
| warning_type                   | TEXT         | CHECK                             | One of: verbal_warning, written_warning, final_warning, suspension, termination |
| offense_type                   | TEXT         | nullable                          | Category of offense (e.g. Attendance, Performance, Conduct, Safety, Policy Violation) |
| offense_description            | TEXT         | nullable                          | Detailed description of the offense or incident |
| plan_for_improvement           | TEXT         | nullable                          | Agreed steps or plan for the employee to improve |
| further_infraction_consequences| TEXT         | nullable                          | Stated consequences if further infractions occur |
| notes                          | TEXT         | nullable                          | Additional notes about the warning       |
| is_acknowledged                | BOOLEAN      | NOT NULL, default false           | Whether the employee has acknowledged receipt |
| acknowledged_at                | TIMESTAMPTZ  | nullable                          | When the employee acknowledged the warning |
| employee_signature_url         | TEXT         | nullable                          | URL to the employee signature image stored in Supabase Storage |
| status                         | TEXT         | NOT NULL, default pending, CHECK  | One of: pending, reviewed                |
| reported_by                    | TEXT         | FK → hr_employee(id), nullable    | Manager or HR who filed the warning      |
| reported_at                    | TIMESTAMPTZ  | NOT NULL, default now             | When the warning was filed               |
| reviewed_by                    | TEXT         | FK → hr_employee(id), nullable    | Employee who reviewed and finalized      |
| reviewed_at                    | TIMESTAMPTZ  | nullable                          | When the warning was reviewed            |
| is_active                      | BOOLEAN      | NOT NULL, default true            | Soft-disable without deleting            |

---

## Inventory — Deferred Features

### Estimated usage adjustment on receipt

When an order receipt is logged, the system should automatically create an adjusted on-hand record before the receipt record to account for estimated consumption since the last on-hand snapshot. The calculation:

1. Get the latest on-hand record for the item (by `onhand_date DESC, created_at DESC`)
2. Calculate weeks elapsed: `(receipt_date - last_onhand_date) / 7`
3. Get `burn_per_week` from `invnt_item`
4. Estimated burn since last on-hand: `burn_per_week * weeks_elapsed`
5. Convert to on-hand units: `estimated_burn / burn_per_onhand_uom`
6. Create an adjusted `invnt_onhand` record with `onhand_quantity = last_onhand - estimated_onhand_usage`
7. Create the receipt `invnt_onhand` record with `onhand_quantity = adjusted_onhand + received_quantity_in_onhand_units`

This keeps the estimated usage visible as an explicit record in the history rather than silently adjusting the on-hand during receipt. Can be implemented as a Supabase database function or in the application layer.

---

