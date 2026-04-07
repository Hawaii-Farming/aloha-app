# Codebase Concerns

**Analysis Date:** 2026-04-07

## Performance Bottlenecks

**Soft-delete filtering without comprehensive indexing:**
- Problem: Over 110 occurrences of `is_deleted` columns across the schema, but only 5 tables have explicit `is_deleted` indexes. Query filters on `is_deleted = false` in `loadTableData()` and `loadDetailData()` will full-table scan on unindexed tables, especially as org data grows.
- Files: `app/lib/crud/crud-helpers.server.ts` (lines 132, 140), `supabase/migrations/` (all table definitions from `20260401000001_*` onward)
- Cause: Tables created without `CREATE INDEX idx_<table>_active ON <table>(org_id, is_deleted)` pattern. Some tables have it (e.g., `hr_department`, `hr_work_authorization`), but majority don't.
- Improvement path: 
  1. Audit all migrations and count tables with `is_deleted` but no index
  2. Create a single migration adding missing composite indexes: `(org_id, is_deleted)` for all org-scoped tables that filter by these columns
  3. Add index creation to table template in `supabase/CLAUDE.md`

**Self-join resolution via additional queries:**
- Problem: `resolveSelfJoins()` in `app/lib/crud/crud-helpers.server.ts` (lines 28-78) makes a second database query for every table with self-referential foreign keys. With large datasets (>1000 rows), this compounds overhead.
- Files: `app/lib/crud/crud-helpers.server.ts` (lines 177-183, 225-232)
- Cause: PostgREST doesn't disambiguate multiple FKs to the same table without explicit constraint names. The app works around this by flattening the first query, then looking up display values in a second query.
- Improvement path:
  1. Document this as a known pattern (not a bug, but a cost)
  2. Consider caching self-join lookup results if a table is queried multiple times per request
  3. Monitor page load times for tables with 2+ self-joins (e.g., `hr_employee` with manager/compensation_manager)

**Date formatting in loop (table list and detail views):**
- Problem: `formatDate()` runs inline in cell render (called per row, per date column) instead of once at data preparation time. For large tables (>100 rows), this recalculates the same transformation repeatedly.
- Files: `app/components/crud/table-list-view.tsx` (lines 115-129), `app/components/crud/card-detail-view.tsx` (lines 37-40)
- Cause: Date formatting logic in component render path, not in loader
- Improvement path: Move date formatting to `loadTableData()` return or use `useMemo()` for date columns in table building

## Fragile Areas

**CRUD module registry and dynamic config lookups:**
- Files: `app/lib/crud/registry.ts`, `app/lib/crud/types.ts`, configs like `app/lib/crud/hr-employee.config.ts`
- Why fragile: 
  - `getModuleConfig(subModuleSlug)` returns `undefined` if slug not registered; routes have fallback schema but silently degrade
  - Adding a new sub-module requires editing registry AND writing a new config file — no scaffolding or automation
  - Configuration is scattered across multiple files; no single source of truth
  - Column visibility (`priority: 'low'`), form field layout, workflow transitions are hardcoded per module
- Safe modification:
  1. Always check `if (!config)` and use fallbacks
  2. Test with invalid module slug before deploying
  3. After adding new module config, manually verify all routes render without console errors
- Test coverage: `app/lib/crud/__tests__/crud-helpers.test.ts` covers helpers but not registry access patterns

**FK resolution via column name inference:**
- Files: `app/components/crud/card-detail-view.tsx` (lines 46-84)
- Why fragile: Uses fuzzy matching to find resolved FK names (`field_key`, `${baseKey}_${label}`, or searching through all record keys). Works for common patterns but breaks if naming conventions change.
- Safe modification: Add `fkResolvedKeyName` property to `FormFieldConfig` to make FK label resolution explicit instead of inferred
- Test coverage: No E2E tests for complex FK scenarios

