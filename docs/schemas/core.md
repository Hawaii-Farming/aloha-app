# Core Schema

Core tables that form the foundation of the Aloha ERP system. These include global reference tables shared across all organizations, identity and access management, customer management, farm structure, product catalog, and pricing.

## Entity Relationship Diagram

```mermaid
erDiagram
    organization ||--o{ org_member : has
    profile ||--o{ org_member : joins
    role ||--o{ org_member : assigned
    organization ||--o{ customer_group : defines
    organization ||--o{ delivery_method : defines
    organization ||--o{ customer : has
    customer_group ||--o{ customer : classifies
    delivery_method ||--o{ customer : delivery
    organization ||--o{ supplier : has
    organization ||--o{ farm : operates
    farm ||--o{ farm_site : contains
    farm ||--o{ farm_variety : grows
    farm ||--o{ farm_grade : grades
    farm ||--o{ farm_product : sells
    farm_grade ||--o{ farm_product : graded
    unit_of_measure ||--o{ farm_product : units
    farm_product ||--o{ farm_product_price : priced
    delivery_method ||--o{ farm_product_price : by-delivery
    customer ||--o{ farm_product_price : customer
    customer_group ||--o{ farm_product_price : group
```

---

## Table Overview

| Table | Purpose |
|-------|---------|
| unit_of_measure | Standardized measurement units (kg, L, °C, etc.) shared across all organizations for consistent data entry and calculations. |
| role | Defines the five access levels (Owner, Admin, Manager, Verifier, Worker) used to control what users can see and do within an organization. |
| organization | Root entity for multi-org support. Every org-scoped record traces back to this table. Stores org-level settings like default currency in metadata. |
| profile | Extends Supabase Auth with app-specific user data like name, phone, and preferences. One-to-one with auth.users. |
| org_member | Links users to organizations with a specific role. Enables a single user to belong to multiple organizations with different access levels in each. |
| customer_group | Allows each organization to classify customers into groups (e.g. Wholesale, Retail, Restaurant) for reporting and group-based pricing. |
| delivery_method | Defines each organization's available delivery methods (e.g. Farm Pick-up, Local Delivery, Distributor). Used in customer setup and pricing. |
| supplier | Organization-level suppliers for procurement. Referenced by inventory items across all farms. |
| customer | Stores an organization's customers with their preferred delivery method, group classification, billing address, and a link to external accounting software. |
| farm | Represents a crop or product line within an organization (e.g. Cuke Farm, Lettuce Farm). Each farm has its own sites, varieties, grades, and products. |
| farm_site | Physical locations within a farm where operations happen — nurseries for seedlings, growing sites for production, packing sites, and storage facilities. |
| farm_variety | Crop varieties grown on a specific farm, each with a short code for quick reference during data entry (e.g. "K" for Keiki). |
| farm_grade | Harvest quality grades used by a specific farm, each with a short code (e.g. "A" for Grade A). Applied during harvest and carried through to sales. |
| farm_product | The sellable products from each farm, combining grade and packaging configuration. Contains the full packaging hierarchy (content → pack → sale → shipping) used for inventory math. |
| farm_product_price | Manages product pricing with three tiers of specificity (default, group, customer) and date ranges to track price changes over time. Currency uses the org default. |

---

## unit_of_measure

Standardized measurement units shared across all organizations for consistent data entry and calculations throughout the system.

| Column       | Type        | Constraints          | Description                          |
|-------------|-------------|----------------------|--------------------------------------|
| id          | UUID        | PK, auto-generated   | Unique identifier                    |
| name        | VARCHAR(50) | NOT NULL, UNIQUE     | Full name, e.g. "Kilogram"           |
| abbreviation| VARCHAR(10) | NOT NULL, UNIQUE     | Short form, e.g. "kg"               |
| category    | VARCHAR(30) | NOT NULL             | Grouping: weight, volume, length, etc.|

## role

Defines the access levels used to control what users can see and do within an organization. Shared across all organizations.

| Column      | Type        | Constraints          | Description                              |
|------------|-------------|----------------------|------------------------------------------|
| id         | UUID        | PK, auto-generated   | Unique identifier                        |
| name       | VARCHAR(30) | NOT NULL, UNIQUE     | Role name: Owner, Admin, Manager, etc.   |
| level      | INT         | NOT NULL, UNIQUE     | Numeric access level (lower = more access) |
| description| TEXT        | nullable             | What this role can do                    |

Defined roles: Owner (1), Admin (2), Manager (3), Verifier (4), Worker (5). Lowest levels inherit permissions of higher levels.

## organization

