# Aloha App

Multi-organization agricultural ERP built on Supabase and React for farm-to-customer operations.

## About

Aloha is an ERP system designed for hydroponic and greenhouse farming operations. It manages the full lifecycle from crop production to customer delivery, supporting multiple organizations on a single platform where each organization manages its own farms, products, customers, and pricing independently.

## Business Context

The system serves agricultural operations that grow crops like cucumbers, lettuce, and tomatoes in controlled greenhouse environments. Each organization can operate multiple **farms**, where a farm represents a crop or product line (e.g. "Cuke Farm", "Lettuce Farm") rather than a physical location. Within each farm, **sites** represent the physical infrastructure -- nurseries for seedling propagation, growing greenhouses for production, packing facilities, and storage areas.

Products move through a defined packaging hierarchy: content (the raw product) is packed into consumer units, grouped into sale units (cases, boxes), and palletized into shipping units. This hierarchy drives inventory calculations and order fulfillment.

Pricing is managed with three tiers of specificity -- default prices by product and FOB point, group-level overrides for customer segments like wholesale or retail, and customer-specific pricing. All prices track effective date ranges so historical pricing is preserved as prices change.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Router 7 (SSR/Framework mode) |
| UI | React 19, Shadcn UI, Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Language | TypeScript 5.9 |
| Build | Vite 7, Turborepo |
| Testing | Playwright (E2E), pgTAP (database) |

## Supabase Project

| Setting | Value |
|---------|-------|
| Project ref | `kfwqtaazdankxmdlqdak` |
| Dashboard | https://supabase.com/dashboard/project/kfwqtaazdankxmdlqdak |
| Region | East US (North Virginia) |

Environment variables are configured in `.env`.

## Development

### Prerequisites

- Node.js >= 20.x
- pnpm 10.18.x
- Supabase CLI

### Getting Started

```bash
pnpm install
pnpm dev       # Start dev server at http://localhost:5173
```

### Essential Commands

```bash
pnpm dev                    # Start all apps
pnpm dev       # Main app only
pnpm typecheck              # Type-check all packages
pnpm format:fix             # Format code
pnpm lint:fix               # Lint code
```

### Database Commands

```bash
pnpm supabase:typegen   # Regenerate TypeScript types from Supabase schema
pnpm supabase:start     # Start local Supabase (requires Docker)
pnpm supabase:reset     # Reset local Supabase with latest schema
```

### Test Users

Three test users are seeded in the hosted Supabase project, each with different access levels to demonstrate the multi-layered access control system. All passwords are `password123`.

| Email | Access Level | Modules Visible |
|-------|-------------|-----------------|
| admin@hawaiifarming.com | owner (level 5) | All 8 modules, full permissions |
| manager@hawaiifarming.com | manager (level 3) | Inventory, Operations, Grow, Pack |
| employee@hawaiifarming.com | employee (level 1) | Operations, Grow only |

Login with any of these users to see how the sidebar navigation adapts based on access level, module assignments, and sub-module visibility.

## Project Structure

### Root Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace package. Defines monorepo scripts (`dev`, `typecheck`, `lint:fix`, `format:fix`, `supabase:*`). |
| `pnpm-workspace.yaml` | Declares workspace packages: `apps/*`, `packages/*`, `packages/features/*`, `tooling/*`. |
| `pnpm-lock.yaml` | Lockfile for deterministic installs across environments. |
| `turbo.json` | Turborepo pipeline configuration. Defines task dependencies, caching, and `globalEnv` for env var invalidation. |
| `tsconfig.json` | Root TypeScript config extended by all packages and apps. |
| `.npmrc` | pnpm settings (strict peer deps, hoist patterns). |
| `.nvmrc` | Node.js version pin (used by nvm/fnm to auto-switch). |
| `.prettierignore` | Files excluded from Prettier formatting. |
| `.syncpackrc` | Monorepo dependency version consistency rules. |
| `.gitignore` | Ignores for `node_modules`, build artifacts, `.env` files, and IDE configs. |
| `CLAUDE.md` | Instructions for Claude Code when working in this repository. |
| `SCHEMA_CONVENTIONS.md` | Schema design rules followed across all SQL migrations. Read before making schema changes. |

### Directory Map

