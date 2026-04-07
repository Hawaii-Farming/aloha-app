# Codebase Structure

**Analysis Date:** 2026-04-07

## Directory Layout

```
aloha-app/
├── app/                        # Main React Router SSR application
│   ├── components/             # Reusable React components organized by feature
│   │   ├── ai/                 # AI chat, form assist components
│   │   ├── auth/               # Auth forms, sign-in, password reset
│   │   ├── crud/               # CRUD table views, form field rendering
│   │   ├── navbar/             # Top navigation, breadcrumbs, search
│   │   ├── sidebar/            # Left sidebar, org selector, navigation
│   │   └── *.tsx               # Root providers, error boundaries, shared components
│   ├── config/                 # App-wide configuration
│   │   ├── app.config.ts       # App metadata, theme, site settings
│   │   ├── auth.config.ts      # Auth providers (OAuth, password)
│   │   ├── feature-flags.config.ts  # Feature toggles
│   │   ├── module-icons.config.ts   # Module slug to icon mappings
│   │   ├── paths.config.ts     # Route paths for redirects
│   │   └── workspace-navigation.config.tsx  # Default nav structure
│   ├── lib/                    # Server and client utilities, organized by concern
│   │   ├── ai/                 # AI integrations (Claude, system prompt builder)
│   │   ├── auth/               # Auth helpers, schemas, password reset
│   │   ├── crud/               # CRUD module configs, registry, helpers
│   │   │   ├── *.config.ts     # Per-module CRUD config (hr-employee, invnt-item, etc.)
│   │   │   ├── crud-action.server.ts     # Create, update, delete operations
│   │   │   ├── crud-helpers.server.ts    # Query/load helpers
│   │   │   ├── registry.ts     # Map submodule slug → config
│   │   │   ├── types.ts        # CRUD type definitions
│   │   │   └── __tests__/      # Vitest unit tests
│   │   ├── csrf/               # CSRF protection, token generation/validation
│   │   │   ├── server/         # Server-side: token generation, cookies
│   │   │   └── client/         # Client-side: token meta tag, form field
│   │   ├── i18n/               # Internationalization
│   │   │   ├── i18n.server.ts  # Server-side i18n instance creation
│   │   │   ├── i18n-client.ts  # Client-side i18n setup
│   │   │   ├── locales/        # Translation JSON files by language
│   │   │   └── *.ts            # Language detection, settings, resolvers
│   │   ├── shared/             # Cross-cutting concerns
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── logger/         # Logger interface and implementations (console, pino)
│   │   │   └── utils.ts        # Shared utilities
│   │   ├── supabase/           # Supabase integrations
│   │   │   ├── clients/        # Server and browser clients
│   │   │   │   ├── server-client.server.ts    # Request-scoped server client
│   │   │   │   ├── server-admin-client.server.ts  # Admin/service role client
│   │   │   │   └── browser-client.ts   # Browser client
│   │   │   ├── hooks/          # React hooks (auth, user, mutations)
│   │   │   ├── auth.ts         # Auth helpers
│   │   │   └── require-user.ts # Auth check utility
│   │   ├── webhooks/           # Database webhook handlers, verifiers, routers
│   │   ├── workspace/          # Org/workspace loaders and access control
│   │   │   ├── org-workspace-loader.server.ts  # Load org context and nav
│   │   │   ├── require-module-access.server.ts # Module access check
│   │   │   ├── access-gate.tsx # Access-denied component wrapper
│   │   │   └── types.ts        # Workspace type definitions
│   │   ├── cookies.ts          # Cookie serialization (theme, sidebar, etc.)
│   │   ├── database.types.ts   # Generated TypeScript types from Supabase schema
│   │   └── require-user-loader.ts  # Auth check for loaders
│   ├── routes/                 # React Router page routes (file-based routing)
│   │   ├── index.ts            # Root, redirects to /auth/sign-in
│   │   ├── version.ts          # GET /version (app version info)
│   │   ├── healthcheck.ts      # GET /healthcheck (health status)
│   │   ├── no-access.tsx       # /no-access (permission denied page)
│   │   ├── workspace-redirect.tsx  # /home (redirect to current account)
│   │   ├── api/                # API routes (actions only, no pages)
│   │   │   ├── ai/             # /api/ai/* - AI endpoints
│   │   │   │   ├── chat.ts     # Stream text responses
│   │   │   │   └── form-assist.ts  # Form field suggestions
│   │   │   └── db/             # /api/db/* - Database operations
│   │   │       └── webhook.ts  # Handle Supabase database change webhooks
│   │   ├── auth/               # Authentication routes (auth layout group)
│   │   │   ├── layout.tsx      # Auth shell (sign-in form container)
│   │   │   ├── sign-in.tsx     # /auth/sign-in page
│   │   │   ├── password-reset.tsx   # /auth/password-reset
│   │   │   ├── update-password.tsx  # /auth/update-password
│   │   │   ├── callback.tsx    # /auth/callback (OAuth redirect handler)
│   │   │   └── callback-error.tsx   # /auth/callback/error (OAuth error)
│   │   └── workspace/          # Workspace routes (workspace layout group)
│   │       ├── layout.tsx      # Workspace shell (sidebar + outlet)
│   │       ├── home.tsx        # /home/:account (home dashboard)
│   │       ├── settings.tsx    # /home/:account/settings (account settings)
│   │       ├── module.tsx      # /home/:account/:module (module home)
│   │       ├── sub-module.tsx  # /home/:account/:module/:subModule (list view)
│   │       ├── sub-module-create.tsx  # /home/:account/:module/:subModule/create (form)
│   │       └── sub-module-detail.tsx  # /home/:account/:module/:subModule/:recordId (detail view)
│   ├── styles/                 # Global CSS (Tailwind)
│   │   └── global.css          # Global styles, Tailwind imports
│   ├── entry.server.tsx        # Server entry point (streaming, bot detection)
│   ├── root.tsx                # Root layout, theme, i18n, CSRF provider
│   └── routes.ts               # Route configuration (maps paths to files)
├── packages/                   # Monorepo shared packages
│   ├── ui/                     # UI component library
│   │   ├── src/
│   │   │   ├── shadcn/         # Shadcn UI components (Button, Form, Card, etc.)
│   │   │   ├── kit/            # Custom Aloha-branded components
│   │   │   ├── hooks/          # Custom React hooks (useIsMobile, etc.)
│   │   │   └── lib/            # Utilities (cn, class merging)
│   │   └── package.json        # Exported as @aloha/ui
│   └── mcp-server/             # Model Context Protocol server for AI integration
├── e2e/                        # End-to-end tests (Playwright)
│   ├── tests/                  # Test files organized by feature
│   │   ├── auth/               # Auth tests (sign-in, password reset)
│   │   ├── crud/               # CRUD tests (create, update, delete, search)
│   │   └── *.po.ts             # Page object files for selectors
│   ├── playwright.config.ts    # Playwright configuration
│   └── fixtures/               # Test data factories, auth tokens
├── supabase/                   # Database schema and migrations
│   ├── schemas/                # SQL table definitions, RLS policies, views
│   ├── migrations/             # Numbered migration files
│   ├── tests/                  # pgTAP unit tests for database
│   ├── config.toml             # Supabase local dev configuration
│   └── seed.sql                # Database seed data for development
├── tooling/                    # Build tools, dev dependencies, linting config
│   ├── eslint/                 # ESLint configuration package
│   ├── prettier/               # Prettier configuration package
│   ├── tailwind/               # Tailwind CSS configuration package
│   └── typescript/             # TypeScript configuration package
├── .planning/                  # GSD planning documents (phases, codebase analysis)
│   └── codebase/               # Codebase mapping documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
├── .claude/                    # Claude AI development tools and skills
├── docs/                       # Developer documentation
├── public/                     # Static assets, locale JSON files
│   └── locales/                # i18n translation files
├── build/                      # Compiled output (gitignored)
├── .react-router/              # React Router generated files and types
├── .turbo/                     # Turborepo cache
├── package.json                # Root workspace manifest
├── pnpm-workspace.yaml         # Workspace configuration
├── pnpm-lock.yaml              # Dependency lock file
├── react-router.config.ts      # React Router SSR configuration
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # Root TypeScript configuration
├── eslint.config.mjs           # Root ESLint configuration
├── CLAUDE.md                   # Claude AI project instructions
├── DESIGN.md                   # Design system documentation
├── SCHEMA_CONVENTIONS.md       # Database schema conventions
└── README.md                   # Project overview
```