Root entity for multi-org support. Every org-scoped table references this. Stores org-level settings such as default currency in the metadata JSONB column.

| Column     | Type         | Constraints          | Description                          |
|-----------|-------------|----------------------|--------------------------------------|
| id        | UUID         | PK, auto-generated   | Unique identifier                    |
| name      | VARCHAR(100) | NOT NULL, UNIQUE     | Organization name                    |
| slug      | VARCHAR(100) | NOT NULL, UNIQUE     | URL-friendly identifier              |
| address   | TEXT         | nullable             | Physical address                     |
| metadata  | JSONB        | NOT NULL, default {} | Org-level settings (currency, etc.)  |
| is_active | BOOLEAN      | NOT NULL, default true| Soft-disable without deleting        |
| created_at| TIMESTAMPTZ  | NOT NULL, default now | When the record was created          |
| created_by| UUID         | FK → profile(id), nullable | Who created the record          |
| updated_at| TIMESTAMPTZ  | NOT NULL, default now | When the record was last updated     |
| updated_by| UUID         | FK → profile(id), nullable | Who last updated the record     |


## profile

Extends Supabase Auth with app-specific user data. Stores user preferences like dark mode and language in the metadata JSONB column. One-to-one with auth.users.

| Column     | Type        | Constraints                  | Description                          |
|-----------|-------------|------------------------------|--------------------------------------|
| id        | UUID        | PK, references auth.users(id)| Same ID as Supabase Auth user        |
| first_name| VARCHAR(50) | NOT NULL                     | User's first name                    |
| last_name | VARCHAR(50) | NOT NULL                     | User's last name                     |
| phone     | VARCHAR(20) | nullable                     | Contact number                       |
| metadata    | JSONB     | NOT NULL, default {}         | User preferences (dark mode, etc.)   |
| is_active | BOOLEAN     | NOT NULL, default true       | Soft-disable without deleting        |
| created_at| TIMESTAMPTZ | NOT NULL, default now        | When the record was created          |
| updated_at| TIMESTAMPTZ | NOT NULL, default now        | When the record was last updated     |

## org_member

Links users to organizations with a specific role. Enables a single user to belong to multiple organizations with different access levels in each.

| Column    | Type        | Constraints                      | Description                          |
|----------|-------------|----------------------------------|--------------------------------------|
| id       | UUID        | PK, auto-generated               | Unique identifier                    |
| org_id   | UUID        | NOT NULL, FK → organization(id)  | The organization                     |
| user_id  | UUID        | NOT NULL, FK → profile(id)       | The user                             |
| role_id  | UUID        | NOT NULL, FK → role(id)          | Their role in this organization      |
| is_active| BOOLEAN     | NOT NULL, default true           | Soft-disable membership              |
| joined_at  | TIMESTAMPTZ | NOT NULL, default now            | When they joined the organization    |
| created_at | TIMESTAMPTZ | NOT NULL, default now            | When the record was created          |
| created_by | UUID        | FK → profile(id), nullable       | Who created the record               |
| updated_at | TIMESTAMPTZ | NOT NULL, default now            | When the record was last updated     |
| updated_by | UUID        | FK → profile(id), nullable       | Who last updated the record          |

Unique constraint on `(org_id, user_id)` — a user can only have one role per organization.

## customer_group

Allows each organization to classify customers into groups for reporting and group-based pricing (e.g. Wholesale, Retail, Restaurant).

| Column | Type        | Constraints                     | Description                |
|--------|-------------|--------------------------------|----------------------------|
| id     | UUID        | PK, auto-generated             | Unique identifier          |
| org_id | UUID        | NOT NULL, FK → organization(id)| The organization           |
| name       | VARCHAR(50)  | NOT NULL                       | Group name                 |
| created_at | TIMESTAMPTZ  | NOT NULL, default now          | When the record was created|
| created_by | UUID         | FK → profile(id), nullable     | Who created the record     |
| updated_at | TIMESTAMPTZ  | NOT NULL, default now          | When the record was last updated |
| updated_by | UUID         | FK → profile(id), nullable     | Who last updated the record|

Unique constraint on `(org_id, name)` — no duplicate group names within an org.

## delivery_method

Defines each organization's available delivery methods (e.g. Farm Pick-up, Local Delivery, Distributor). Used in customer setup to set a preferred delivery and in pricing to set delivery-specific prices.

