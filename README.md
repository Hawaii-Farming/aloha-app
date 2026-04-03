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
    migrations/          # Sequential SQL migration files (001-135, source of truth)
  docs/
    schemas/             # Schema documentation per module (01_sys through 10_fsafe)
    processes/           # Business process and workflow documentation (01-10)
  scripts/
    migrations/          # One-time data import from legacy systems
    processes/           # Ongoing operational workflows (e.g. payroll processing)
  src/                   # React application (coming soon)
  SCHEMA_CONVENTIONS.md  # Schema design rules — read before every change
```

## System Module (6 tables) — [Docs](docs/schemas/20260401000001_sys.md)

- **sys_uom** — Standardized measurement units with `code` as primary key (kg, L, °C, ppm, etc.)
- **sys_access_level** — Defines the 5 hierarchical access tiers (employee, team_lead, manager, admin, owner)
- **sys_module** — Master list of application modules for access control
- **sys_sub_module** — Master list of sub-modules within each module with minimum access level requirements
- **grow_pest** — System-wide pest catalog for scouting observations
- **grow_disease** — System-wide disease catalog for scouting observations

## Organization Module (8 tables) — [Docs](docs/schemas/20260401000002_org.md)

- **org** — Root entity for multi-org support with currency setting
- **org_module** — Org-scoped module toggles with custom display names and ordering
- **org_sub_module** — Org-scoped sub-module toggles with custom display names, ordering, and access levels
- **org_farm** — Crop/product lines within an org with weighing and growing UOM defaults
- **org_site_category** — Two-level site category hierarchy (e.g. growing/greenhouse, packing/room, housing/room)
- **org_site** — Unified site register with parent-child hierarchy for all locations; category and subcategory are FK references to org_site_category
- **org_equipment** — Equipment register for physical assets; farm-level or shared, site-level or mobile
- **org_business_rule** — Org-scoped registry for business rules, workflows, calculations, requirements, and definitions

## Inventory Module (8 tables, includes 1 view) — [Docs](docs/schemas/20260401000003_invnt.md)

- **invnt_vendor** — Org-level vendors for procurement with contact details and payment terms (TEXT PK)
- **invnt_category** — Two-level category hierarchy; rows with `sub_category_name` null are top-level categories, rows with `sub_category_name` set are subcategories (TEXT PK)
- **invnt_item** — Items with unit conversions, burn rates, reorder settings, and proper columns for all details
- **invnt_po** — Purchase order requests with workflow (requested → approved → ordered → received) and snapshot pricing
- **invnt_lot** — Unique inventory lots by item and lot number; active while stock remains (TEXT PK)
- **invnt_po_received** — Individual deliveries received against a purchase order with partial delivery support
- **invnt_onhand** — On-hand inventory snapshots per item with burn unit conversion
- **invnt_item_summary** (view) — Computed on-hand, on-order, weeks-on-hand, and next-order-date per item

## Human Resources Module (9 tables) — [Docs](docs/schemas/20260401000004_hr.md)

- **hr_department** — Org-specific department lookup for classifying employees (e.g. GH, PH, Lettuce). TEXT PK derived from name.
- **hr_work_authorization** — Org-specific work authorization type lookup (e.g. Local, FURTE, WFE, H1B). TEXT PK derived from name.
- **hr_title** — Org-specific job title lookup (e.g. Farm Manager, Supervisor, Grower). TEXT PK derived from name.
- **hr_employee** — Unified employee register and org membership; every system user has a row here with a role. Tracks employment details, compensation, and access level. Department, work authorization, and title are FK references. Users are duplicated per org they belong to.
- **hr_module_access** — Controls which application modules each employee can access; one row per employee per module with is_enabled toggle
- **hr_time_off_request** — Employee time off requests with PTO/sick leave breakdown and approval workflow (pending → approved/denied)
- **hr_travel_request** — Employee travel requests with trip details and approval workflow (pending → approved/denied)
- **hr_disciplinary_warning** — Employee disciplinary warning records with acknowledgment and review workflow
- **hr_payroll** — Merged payroll data imported from external processor; one row per employee per check date with snapshotted employee fields

## Operations Module (14 tables, includes 1 view) — [Docs](docs/schemas/20260401000005_ops.md)

- **ops_task** — Flat task catalog for labor tracking with name and description (TEXT PK)
- **ops_task_tracker** — Header record for a task event with task, farm, site, date, start/stop times, and verification status. Site is stored directly on the tracker.
- **ops_task_schedule** — Employees per task event with individual start/stop times (overridable from tracker)
- **ops_task_weekly_schedule** (view) — Pivoted weekly schedule with Sun–Sat time columns, total hours, and OT threshold flag derived from each employee's bi-weekly `overtime_threshold`
- **ops_training_type** — Org-specific training type lookup (e.g. GMP, Food Safety, HACCP). TEXT PK derived from name.
- **ops_training** — Staff training session records with type, date, topics, trainer names, and materials
- **ops_training_attendee** — Per-employee attendance and certification records for each training session
- **ops_template** — Master checklist template definition with name and optional farm scope
- **ops_task_template** — Many-to-many link between tasks and templates; app loads linked templates when creating an activity
- **ops_corrective_action_choice** — Org-defined reusable corrective action options selectable from a dropdown
- **ops_template_question** — Questions within a template with display order, response type (boolean, numeric, enum), pass criteria, and warning message
- **ops_template_result** — Employee responses per question per task tracker session targeting either a site or equipment; `ops_task_tracker` acts as the checklist completion header
- **ops_template_result_photo** — Photos attached to a checklist response; one row per photo, only used when ops_template_question.include_photo = true
- **ops_corrective_action_taken** — Corrective actions raised against failing checklist responses or EMP test results with assignment, due date, result tracking, and verification

## Grow Module (20 tables, 1 view) — [Docs](docs/schemas/20260401000006_grow.md)

- **grow_variety** — Crop varieties with short codes for quick reference (e.g. "K" for Keiki). Farm-scoped.
- **grow_grade** — Harvest quality grades with short codes (e.g. "A" for Grade A). Farm-scoped.
- **grow_cycle_pattern** — Growing cycle patterns per farm (e.g. 14-Day Lettuce, 42-Day Cucumber) for auto-calculating transplant/harvest dates (TEXT PK).
- **grow_trial_type** — Lookup defining types of seeding trials (e.g. new lot, new variety). Farm-scoped (TEXT PK).
- **grow_seed_mix** — Named seed blend recipes with items and percentages defined in child table. Farm-scoped (TEXT PK).
- **grow_seed_mix_item** — Individual seed items within a mix recipe with proportion percentage.
- **grow_seed_batch** — Seeding batch linked to ops activity; either single variety or mix, with traceability code and lifecycle status.
- **grow_harvest_container** — Container definitions with tare weight, optionally specific to variety and grade for auto-calculation
- **grow_harvest_weight** — Individual weigh-ins per container type; links directly to seeding batch for traceability with grade assignment. Tare auto-calculated.
- **grow_task_seed_batch** — Unified join table linking any grow activity (scouting, spraying, fertigation, monitoring) to seeding batches.
- **grow_task_photo** — Unified photo table for any grow activity (scouting, monitoring) with optional caption.
- **grow_scout_result** — Individual pest or disease finding with severity and infection stage.
- **grow_spray_compliance** — Chemical label registry with REI, PHI, application rates, and regulatory info per product.
- **grow_spray_input** — Individual chemical/fertilizer applied per spraying activity with quantity and compliance link.
- **grow_spray_equipment** — Equipment used per spraying activity with water UOM and quantity per piece.
- **grow_fertigation_recipe** — Reusable fertigation recipe with flush water config and top-up hours (TEXT PK).
- **grow_fertigation_recipe_item** — Fertilizer items in a recipe with quantities; invnt_item_id nullable for one-off products.
- **grow_fertigation_recipe_site** — Sites that receive a recipe (configuration for pre-filling).
- **grow_fertigation** — Tanks used per fertigation event with volume applied.
- **grow_monitoring_metric** — Defines what to measure per farm and site category with UOM, thresholds, and optional formula for calculated points.
- **grow_monitoring_result** — Individual measurement per monitoring event per point per station.
- **grow_spray_restriction** (view) — Derived daily NE (No Entry) and NH (No Harvest) restriction calendar per site from spray events

## Pack Module (10 tables) — [Docs](docs/schemas/20260401000007_pack.md)

- **pack_lot** — Production lot header with lot number, harvest date, and pack date; lot numbers are system-generated from the pack date and shared across all products packed on the same day
- **pack_lot_item** — Individual products packed within a lot with best-by date, quantity packed, and UOM
- **pack_shelf_life_metric** — Defines what gets checked during shelf life observations with response type and termination criteria (TEXT PK)
- **pack_shelf_life** — Shelf life trial header linking product, lot, packaging type, target vs actual shelf life, and trial status
- **pack_shelf_life_result** — Individual observation responses per check per date per trial with typed responses
- **pack_shelf_life_photo** — Photos taken per observation date per trial, one row per photo with optional caption
- **pack_dryer_result** — Environmental and moisture readings during packing; tracks temperature and moisture conditions before and after the dryer
- **pack_productivity_fail_category** — Lookup for pack line fail categories (e.g. film, tray, printer, leaves, ridges)
- **pack_productivity_hour** — Hourly pack line snapshot with crew counts by role and metal detection flag
- **pack_productivity_hour_fail** — Fail counts per category per hour

## Sales Module (9 tables) — [Docs](docs/schemas/20260401000008_sales.md)

- **sales_fob** — Org-specific FOB (Freight On Board) delivery points (TEXT PK)
- **sales_customer_group** — Org-specific customer classifications for reporting and group pricing (TEXT PK)
- **sales_customer** — Org customers with group, FOB preference, billing, and external accounting link (TEXT PK)
- **sales_product** — Sellable products with full packaging hierarchy (content → pack → sale → shipping) (TEXT PK)
- **sales_product_price** — Tiered pricing (customer → group → default) with effective date ranges
- **sales_po** — Customer order header with customer, FOB, dates, approval workflow, accounting upload tracking, and optional recurring frequency for standing orders
- **sales_po_line** — Individual products within an order with snapshot pricing at time of order
- **sales_container_type** — Lookup table for shipping container types with maximum pallet space capacity
- **sales_po_fulfillment** — Fulfillment records linking order lines to pack lots, with shipping traceability (container_id, booking_id, pallet_number, container_space) bulk-set during containerization

## Maintenance Module (3 tables) — [Docs](docs/schemas/20260401000009_maint.md)

- **maint_request** — Standalone maintenance work order targeting either a site or equipment (never both), with priority, status, fixer assignment, completion details, and recurring frequency
- **maint_request_invnt_item** — Inventory items consumed during a maintenance request with quantity used
- **maint_request_photo** — Photos attached to a maintenance request with before/after classification

## Food Safety Module (6 tables) — [Docs](docs/schemas/20260401000010_fsafe.md)

- **fsafe_lab_test** — Catalog of EMP (Environmental Monitoring Program) test definitions with result type, pass criteria, and retest/vector requirements (TEXT PK)
- **fsafe_result** — Unified food safety test results for both EMP and test-and-hold testing; one row per test event with retest/vector chaining, corrective action linkage, and optional test-and-hold parent reference
- **fsafe_lab** — Catalog of laboratories used for food safety test submissions (TEXT PK)
- **fsafe_test_hold** — Test-and-hold header; one record per pack lot tested, tracks sample collection, lab submission, and test timeline
- **fsafe_test_hold_po** — Links test-and-hold records to sales POs on hold pending results
- **fsafe_pest_result** — Per-station pest trap inspection result; one row per trap station per inspection event

## Schema Conventions

See [SCHEMA_CONVENTIONS.md](SCHEMA_CONVENTIONS.md) for the full set of schema design rules followed across this project.

## Schema Documentation

Detailed table documentation with column definitions, constraints, and relationships is maintained in `docs/schemas/`:

- [System Schema](docs/schemas/20260401000001_sys.md) — 6 system-level tables
- [Org Schema](docs/schemas/20260401000002_org.md) — 8 organization structure tables
- [Inventory Schema](docs/schemas/20260401000003_invnt.md) — Items, orders, transactions, and views
- [Human Resources Schema](docs/schemas/20260401000004_hr.md) — Employee records and Human Resources lookups
- [Operations Schema](docs/schemas/20260401000005_ops.md) — Task tracking, training, and food safety checklists
- [Grow Schema](docs/schemas/20260401000006_grow.md) — Seeding, harvesting, scouting, spraying, fertigation, and monitoring
- [Pack Schema](docs/schemas/20260401000007_pack.md) — Lot tracking, shelf life trials, and hourly productivity
- [Sales Schema](docs/schemas/20260401000008_sales.md) — Product catalog, pricing, orders, and fulfillment
- [Maintenance Schema](docs/schemas/20260401000009_maint.md) — Work orders and parts usage
- [Food Safety Schema](docs/schemas/20260401000010_fsafe.md) — EMP testing, lab management, test-and-hold, and pest trap inspections


## Process Documentation

Workflow and business process documentation with flow diagrams:

- [Org Provisioning](docs/processes/20260401000001_org_provisioning.md) — New org setup and module seeding
- [User Access Flow](docs/processes/20260401000002_user_access_flow.md) — Login, org selection, and multi-layered access control
- [Grow Seeding](docs/processes/20260401000003_grow_seeding_workflow.md) — Seeding batch creation and lifecycle
- [Grow Harvesting](docs/processes/20260401000004_grow_harvesting_workflow.md) — Harvest weigh-in and grading
- [Grow Scouting](docs/processes/20260401000005_grow_scouting_workflow.md) — Pest and disease observation
- [Grow Spraying](docs/processes/20260401000006_grow_spraying_workflow.md) — Chemical application with compliance enforcement
- [Grow Fertigation](docs/processes/20260401000007_grow_fertigation_workflow.md) — Fertilizer recipe application
- [Grow Monitoring](docs/processes/20260401000008_grow_monitoring_workflow.md) — Environmental readings with calculated points
- [Ops Task Workflow](docs/processes/20260401000009_ops_template_workflow.md) — General task + checklist workflow with ATP testing
- [Pack Productivity](docs/processes/20260401000010_pack_productivity_workflow.md) — Hourly pack line tracking with crew and fail logging