**Workspace loader and org-switching fallback:**
- Files: `app/lib/workspace/org-workspace-loader.server.ts` (lines 56-59)
- Why fragile: If user is removed from their current org (soft-deleted), loader silently redirects to first org in `allOrgs` without logging or user notification. User may be confused about workspace change.
- Safe modification: Add explicit notification or keep redirect but log the event
- Test coverage: No test for multi-org user losing access mid-session

## Scaling Limits

**Table data pagination with high cardinality lookups:**
- Current capacity: Page size defaults to 25 rows; reasonable for 10k+ row tables
- Limit: If a table grows to 100k+ rows AND has FK options (dropdowns) for lookup tables, `loadFormOptions()` queries ALL valid values per-request. This is not paginated and will grow memory usage linearly with lookup table size.
- Scaling path: Implement combobox search (already supported in form config) for all high-cardinality FK fields instead of pre-loading all options

**Soft-deleted rows remain in database indefinitely:**
- Current capacity: Soft deletes work indefinitely, no cleanup strategy
- Limit: Over time, `is_deleted = true` rows accumulate. Without archival or purging, tables grow unbounded. Full-table scans become slower even with indexes.
- Scaling path: Implement time-based archival (e.g., move records older than 1 year to archive table or hard-delete after 2 years) with a scheduled job

**Multi-org workspace view re-computation on every layout load:**
- Current capacity: `loadOrgWorkspace()` queries `app_navigation` view on every route change within a workspace
- Limit: View is not indexed; cross-joins 7+ tables (org, hr_employee, sys_access_level, sys_module, org_module, hr_module_access, etc.). With 20+ org users each with 5+ modules, view becomes slow.
- Scaling path: Cache view results in layout-scoped state (React Router loader cache) or add materialized view with refresh strategy

## Dependencies at Risk

**@edge-csrf/core 2.5.3-cloudflare-rc1:**
- Risk: Pre-release RC version pinned in package.json. Cloudflare-specific, no guarantee of stability or long-term support.
- Impact: CSRF token generation could break if Cloudflare discontinues this package or releases breaking changes
- Migration plan: Monitor for stable release; upgrade if available. If RC remains only option, document rationale. Consider forking or reimplementing token generation with standard crypto module if RC is abandoned.

**next-themes 0.4.6 (legacy):**
- Risk: Package is unmaintained; last update ~2 years ago. Theme toggle and localStorage sync may not work with future React versions.
- Impact: Dark mode toggle may break; theme preference persistence could fail.
- Migration plan: Audit `next-themes` integration in `app/entry.tsx` and root layout. If breaking changes hit React 19.x, reimplement theme toggle with native `localStorage` and CSS custom properties.

**Vercel AI SDK (ai 6.0.141, @ai-sdk/anthropic 3.0.64):**
- Risk: Rapidly evolving; major version changes are frequent. API surface changes year-over-year.
- Impact: AI form assist and workflow automation could break if SDK changes streaming API or error handling.
- Migration plan: Pin to major version only. Maintain `app/lib/ai/` as abstraction layer so migrations are contained. Test all AI routes on every package update.

## Security Considerations

**Multi-tenant org isolation via RLS + application-layer access checks:**
- Risk: RLS policies on `hr_employee` and org depend on `auth.uid()` session cookie. If session is hijacked, attacker can read/write any org the victim belongs to.
- Files: `supabase/migrations/20260401000142_app_views.sql` (lines 39-73, app_navigation view), `app/lib/workspace/org-workspace-loader.server.ts` (lines 44-54)
- Current mitigation: 
  1. RLS policies use `auth.uid()` from JWT; Supabase session is httpOnly cookie
  2. Application checks `hr_module_access` for can_edit/can_delete before mutations
  3. Service role key used server-side only, not exposed to client
- Recommendations:
  1. Add session timeout config (Supabase default is 1 hour; consider shorter for sensitive operations)
  2. Audit `org_workspace_loader.server.ts` to ensure employee record is verified before accessing org data
  3. Log all mutations with employee_id + org_id for audit trail (partially done via `created_by`, `updated_by` but no audit table)

