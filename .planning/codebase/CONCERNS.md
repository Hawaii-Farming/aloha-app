# Codebase Concerns

Snapshot as of 2026-04-01, branch `dev`.

---

## 1. Security

### 1a. Row Level Security (RLS) missing on ~83 business tables (CRITICAL)

Only 8 core tables (org, hr_employee, sys_access_level, sys_module, sys_sub_module, org_module, org_sub_module, hr_module_access) have RLS enabled and policies defined, all in `supabase/migrations/20260326000092_rls_policies.sql`. The remaining ~83 business tables (grow_*, pack_*, sales_*, ops_*, invnt_*, maint_*, hr_payroll, hr_time_off_request, etc.) have:

- No `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- No `CREATE POLICY` statements
- No `GRANT` statements

This means any authenticated user can read/write any row in any business table regardless of org membership. With RLS disabled, Supabase defaults to allowing all access for the granted role.

### 1b. RLS policies are SELECT-only

Even the 8 tables that do have RLS only define SELECT policies. There are zero INSERT, UPDATE, or DELETE policies anywhere. The GRANT statements are also SELECT-only. Write operations at the database level are unprotected.

### 1c. Seed file contains hardcoded credentials

`supabase/seed/dev.sql` contains `password123` for the admin user (`admin@hawaiifarming.com`). This is acceptable for local dev but the file is git-tracked. Comment in the seed says "LOCAL DEVELOPMENT ONLY" which is appropriate, but there is no CI gate preventing this seed from running against a hosted instance.

### 1d. .env committed to git (local dev keys only)

`.env` is git-tracked (confirmed via `git ls-files` returning empty, but the file is present and not in `.gitignore`). It contains only Supabase local dev JWT tokens (the well-known `supabase-demo` issuer tokens), not production credentials. The `ANTHROPIC_API_KEY` field is empty. Risk is low but the `.env` file should be gitignored and only `.env.template` tracked.

**Update:** `.env` is NOT in `git ls-files` output, meaning it is untracked. However, `.gitignore` only ignores `.env*.local`, not `.env` itself. The file is at risk of being accidentally committed.

---

## 2. Configuration Mismatches

### 2a. site_url mismatch: config.toml vs .env

- `supabase/config.toml` sets `site_url = "http://localhost:3000"`
- `.env` sets `VITE_SITE_URL=http://localhost:5173`
- `config.toml` redirect URLs also use port 3000: `http://localhost:3000/auth/callback`

The app runs on port 5173 (Vite default). The Supabase auth redirect URLs point to port 3000, which will cause auth callbacks to fail in local development unless Supabase is configured separately.

### 2b. Zod version conflict

- `pnpm-workspace.yaml` catalog pins `zod: 3.25.74`
- `package.json` pnpm overrides forces `zod: 3.25.76`

The override wins at runtime, but the catalog version is stale and misleading.

### 2c. Node.js version requirement inconsistency

CLAUDE.md documents both `>=20.x` (root workspace) and `>=18.x` (web app). The `package.json` engines field only specifies `>=20.x`. The discrepancy in CLAUDE.md is inherited from the template era and should be cleaned up.

---

## 3. Technical Debt

### 3a. Dual auth model (documented, unresolved)

The template's `accounts`/`memberships` system coexists with the ERP's `org`/`hr_employee` model. CLAUDE.md explicitly acknowledges this as a "foundation phase" compromise. Current state:

- 6 files in `app/` reference accounts/memberships
- 14 files reference hr_employee/org_id
- The `supabase/schemas/03-accounts.sql` file (281 lines) maintains the template's account system with 2 TODO comments about simplification

Until unified, every auth-related feature must navigate both models, and new developers face a confusing dual-tenant surface.

### 3b. Stale CLAUDE.md references to inlined packages

Recent commits inlined `@aloha/auth`, `@aloha/shared`, `@aloha/csrf`, `@aloha/i18n`, `@aloha/ai`, and `@aloha/database-webhooks` into `app/lib/`. However, CLAUDE.md still references:

