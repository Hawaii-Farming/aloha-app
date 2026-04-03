# Codebase Concerns

**Analysis Date:** 2026-04-02

## Tech Debt

**Type Generation Gap for SQL Views:**
- Issue: Navigation views (`app_nav_modules`, `app_nav_sub_modules`) exist in SQL but are not included in generated TypeScript types from `supabase typegen`. This forces developers to use `as unknown as` type assertions to query these views.
- Files: `app/lib/workspace/org-workspace-loader.server.ts` (line 54-55), `app/routes/workspace/sub-module-create.tsx` (line 96), `app/routes/workspace/module.tsx` (line 25), `app/lib/workspace/require-module-access.server.ts` (line 27, 57)
- Impact: 10 unsafe type casts scattered across codebase; reduces type safety; makes future refactoring risky
- Fix approach: Run `supabase typegen` with `--linked` flag to include views in schema snapshot, or maintain manual type definitions for views in a `view-types.ts` file and document the pattern

**CRUD Registry Incompleteness:**
- Issue: Only 2 modules (`departments`, `products`) have CRUD configs in `app/lib/crud/registry.ts`. As new modules are added to the ERP, they each require a manual config entry. Without a config, routes fall back to generic `fallbackSchema` (id + name + description only).
- Files: `app/lib/crud/registry.ts` (13 tables but only 2 registered), `app/routes/workspace/sub-module-create.tsx` (lines 38-55 fallback)
- Impact: New modules ship with incomplete form handling; complex fields won't render correctly; developers must manually register every new module
- Fix approach: Build a config generator that reads Supabase schema and auto-generates CRUD configs; or implement schema-driven form rendering that discovers columns at runtime

**Untyped Client Workarounds:**
- Issue: Multiple locations cast Supabase client to `unknown as SupabaseClient` to bypass type checking on view queries, creating fragile code paths.
- Files: `app/lib/workspace/org-workspace-loader.server.ts` (55), `app/routes/workspace/sub-module-create.tsx` (96), `app/routes/workspace/module.tsx` (25)
- Impact: Silent failures if view schema changes; no IDE autocomplete; increases regression risk
- Fix approach: Generate proper TypeScript types for views or create strongly-typed view clients with explicit column selections

**Generated Database Types File Size:**
- Issue: `app/lib/database.types.ts` is 9,762 lines, making it difficult to navigate and import selectively. Every Supabase schema change triggers a full regeneration.
- Files: `app/lib/database.types.ts`
- Impact: Slow IDE performance; large bundle bloat; git diffs are hard to review; type regeneration is slower than it should be
- Fix approach: Split generated types into per-table modules, e.g., `@aloha/supabase/types/org.ts`, `@aloha/supabase/types/hr-employee.ts`; use Supabase CLI's `--type-def-file-path` to distribute types

## Fragile Areas

**RLS Policy Rollout Status:**
- Issue: 104 database migration files exist; 9 are RLS-specific (created Apr 1, 2026). This suggests RLS enforcement is very recent. If any RLS policy is too permissive or has edge cases, data leakage could occur before discovery.
- Files: `supabase/migrations/20260401000099_rls_org_hr_tables.sql` through `20260401000103_rls_*.sql`; `supabase/tests/` (7 pgTAP test files)
- Risk: 81+ tables with 204+ RLS policies deployed in final wave; test suite has 78 tests but coverage may not span all table combinations
- Safe modification: Always run full pgTAP suite (`pnpm supabase:test`) before applying new RLS policies; add integration tests for cross-org denial; schedule quarterly RLS audit
- Test coverage: 78 pgTAP tests exist covering helper functions and positive/negative access cases, but no test for accidental data leakage via FK joins

**Dynamic Form Field Rendering:**
- Issue: `app/routes/workspace/sub-module-create.tsx` builds forms dynamically from `config.formFields` (lines 192-199). If a field config is missing or malformed, the form silently skips it or uses fallback values.
- Files: `app/routes/workspace/sub-module-create.tsx` (lines 77-123 loader), `app/lib/crud/render-form-field.tsx` (infers behavior from field type)
- Risk: Data loss if new fields are added to database but not registered in form config; users can bypass required fields using fallback schema
- Safe modification: Validate form config against Supabase table schema at build time; throw hard error if required columns are missing from config; use schema-driven rendering instead

