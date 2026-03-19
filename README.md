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

## Core Schema (11 tables) — [Docs](docs/schemas/20260318_01_core.md)

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

## Inventory Module (7 tables, 2 views) — [Docs](docs/schemas/20260318_02_invnt.md)

- **invnt_vendor** — Org-level vendors for procurement with contact details and payment terms (TEXT PK)
- **invnt_category** — Top-level categories for organizing inventory items (TEXT PK)
- **invnt_subcategory** — Second-level categories under invnt_category (TEXT PK)
- **invnt_item** — Items with unit conversions, burn rates, reorder settings, and proper columns for all details
- **invnt_po** — Purchase order requests with workflow (requested → approved → ordered → received) and snapshot pricing
- **invnt_po_receipt** — Individual deliveries against a purchase order with lot tracking and partial receipt support
- **invnt_onhand** — On-hand inventory snapshots per item with lot tracking and burn unit conversion
- **invnt_item_summary** (view) — Computed on-hand, on-order, weeks-on-hand, and next-order-date per item
- **invnt_lot_summary** (view) — Current on-hand quantity per lot with expiry dates

## HR Module (10 tables, 1 view) — [Docs](docs/schemas/20260318_03_hr.md)

- **hr_department** — Org-specific department lookup for classifying employees (e.g. GH, PH, Lettuce). Composite PK on (org_id, code).
- **hr_work_authorization** — Org-specific work authorization type lookup (e.g. Local, FURTE, WFE, H1B). Composite PK on (org_id, code).
- **hr_task** — Flat task catalog for labor tracking with name, description, and accounting link (TEXT PK)
- **hr_employee** — Unified employee register and org membership; every system user has a row here with a role. Tracks employment details, compensation, and access level. Users are duplicated per org they belong to.
- **hr_task_tracker** — Header record for a task event with task, farm, date, start/stop times, and verification status
- **hr_task_site** — Sites where a task event was performed; supports tasks carried out across multiple sites
- **hr_task_roster** — Employees per task event with individual start/stop times (overridable from tracker) and units completed
- **hr_time_off_request** — Employee time off requests with PTO/sick leave breakdown and approval workflow (pending → approved/denied)
- **hr_training** — Staff training session records with type, date, topics, trainer, and certification details
- **hr_training_attendee** — Per-employee attendance and certification records for each training session
- **hr_weekly_schedule** (view) — Pivoted weekly schedule with Sun–Sat time columns, total hours, and OT threshold flag derived from each employee's bi-weekly `overtime_threshold`

## Maintenance Module (2 tables) — [Docs](docs/schemas/20260318_04_maint.md)

- **maint_request** — Standalone maintenance work order with site, priority, status, fixer assignment, completion details, and recurring frequency
- **maint_request_invnt_item** — Inventory items consumed during a maintenance request with quantity used

## Food Safety Module (8 tables) — [Docs](docs/schemas/20260318_05_fsafe.md)

- **fsafe_template** — Master checklist template definition with name, template type, and optional farm scope
- **fsafe_corrective_action_type** — Org-defined reusable corrective action options selectable from a dropdown
- **fsafe_question** — Questions within a template with display order, response type (boolean, numeric, enum), pass criteria, and warning message
- **fsafe_response** — Employee responses per question per task tracker session; `hr_task_tracker` acts as the checklist completion header
- **fsafe_corrective_action** — Corrective actions raised against failing checklist responses or EMP test failures with assignment, due date, result tracking, and verification
- **fsafe_emp_test_name** — Catalog of EMP (Environmental Monitoring Program) test definitions with result type, pass criteria, and retest/vector requirements (TEXT PK)
- **fsafe_emp_test** — Individual EMP test results per site with retest/vector chaining, certification, and corrective action linkage
- **fsafe_water_test** — Water test results per submission covering E.coli, Salmonella, Listeria, and Total Coliform with lab reference tracking

## Planned Modules

- [x] **Inventory** — Item catalog, categories, orders with partial receipt workflow, transactions, and computed views for dashboards
- [~] **HR** — Employee records, task catalog, scheduling, and labor tracking (in progress); travel requests and disciplinary warnings deferred to future
- [x] **Food Safety** — Checklist templates, question banks, employee responses, and corrective action tracking
- [ ] **Sales** — Customer orders, order lines with price snapshots, invoicing
- [ ] **Pack** — Pack runs, label generation, lot tracking (FSMA traceability)
- [ ] **Grow** — Seeding, grow batches, growth stage tracking, nutrient recipes, environmental monitoring
- [ ] **Global** — Cross-module shared configuration, reporting, and analytics

## Database Conventions

See [DATABASE_CONVENTIONS.md](DATABASE_CONVENTIONS.md) for the full set of schema design rules followed across this project.

## Schema Documentation

Detailed table documentation with column definitions, constraints, and relationships is maintained in `docs/schemas/`:

- [Core Schema](docs/schemas/20260318_01_core.md) — 11 foundation tables
- [Inventory Schema](docs/schemas/20260318_02_invnt.md) — Items, orders, transactions, and views
- [HR Schema](docs/schemas/20260318_03_hr.md) — Tasks, employees, and labor tracking
- [Maintenance Schema](docs/schemas/20260318_04_maint.md) — Work orders and parts usage
- [Food Safety Schema](docs/schemas/20260318_05_fsafe.md) — Checklists, responses, and corrective actions
- [Future Improvements](docs/schemas/20260318_06_future.md) — Deferred tables and planned features (migrations staged in `supabase/migrations_future/`)