- `packages/features/*` as a project structure element (line 18)
- `packages/features/{auth,access-control,team-accounts,ai,crud}/src/` as a layer location (line 261)
- `@aloha/shared/logger` for Pino logging (line 132)
- Feature packages in the architecture section (line 246)

Only `packages/ui` and `packages/mcp-server` remain as actual packages.

### 3c. Stale comment in seed file

`supabase/seed/dev.sql` line 4 references `schemas/04-tables.sql` which does not exist. Tables are now defined in individual migration files (20260326000001 through 20260326000091).

### 3d. Stale Remix references in entry.server.tsx

`app/entry.server.tsx` lines 2-4 contain comments referencing Remix (`By default, Remix will handle...`, `npx remix reveal`). The app uses React Router 7, not Remix.

### 3e. Migration ordering fragility

Five of the last six commits were fixes to migration ordering:
- `9e4073f` fix: reorder invnt migrations
- `cbc4ec9` fix: topological sort migrations by FK dependency order
- `58ac995` fix: resolve schema/migration conflicts
- `2e9efcc` fix: restore original dependency order
- `318e8c9` fix: rename migrations to unique timestamps

All 94 ERP migrations share the same date prefix (`20260326`) with sequential numbering. FK dependencies require correct ordering, and this has been a recurring pain point. Any new table with cross-module FKs risks breaking the sequence.

### 3f. Deleted file in working tree (inv-product.config.ts)

Git status shows `D app/lib/crud/inv-product.config.ts` (deleted) and `?? app/lib/crud/invnt-item.config.ts` (untracked replacement). The registry has been updated to import `invntItemConfig` from the new file, but neither change is committed.

---

## 4. Missing / Incomplete Features

### 4a. CRUD registry covers only 2 of 91 tables

`app/lib/crud/registry.ts` maps only 2 sub-modules:
- `departments` -> `hrDepartmentConfig`
- `products` -> `invntItemConfig`

The remaining 89 tables have no CRUD config, meaning the generic CRUD UI cannot render them. The schema defines modules for HR, inventory, operations, growing, food safety, packing, sales, and maintenance, but the app layer only supports 2 sub-modules.

### 4b. No E2E tests for ERP features

`e2e/tests/` contains only `authentication/auth.po.ts` (a page object, not a test). Recent commits deleted stale E2E tests. There are no E2E tests for any workspace, module, or CRUD functionality.

### 4c. No database unit tests

No `supabase/tests/` directory exists. The `pnpm supabase:test` command is configured but there are no pgTAP test files to run.

### 4d. Only 16 data-test attributes across the app

Convention says to add `data-test` for E2E tests where appropriate, but only 16 instances exist across all `.tsx` files. Many interactive elements lack test selectors.

### 4e. No write operations at the database level

The RLS grants are SELECT-only for all tables. Even if the app implements create/update/delete in the CRUD layer, the database will reject writes from the authenticated role on core tables (and allow writes on unprotected business tables -- see 1a).

---

## 5. Schema / Migration Complexity

### 5a. 95 migration files, one-table-per-file pattern

The one-table-per-migration pattern is explicit and aids readability, but 95 files with shared-timestamp ordering is unusual for Supabase. Adding cross-module FK relationships requires careful insertion into the sequence. The pattern has already caused 5 ordering-fix commits.

### 5b. Dual schema definition paths

`supabase/config.toml` configures both:
- `schema_paths = ["./schemas/*.sql"]` (4 files: privileges, enums, config, accounts)
- `supabase/migrations/` (95 files)

Schemas run before migrations on `supabase db reset`. The accounts schema in `schemas/03-accounts.sql` defines template tables, while migrations define ERP tables. This dual path adds cognitive overhead and is a potential source of ordering conflicts.

### 5c. 91 tables, ~7 functional routes