**Server Action Error Handling Inconsistency:**
- Issue: Error objects from Supabase are sometimes cast to `unknown as { code: string }` (e.g., `app/components/auth/update-password-form.tsx` line 46). Error handling relies on manually checking `.code` property that may not exist.
- Files: `app/components/auth/update-password-form.tsx` (46), `app/lib/supabase/auth-callback.service.server.ts` (error handling)
- Impact: If error object structure changes, UI will display generic "Validation failed" instead of specific error message
- Fix approach: Create error parsing utility that validates error object structure before accessing properties; use discriminated unions for error types

**Navigation Module Access Queries:**
- Issue: `requireModuleAccess()` and `requireSubModuleAccess()` query untyped views and return 403 if view returns no data. But queries don't filter by `is_enabled` or check RLS — they rely on the view itself to apply auth context.
- Files: `app/lib/workspace/require-module-access.server.ts` (lines 13-64)
- Risk: If `app_nav_modules` view has an RLS bug or returns stale data, unauthorized users could see modules
- Safe modification: Add explicit `WHERE is_enabled = true` to queries; verify view RLS policies in `supabase/schemas/06-nav-view-contracts.sql`; add integration test that spawns requests as different users

## Logging Inconsistency

**Console Output in Production:**
- Issue: `console.log`, `console.error`, and `console.warn` are used throughout app for error reporting and initialization, but production doesn't route these to structured logs.
- Files: `app/entry.server.tsx` (84, 133, 144), `app/lib/i18n/i18n-client.ts` (32-34), `app/lib/i18n/i18n-server.ts` (similar), `app/lib/supabase/auth-callback.service.server.ts`
- Impact: Production errors are lost if server stdout is not captured; no error aggregation or alerting; debugging production issues is blind
- Fix approach: Replace `console.*` calls with structured logger from `@aloha/shared/logger` in all `.server.ts` files; use Pino in production mode with remote sink (e.g., Datadog, Honeycomb)

**i18n Initialization Debug Logging:**
- Issue: `app/lib/i18n/i18n-client.ts` (lines 32-34) logs failed locale loads to `console.log`, making it easy to miss missing locale files in CI/CD.
- Files: `app/lib/i18n/i18n-client.ts` (32-34), `app/lib/i18n/i18n-server.ts` (equivalent)
- Impact: Silently falls back to empty object `{}` if locale file is missing; users see untranslated UI; no alerting in production
- Fix approach: Throw error on missing critical namespaces (e.g., `common`, `navigation`); log to structured logger instead of console

## Missing Test Coverage

**End-to-End Tests:**
- Issue: `e2e/tests/` directory contains only a page object (`auth.po.ts`) with no actual test files (`.spec.ts`). No E2E tests for core workflows (login, create/edit module data, navigation).
- Files: `e2e/tests/authentication/auth.po.ts` exists but no `.spec.ts` tests
- Risk: UI bugs and integration failures are not caught until production; browser-specific issues (SSR mismatch, hydration errors) are unknown
- Priority: High — Add smoke tests for auth flow, data list/detail pages, and form submission

**Unit Tests for CRUD Layer:**
- Issue: No unit tests for `crudCreateAction()`, `crudUpdateAction()`, `crudDeleteAction()`, or `loadTableData()`.
- Files: `app/lib/crud/crud-action.server.ts`, `app/lib/crud/crud-helpers.server.ts` have no `.test.ts` files
- Risk: Schema validation logic, soft-delete behavior, and FK option fetching are untested; regressions are invisible
- Priority: High — Add tests for validation failures, org scoping, and soft-delete flag