| Column | Type        | Constraints                     | Description                |
|--------|-------------|--------------------------------|----------------------------|
| id     | UUID        | PK, auto-generated             | Unique identifier          |
| org_id | UUID        | NOT NULL, FK → organization(id)| The organization           |
| name       | VARCHAR(50)  | NOT NULL                       | Delivery method name       |
| created_at | TIMESTAMPTZ  | NOT NULL, default now          | When the record was created|
| created_by | UUID         | FK → profile(id), nullable     | Who created the record     |
| updated_at | TIMESTAMPTZ  | NOT NULL, default now          | When the record was last updated |
| updated_by | UUID         | FK → profile(id), nullable     | Who last updated the record|

Unique constraint on `(org_id, name)` — no duplicate delivery methods within an org.

## supplier

Organization-level suppliers used for procurement across all farms. Stores contact details and flexible fields like address, payment terms, and lead times in metadata.

| Column         | Type         | Constraints                     | Description                        |
|---------------|--------------|--------------------------------|------------------------------------|
| id            | UUID         | PK, auto-generated             | Unique identifier                  |
| org_id        | UUID         | NOT NULL, FK → organization(id)| The organization                   |
| name          | VARCHAR(100) | NOT NULL                       | Supplier/company name              |
| contact_person| VARCHAR(100) | nullable                       | Primary contact                    |
| email         | VARCHAR(100) | nullable                       | Contact email                      |
| phone         | VARCHAR(20)  | nullable                       | Contact phone                      |
| metadata      | JSONB        | NOT NULL, default {}           | Address, payment terms, lead times, etc. |
| is_active     | BOOLEAN      | NOT NULL, default true         | Soft-disable without deleting      |
| created_at    | TIMESTAMPTZ  | NOT NULL, default now          | When the record was created        |
| created_by    | UUID         | FK → profile(id), nullable     | Who created the record             |
| updated_at    | TIMESTAMPTZ  | NOT NULL, default now          | When the record was last updated   |
| updated_by    | UUID         | FK → profile(id), nullable     | Who last updated the record        |

Unique constraint on `(org_id, name)` — no duplicate supplier names within an org.

## customer

Stores an organization's customers with their group classification, preferred delivery method, billing address, and a link to external accounting software via external_id. Additional display fields like store number, store name, and CC emails are stored in metadata.

| Column           | Type         | Constraints                        | Description                              |
|-----------------|--------------|------------------------------------|------------------------------------------|
| id              | UUID         | PK, auto-generated                 | Unique identifier                        |
| org_id          | UUID         | NOT NULL, FK → organization(id)    | The organization                         |
| customer_group_id| UUID        | FK → customer_group(id), nullable  | Customer classification for reporting    |
| delivery_method_id          | UUID         | FK → delivery_method(id), nullable| Preferred delivery method                |
| external_id     | VARCHAR(50)  | nullable                           | Links to accounts management software    |
| name            | VARCHAR(100) | NOT NULL                           | Customer/business name                   |
| email           | VARCHAR(100) | nullable                           | Primary email                            |
| metadata        | JSONB        | NOT NULL, default {}               | Flexible fields: store_number, store_name, cc_emails, etc. |
| billing_address | TEXT         | nullable                           | Billing address                          |
| is_active       | BOOLEAN      | NOT NULL, default true             | Soft-disable without deleting            |
| created_at      | TIMESTAMPTZ  | NOT NULL, default now              | When the record was created              |
| created_by      | UUID         | FK → profile(id), nullable         | Who created the record                   |
| updated_at      | TIMESTAMPTZ  | NOT NULL, default now              | When the record was last updated         |
| updated_by      | UUID         | FK → profile(id), nullable         | Who last updated the record              |

Unique constraint on `(org_id, name)` — no duplicate customer names within an org.

## farm

Represents a crop or product line within an organization (e.g. Cuke Farm, Lettuce Farm). Each farm has its own sites, varieties, grades, and products. Farm-level defaults like weighing and growing units are stored in metadata.

| Column   | Type         | Constraints                     | Description                                  |
|---------|--------------|---------------------------------|----------------------------------------------|
| id      | UUID         | PK, auto-generated              | Unique identifier                            |
| org_id  | UUID         | NOT NULL, FK → organization(id) | The organization                             |
| name    | VARCHAR(100) | NOT NULL                        | Farm name, e.g. "Cuke Farm"                  |
| metadata| JSONB        | NOT NULL, default {}            | Farm-level settings (weighing_uom_id, growing_uom_id, etc.) |
| is_active  | BOOLEAN     | NOT NULL, default true          | Soft-disable without deleting                |
| created_at | TIMESTAMPTZ | NOT NULL, default now           | When the record was created                  |
| created_by | UUID        | FK → profile(id), nullable      | Who created the record                       |
| updated_at | TIMESTAMPTZ | NOT NULL, default now           | When the record was last updated             |
| updated_by | UUID        | FK → profile(id), nullable      | Who last updated the record                  |

