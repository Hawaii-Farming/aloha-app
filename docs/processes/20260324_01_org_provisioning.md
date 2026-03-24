# Organization Provisioning

This document lists everything that must be seeded or created when a new organization is onboarded. Each section describes what is provisioned, the source data, and the target table.

---

## 1. Provisioning Order

Steps must be executed in this order due to FK dependencies:

1. Create `org` record
2. Copy system modules → `org_module`
3. Copy system sub-modules → `org_sub_module`
4. Create admin `hr_employee` record (manual)
5. Copy org modules → `hr_module_access` for admin
6. Seed default `ops_task` records

---

## 2. Organization Record

| Target | Source | Notes |
|--------|--------|-------|
| `org` | Manual input | Name, address, currency |

---

## 3. Module & Sub-Module Configuration

| Target | Source | Notes |
|--------|--------|-------|
| `org_module` | `sys_module` | One row per system module; all `is_enabled = true`; `display_name` and `display_order` inherited from system |
| `org_sub_module` | `sys_sub_module` | One row per system sub-module; all `is_enabled = true`; `sys_access_level_id`, `display_name`, and `display_order` inherited from system |

---

## 4. Admin Employee

| Target | Source | Notes |
|--------|--------|-------|
| `hr_employee` | Manual input | Created manually with `sys_access_level_id = admin` and a linked `user_id` |

---

## 5. Admin Module Access

| Target | Source | Notes |
|--------|--------|-------|
| `hr_module_access` | `org_module` | One row per enabled org module; all permissions set to `true` (`can_view`, `can_edit`, `can_delete`, `can_verify`) |

---

## 6. Default Operations Tasks

| Target | Source | Notes |
|--------|--------|-------|
| `ops_task` | Hardcoded seed data | Required for grow module activity flows |

Default tasks:

| id | name | Description |
|---|---|---|
| seeding | Seeding | Required by grow_seeding_workflow |
| harvesting | Harvesting | Required by grow_harvesting_workflow |
| scouting | Scouting | Required by grow_scouting_workflow |
| spraying | Spraying | Required by grow_spraying_workflow |
| fertigation | Fertigation | Required by grow_fertigation_workflow |

---

## 7. New Employee Provisioning

When a new employee is added with a `user_id` (app access):

| Target | Source | Notes |
|--------|--------|-------|
| `hr_module_access` | `org_module` | One row per enabled org module; permissions use defaults: `can_view = true`, `can_edit = true`, `can_delete = false`, `can_verify = false` |

---

## 8. Future Provisions

As the system grows, additional seed data may be required:

- **Grow lookups** — default pest types, disease types, trial types per farm
- **Ops templates** — default checklist templates (e.g. pre-spray safety check)
- **Food safety** — default lab test definitions per org
- **UOM** — standard units of measure (system-level, seeded once globally)