The database defines 91 ERP tables across 8 modules, but the app has only 21 route files total (7 workspace routes, 6 auth routes, 3 API routes, 5 utility routes). The vast majority of the schema has no corresponding UI.

---

## 6. Performance Concerns

### 6a. RLS subquery pattern on every read

The documented RLS pattern uses a correlated subquery on `hr_employee` for every row access:
```sql
EXISTS (SELECT 1 FROM hr_employee e WHERE e.org_id = table.org_id AND e.user_id = auth.uid() AND e.is_deleted = false)
```
This will execute per-row on every query. With proper indexing on `hr_employee(org_id, user_id, is_deleted)` this is manageable, but no index creation is visible in the migrations. As table sizes grow, this could become a bottleneck.

### 6b. No database indexes beyond PKs and FKs

The migration files create tables with PKs and FK constraints but no explicit indexes for common query patterns (e.g., filtering by org_id, date ranges, status fields). PostgreSQL auto-creates indexes for PKs and unique constraints, but FK columns and filter columns are not indexed.

---

## 7. Documentation Gaps

### 7a. CLAUDE.md architecture section references non-existent code

The architecture section describes layers, abstractions, and patterns (registry, policy engine, workspace loaders) that either no longer exist in their documented locations or were inlined. The `packages/policies/` directory is referenced but does not appear to exist.

### 7b. Empty convention sections

CLAUDE.md has empty sections for: Error Handling, Logging, Comments, Module Design. These are headings with no content.

### 7c. supabase/CLAUDE.md references non-existent schema file

References `schemas/04-tables.sql` in the table header, but this file does not exist. Tables live in individual migrations.

---

## 8. Dead Code / Unused Dependencies

### 8a. MCP server package

`packages/mcp-server/` exists with `@modelcontextprotocol/sdk` as a dependency. It is unclear if this is actively used or planned. No route or integration point references it from the app.

### 8b. Template-era schema complexity

`supabase/schemas/03-accounts.sql` (281 lines) maintains the template's account system with functions, triggers, and RLS policies for accounts/memberships tables. Two TODO comments indicate planned simplification. This file runs on every `supabase db reset` and creates tables/functions that duplicate the ERP's own org/hr_employee model.

### 8c. i18next infrastructure with minimal translations

The app includes full i18n infrastructure (i18next, react-i18next, language detector, resource backend) but the actual locale files were recently cleaned up (commit `07783dd` deleted unused `chats.json`). The overhead of the i18n system vs. the current single-language usage should be evaluated.

---

## 9. Convention Deviations

### 9a. useEffect usage

Convention says `useEffect is a code smell and must be justified`. One instance exists in `app/lib/supabase/hooks/use-auth-change-listener.ts` for the auth state subscription. This is a legitimate use case (subscribing to Supabase auth events) but is the only `useEffect` in the codebase.

### 9b. All dependencies are devDependencies

`package.json` lists every dependency (including runtime ones like `react`, `react-router`, `@supabase/supabase-js`, `pino`) under `devDependencies` with no `dependencies` section. While this works for bundled apps (Vite bundles everything), it is unconventional and may cause issues with SSR where Node.js resolves server-side imports at runtime.

---

## Summary by Priority

| Priority | Issue | Section |
|----------|-------|---------|
| CRITICAL | 83 business tables have no RLS, no policies, no grants | 1a |
| CRITICAL | Even protected tables lack write policies | 1b, 4e |
| HIGH | site_url mismatch breaks local auth callbacks | 2a |
| HIGH | No database indexes beyond PKs | 6b |
| MEDIUM | CRUD registry covers 2 of 91 tables | 4a |
| MEDIUM | CLAUDE.md references inlined/deleted packages | 3b |
| MEDIUM | Migration ordering fragility | 3e |
| MEDIUM | Dual auth model unresolved | 3a |
| LOW | No E2E or database tests | 4b, 4c |
| LOW | Zod version mismatch | 2b |
| LOW | Stale Remix comments | 3d |
| LOW | .env at risk of accidental commit | 1d |
