# Aloha App

Multi-organization agricultural ERP built on Supabase and React for farm-to-customer operations.

## About

Aloha is an ERP system designed for hydroponic and greenhouse farming operations. It manages the full lifecycle from crop production to customer delivery, supporting multiple organizations on a single platform where each organization manages its own farms, products, customers, and pricing independently.

## Business Context

The system serves agricultural operations that grow crops like cucumbers, lettuce, and tomatoes in controlled greenhouse environments. Each organization can operate multiple **farms**, where a farm represents a crop or product line (e.g. "Cuke Farm", "Lettuce Farm") rather than a physical location. Within each farm, **sites** represent the physical infrastructure — nurseries for seedling propagation, growing greenhouses for production, packing facilities, and storage areas.

Products move through a defined packaging hierarchy: content (the raw product) is packed into consumer units, grouped into sale units (cases, boxes), and palletized into shipping units. This hierarchy drives inventory calculations and order fulfillment.

Pricing is managed with three tiers of specificity — default prices by product and delivery method, group-level overrides for customer segments like wholesale or retail, and customer-specific pricing. All prices track effective date ranges so historical pricing is preserved as prices change.

## Tech Stack

- **Database:** PostgreSQL (via Supabase)
- **Backend:** Supabase (auth, storage, APIs, row-level security)
- **Frontend:** React
- **Auth:** Supabase Auth with profile extension

## Project Structure

```
aloha-app/
  supabase/
    migrations/          # Sequential SQL migration files (source of truth)
  docs/
    schemas/             # Human-readable schema documentation per module
  src/                   # React application (coming soon)
```

## Core Schema (14 tables)

### Global Reference Tables
These tables are shared across all organizations.

- **unit_of_measure** — Standardized measurement units (kg, L, °C, ppm, etc.)
- **role** — Five access levels: Owner (5), Admin (4), Manager (3), Verifier (2), Worker (1)

### Identity and Access
- **profile** — Extends Supabase Auth with user data and preferences
- **org_member** — Links users to organizations with roles; a user can belong to multiple orgs

### Organization and Customers
- **organization** — Root entity for multi-org support with org-level settings in metadata
- **customer_group** — Org-specific customer classifications for reporting and group pricing
- **freight_on_board** — Org-specific delivery methods (Farm Pick-up, Local Delivery, Distributor)
- **customer** — Org customers with group, delivery preference, billing, and external accounting link

### Farm Structure
- **farm** — Crop/product lines within an org (e.g. Cuke Farm, Lettuce Farm)
- **farm_site** — Physical locations within a farm (nursery, growing, packing, storage)
- **farm_variety** — Crop varieties with short codes (e.g. "K" for Keiki)
- **farm_grade** — Harvest quality grades with short codes (e.g. "A" for Grade A)

### Products and Pricing
- **farm_product** — Sellable products with full packaging hierarchy (content → pack → sale → shipping)
- **farm_product_price** — Tiered pricing (customer → group → default) with effective date ranges

## Planned Modules

- [ ] **Inventory** — Inventory items, stock movements, product-inventory junction table
- [ ] **Growing Operations** — Seeding, grow batches, growth stage tracking, nutrient recipes
- [ ] **Environmental Monitoring** — Sensor readings (water EC, pH) linked to monitoring stations at growing sites
- [ ] **Harvest** — Harvest logging by variety and grade, yield tracking
- [ ] **Orders and Sales** — Customer orders, order lines with price snapshots, invoicing
- [ ] **Packing** — Pack runs, label generation, lot tracking (FSMA traceability)
- [ ] **Shipping** — Shipment scheduling, BOL generation, delivery confirmation
- [ ] **Maintenance** — Equipment and site maintenance scheduling and tracking
- [ ] **Food Safety** — Compliance checks, audit trails, corrective actions
- [ ] **Reporting and Analytics** — Cost-per-batch, yield forecasting, revenue dashboards

## Database Conventions

- **UUIDs** for all primary keys (`gen_random_uuid()`)
- **org_id** on every org-scoped table for direct RLS filtering
- **is_active** boolean for soft deletes (no records are physically deleted)
- **metadata** JSONB columns for flexible, display-only fields that don't require indexing or calculations
- **Proper FK columns** for anything used in calculations, filtering, or joins
- Sequential migration files in `supabase/migrations/` with naming: `YYYYMMDD_NNN_module_tablename.sql`

## Schema Documentation

Detailed table documentation with column definitions, constraints, and relationships is maintained in `docs/schemas/`. Start with [Core Schema](docs/schemas/core.md).