Unique constraint on `(org_id, name)` — no duplicate farm names within an org.

## farm_site

Physical locations within a farm where operations happen. Each site has a type (nursery, growing, packing, storage) and type-specific data in metadata such as acres, total rows, and monitoring stations for growing sites.

| Column   | Type         | Constraints              | Description                    |
|---------|--------------|--------------------------|--------------------------------|
| id      | UUID         | PK, auto-generated                | Unique identifier              |
| org_id  | UUID         | NOT NULL, FK → organization(id)   | The organization               |
| farm_id | UUID         | NOT NULL, FK → farm(id)           | The farm this site belongs to  |
| name    | VARCHAR(100) | NOT NULL                          | Site name, e.g. "Greenhouse A" |
| type    | VARCHAR(20)  | NOT NULL, CHECK                   | One of: nursery, growing, packing, storage |
| metadata| JSONB        | NOT NULL, default {}              | Type-specific data (acres, rows, monitoring stations, etc.) |
| is_active  | BOOLEAN     | NOT NULL, default true            | Soft-disable without deleting  |
| created_at | TIMESTAMPTZ | NOT NULL, default now             | When the record was created    |
| created_by | UUID        | FK → profile(id), nullable        | Who created the record         |
| updated_at | TIMESTAMPTZ | NOT NULL, default now             | When the record was last updated |
| updated_by | UUID        | FK → profile(id), nullable        | Who last updated the record    |

Unique constraint on `(farm_id, name)` — no duplicate site names within a farm.

## farm_variety

Crop varieties grown on a specific farm, each with a short code for quick reference during data entry. Used across seeding, growing, and harvest modules.

| Column  | Type        | Constraints             | Description                   |
|---------|-------------|-------------------------|-------------------------------|
| id      | UUID        | PK, auto-generated              | Unique identifier             |
| org_id  | UUID        | NOT NULL, FK → organization(id) | The organization              |
| farm_id | UUID        | NOT NULL, FK → farm(id)         | The farm this variety belongs to |
| code    | VARCHAR(10) | NOT NULL                | Short code, e.g. "K"         |
| name       | VARCHAR(50)  | NOT NULL                | Full name, e.g. "Keiki"      |
| is_active  | BOOLEAN      | NOT NULL, default true  | Soft-disable without deleting|
| created_at | TIMESTAMPTZ  | NOT NULL, default now   | When the record was created  |
| created_by | UUID         | FK → profile(id), nullable | Who created the record    |
| updated_at | TIMESTAMPTZ  | NOT NULL, default now   | When the record was last updated |
| updated_by | UUID         | FK → profile(id), nullable | Who last updated the record |

Unique constraints on `(farm_id, code)` and `(farm_id, name)`.

## farm_grade

Harvest quality grades for a specific farm, each with a short code. Applied during harvest logging and carried through to product definition, packing, and sales.

| Column  | Type        | Constraints             | Description                   |
|---------|-------------|-------------------------|-------------------------------|
| id      | UUID        | PK, auto-generated              | Unique identifier             |
| org_id  | UUID        | NOT NULL, FK → organization(id) | The organization              |
| farm_id | UUID        | NOT NULL, FK → farm(id)         | The farm this grade belongs to |
| code    | VARCHAR(10) | NOT NULL                | Short code, e.g. "A"         |
| name       | VARCHAR(50)  | NOT NULL                | Full name, e.g. "Grade A"    |
| is_active  | BOOLEAN      | NOT NULL, default true  | Soft-disable without deleting|
| created_at | TIMESTAMPTZ  | NOT NULL, default now   | When the record was created  |
| created_by | UUID         | FK → profile(id), nullable | Who created the record    |
| updated_at | TIMESTAMPTZ  | NOT NULL, default now   | When the record was last updated |
| updated_by | UUID         | FK → profile(id), nullable | Who last updated the record |

Unique constraints on `(farm_id, code)` and `(farm_id, name)`.

## farm_product

The sellable products from each farm. Combines a grade with a full packaging hierarchy (content → pack → sale → shipping) that drives inventory calculations. Display-only fields like description, manufacturer, GTIN, UPC, dimensions, photos, and spec sheet data are stored in metadata.