```
aloha-app/
  .claude/
    agents/                   # AI agents (code-quality-reviewer)
    commands/                 # Slash commands (feature-builder)
    skills/                   # Dev skills (playwright-e2e, postgres-expert, react-form-builder, server-action-builder, service-builder)
    evals/                    # Evaluation criteria for implementation quality
  apps/
    web/                      # Main React Router 7 SSR application
      app/routes/             # File-based routes (auth, home, api, join)
      components/             # Shared app-level components
      config/                 # App configuration (auth, paths, feature flags)
      lib/                    # App-level utilities (i18n, database types, require-user)
      public/                 # Static assets and locale JSON files
      styles/                 # Global CSS (Tailwind entry point)
      supabase/
        schemas/              # SQL schema files (00-20) for auth, views, seed data
        migrations/           # Deployable migrations
        config.toml           # Supabase CLI project config
        seed.sql              # Local development seed data
    e2e/                      # Playwright end-to-end tests
      tests/                  # Test files organized by feature
      playwright.config.ts    # Browser, base URL, and timeout config
  packages/
    features/
      auth/                   # Sign in, sign up, password reset, magic link
      access-control/         # Role-based access control, route guards
      team-accounts/          # Org settings, member list, role updates, ownership transfer
      crud/                   # Schema-driven CRUD (list, detail, form views)
      ai/                     # AI chat and form-assist
    supabase/                 # Supabase client factory, generated types, SSR cookies
    ui/                       # Shadcn UI components + custom kit (data tables, forms, nav)
    shared/                   # Registry pattern, Pino logger, React hooks
    i18n/                     # i18next with lazy locale loading and language detection
    mailers/                  # Email abstraction (Nodemailer dev, Resend prod)
    policies/                 # Business rule engine (ALL/ANY operators, LRU caching)
    otp/                      # One-time password for sensitive operations
    utils/                    # CSRF protection via @edge-csrf/core
    mcp-server/               # Model Context Protocol server for AI tools
    database-webhooks/        # Supabase database webhook handlers
  tooling/
    eslint/                   # ESLint 9 flat config (typescript-eslint, react, react-hooks)
    prettier/                 # Prettier config (import sorting, Tailwind class sorting)
    tailwind/                 # Tailwind CSS 4 config exported as Vite plugin
    typescript/               # Shared tsconfigs (base, React, Node)
    scripts/                  # Build and dev shell scripts
  turbo/
    generators/               # Turborepo code generators for scaffolding new packages
  docs/
    schemas/                  # 11 schema docs with tables, columns, constraints, mermaid ERDs
    processes/                # 10 workflow docs with mermaid flow diagrams
  supabase/
    migrations/               # Original 91 SQL migration files (schema design source of truth)
  scripts/
    python/
      process_payroll.py      # ETL for importing payroll from external processor
      requirements.txt        # Python dependencies
    sql/
      deploy-views-and-seed.sql  # Creates view contracts + seeds system data (run in SQL Editor)
      seed-test-data.sql      # Creates test users and links to hr_employee records
```

### Apps

**``** -- The main application. React Router 7 in SSR/framework mode. Routes are organized by section: `auth/` for login flows, `home/` for the authenticated app shell with org-scoped navigation, and `api/` for server endpoints (AI, webhooks, OTP). Configuration lives in `config/` (auth providers, paths, feature flags). The `supabase/` subdirectory contains SQL schema files (00-20) that define the view contracts and auth infrastructure used by local Supabase.

**`e2e/`** -- Playwright end-to-end test suite. Tests are organized by feature and run against the dev server. Configure browsers, base URL, and timeouts in `playwright.config.ts`.

### Feature Packages (`packages/features/`)

Each feature package encapsulates domain logic, UI components, and server actions. They are consumed by the web app via `@aloha/{feature}` imports (e.g. `@aloha/auth/shared`, `@aloha/team-accounts/api`).

**`auth/`** -- Authentication flows: password sign-in, sign-up, password reset, magic link. Exports TypeScript types for the view contracts (`AppUserProfile`, `AppUserOrgs`, `AppOrgContext`) consumed by workspace loaders.

**`access-control/`** -- Module-level access control. Exports view contract types (`AppNavModule`, `AppNavSubModule`) and the `requireModuleAccess` route guard that checks `app_nav_modules` before rendering a module page.

**`team-accounts/`** -- Organization management. Handles org settings (name update), member list (queries `hr_employee`), role updates (changes `sys_access_level_id`), member removal, and ownership transfer.

**`crud/`** -- Schema-driven CRUD operations. Configurable list view, detail view, and create/edit forms generated from schema configuration. The core workhorse for adding new ERP modules.

**`ai/`** -- AI-powered features. Chat interface and form-assist that use AI SDK for streaming responses.

### Infrastructure Packages (`packages/`)

**`supabase/`** -- The database layer. Contains `getSupabaseServerClient(request)` for request-scoped Supabase clients with SSR cookie handling, and `database.types.ts` (7,980 lines generated from the live schema via `pnpm supabase:typegen`). All database access flows through this package.

**`ui/`** -- Component library built on Radix UI primitives. Shadcn UI components in `shadcn/`, custom components in `kit/` (data tables, forms, sidebar navigation, profile avatars), and the `cn()` utility for Tailwind class merging.

