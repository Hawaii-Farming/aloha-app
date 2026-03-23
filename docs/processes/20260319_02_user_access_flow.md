# User Access & Module Visibility Flow

This document describes how users log in, select an organization, and see only the modules and sub-modules they are authorized to access.

---

## 1. System-Level Setup (One-Time)

Before any organization is onboarded, the system is seeded with:

- **Access Levels** — Four tiers that determine what a user can see. Higher level = more access.

| ID | Name | Level |
|----|------|-------|
| employee | Employee | 1 |
| team_lead | Team Lead | 2 |
| manager | Manager | 3 |
| owner | Owner | 5 |

- **Modules** — The main sections of the application (e.g. Inventory, Human Resources, Operations, Pack, Sales, Maintenance, Food Safety).

- **Sub-Modules** — Pages or features within each module (e.g. Inventory → Vendors, Items, Purchase Orders). Each sub-module has a minimum access level that determines who can see it.

These system-level records are the master templates. They do not belong to any organization.

---

## 2. New Organization Onboarding

When a new organization is created:

1. An `org` record is created with the organization name and default currency.
2. All system modules are copied into `org_module` for that organization — all enabled by default.
3. All system sub-modules are copied into `org_sub_module` for that organization — all enabled by default, inheriting the access level from the system template.

The organization admin can then:

- **Toggle modules on/off** — disabling a module hides it from every user in that organization.
- **Toggle sub-modules on/off** — disabling a sub-module hides it from every user, regardless of their access level.
- **Customize display names and ordering** — each organization can rename modules and sub-modules and control the order they appear in the menu.
- **Adjust access levels per sub-module** — if the organization wants a sub-module to require a higher (or lower) access level than the system default, they can change it.

---

## 3. Employee Setup

When a new employee is added to an organization:

1. An `hr_employee` record is created with a `system_access_level_id` (e.g. employee, team_lead, manager, or owner).
2. One `hr_module_access` record is created for each module the employee should have access to, with `is_enabled = true`.
3. If the employee needs app login access, their `user_id` is linked to a Supabase Auth account.

An employee can belong to **multiple organizations**. Each organization has its own `hr_employee` record for that person, with its own access level and module assignments. The same Supabase Auth account (`auth.users`) is shared across organizations.

---

## 4. Login Flow

### Step 1 — Authentication

The user logs in via Supabase Auth (email/password, SSO, or magic link). This identifies the user by their `auth.users` account.

### Step 2 — Organization Selection

The system looks up all `hr_employee` records linked to the user's `auth.users.id`. If the user belongs to multiple organizations, they are presented with an **organization selector** to choose which organization they want to work in. If they belong to only one organization, this step is skipped.

The selected `org_id` is stored in the user's session for the duration of their login. All subsequent data queries are filtered by this organization.

### Step 3 — Menu Rendering

The application builds the user's menu by applying three filters in order:

1. **Organization filter** — Only modules where `org_module.is_enabled = true` for this organization.
2. **Employee module filter** — Of those, only modules where `hr_module_access.is_enabled = true` for this employee.
3. **Access level filter** — Within each visible module, only sub-modules where:
   - `org_sub_module.is_enabled = true` for this organization, **AND**
   - The employee's access level number is **greater than or equal to** the sub-module's required access level number.

### Example

| Setting | Value |
|---------|-------|
| Organization | Hawaii Farming |
| Employee | John (Manager, level 3) |
| Module: Inventory | org enabled, John has access |
| Sub-module: Vendors (level 1) | Visible — John's level 3 ≥ 1 |
| Sub-module: Items (level 1) | Visible — John's level 3 ≥ 1 |
| Sub-module: Purchase Orders (level 3) | Visible — John's level 3 ≥ 3 |
| Sub-module: Reorder Settings (level 5) | Hidden — John's level 3 < 5 (owner only) |
| Module: HR | org enabled, but John has no hr_module_access | Hidden entirely |

### Step 4 — Organization Switching

At any point during their session, the user can switch to a different organization (if they belong to more than one). This reloads their menu based on the new organization's module configuration and their access level within that organization.

---

## 5. Summary of Access Control Layers

| Layer | Who controls it | What it does |
|-------|----------------|--------------|
| System modules & sub-modules | System admin (developer) | Defines what exists in the application |
| Org module/sub-module toggles | Organization admin | Controls what is available to the entire organization |
| Employee module access | Organization admin | Controls which modules each employee can see |
| Access level on sub-modules | Organization admin (inherited from system) | Controls which sub-modules are visible based on the employee's role |
| Employee access level | Organization admin | Assigned per employee; determines sub-module visibility |

---

## 6. Tables Involved

| Table | Purpose |
|-------|---------|
| `system_access_level` | Defines the 4 access tiers (employee, team_lead, manager, owner) |
| `system_module` | Master list of application modules |
| `system_sub_module` | Master list of sub-modules with minimum access level |
| `org` | Organization record |
| `org_module` | Org-scoped module toggles with custom display name and order |
| `org_sub_module` | Org-scoped sub-module toggles with custom display name, order, and access level |
| `hr_employee` | Employee record with `system_access_level_id` and `user_id` for auth |
| `hr_module_access` | Maps employee to modules they can access |
| `auth.users` | Supabase Auth — handles login credentials and session |
