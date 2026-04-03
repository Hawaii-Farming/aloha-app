# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
aloha-app/
├── app/                           # React Router app (SSR)
│   ├── components/                # React components (pages, auth, sidebar, AI)
│   ├── config/                    # App config (auth, paths, features, icons)
│   ├── entry.server.tsx           # HTTP entry point (bot detection, streaming)
│   ├── lib/                       # App-level utilities (server & client)
│   ├── root.tsx                   # Root component (CSRF, theme, i18n, providers)
│   ├── routes/                    # React Router route definitions
│   ├── routes.ts                  # Route config (layout groups, paths)
│   └── styles/                    # Global CSS (Tailwind + custom)
├── e2e/                           # Playwright end-to-end tests
├── packages/                      # Monorepo packages
│   ├── mcp-server/                # MCP server for Claude integration
│   └── ui/                        # Shadcn UI component library
├── supabase/                      # PostgreSQL + RLS
│   ├── migrations/                # Database migrations (numbered by Supabase)
│   ├── schemas/                   # SQL schema definitions (ordered 00-05)
│   ├── seed/                      # Seed scripts for local dev
│   └── tests/                     # pgTAP unit tests for RLS
├── tooling/                       # Build & dev tools (shared configs)
│   ├── eslint/                    # ESLint flat config
│   ├── prettier/                  # Prettier config
│   ├── tailwind/                  # Tailwind CSS config plugin
│   └── typescript/                # TypeScript base config
├── docs/                          # Documentation
│   ├── processes/                 # Business workflow diagrams
│   └── schemas/                   # Per-module schema docs
├── public/                        # Static assets
├── scripts/                       # CLI scripts (Python, SQL)
├── turbo.json                     # Turborepo config (tasks, caching)
├── vite.config.ts                 # Vite build config (Tailwind plugin)
├── react-router.config.ts         # React Router SSR config
├── tsconfig.json                  # TypeScript config (path aliases)
└── pnpm-workspace.yaml            # pnpm monorepo config
```

## Directory Purposes

**`app/`:**
- Purpose: Main React Router application (SSR mode)
- Contains: Routes, components, utilities, config, styles
- Key files: `entry.server.tsx`, `root.tsx`, `routes.ts`

**`app/components/`:**
- Purpose: React components organized by feature (auth, sidebar, AI)
- Contains: Page wrappers, form components, layout wrappers
- Naming: `kebab-case.tsx` for components, `kebab-case.server.tsx` for server-only components
- Examples: `auth/password-sign-in-container.tsx`, `sidebar/workspace-sidebar.tsx`, `root-error-boundary.tsx`

**`app/config/`:**
- Purpose: Centralized app configuration
- Contains: Auth providers, feature flags, path constants, module icons, navigation structure
- Key files:
  - `app.config.ts` — app title, version, default theme
  - `auth.config.ts` — OAuth providers (GitHub, Google), auth callback URL
  - `feature-flags.config.ts` — feature toggles by feature name
  - `paths.config.ts` — URL path constants (sign-in, callback, home)
  - `workspace-navigation.config.tsx` — sidebar menu items

**`app/lib/`:**
- Purpose: App-level utilities (server and client)
- Subdirectories by concern: `auth/`, `supabase/`, `workspace/`, `crud/`, `ai/`, `i18n/`, `csrf/`, `shared/`

**`app/lib/auth/`:**
- Purpose: Auth-related utilities and schemas
- Contains: Sign-in flow, password reset, view contracts (types for SQL views)
- Examples: `sign-in.ts`, `password-reset.ts`, `schemas/password-sign-in.schema.ts`

**`app/lib/supabase/`:**
- Purpose: Supabase client factory and auth validation
- Contains: Server client, admin client (server-only), auth callback handler
- Key files:
  - `clients/server-client.server.ts` — request-scoped client with session management
  - `clients/server-admin-client.server.ts` — service-role client (server-only)
  - `require-user.ts` — validation helper to check user session
- Subdirectory `hooks/` — client-side hooks: `useSupabase()`, `useSupabaseQuery()`

**`app/lib/workspace/`:**
- Purpose: Org/workspace context loading and access control
- Contains: Workspace loader, module/submodule access guards
- Key files:
  - `org-workspace-loader.server.ts` — loads current org, user's orgs, navigation
  - `require-module-access.server.ts` — guards routes by module/submodule CRUD permissions
  - `use-module-access.ts` — client-side hook to check permissions
  - `types.ts` — TypeScript types for nav views

**`app/lib/crud/`:**
- Purpose: Generic CRUD helpers and module registry
- Contains: Dynamic table loading, row helpers, module config registry
- Key files:
  - `crud-helpers.server.ts` — `loadTableData()` queries table by module slug
  - `crud-action.server.ts` — generic create/update/delete action handler
  - `registry.ts` — `getModuleConfig()` maps module slug → schema, columns, API

**`app/lib/ai/`:**
- Purpose: AI assistant context and workflow helpers
- Contains: System prompt builder, workflow automation logic
- Key files:
  - `build-system-prompt.server.ts` — generates Claude system prompt with org context
  - `workflow-automation.server.ts` — automation rules for multi-step workflows

**`app/lib/i18n/`:**
- Purpose: Internationalization (i18next) setup and locale files
- Contains: Server-side i18n instance, locale JSON files
- Key files:
  - `i18n.server.ts` — creates i18n instance for SSR (language detection from request)
  - `locales/en/` — English translation files (common, auth, teams, modules)

**`app/lib/csrf/`:**
- Purpose: CSRF protection via edge-csrf
- Subdirectories:
  - `server/` — token generation in loader
  - `client/` — token validation in form actions

**`app/lib/shared/`:**
- Purpose: Cross-cutting utilities (logging, hooks, helpers)
- Contains: Logger (Pino/console impl), React hooks, utility functions
- Examples: `logger/`, `hooks/`, `utils.ts` (safe redirect, env helpers)

**`app/routes/`:**
- Purpose: React Router route definitions (loader + component pairs)
- Layout-organized subdirectories: `auth/`, `workspace/`, `api/`
- Pattern: Each route file exports `loader`, `action`, `default` (component), `meta`, `ErrorBoundary`

**`app/routes/auth/`:**
- Purpose: Authentication flow routes
- Key routes:
  - `sign-in.tsx` — login page (OAuth + password)
  - `callback.tsx` — OAuth callback handler
  - `password-reset.tsx` — request password reset
  - `update-password.tsx` — set new password
  - `layout.tsx` — auth page wrapper

**`app/routes/workspace/`:**
- Purpose: Protected workspace routes (org-scoped)
- Key routes:
  - `layout.tsx` — workspace loader (org context, nav)
  - `home.tsx` — org dashboard
  - `settings.tsx` — org settings
  - `module.tsx` — module page (details for a feature)
  - `sub-module.tsx` — table list view (dynamic CRUD)
  - `sub-module-detail.tsx` — record detail page
  - `sub-module-create.tsx` — create/edit form (reused for both)

**`app/routes/api/`:**
- Purpose: HTTP API endpoints (server actions)
- Subdirectories: `ai/`, `db/`, `otp/`, `accounts/`
- Pattern: Export `action({ request })` — no React component

**`app/styles/`:**
- Purpose: Global CSS and theme configuration
- Contains: Tailwind globals, CSS variables, dark mode setup

**`supabase/schemas/`:**
- Purpose: PostgreSQL schema definitions (ordered by dependency)
- Files:
  - `00-privileges.sql` — DB role setup for RLS
  - `01-enums.sql` — Custom enum types (access levels, statuses)
  - `02-config.sql` — Configuration tables
  - `03-accounts.sql` — Auth accounts (template schema)
  - `04-tables.sql` — All business tables (org, hr_employee, inventory, etc.)
  - `05-view-contracts.sql` — Auth views (app_org_context, app_user_orgs)
  - `06-nav-view-contracts.sql` — Navigation views (app_nav_modules, app_nav_sub_modules)

**`supabase/migrations/`:**
- Purpose: Incremental database changes (generated by `supabase db diff`)
- Naming: Timestamp-based, auto-generated by Supabase CLI
- Usage: Run during `supabase db push` on production

**`supabase/tests/`:**
- Purpose: pgTAP unit tests for RLS policies
- Language: SQL (pgTAP framework)
- Run: `pnpm supabase:test`

**`packages/ui/`:**
- Purpose: Shared component library (Shadcn UI wrappers + custom)
- Subdirectories:
  - `src/shadcn/` — Shadcn components (Button, Input, Dialog, etc.)
  - `src/kit/` — Custom components (AppBreadcrumbs, DataTable, PageLayout)
  - `src/utils/` — `cn()` utility for Tailwind class merging
  - `src/trans/` — i18n Trans component

**`packages/mcp-server/`:**
- Purpose: Model Context Protocol server for Claude integration
- Contains: Tools for database introspection, schema exploration, CRUD operations

**`tooling/`:**
- Purpose: Shared build and dev configs (shared across workspace)
- Packages:
  - `eslint/` — ESLint 9 flat config with React, TypeScript rules
  - `prettier/` — Prettier config with import sorting, Tailwind sorting
  - `tailwind/` — Tailwind CSS config with Vite plugin
  - `typescript/` — TypeScript base config (extends by all packages)

**`docs/schemas/`:**
- Purpose: Schema documentation per module (ERD, column definitions)
- Examples: `inventory.md`, `hr.md`, `sales.md`

**`docs/processes/`:**
- Purpose: Business process workflows (diagrams, descriptions)

## Key File Locations

**Entry Points:**
- `app/entry.server.tsx` — HTTP entry (bot detection, streaming)
- `app/root.tsx` — Root component (CSRF, theme, i18n)
- `app/routes.ts` — Route config

**Configuration:**
- `app/config/app.config.ts` — App metadata
- `app/config/auth.config.ts` — OAuth providers
- `app/config/paths.config.ts` — URL constants
- `vite.config.ts` — Build config (Tailwind plugin)
- `react-router.config.ts` — SSR config

**Core Logic:**
- `app/lib/workspace/org-workspace-loader.server.ts` — Workspace hydration
- `app/lib/supabase/clients/server-client.server.ts` — Request-scoped Supabase
- `app/lib/crud/registry.ts` — Module config registry
- `app/lib/auth/view-contracts.ts` — SQL view types

**Database:**
- `app/lib/database.types.ts` — Generated Supabase types (run `pnpm supabase:typegen`)
- `supabase/schemas/04-tables.sql` — All business tables + RLS
- `supabase/schemas/05-view-contracts.sql` — Auth/context views
- `supabase/schemas/06-nav-view-contracts.sql` — Navigation views

**Testing:**
- `e2e/tests/` — Playwright tests
- `supabase/tests/` — pgTAP database tests

## Naming Conventions

**Files:**
- React components: `kebab-case.tsx` (e.g., `password-sign-in-container.tsx`)
- Server-only modules: `kebab-case.server.ts` (e.g., `org-workspace-loader.server.ts`)
- Service classes: `kebab-case.service.ts` (e.g., `account-invitations.service.ts`)
- Zod schemas: `kebab-case.schema.ts` (e.g., `password-sign-in.schema.ts`)
- Page objects (E2E): `kebab-case.po.ts` (e.g., `auth.po.ts`)

**Directories:**
- Feature-based: `lib/workspace/`, `lib/crud/`, `lib/auth/`
- Route-based: `routes/auth/`, `routes/workspace/`, `routes/api/`
- Utilities: `lib/shared/`, `lib/supabase/`

**Functions:**
- camelCase for all function names
- Factory functions: `createXxxService()`, `getSupabaseServerClient()`
- Hooks: `useXxx()` (React convention)
- Server actions: `xyzAction()` (e.g., `deletePersonalAccountAction`)

**Components:**
- PascalCase for all React components
- Props interface: `interface ComponentNameProps`
- Type aliases: `type ComponentName = ...`

**Variables:**
- camelCase for all local variables and parameters
- Destructured object parameters preferred for complex inputs
- Prefixed with `_` if unused (e.g., `_unusedParam`)

## Where to Add New Code

**New Feature (e.g., Inventory Management):**
- Primary code: `app/routes/workspace/sub-module.tsx` (list), `sub-module-detail.tsx` (detail), `sub-module-create.tsx` (form) — reused generically via module registry
- Module config: `app/lib/crud/registry.ts` — add entry mapping slug → schema
- Database: `supabase/schemas/04-tables.sql` — create table with org_id, RLS policies
- Navigation: `app/lib/workspace/types.ts` — add to nav view if new module
- Tests: `supabase/tests/` — add pgTAP tests for RLS policies

**New Component/Module:**
- Implementation: `app/components/{feature}/` directory
- Naming: `kebab-case.tsx` for all files
- Props: `interface ComponentNameProps`
- Tests: Colocated with component if unit tested, or `e2e/tests/`

**Utilities/Helpers:**
- Shared within app: `app/lib/shared/`
- Shared across workspace: `packages/ui/src/utils/`, `packages/shared/`

**Database Table:**
1. Create SQL in `supabase/schemas/04-tables.sql`
2. Add to module registry: `app/lib/crud/registry.ts`
3. Run `pnpm supabase:reset` (local) or `supabase db diff -f migration-name` (production)
4. Generate types: `pnpm supabase:typegen`
5. Create routes: `routes/workspace/sub-module*.tsx` (reuse generic CRUD)

## Special Directories

**`.react-router/types/`:**
- Purpose: Generated React Router type definitions per route
- Generated: Yes (by `react-router typegen` command)
- Committed: No (in `.gitignore`)
- Usage: Import `type Route` from `~/types/app/routes/{path}/+types/{filename}`

**`build/`:**
- Purpose: Build output (client + server bundles)
- Generated: Yes (by `pnpm build`)
- Committed: No
- Client: `build/client/` (served by CDN or static server)
- Server: `build/server/index.js` (entry for Node.js)

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (by `pnpm install`)
- Committed: No
- Workspace-wide monorepo node_modules

**`supabase/.branches/`:**
- Purpose: Supabase CLI branch management
- Generated: Yes (by `supabase start`)
- Committed: No

**`public/`:**
- Purpose: Static assets (images, icons, fonts)
- Committed: Yes
- Served: At app root (`/images/`, etc.)

---

*Structure analysis: 2026-04-02*
