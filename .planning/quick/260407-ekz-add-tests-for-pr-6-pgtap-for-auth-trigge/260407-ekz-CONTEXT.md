# Quick Task 260407-ekz: Add tests for PR #6 - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Task Boundary

Add tests for PR #6 changes: pgTAP tests for the auth auto-link trigger and RLS policies, TypeScript unit tests for CRUD filter/search handling, and Playwright E2E tests for CRUD create/edit/delete flows.

</domain>

<decisions>
## Implementation Decisions

### Test scope
- All three test types: pgTAP, CRUD unit tests, and E2E Playwright tests

### pgTAP test strategy
- Direct auth.users inserts — test the actual trigger firing, not the function in isolation
- Follows existing pattern in supabase/tests/

### Claude's Discretion
- Test file naming and organization within existing conventions
- Specific E2E flow selection (which module to test CRUD against)

</decisions>

<specifics>
## Specific Ideas

- pgTAP: test email_confirmed_at gate (NULL skips link, NOT NULL links), audit log insertion, cross-org multi-link, backfill safety
- pgTAP: test RLS policies — hr_employee read within org, cross-org denial, app_navigation tenant isolation
- Unit: test sanitizeSearch strips PostgREST delimiters, column whitelist rejects unknown columns, sort validation falls back to default
- E2E: CRUD list view with search, filter, create, edit, delete flows

</specifics>

<canonical_refs>
## Canonical References

- Existing pgTAP tests: supabase/tests/00000-00050 series
- Auth trigger: supabase/migrations/20260401000141_auth_auto_link_employee.sql
- RLS policies: supabase/migrations/20260401000142_app_views.sql
- CRUD helpers: app/lib/crud/crud-helpers.server.ts
- E2E config: e2e/playwright.config.ts
- E2E tests: e2e/tests/

</canonical_refs>