## Directory Purposes

**`app/components/`:**
- Purpose: React components organized by feature domain
- Contains: Auth forms, CRUD UI, navigation, AI chat, shared atoms
- Pattern: `kebab-case.tsx` file names, PascalCase component names
- Key files: `root-providers.tsx` (global context), `root-error-boundary.tsx` (error page), `workspace-sidebar.tsx` (left nav)

**`app/config/`:**
- Purpose: Configuration files for app settings, feature flags, and metadata
- Contains: Environment-specific settings, auth providers, feature toggles, icon mappings
- Pattern: `*.config.ts` file names, exported as constants or functions
- Key: Changes here affect behavior across app without code changes

**`app/lib/`:**
- Purpose: Shared utilities, helpers, and business logic
- Contains: Supabase clients, auth helpers, CRUD operations, validation schemas
- Organization: Organized by concern (auth, crud, supabase, workspace, etc.)
- Pattern: `.server.ts` suffix for server-only files; never imported client-side

**`app/lib/crud/`:**
- Purpose: CRUD module system — maps submodule slugs to table configs and form schemas
- Contains: Registry, module configs, action helpers, data loading helpers
- Module Config Files: `hr-employee.config.ts`, `invnt-item.config.ts`, etc. (one per Supabase table)
- Key Pattern: Each config exports metadata (table name, columns, schema, joins) used by list/detail/create routes