**`shared/`** -- Cross-cutting utilities. `createRegistry()` for dependency injection without direct coupling. Pino logger (console in dev, structured JSON in prod). Shared React hooks.

**`i18n/`** -- Internationalization via i18next. Lazy locale loading with `i18next-resources-to-backend`. Language detection via `i18next-browser-languagedetector`. Locale JSON files live in `public/locales/`.

**`mailers/`** -- Email provider abstraction. Common interface with swappable backends: Nodemailer for local development, Resend for production. Configured via `MAILER_PROVIDER` env var.

**`policies/`** -- Business rule evaluation engine. Declarative policy functions with ALL/ANY group operators, stage-aware filtering, and LRU caching for performance.

**`otp/`** -- One-time password generation and verification. Used for sensitive operations like account deletion (requires OTP confirmation).

**`utils/`** -- CSRF protection via `@edge-csrf/core`. Edge-compatible CSRF tokens on all mutations.

**`mcp-server/`** -- Model Context Protocol server. Exposes application data and operations as AI-callable tools.

**`database-webhooks/`** -- Handlers for Supabase database webhooks. Processes events triggered by database changes (e.g. row inserts, updates).

### Tooling (`tooling/`)

Shared build and development configuration consumed by all packages. Keeping these centralized ensures consistency across the monorepo.

**`eslint/`** -- ESLint 9 flat config with `typescript-eslint`, `eslint-plugin-react`, and `eslint-plugin-react-hooks`. Unused vars must be prefixed with `_`.

**`prettier/`** -- Prettier config with `@trivago/prettier-plugin-sort-imports` (consistent import ordering) and `prettier-plugin-tailwindcss` (class sorting). 2 spaces, semicolons, single quotes.

**`tailwind/`** -- Shared Tailwind CSS 4 configuration exported as a Vite plugin via `@aloha/tailwind-config/vite`.

**`typescript/`** -- Shared TypeScript configs (base, React, Node) extended by all packages. Strict mode enabled.

**`scripts/`** -- Build and development shell scripts for cross-platform env handling.

### Other Directories

**`turbo/generators/`** -- Turborepo code generators for scaffolding new packages with consistent structure.

**`docs/schemas/`** -- Per-module schema documentation (11 files). Each file documents every table, column, constraint, and relationship for a module, with mermaid entity-relationship diagrams.

**`docs/processes/`** -- Business process documentation (10 files). Workflow descriptions with mermaid flow diagrams covering org provisioning, user access, growing operations, packing, and more.

**`supabase/migrations/`** -- The original 91 SQL migration files that define the complete database schema. These are the source of truth for schema design decisions and naming conventions. They are not deployed directly -- they document the schema that exists in the hosted Supabase project.

**`scripts/python/`** -- Python utilities. `process_payroll.py` is an ETL script for importing payroll data from an external payroll processor into the `hr_payroll` table.

**`scripts/sql/`** -- SQL deployment scripts. `deploy-views-and-seed.sql` creates the 5 view contracts and seeds system-level data (access levels, modules, sub-modules). `seed-test-data.sql` creates test users via the Supabase Auth admin API workaround and links them to `hr_employee` records with appropriate module access.

**`.claude/`** -- Claude Code AI development workflow. Contains specialized agents (`code-quality-reviewer`), slash commands (`/feature-builder` for scaffolding complete features end-to-end), development skills (Playwright E2E, Postgres expert, React form builder, server action builder, service builder), and evaluation criteria for assessing implementation quality.

## Multi-Tenant Architecture

### Access Control Model

The system uses a multi-layered access control model combining feature toggling, role-based access (RBAC), and attribute-based access (ABAC):

| Layer | Model | What it controls |
|-------|-------|-----------------|
| Feature Toggling | Org-level switches (`org_module`, `org_sub_module`) | Organization admins enable or disable modules/sub-modules for their org |
| RBAC | Hierarchical access levels (`sys_access_level`) | Each employee has an access level (employee, team_lead, manager, admin, owner). Sub-modules define a minimum level. |
| ABAC | Per-employee module permissions (`hr_module_access`) | Each employee has individual flags per module: `can_view`, `can_edit`, `can_delete`, `can_verify` |

### How It Works

1. User logs in via Supabase Auth (email/password)
2. System queries `hr_employee` to find which orgs the user belongs to
3. If multiple orgs, user selects one; if one, auto-selected
4. Sidebar navigation is built by applying three filters:
   - **Org filter** -- only modules where `org_module.is_enabled = true`
   - **Employee filter** -- only modules where `hr_module_access.is_enabled = true` for this employee
   - **Access level filter** -- only sub-modules where employee's level >= sub-module's required level

### Key Tables