**CRUD Registry Config Validation:**
- Issue: Registry lookup (`getModuleConfig()`) returns `undefined` for unconfigured modules, but callers don't validate the return value before using it.
- Files: `app/routes/workspace/sub-module-create.tsx` (77, 191), `app/routes/workspace/sub-module-detail.tsx` (similar)
- Risk: If a module slug is typo'd or missing from registry, code silently falls back to generic schema without warning
- Priority: Medium — Add invariant checks; throw error if module config is required but not found

## Performance Concerns

**Navigation Data Loading:**
- Issue: `loadOrgWorkspace()` makes three parallel queries to `app_org_context`, `app_nav_modules`, `app_nav_sub_modules` on every workspace-scoped route load (lines 73-76 of `org-workspace-loader.server.ts`). No caching.
- Files: `app/lib/workspace/org-workspace-loader.server.ts` (25-90)
- Impact: N+1 queries; repeated loads of same org/user combo hit database each time; layout re-renders cause loader re-runs
- Fix approach: Cache workspace loader result in React Router's loader context or use TanStack Query with stale-while-revalidate

**Form Field Options Fetching:**
- Issue: `sub-module-create.tsx` loader fetches FK options sequentially for each FK field, then waits for all via `Promise.all()` (lines 98-114). If there are many FK fields, this blocks page render.
- Files: `app/routes/workspace/sub-module-create.tsx` (93-114)
- Impact: Forms with 5+ FK fields have slow initial load; no pagination on FK options (limit 200); large option lists will cause dropdown lag
- Fix approach: Lazy-load FK options on select focus; implement virtual scrolling in dropdowns; add query caching

**Database Type Generation:**
- Issue: `pnpm supabase:typegen` runs sequentially and generates 9,762-line single file. No caching of Supabase CLI output; runs on every local schema change.
- Impact: Slow local dev loop; `react-router typegen && tsc` waits for all types to be available
- Fix approach: Cache Supabase schema snapshot; split type generation into separate modules; use `--linked` mode to avoid full regeneration

## Security Considerations

**RLS Edge Cases Not Documented:**
- Issue: RLS policies use `user_has_org_access(org_id)` helper (added Apr 1, 2026), but the helper function's behavior with org switching, employee deletion, and access level changes is not explicitly tested.
- Files: `supabase/migrations/20260401000099_rls_org_hr_tables.sql` (policy definitions), `supabase/tests/00040-rls-edge-cases.sql` (only 210 lines for all edge cases)
- Risk: If employee is soft-deleted (`is_deleted = true`), can they still read data? If user is removed from `hr_employee`, does RLS trigger immediately? These scenarios need explicit test cases.
- Recommendation: Add test for each RLS edge case: employee removal, access level downgrade, org ID change, concurrent deletion; document in SECURITY.md

**Soft Delete Enforcement:**
- Issue: `is_deleted` flag is relied upon for data privacy, but there's no policy that prevents admins from restoring deleted records if needed. Also, views may leak soft-deleted data if they don't filter by `is_deleted = false`.
- Files: `supabase/migrations/` (all tables have `is_deleted BOOLEAN DEFAULT false`), `app/lib/crud/crud-action.server.ts` (line 88-96 soft-delete implementation)
- Impact: Accidentally restored deleted records are not visible in audit logs; soft-deleted data could appear in reports if views are not careful
- Recommendation: Create an audit table that logs soft-delete actions with timestamp and user_id; update all views to filter `is_deleted = false` explicitly

**Type Casting in Auth Error Handling:**
- Issue: `app/components/auth/update-password-form.tsx` (line 46) casts error to `{ code: string }` without validation. Attacker could pass malformed error object that crashes the UI.
- Files: `app/components/auth/update-password-form.tsx` (46)
- Impact: Potential to trigger unhandled exception in UI if error object structure is unexpected
- Recommendation: Create error validation schema (`authErrorSchema.ts`) using Zod; validate error before accessing properties

## Deployment & Environment

**Environment Variable Documentation:**
- Issue: `.env.template` lists MAILER_PROVIDER, ANTHROPIC_API_KEY, and OAuth client secrets, but no documentation of which are required vs optional, or what happens if they're missing.
- Files: `.env.template`
- Impact: Deployment to production may fail silently if a required env var is not set; no clear error message
- Fix approach: Document required vs optional env vars; validate all required vars on app startup in `root.tsx` loader; throw 500 if missing