**`app/lib/supabase/clients/`:**
- Purpose: Supabase database clients with different auth scopes
- Contains:
  - `server-client.server.ts`: Request-scoped client with session cookies (used in loaders/actions)
  - `server-admin-client.server.ts`: Service role client for admin operations
  - `browser-client.ts`: Client-side Supabase client for React hooks

**`app/routes/`:**
- Purpose: Page routes organized by feature layout groups
- Pattern: File-based routing via `@react-router/fs-routes`; each file exports `loader`, `action`, `default` component
- Layout Groups:
  - `auth/`: Authentication pages (no sidebar)
  - `workspace/`: Authenticated pages (with sidebar and org context)
  - `api/`: API routes (actions only, no UI)

**`app/routes/workspace/`:**
- Purpose: Authenticated app routes with org workspace context
- Files:
  - `layout.tsx`: Workspace shell (sidebar, header, outlet)
  - `sub-module.tsx`: List/table view for CRUD records
  - `sub-module-create.tsx`: Create/edit form view
  - `sub-module-detail.tsx`: Single record detail view
- Pattern: Each uses `getModuleConfig()` to load dynamic config for its module

**`packages/ui/`:**
- Purpose: Shared component library exported as `@aloha/ui`
- Contains: Shadcn UI components, custom Aloha components, utilities
- Organization:
  - `shadcn/`: Shadcn primitive components (Button, Card, Dialog, Form, etc.)
  - `kit/`: Custom Aloha-branded components (Page, Navigation, etc.)
  - `lib/`: Class name utilities (cn, tailwind-merge)

**`e2e/`:**
- Purpose: End-to-end tests via Playwright
- Organization: Tests grouped by feature (auth, crud)
- Page Objects: `*.po.ts` files define selectors and interactions for each page
- Config: `playwright.config.ts` sets base URL, timeouts, browser options

**`supabase/schemas/`:**
- Purpose: Database schema definitions, RLS policies, views
- Contains: CREATE TABLE, CREATE POLICY (RLS), CREATE VIEW statements
- Views: `app_org_context`, `app_navigation`, `app_user_orgs` enforce tenant isolation

**`tooling/`:**
- Purpose: Shared build and dev tool configurations
- Contains: ESLint, Prettier, Tailwind, TypeScript configs as packages
- Usage: Root and workspace packages extend these configs

**`public/locales/`:**
- Purpose: i18n translation files organized by language
- Pattern: `locales/[lang]/[namespace].json` (e.g., `locales/en/auth.json`)
- Usage: Lazy-loaded by i18next, not bundled

## Key File Locations

**Entry Points:**
- `app/entry.server.tsx`: Server entry point (streaming, bot detection)
- `app/root.tsx`: Root layout, theme, i18n, CSRF provider
- `app/routes.ts`: Route configuration

**Configuration:**
- `app/config/app.config.ts`: App metadata, theme colors, site title
- `app/config/feature-flags.config.ts`: Feature toggles (team accounts, sidebar trigger, theme toggle)
- `app/config/auth.config.ts`: OAuth providers list
- `app/config/module-icons.config.ts`: Module slug to icon mappings

**Core Logic:**
- `app/lib/workspace/org-workspace-loader.server.ts`: Load org, user, navigation
- `app/lib/supabase/clients/server-client.server.ts`: Request-scoped database client
- `app/lib/crud/registry.ts`: Module slug to config mapping
- `app/lib/crud/crud-action.server.ts`: Create/update/delete with validation
- `app/lib/auth/sign-in.ts`: Email/password authentication
- `app/lib/ai/build-system-prompt.server.ts`: Generate Claude system prompt

