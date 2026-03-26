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
    migrations_future/   # Designed but not yet deployed tables
  docs/
    schemas/             # Human-readable schema documentation per module
    processes/           # Business process documentation with flow diagrams
  src/                   # React application (coming soon)
```

## System Module (4 tables) — [Docs](docs/schemas/20260326_01_sys.md)

- **sys_uom** — Standardized measurement units with `code` as primary key (kg, L, °C, ppm, etc.)
- **sys_access_level** — Defines the 5 hierarchical access tiers (employee, team_lead, manager, admin, owner)
- **sys_module** — Master list of application modules for access control
- **sys_sub_module** — Master list of sub-modules within each module with minimum access level requirements

## Organization Module (7 tables) — [Docs](docs/schemas/20260326_02_org.md)

- **org** — Root entity for multi-org support with currency setting
- **org_module** — Org-scoped module toggles with custom display names and ordering
- **org_sub_module** — Org-scoped sub-module toggles with custom display names, ordering, and access levels
- **org_farm** — Crop/product lines within an org with weighing and growing UOM defaults
- **org_site** — Unified site register for all locations and assets (growing, packaging, storage, maintenance) with category/subcategory-driven fields
- **org_equipment** — Equipment register for physical assets; farm-level or shared, with current/previous employee assignment
- **org_business_rule** — Org-scoped registry for business rules, workflows, calculations, requirements, and definitions

## Inventory Module (8 tables, includes 1 view) — [Docs](docs/schemas/20260326_03_invnt.md)

- **invnt_vendor** — Org-level vendors for procurement with contact details and payment terms (TEXT PK)
- **invnt_category** — Two-level category hierarchy; rows with `sub_category_name` null are top-level categories, rows with `sub_category_name` set are subcategories (TEXT PK)
- **invnt_item** — Items with unit conversions, burn rates, reorder settings, and proper columns for all details
- **invnt_po** — Purchase order requests with workflow (requested → approved → ordered → received) and snapshot pricing
- **invnt_lot** — Unique inventory lots by item and lot number; active while stock remains (TEXT PK)
- **invnt_po_received** — Individual deliveries received against a purchase order with partial delivery support
- **invnt_onhand** — On-hand inventory snapshots per item with burn unit conversion
- **invnt_item_summary** (view) — Computed on-hand, on-order, weeks-on-hand, and next-order-date per item

## Human Resources Module (6 tables) — [Docs](docs/schemas/20260326_04_hr.md)

- **hr_department** — Org-specific department lookup for classifying employees (e.g. GH, PH, Lettuce). TEXT PK derived from name.
- **hr_work_authorization** — Org-specific work authorization type lookup (e.g. Local, FURTE, WFE, H1B). TEXT PK derived from name.
- **hr_title** — Org-specific job title lookup (e.g. Farm Manager, Supervisor, Grower). TEXT PK derived from name.
- **hr_employee** — Unified employee register and org membership; every system user has a row here with a role. Tracks employment details, compensation, and access level. Department, work authorization, and title are FK references. Users are duplicated per org they belong to.
- **hr_module_access** — Controls which application modules each employee can access; one row per employee per module with is_enabled toggle
- **hr_time_off_request** — Employee time off requests with PTO/sick leave breakdown and approval workflow (pending → approved/denied)

## Operations Module (14 tables, includes 1 view) — [Docs](docs/schemas/20260326_05_ops.md)

- **ops_task** — Flat task catalog for labor tracking with name and description (TEXT PK)
- **ops_task_tracker** — Header record for a task event with task, farm, site, date, start/stop times, and verification status. Site is stored directly on the tracker.
- **ops_task_schedule** — Employees per task event with individual start/stop times (overridable from tracker) and units completed
- **ops_weekly_schedule** (view) — Pivoted weekly schedule with Sun–Sat time columns, total hours, and OT threshold flag derived from each employee's bi-weekly `overtime_threshold`
- **ops_training_type** — Org-specific training type lookup (e.g. GMP, Food Safety, HACCP). TEXT PK derived from name.
- **ops_training** — Staff training session records with type, date, topics, trainer names, and materials
- **ops_training_attendee** — Per-employee attendance and certification records for each training session
- **ops_template_category** — Org-defined categories for grouping checklist templates by module or purpose (TEXT PK)
- **ops_template** — Master checklist template definition with name, category, and optional farm scope
- **ops_task_template** — Many-to-many link between tasks and templates; app loads linked templates when creating an activity
- **ops_corrective_action_choice** — Org-defined reusable corrective action options selectable from a dropdown
- **ops_template_question** — Questions within a template with display order, response type (boolean, numeric, enum), pass criteria, and warning message
- **ops_template_response** — Employee responses per question per task tracker session; `ops_task_tracker` acts as the checklist completion header
- **ops_corrective_action_taken** — Corrective actions raised against failing checklist responses or EMP test results with assignment, due date, result tracking, and verification

## Grow Module (24 tables) — [Docs](docs/schemas/20260326_06_grow.md)

- **grow_variety** — Crop varieties with short codes for quick reference (e.g. "K" for Keiki). Farm-scoped.
- **grow_grade** — Harvest quality grades with short codes (e.g. "A" for Grade A). Farm-scoped.
- **grow_cycle_pattern** — Growing cycle patterns per farm (e.g. 14-Day Lettuce, 42-Day Cucumber) for auto-calculating transplant/harvest dates (TEXT PK).
- **grow_trial_type** — Lookup defining types of seeding trials (e.g. new lot, new variety). Farm-scoped (TEXT PK).
- **grow_seed_mix** — Named seed blend recipes with items and percentages defined in child table. Farm-scoped (TEXT PK).
- **grow_seed_mix_item** — Individual seed items within a mix recipe with proportion percentage.
- **grow_seed_batch** — Seeding batch linked to ops activity; either single variety or mix, with traceability code and lifecycle status.
- **grow_harvest_container** — Container definitions with tare weight, optionally specific to variety and grade for auto-calculation
- **grow_harvest_weight** — Individual weigh-ins per container type; links directly to seeding batch for traceability with grade assignment. Tare auto-calculated.
- **grow_pest** — Standardized pest names for scouting observations. Farm-scoped (TEXT PK).
- **grow_disease** — Standardized disease names for scouting observations. Farm-scoped (TEXT PK).
- **grow_task_seed_batch** — Unified join table linking any grow activity (scouting, spraying, fertigation, monitoring) to seeding batches.
- **grow_task_photo** — Unified photo table for any grow activity (scouting, monitoring) with optional caption.
- **grow_scout_observation** — Individual pest or disease finding with side, severity, and infection stage.
- **grow_scout_observation_row** — Rows affected by a specific observation; one row per growing row.
- **grow_spray_compliance** — Chemical label registry with REI, PHI, application rates, and regulatory info per product.
- **grow_spray_input** — Individual chemical/fertilizer applied per spraying activity with quantity and compliance link.
- **grow_spray_equipment** — Equipment used per spraying activity with water UOM and quantity per piece.
- **grow_fertigation_recipe** — Reusable fertigation recipe with flush water config and top-up hours (TEXT PK).
- **grow_fertigation_recipe_item** — Fertilizer items in a recipe with quantities; invnt_item_id nullable for one-off products.
- **grow_fertigation_recipe_site** — Sites that receive a recipe (configuration for pre-filling).
- **grow_fertigation** — Tanks used per fertigation event with volume applied.
- **grow_monitoring_metric** — Defines what to measure per farm and site category with UOM, thresholds, and optional formula for calculated points.
- **grow_monitoring_reading** — Individual measurement per monitoring event per point per station.

## Pack Module (6 tables) — [Docs](docs/schemas/20260326_07_pack.md)

- **pack_lot** — Production lot header with lot number, harvest date, and pack date; lot numbers are system-generated from the pack date and shared across all products packed on the same day
- **pack_lot_item** — Individual products packed within a lot with best-by date, quantity packed, and UOM
- **pack_shelf_life_metric** — Defines what gets checked during shelf life observations with response type and termination criteria (TEXT PK)
- **pack_shelf_life** — Shelf life trial header linking product, lot, packaging type, target vs actual shelf life, and trial status
- **pack_shelf_life_observation** — Individual observation responses per check per date per trial with typed responses
- **pack_shelf_life_photo** — Photos taken per observation date per trial, one row per photo with optional caption

## Sales Module (8 tables) — [Docs](docs/schemas/20260326_08_sales.md)

- **sales_fob** — Org-specific FOB (Freight On Board) delivery points (TEXT PK)
- **sales_customer_group** — Org-specific customer classifications for reporting and group pricing (TEXT PK)
- **sales_customer** — Org customers with group, FOB preference, billing, and external accounting link (TEXT PK)
- **sales_product** — Sellable products with full packaging hierarchy (content → pack → sale → shipping) (TEXT PK)
- **sales_product_price** — Tiered pricing (customer → group → default) with effective date ranges
- **sales_po** — Customer order header with customer, FOB, dates, approval workflow, accounting upload tracking, and optional recurring frequency for standing orders
- **sales_po_line** — Individual products within an order with snapshot pricing at time of order
- **sales_po_fulfillment** — Fulfillment records linking order lines to pack lots, supporting partial fulfillment across multiple lots

## Maintenance Module (2 tables) — [Docs](docs/schemas/20260326_09_maint.md)

- **maint_request** — Standalone maintenance work order with site, priority, status, fixer assignment, completion details, and recurring frequency
- **maint_request_invnt_item** — Inventory items consumed during a maintenance request with quantity used

## Food Safety Module (5 tables) — [Docs](docs/schemas/20260326_10_fsafe.md)

- **fsafe_lab_test** — Catalog of EMP (Environmental Monitoring Program) test definitions with result type, pass criteria, and retest/vector requirements (TEXT PK)
- **fsafe_result** — Unified food safety test results for both EMP and test-and-hold testing; one row per test event with retest/vector chaining, corrective action linkage, and optional test-and-hold parent reference
- **fsafe_lab** — Catalog of laboratories used for food safety test submissions (TEXT PK)
- **fsafe_test_hold** — Test-and-hold header; one record per pack lot tested, tracks sample collection, lab submission, and test timeline
- **fsafe_test_hold_po** — Links test-and-hold records to sales POs on hold pending results

## Planned Modules

- **Grow** — Seed mix recipes, seeding batches with traceability codes, growth stage tracking, nutrient recipes, environmental monitoring
- **Organisation** — Site enhancements (grow zone tracking, environmental sensors), equipment maintenance schedules, org-level reporting and analytics
- **Human Resources** — Payroll processing integration
- **Pack** — Pack line productivity tracking and reporting

## Schema Conventions

See [SCHEMA_CONVENTIONS.md](SCHEMA_CONVENTIONS.md) for the full set of schema design rules followed across this project.

## Schema Documentation

Detailed table documentation with column definitions, constraints, and relationships is maintained in `docs/schemas/`:

- [System Schema](docs/schemas/20260326_01_sys.md) — 4 system-level tables
- [Org Schema](docs/schemas/20260326_02_org.md) — 7 organization structure tables
- [Inventory Schema](docs/schemas/20260326_03_invnt.md) — Items, orders, transactions, and views
- [Human Resources Schema](docs/schemas/20260326_04_hr.md) — Employee records and Human Resources lookups
- [Operations Schema](docs/schemas/20260326_05_ops.md) — Task tracking, training, and food safety checklists
- [Grow Schema](docs/schemas/20260326_06_grow.md) — Crop varieties and harvest grades
- [Pack Schema](docs/schemas/20260326_07_pack.md) — Production lot tracking and shelf life trials
- [Sales Schema](docs/schemas/20260326_08_sales.md) — Product catalog, pricing, orders, and fulfillment
- [Maintenance Schema](docs/schemas/20260326_09_maint.md) — Work orders and parts usage
- [Food Safety Schema](docs/schemas/20260326_10_fsafe.md) — EMP testing, lab management, and test-and-hold
- [Future Improvements](docs/schemas/20260326_11_future.md) — Deferred tables and planned features (migrations staged in `supabase/migrations_future/`)