**Secrets in Template File:**
- Issue: `.env.template` contains demo Supabase keys for local development. These are safe (hardcoded in Supabase docs), but the pattern invites copy-paste of real secrets into git.
- Files: `.env.template` (lines 32-34)
- Impact: Low immediate risk, but sets bad precedent; if developer renames `.env.template` to `.env` and adds real secrets, they could accidentally commit
- Recommendation: Use `.env.local` for secrets; keep `.env.template` secrets-free with comments like `SUPABASE_SECRET_KEY=<set in your hosting provider>`

## Migration & Schema

**104 Migration Files Without Clear Timeline:**
- Issue: 104 SQL migration files in `supabase/migrations/`. No index or README explaining the migration order, purpose, or blockers. RLS migrations (Wave 1 through 3) were applied Apr 1, 2026 in a single commit.
- Files: `supabase/migrations/` (104 files, latest dated 2026-04-01)
- Impact: Hard to understand schema evolution; reverting a migration requires understanding downstream dependencies
- Fix approach: Create `supabase/migrations/README.md` with a table of migration waves (foundation, org/hr, inventory, etc.); add comments at top of each migration explaining purpose

**RLS Migration Wave Rollout:**
- Issue: 9 RLS migrations added in a single day (Apr 1, 2026), enabling RLS on 81 tables with 204+ policies. This is high-risk if any policy is malformed.
- Files: `supabase/migrations/20260401000099_rls_org_hr_tables.sql` through `20260401000103_rls_*.sql`
- Risk: If a policy is too permissive or has a typo, all 81 tables are exposed until noticed
- Recommendation: Stage RLS rollout per feature module; validate each migration with full pgTAP suite before deploying; use feature flags to disable RLS per module if needed

## Scaling & Architecture

**Single-Namespace CRUD Registry:**
- Issue: All modules map to a single `registry` map in `app/lib/crud/registry.ts` (line 13). As ERP grows to 50+ modules, this becomes a bottleneck and maintenance nightmare.
- Files: `app/lib/crud/registry.ts` (13 entries but only 2 configured)
- Impact: All module configs must be centralized; new modules can't provide their own config; hard to organize by feature
- Fix approach: Refactor registry to accept plugins or lazy-load configs per module; use a feature-based structure where each module package exports its own config

**Navigation Views Hardcoded in Loaders:**
- Issue: Sidebar and navigation are loaded from `app_nav_modules` and `app_nav_sub_modules` views on every workspace load. If these views are slow or have permissions issues, all pages are affected.
- Files: `app/lib/workspace/org-workspace-loader.server.ts` (57-76)
- Impact: Single point of failure; can't disable a slow query without affecting navigation
- Fix approach: Cache nav data for 30 seconds; make nav loading non-blocking (fetch in background, use stale cache); add dedicated nav endpoints

## Code Quality

**Unsafe Type Assertions (10 instances):**
- Issue: 10 places use `as unknown as Type` pattern, bypassing TypeScript compiler. While intentional (documented comments), this creates maintenance burden and hides intent.
- Files: Listed in "Type Generation Gap" section above
- Impact: Future developers may not understand why the assertion is needed; easy to accidentally remove it without understanding consequences
- Fix approach: Document with JSDoc why each assertion is needed; create a typed helper function `queryUntypedView(tableName, columns)` that documents the pattern once

**Fallback Form Schema:**
- Issue: `fallbackSchema` in `sub-module-create.tsx` (line 38-42) is ultra-generic (id, name, description only). Any module without a config will have broken forms.
- Files: `app/routes/workspace/sub-module-create.tsx` (38-55)
- Impact: Encourages lazy form implementation; new modules ship broken until config added
- Fix approach: Throw error if module config is missing instead of falling back; force explicit CRUD config for all modules

---

*Concerns audit: 2026-04-02*
