---
phase: quick
plan: 260407-dz4
subsystem: database
tags: [auth, rls, trigger, security, audit]
dependency_graph:
  requires: [hr_employee, org, auth.users]
  provides: [auth_link_log, email-confirmation-gate, composite-index]
  affects: [PR-6]
tech_stack:
  added: [auth_link_log audit table, idx_hr_module_access_employee_module index]
  patterns: [CTE-with-RETURNING for atomic link+audit, AFTER UPDATE OF trigger]
key_files:
  created: []
  modified:
    - supabase/migrations/20260401000141_auth_auto_link_employee.sql
    - supabase/migrations/20260401000142_app_views.sql
decisions:
  - Used TEXT type for auth_link_log.employee_id to match hr_employee.id type
  - No SELECT grant on auth_link_log — internal audit table only
metrics:
  duration: 87s
  completed: "2026-04-07T15:07:52Z"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 260407-dz4: Fix PR #6 Blockers — Auth Trigger and RLS Gaps

Hardened auth auto-link trigger with email_confirmed_at gate, audit logging via auth_link_log table, and dual triggers for OAuth/email flows; documented RLS mutation strategy inline and added composite index for app_navigation performance.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Harden auth auto-link trigger with email confirmation gate and audit log | 3053cc2 | supabase/migrations/20260401000141_auth_auto_link_employee.sql |
| 2 | Add RLS mutation documentation, composite index, and app_navigation comment | b3598cd | supabase/migrations/20260401000142_app_views.sql |

## Key Changes

### Task 1: Auth Trigger Hardening
- Added `email_confirmed_at IS NULL` guard clause as first check in trigger function
- Created `auth_link_log` audit table (UUID PK, auth_user_id UUID, employee_id TEXT, linked_at TIMESTAMPTZ)
- Refactored UPDATE to CTE with RETURNING for atomic link + audit insert
- Added second trigger `on_auth_user_confirmed` for email/password confirmation flow (AFTER UPDATE OF email_confirmed_at)
- Added DROP TRIGGER IF EXISTS for idempotency
- Added commented-out backfill query with email_confirmed_at filter
- Explicit GRANT INSERT on auth_link_log to service_role

### Task 2: RLS Documentation and Index
- Expanded mutation strategy comment block explaining service_role + hr_module_access enforcement
- Created composite index `idx_hr_module_access_employee_module` on hr_module_access(hr_employee_id, org_module_id)
- Added cross-tenant safety documentation above app_navigation view
- Confirmed SELECT-only GRANTs on hr_employee and org are correct

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None - all changes align with the plan's threat model. No new network endpoints or auth paths introduced.

## Self-Check: PASSED
