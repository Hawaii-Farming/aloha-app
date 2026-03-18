# Aloha App

Multi-organization agricultural ERP built on Supabase and React for farm-to-customer operations.

## About

Aloha is an ERP system designed for hydroponic and greenhouse farming operations. It manages the full lifecycle from crop production to customer delivery, supporting multiple organizations on a single platform where each organization manages its own farms, products, customers, and pricing independently.

## Business Context

The system serves agricultural operations that grow crops like cucumbers, lettuce, and tomatoes in controlled greenhouse environments. Each organization can operate multiple **farms**, where a farm represents a crop or product line (e.g. "Cuke Farm", "Lettuce Farm") rather than a physical location. Within each farm, **sites** represent the physical infrastructure — nurseries for seedling propagation, growing greenhouses for production, packing facilities, and storage areas.

Products move through a defined packaging hierarchy: content (the raw product) is packed into consumer units, grouped into sale units (cases, boxes), and palletized into shipping units. This hierarchy drives inventory calculations and order fulfillment.

Pricing is managed with three tiers of specificity — default prices by product and FOB point, group-level overrides for customer segments like wholesale or retail, and customer-specific pricing. All prices track effective date ranges so historical pricing is preserved as prices change.

## Tech Stack

- **Database:** PostgreSQL (via Supabase)
- **Backend:** Supabase (auth, storage, APIs, row-level security)
- **Frontend:** React
- **Auth:** Supabase Auth (`auth.users` referenced directly for audit trails and access control)

## Project Structure

```
aloha-app/
  supabase/
    migrations/          # Sequential SQL migration files (source of truth)
  docs/
    schemas/             # Human-readable schema documentation per module
  src/                   # React application (coming soon)
```

## Core Schema (11 tables) — [Docs](docs/schemas/core.md)

### Global Reference Tables
These tables are shared across all organizations.

- **util_uom** — Standardized measurement units with `code` as primary key (kg, L, °C, ppm, etc.)

### Organization and Customers
- **org** — Root entity for multi-org support with currency setting
- **sales_cust_group** — Org-specific customer classifications for reporting and group pricing
- **sales_fob** — Org-specific FOB (Free On Board) delivery points
- **sales_cust** — Org customers with group, FOB preference, billing, and external accounting link

### Farm Structure
- **farm** — Crop/product lines within an org with weighing and growing UOM defaults
- **site** — Unified site register for all locations and assets (growing, packaging, storage, maintenance) with category/subcategory-driven fields
- **grow_variety** — Crop varieties with short codes (e.g. "K" for Keiki)
- **grow_grade** — Harvest quality grades with short codes (e.g. "A" for Grade A)

### Products and Pricing
- **sales_product** — Sellable products with full packaging hierarchy (content → pack → sale → shipping)
- **sales_product_price** — Tiered pricing (customer → group → default) with effective date ranges

## Inventory Module (7 tables, 2 views) — [Docs](docs/schemas/inventory.md)

- **invnt_vendor** — Org-level vendors for procurement with contact details and payment terms (TEXT PK)
- **invnt_category** — Top-level categories for organizing inventory items (TEXT PK)
- **invnt_subcategory** — Second-level categories under invnt_category (TEXT PK)
- **invnt_item** — Items with unit conversions, burn rates, reorder settings, and proper columns for all details
- **invnt_po** — Purchase order requests with workflow (requested → approved → ordered → received) and snapshot pricing
- **invnt_po_receipt** — Individual deliveries against a purchase order with lot tracking and partial receipt support
- **invnt_onhand** — On-hand inventory snapshots per item with lot tracking and burn unit conversion
- **invnt_item_summary** (view) — Computed on-hand, on-order, weeks-on-hand, and next-order-date per item
- **invnt_lot_summary** (view) — Current on-hand quantity per lot with expiry dates

## HR Module (7 tables, 1 view) — [Docs](docs/schemas/hr.md)