**CSRF protection on POST /api routes:**
- Risk: CSRF token is generated in root loader and stored in HTML meta tag. If token extraction fails, API endpoint might not validate properly.
- Files: `app/lib/csrf/server/create-csrf-protect.server.ts`, form handling in routes
- Current mitigation: Token is generated per-request and validated before mutations
- Recommendations:
  1. Audit all `/api/*` routes to ensure they call `verifyCsrfToken()` before processing
  2. Test CSRF validation by submitting forms with invalid/expired tokens
  3. Add rate limiting to `/api/*` endpoints to prevent token brute-forcing

**Redirect validation in auth callback:**
- Risk: `isSafeRedirectPath()` in `auth-callback.service.server.ts` (lines 11-16) blocks `//` and `://` but allows single `/` followed by any path. An open redirect is prevented, but logic should be defensive.
- Files: `app/lib/supabase/auth-callback.service.server.ts` (lines 11-96)
- Current mitigation: Checks `!path.startsWith('//')`, blocks `://`, blocks `\`
- Recommendations:
  1. Add whitelist of allowed redirect paths (e.g., `/home/*`, `/auth/callback/next`)
  2. Reject paths containing `?`, `#` (except for the final query string after callback resolution)
  3. Test with malicious inputs: `/home/../../../etc/passwd`, `/home/\x00`, `/home//double-slash`

## Tech Debt

**Database type generation requires manual regeneration:**
- Issue: `supabase:typegen` must be run manually after schema changes. If types drift from schema, type safety is lost.
- Files: `app/lib/database.types.ts` (9130 lines, generated), `package.json` scripts
- Impact: 
  1. Large PR diffs when types change (hard to review actual schema changes)
  2. Easy to forget; branches with schema changes but no type updates cause runtime errors
- Fix approach:
  1. Add pre-commit hook to regenerate types if any `supabase/migrations/*.sql` files change
  2. Document in CONTRIBUTING.md that types must be committed alongside migrations
  3. Consider `supabase link --project-ref` + automatic type generation in CI

**Duplication in route loaders (sub-module detail, create, list):**
- Issue: Three routes have nearly identical patterns:
  1. `getSupabaseServerClient(request)`
  2. `requireModuleAccess()` + `requireSubModuleAccess()`
  3. `getModuleConfig(subModuleSlug)`
  4. Load form options via `loadFormOptions()`
- Files: `app/routes/workspace/sub-module-detail.tsx` (lines 23-77), `app/routes/workspace/sub-module-create.tsx` (lines 58-126), `app/routes/workspace/sub-module.tsx`
- Impact: Changes to access control or config loading must be made in 3 places; easy to miss one
- Fix approach: Extract shared loader logic into `app/lib/crud/load-submodule-context.server.ts` exporting single function

**Fallback form schema hardcoded in routes:**
- Issue: Routes define fallback schema if module config is not found:
  ```typescript
  const fallbackSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  });
  ```
- Files: `app/routes/workspace/sub-module-create.tsx` (lines 39-43), likely duplicated in detail/edit routes
- Impact: If config is missing, form will use generic schema; validation differs from intended module schema
- Fix approach: Store fallback schema in registry or config loader, not in routes

**No transaction support for multi-step operations:**
- Issue: Workflow transitions (`crudBulkTransitionAction`, `crudTransitionAction`) and complex creates may involve multiple mutations without transaction wrapping. If one fails mid-transaction, state is inconsistent.
- Files: `app/lib/crud/crud-action.server.ts` (lines 129-202), workflow helpers
- Impact: If a transition step fails after updating status but before setting related fields, record is left in invalid state
- Fix approach:
  1. Use Supabase RPC functions for multi-step operations
  2. Wrap related mutations in explicit transaction (requires custom Supabase client method or SDK RPC)
  3. Document current behavior and document manual recovery steps if edge cases occur

**Missing error details in user-facing API responses:**
- Issue: Routes catch Supabase errors and return generic status codes:
  ```typescript
  if (error) {
    return { success: false as const, error: error.message };
  }
  ```
- Files: `app/lib/crud/crud-action.server.ts` (lines 43-44, 77-78, 100-101, 159-160), `app/components/crud/create-panel.tsx`, `app/components/crud/edit-panel.tsx`
- Impact: Users see cryptic database error messages (e.g., "duplicate key value violates unique constraint") instead of friendly guidance. Errors are not localized.
- Fix approach:
  1. Create error classifier: `classifySupabaseError(error: SupabaseError): UserFacingError`
  2. Map constraint errors to user messages: `{fk: "Department not found", unique: "Name already in use", check: "Value outside allowed range"}`
  3. Return localized error key to client, render i18n message

## Missing Critical Features

**No audit logging for data mutations:**
- Problem: `created_by`, `updated_by` columns track who, but no separate audit table tracks when/what changed. Compliance and debugging is difficult.
- Blocks: Regulatory requirements for data lineage; incident investigation
- Suggested implementation:
  1. Create `audit_log` table: `(id UUID, org_id, table_name, record_id, action, old_values JSONB, new_values JSONB, user_id, created_at)`
  2. Use PostgreSQL trigger to auto-log inserts/updates/deletes
  3. Expose audit log in admin UI (read-only)

**No bulk import / CSV upload:**
- Problem: Adding 100+ employees, inventory items, or seed batches requires clicking forms 100 times. No bulk data ingestion.
- Blocks: On-boarding of large orgs; data migration from legacy systems
- Suggested implementation:
  1. Add `/api/bulk-import` endpoint accepting CSV
  2. Parse rows, validate against module schema, batch insert
  3. Return import report with success/failure counts and errors

**No webhooks or event streaming:**
- Problem: External systems (e.g., field sensors, ERP integrations) can't receive real-time updates when records change.
- Blocks: Real-time integrations; sync with external systems
- Suggested implementation:
  1. Use Supabase realtime subscriptions or webhooks
  2. Emit events from mutation routes: `emitEvent('grow_seed_batch.created', { id, org_id, ...})`
  3. Document event schema for integrators

## Test Coverage Gaps

**Routes with complex loader logic lack E2E coverage:**
- What's not tested: Multi-org user switching in workspace layout, permission boundaries (user from Org A cannot read Org B data)
- Files: `app/routes/workspace/layout.tsx`, `app/lib/workspace/org-workspace-loader.server.ts`, `app/lib/workspace/require-module-access.server.ts`
- Risk: Org isolation could silently fail if RLS policy is accidentally removed or if loader caching is added incorrectly
- Priority: High — security-critical

**FK resolution and embedded selects lack unit test coverage:**
- What's not tested: `flattenRow()`, `resolveSelfJoins()`, FK display name inference (card-detail-view buildFkKeyMap)
- Files: `app/lib/crud/crud-helpers.server.ts`, `app/components/crud/card-detail-view.tsx`
- Risk: Refactoring FK handling could silently break display on detail views
- Priority: Medium — impacts user experience on complex modules

**AI form assist error handling:**
- What's not tested: API endpoint returning non-JSON, timeout, partial field population
- Files: `app/components/ai/ai-form-assist.tsx` (lines 80-133), `/api/ai/form-assist` route
- Risk: Error states not covered; user may be confused by timeout behavior
- Priority: Medium

**CRUD workflow transitions:**
- What's not tested: Workflow state machine enforced correctly (can only transition from state A to state B, not arbitrary states)
- Files: `app/lib/crud/crud-action.server.ts` (lines 129-202), workflow configs per module
- Risk: Invalid transitions could be applied; no enforcement
- Priority: High if workflows are business-critical

---

*Concerns audit: 2026-04-07*