**Testing:**
- `app/lib/crud/__tests__/`: Vitest unit tests for CRUD helpers
- `e2e/tests/`: Playwright end-to-end tests
- `supabase/tests/`: pgTAP database tests

**Database:**
- `supabase/schemas/`: SQL table definitions and RLS policies
- `supabase/migrations/`: Numbered migration files (executed in order)
- `app/lib/database.types.ts`: Generated TypeScript types (from `pnpm supabase:typegen`)

## Naming Conventions

**Files:**
- React components: `kebab-case.tsx` — e.g., `password-sign-in-form.tsx`, `module-sidebar-navigation.tsx`
- Server-only modules: `.server.ts` suffix — e.g., `org-workspace-loader.server.ts`, `create-csrf-protect.server.ts`
- Zod schemas: `.schema.ts` suffix — e.g., `password-sign-in.schema.ts`
- Page objects for E2E: `.po.ts` suffix — e.g., `auth.po.ts`
- Route loaders/components: `kebab-case.tsx` in route directories
- Config files: `.config.ts` suffix — e.g., `app.config.ts`, `hr-employee.config.ts`

**Directories:**
- Features: `kebab-case` — e.g., `ai`, `auth`, `crud`, `supabase`
- Components by feature: `kebab-case` — e.g., `sidebar`, `navbar`, `components/auth/`

**Functions:**
- camelCase — e.g., `handleGenerate()`, `loadOrgWorkspace()`, `crudCreateAction()`

**Variables:**
- camelCase — e.g., `currentOrg`, `tableData`, `accountSlug`

**React Components:**
- PascalCase — e.g., `ModuleSidebarNavigation`, `PasswordSignInForm`, `AiChatProvider`

**Types & Interfaces:**
- `interface` for component props — e.g., `interface ModuleSidebarNavigationProps`
- `type` for utility types and unions — e.g., `type AppNavModule`

## Where to Add New Code

**New Feature:**
- Primary code: `app/lib/[feature]/*.ts` (utilities), `app/components/[feature]/*.tsx` (UI)
- Routes: `app/routes/workspace/[feature].tsx` or `app/routes/api/[feature].ts`
- Tests: Co-located in same directory as implementation, e.g., `app/lib/[feature]/__tests__/*.test.ts`

**New Component/Module:**
- UI component: `app/components/[feature]/[name].tsx`
- Feature utilities: `app/lib/[feature]/[name].ts` or `.server.ts`
- If reusable across apps: Add to `packages/ui/src/`

**New CRUD Module:**
- Create module config: `app/lib/crud/[module-name].config.ts` (export `CrudModuleConfig`)
- Register in: `app/lib/crud/registry.ts` (add entry to `Map`)
- Create schema: `app/lib/auth/schemas/[module-name].schema.ts` if custom validation needed
- Routes use: `getModuleConfig(subModuleSlug)` automatically

**Database Changes:**
- Schema: Add table definition to `supabase/schemas/*.sql` or new file
- Migration: Create `supabase/migrations/[timestamp]_[description].sql`
- RLS Policies: Add `CREATE POLICY` statements in schema
- View: Add to `supabase/schemas/` if new view needed for tenant filtering
- Types: Run `pnpm supabase:typegen` to regenerate `app/lib/database.types.ts`

**Utilities:**
- Shared helpers: `app/lib/shared/utils.ts` or new file in `app/lib/shared/`
- Server-only utilities: `app/lib/[concern]/[name].server.ts`
- Client/Server compatible: `app/lib/[concern]/[name].ts`

**Configuration:**
- App settings: `app/config/app.config.ts`
- Feature flags: `app/config/feature-flags.config.ts`
- Auth config: `app/config/auth.config.ts`
- Paths: `app/config/paths.config.ts`

## Special Directories

**`.react-router/`:**
- Purpose: Generated by React Router build process
- Contains: Route types, manifest, type definitions
- Generated: Yes (do not edit manually)
- Committed: No (gitignored)

**`.turbo/`:**
- Purpose: Turborepo build cache
- Generated: Yes
- Committed: No (gitignored)

**`build/`:**
- Purpose: Compiled SSR server and client assets
- Contains: `build/server/index.js` (SSR entry), static assets
- Generated: Yes (via `pnpm build`)
- Committed: No (gitignored)

**`public/locales/`:**
- Purpose: i18n translation JSON files
- Generated: No (manually maintained)
- Committed: Yes
- Pattern: `locales/[lang]/[namespace].json`

---

*Structure analysis: 2026-04-07*