| Column                      | Type         | Constraints                          | Description                              |
|----------------------------|--------------|--------------------------------------|------------------------------------------|
| id                         | UUID         | PK, auto-generated                   | Unique identifier                        |
| org_id                     | UUID         | NOT NULL, FK → organization(id)      | The organization                         |
| farm_id                    | UUID         | NOT NULL, FK → farm(id)              | The farm this product belongs to         |
| grade_id                   | UUID         | FK → farm_grade(id), nullable        | Product grade                            |
| code                       | VARCHAR(20)  | NOT NULL                             | Product code/abbreviation                |
| name                       | VARCHAR(100) | NOT NULL                             | Product name                             |
| weight_unit_id             | UUID         | FK → unit_of_measure(id), nullable   | Weight unit for content                  |
| product_item_unit_id       | UUID         | FK → unit_of_measure(id), nullable   | Item unit for content                    |
| pack_unit_id               | UUID         | FK → unit_of_measure(id), nullable   | Consumer pack unit                       |
| product_item_per_pack_unit | NUMERIC      | nullable                             | Items per pack                           |
| pack_unit_net_weight       | NUMERIC      | nullable                             | Net weight per pack                      |
| sale_unit_id               | UUID         | FK → unit_of_measure(id), nullable   | Primary selling unit                     |
| pack_per_sale_unit         | NUMERIC      | nullable                             | Packs per sale unit                      |
| sale_unit_net_weight       | NUMERIC      | nullable                             | Net weight per sale unit                 |
| minimum_order_quantity     | NUMERIC      | nullable                             | Minimum order quantity                   |
| is_catch_weight            | BOOLEAN      | NOT NULL, default false              | Whether product is sold by catch weight  |
| shipping_unit_id           | UUID         | FK → unit_of_measure(id), nullable   | Shipping unit                            |
| sale_per_shipping_unit_max | NUMERIC      | nullable                             | Max sale units per shipping unit         |
| shipping_unit_net_weight   | NUMERIC      | nullable                             | Net weight per shipping unit             |
| shipping_unit_ti           | NUMERIC      | nullable                             | Pallet TI (layers per tier)              |
| shipping_unit_hi           | NUMERIC      | nullable                             | Pallet HI (tiers high)                   |
| metadata                   | JSONB        | NOT NULL, default {}                 | Description, segment, manufacturer, gtin, upc, packaging_type, dimensions, photos, spec sheet, shipping requirements |
| display_order              | INT          | nullable                             | Sort order for display                   |
| is_active                  | BOOLEAN      | NOT NULL, default true               | Soft-disable without deleting            |
| created_at                 | TIMESTAMPTZ  | NOT NULL, default now                | When the record was created              |
| created_by                 | UUID         | FK → profile(id), nullable           | Who created the record                   |
| updated_at                 | TIMESTAMPTZ  | NOT NULL, default now                | When the record was last updated         |
| updated_by                 | UUID         | FK → profile(id), nullable           | Who last updated the record              |

Unique constraints on `(farm_id, code)` and `(farm_id, name)`.

## farm_product_price

Manages product pricing with three tiers of specificity and date ranges to track price changes over time. When a price changes, the current row gets an effective_to date and a new row is created. Currency always uses the org default from organization.metadata.

| Column           | Type    | Constraints                          | Description                              |
|-----------------|---------|--------------------------------------|------------------------------------------|
| id              | UUID    | PK, auto-generated                   | Unique identifier                        |
| org_id          | UUID    | NOT NULL, FK → organization(id)      | The organization                         |
| product_id      | UUID    | NOT NULL, FK → farm_product(id)      | The product being priced                 |
| delivery_method_id | UUID   | NOT NULL, FK → delivery_method(id)   | Delivery method this price applies to    |
| customer_id     | UUID    | FK → customer(id), nullable          | Customer-specific price (tier 1)         |
| customer_group_id| UUID   | FK → customer_group(id), nullable    | Group-specific price (tier 2)            |
| price           | NUMERIC | NOT NULL                             | The price amount                         |
| effective_from  | DATE    | NOT NULL                             | When this price starts                   |
| effective_to    | DATE    | nullable                             | When this price ends (null = current)    |
| is_active       | BOOLEAN     | NOT NULL, default true               | Soft-disable without deleting            |
| created_at      | TIMESTAMPTZ | NOT NULL, default now                | When the record was created              |
| created_by      | UUID        | FK → profile(id), nullable           | Who created the record                   |
| updated_at      | TIMESTAMPTZ | NOT NULL, default now                | When the record was last updated         |
| updated_by      | UUID        | FK → profile(id), nullable           | Who last updated the record              |

Pricing lookup priority: customer price (tier 1) → group price (tier 2) → default price (tier 3), filtered by `effective_from <= today AND (effective_to IS NULL OR effective_to > today)`.