| Table | Purpose |
|-------|---------|
| `org` | Root tenant entity |
| `hr_employee` | Employee register and org membership (one row per user per org) |
| `sys_access_level` | Five hierarchical tiers: employee (1), team_lead (2), manager (3), admin (4), owner (5) |
| `hr_module_access` | Per-employee, per-module permission flags |
| `org_module` | Org-scoped module toggles |
| `org_sub_module` | Org-scoped sub-module toggles with access level requirements |

## View Contracts

Five database views bridge the schema to the application UI. These views are security-invoked (RLS applies) and filter by `auth.uid()` for defense-in-depth.

| View | Purpose |
|------|---------|
| `app_user_profile` | Current user's employee record (employee_id, org_id, name, access_level) |
| `app_user_orgs` | All orgs the user belongs to (for org switcher) |
| `app_org_context` | Current org context including employee_id and access_level |
| `app_nav_modules` | Modules the user can access in an org (pre-filtered by `hr_module_access`) |
| `app_nav_sub_modules` | Sub-modules filtered by `sys_access_level` comparison |

The view SQL is defined in `supabase/schemas/19-view-contracts.sql` and `20-nav-view-contracts.sql`. To deploy to a new Supabase project, run `scripts/sql/deploy-views-and-seed.sql` in the SQL Editor.

## ERP Modules

| Module | Tables | Description |
|--------|--------|-------------|
| System | 4 | Access levels, modules, sub-modules, units of measure |
| Organization | 7 | Orgs, farms, sites, equipment, business rules |
| Inventory | 8 | Vendors, items, purchase orders, lots, on-hand tracking |
| Human Resources | 9 | Employees, departments, titles, payroll, time off |
| Operations | 14 | Task tracking, training, checklists, corrective actions |
| Grow | 24 | Seeding, harvesting, scouting, spraying, fertigation, monitoring |
| Pack | 10 | Lot tracking, shelf life trials, hourly productivity |
| Sales | 8 | Products, pricing, orders, fulfillment |
| Maintenance | 2 | Work orders and parts usage |
| Food Safety | 5 | EMP testing, lab management, test-and-hold |

## Schema Documentation

Detailed table documentation with column definitions, constraints, and relationships:

- [System Schema](docs/schemas/20260326_01_sys.md) -- 4 system-level tables
- [Org Schema](docs/schemas/20260326_02_org.md) -- 7 organization structure tables
- [Inventory Schema](docs/schemas/20260326_03_invnt.md) -- Items, orders, transactions, and views
- [Human Resources Schema](docs/schemas/20260326_04_hr.md) -- Employee records and HR lookups
- [Operations Schema](docs/schemas/20260326_05_ops.md) -- Task tracking, training, and checklists
- [Grow Schema](docs/schemas/20260326_06_grow.md) -- Seeding, harvesting, scouting, spraying, fertigation, monitoring
- [Pack Schema](docs/schemas/20260326_07_pack.md) -- Lot tracking, shelf life trials, productivity
- [Sales Schema](docs/schemas/20260326_08_sales.md) -- Product catalog, pricing, orders, fulfillment
- [Maintenance Schema](docs/schemas/20260326_09_maint.md) -- Work orders and parts usage
- [Food Safety Schema](docs/schemas/20260326_10_fsafe.md) -- EMP testing, lab management, test-and-hold
- [Future Improvements](docs/schemas/20260326_11_future.md) -- Deferred features

## Process Documentation

Workflow and business process documentation with flow diagrams:

- [Org Provisioning](docs/processes/20260326_01_org_provisioning.md) -- New org setup and module seeding
- [User Access Flow](docs/processes/20260326_02_user_access_flow.md) -- Login, org selection, and access control
- [Grow Seeding](docs/processes/20260326_03_grow_seeding_workflow.md) -- Seeding batch creation and lifecycle
- [Grow Harvesting](docs/processes/20260326_04_grow_harvesting_workflow.md) -- Harvest weigh-in and grading
- [Grow Scouting](docs/processes/20260326_05_grow_scouting_workflow.md) -- Pest and disease observation
- [Grow Spraying](docs/processes/20260326_06_grow_spraying_workflow.md) -- Chemical application with compliance
- [Grow Fertigation](docs/processes/20260326_07_grow_fertigation_workflow.md) -- Fertilizer recipe application
- [Grow Monitoring](docs/processes/20260326_08_grow_monitoring_workflow.md) -- Environmental readings
- [Ops Task Workflow](docs/processes/20260326_09_ops_task_workflow.md) -- Task + checklist workflow
- [Pack Productivity](docs/processes/20260326_10_pack_productivity_workflow.md) -- Hourly pack line tracking

## Schema Conventions

See [SCHEMA_CONVENTIONS.md](SCHEMA_CONVENTIONS.md) for the full set of schema design rules followed across this project.