- **hr_department** — Org-specific department lookup for classifying employees (e.g. GH, PH, Lettuce). Composite PK on (org_id, code).
- **hr_work_authorization** — Org-specific work authorization type lookup (e.g. Local, FURTE, WFE, H1B). Composite PK on (org_id, code).
- **hr_task** — Flat task catalog for labor tracking with name, description, and accounting link (TEXT PK)
- **hr_employee** — Unified employee register and org membership; every system user has a row here with a role. Tracks employment details, compensation, and access level. Users are duplicated per org they belong to.
- **hr_task_tracker** — Header record for a task event with task, location, date, start/stop times, and verification status
- **hr_task_roster** — Employees per task event with individual start/stop times (overridable from tracker) and units completed
- **hr_time_off_request** — Employee time off requests with PTO/sick leave breakdown and approval workflow (pending → approved/denied)
- **hr_weekly_schedule** (view) — Pivoted weekly schedule with Sun–Sat time columns, total hours, and OT threshold flag derived from each employee's bi-weekly `overtime_threshold`

## Maintenance Module (2 tables) — [Docs](docs/schemas/maint.md)

- **maint_request** — Standalone maintenance work order with site, priority, status, fixer assignment, completion details, recurring frequency, and before/after photo arrays
- **maint_request_part** — Inventory items consumed during a maintenance request with quantity used

## Planned Modules

- [x] **Inventory** — Item catalog, categories, orders with partial receipt workflow, transactions, and computed views for dashboards
- [~] **HR** — Employee records, task catalog, scheduling, and labor tracking (in progress); travel requests and disciplinary warnings deferred to future
- [ ] **Sales** — Customer orders, order lines with price snapshots, invoicing
- [ ] **Pack** — Pack runs, label generation, lot tracking (FSMA traceability)
- [ ] **Grow** — Seeding, grow batches, growth stage tracking, nutrient recipes, environmental monitoring
- [ ] **Food Safety** — Compliance checks, audit trails, corrective actions
- [ ] **Global** — Cross-module shared configuration, reporting, and analytics

## Database Conventions

- **UUIDs** for most primary keys (`gen_random_uuid()`); most lookup/reference tables use human-readable **TEXT** PKs derived from their name fields (e.g., `org.id`, `farm.id`, `site.id`, `sales_cust_group.id`, `sales_fob.id`, `sales_cust.id`, `grow_variety.id`, `grow_grade.id`, `sales_product.id`, `invnt_vendor.id`, `invnt_category.id`, `invnt_subcategory.id`, `hr_task.id`, `hr_employee.id`, `hr_department.id`, `hr_work_authorization.id`)
- **`org_id`** (TEXT) and **`org_farm_id`** (TEXT) FK columns reference `org(id)` and `farm(id)` respectively
- **`util_uom.code`** (VARCHAR) as PK — all unit FK columns across the system are `VARCHAR(10)` referencing `util_uom(code)`
- **org_id** on every org-scoped table for direct RLS filtering
- **is_active** boolean for soft deletes (no records are physically deleted)
- **Audit fields** (`created_at`, `created_by`, `updated_at`, `updated_by`) on all org-scoped tables; `created_by` and `updated_by` store user emails as TEXT
- **metadata** JSONB columns for flexible, display-only fields that don't require indexing or calculations
- **Proper FK columns** for anything used in calculations, filtering, or joins
- **Module prefixes** for table naming: `util_*`, `sales_*`, `invnt_*`, `grow_*`, `hr_*`
- Sequential migration files in `supabase/migrations/` with naming: `YYYYMMDD_NNN_module_tablename.sql`

## Schema Documentation

Detailed table documentation with column definitions, constraints, and relationships is maintained in `docs/schemas/`:

- [Core Schema](docs/schemas/core.md) — 11 foundation tables
- [Inventory Schema](docs/schemas/inventory.md) — Items, orders, transactions, and views
- [HR Schema](docs/schemas/hr.md) — Tasks, employees, and labor tracking
- [Maintenance Schema](docs/schemas/maint.md) — Work orders and parts usage
- [Future Improvements](docs/schemas/future.md) — Deferred tables and planned features (migrations staged in `supabase/migrations_future/`)
