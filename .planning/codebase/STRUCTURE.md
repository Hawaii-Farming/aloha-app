# Project Structure

## Top-Level Directory Layout

```
aloha-app/
  app/                  # Main React Router application (routes, components, lib, config)
  build/                # Build output (server + client bundles)
  docs/                 # Schema documentation and workflow process docs
  e2e/                  # Playwright end-to-end tests
  packages/             # Monorepo shared packages (ui, mcp-server)
  public/               # Static assets served directly
  scripts/              # Utility scripts (python/, sql/)
  supabase/             # Database: migrations, schemas, seeds, config, email templates
  tooling/              # Build tool configs (eslint, prettier, tailwind, typescript)
  turbo/                # Turborepo generator templates
```

**Root config files:**

| File | Purpose |
|---|---|
| `package.json` | Root workspace package; all app dependencies listed here |
| `pnpm-workspace.yaml` | Workspace definition: `e2e`, `packages/**`, `tooling/*` |
| `turbo.json` | Turborepo task orchestration (build, dev, lint, typecheck, test) |
| `vite.config.ts` | Vite build configuration with React Router and Tailwind plugins |
| `react-router.config.ts` | SSR enabled; Vercel preset available but disabled |
| `tsconfig.json` | Root TypeScript config |
| `eslint.config.mjs` | ESLint flat config |
| `CLAUDE.md` | AI development guidance and project conventions |

## Monorepo Workspace Organization

The project uses pnpm workspaces with Turborepo orchestration. Workspace packages are referenced via `@aloha/*` imports.

### packages/

```
packages/
  mcp-server/           # Model Context Protocol server for AI tooling
    src/
      index.ts
      tools/            # MCP tools: components, database, migrations, prd-manager, prompts, scripts
  ui/                   # Component library (@aloha/ui)
    src/
      hooks/            # Custom hooks (use-mobile.tsx)
      kit/              # Custom components (data-table, form-fields, sidebar, page, etc.)
        context/        # React contexts (sidebar.context.ts)
        marketing/      # Marketing components (coming-soon.tsx)
      lib/              # Utility functions
      shadcn/           # Shadcn UI component wrappers (alert-dialog, button, card, form, etc.)
```

### tooling/

```
tooling/
  eslint/               # @aloha/eslint-config — shared ESLint flat config (base, react, apps)
  prettier/             # @aloha/prettier-config — Prettier with import sorting + Tailwind
  tailwind/             # @aloha/tailwind-config — shared Tailwind CSS v4 config
  typescript/           # @aloha/tsconfig — shared TypeScript base configs
```

### e2e/

```
e2e/
  tests/                # Playwright test files
  playwright.config.ts  # Playwright configuration
  package.json
```

## App Directory Structure

The `app/` directory contains the main React Router application:

```
app/
  entry.server.tsx      # Server entry: bot detection, streaming HTML rendering
  root.tsx              # Root route: CSRF, theme, i18n, global providers, error boundary
  routes.ts             # Route definitions (rootRoutes, apiRoutes, authLayout, workspaceLayout)
  styles/               # CSS files
    global.css          # Global styles entry
    kit.css             # Kit component styles
    shadcn-ui.css       # Shadcn UI theme variables
    theme.css           # Theme definitions
    theme.utilities.css # Theme utility classes
  components/           # Shared React components
    ai/                 # AI chat panel, form assist, provider
    auth/               # Auth-related components
    sidebar/            # Workspace sidebar, navigation, org selector
    app-logo.tsx
    auth-provider.tsx
    react-query-provider.tsx
    root-error-boundary.tsx
    root-head.tsx
    root-providers.tsx
    user-profile-dropdown.tsx
  config/               # Application configuration (Zod-validated)
    app.config.ts       # App metadata (title, description, theme)
    auth.config.ts      # Auth provider configuration
    feature-flags.config.ts
    module-icons.config.ts  # Icon mapping for ERP modules
    paths.config.ts     # URL path constants
    workspace-navigation.config.tsx
  lib/                  # Server and shared utilities
    ai/                 # AI integration
      ai-context.ts
      build-system-prompt.server.ts
      workflow-automation.server.ts
    auth/               # Auth helpers
      password-reset.ts
      schemas/          # Zod schemas for auth forms
      shared.ts
      sign-in.ts
      view-contracts.ts # TypeScript types for SQL views
    crud/               # Generic CRUD engine
      crud-action.server.ts    # Create, update, delete, transition actions
      crud-helpers.server.ts   # loadTableData, loadDetailData helpers
      hr-department.config.ts  # CRUD config for HR departments
      invnt-item.config.ts     # CRUD config for inventory items
      registry.ts              # Map<slug, CrudModuleConfig> — central config registry
      render-form-field.tsx    # Dynamic form field renderer
      types.ts                 # CrudModuleConfig, ColumnConfig, FormFieldConfig, WorkflowConfig
      workflow-helpers.ts      # Workflow history/default value builders
    csrf/               # CSRF protection (client + server)
    i18n/               # Internationalization
      i18n.server.ts    # Server-side i18n instance factory
      i18n-client.ts    # Client-side i18n
      i18n-provider.tsx # React i18n provider
      locales/          # Translation files
    shared/             # Cross-cutting utilities
      hooks/            # Shared React hooks
      logger/           # Logger abstraction
      utils.ts
    supabase/           # Supabase client wrappers
      auth-callback.service.server.ts
      auth.ts
      clients/
        browser-client.ts              # Client-side Supabase client
        server-admin-client.server.ts  # Service role client (bypasses RLS)
        server-client.server.ts        # Request-scoped client (cookie-based)
      get-service-role-key.ts
      get-supabase-client-keys.ts
      hooks/
      require-user.ts
    webhooks/           # Database webhook handling
      database-webhook-handler.service.ts
      database-webhook-router.service.ts
      database-webhook-verifier-factory.ts
      database-webhook-verifier.service.ts
      postgres-database-webhook-verifier.service.ts
      record-change.type.ts
    workspace/          # Workspace context and access control
      access-gate.tsx              # Client-side permission gate component
      home-loader.server.ts
      org-workspace-loader.server.ts  # Fetches org context + navigation
      require-module-access.server.ts # Server-side module/sub-module guards
      types.ts                        # AppNavModule, AppNavSubModule types
      use-module-access.ts            # Client-side access hook
    cookies.ts          # Cookie definitions (theme, sidebar, layout)
    database.types.ts   # Auto-generated Supabase TypeScript types
    org-storage.ts      # Org-scoped storage helpers
    require-user-loader.ts  # Auth guard: redirect to sign-in if unauthenticated
```

## Route Structure

Routes are defined manually in `app/routes.ts` (not file-system routing):

### Root Routes

```
/                   routes/index.ts           # Landing/redirect
/version            routes/version.ts         # Version endpoint
/healthcheck        routes/healthcheck.ts     # Health check
/home               routes/workspace-redirect.tsx  # Redirect to user's org
/no-access          routes/no-access.tsx      # Access denied page
```

### API Routes

```
/api/db/webhook     routes/api/db/webhook.ts       # Supabase database webhooks
/api/ai/chat        routes/api/ai/chat.ts           # AI chat endpoint
/api/ai/form-assist routes/api/ai/form-assist.ts    # AI form auto-fill endpoint
```

### Auth Layout (`/auth/*`)

Wrapped in `routes/auth/layout.tsx`:

```
/auth/sign-in           routes/auth/sign-in.tsx
/auth/password-reset    routes/auth/password-reset.tsx
/auth/update-password   routes/auth/update-password.tsx
/auth/callback          routes/auth/callback.tsx
/auth/callback/error    routes/auth/callback-error.tsx
```

### Workspace Layout (`/home/:account/*`)

Wrapped in `routes/workspace/layout.tsx` (org context, sidebar/header, AI chat):

```
/home/:account                                    routes/workspace/home.tsx          # Org dashboard
/home/:account/settings                           routes/workspace/settings.tsx      # Org settings
/home/:account/:module                            routes/workspace/module.tsx         # Redirects to first sub-module
/home/:account/:module/:subModule                 routes/workspace/sub-module.tsx     # List view (DataTable)
/home/:account/:module/:subModule/create          routes/workspace/sub-module-create.tsx  # Create form
/home/:account/:module/:subModule/:recordId       routes/workspace/sub-module-detail.tsx  # Detail view
/home/:account/:module/:subModule/:recordId/edit  routes/workspace/sub-module-create.tsx  # Edit form (shared route)
```

The workspace uses a generic CRUD pattern: the same route files handle all modules/sub-modules, driven by config from the CRUD registry.

## Database Schema Organization

### supabase/schemas/ (Reference SQL)

Numbered SQL schema files defining the base template schema:

```
00-privileges.sql    # Database role privileges
01-enums.sql         # Shared enum types
02-config.sql        # Configuration tables
03-accounts.sql      # Template account/membership tables
```

### supabase/migrations/ (95 files)

All schema changes as timestamped migrations:

```
20250301000000_schema.sql         # Base template schema (accounts, memberships, etc.)
20260326000001_org.sql            # org table (ERP tenant)
20260326000002–000005             # fsafe_lab, sys_uom, org_farm, fsafe_lab_test
20260326000006–000011             # HR: work_authorization, department, site, access_level, title, employee
20260326000012–000019             # Sales: customer_group, fob, customer, po; Pack: lot; Fsafe: test_hold, result
20260326000020–000035             # Grow: cycle_pattern, disease, variety, field, planting, seeding, harvesting, etc.
20260326000036–000050             # Grow (continued): scouting, spraying, fertigation, monitoring
20260326000051–000064             # Inventory: vendor, category, item, location, onhand, PO, PO received
20260326000065–000075             # Ops: template_category, template, question, response, corrective_action, task_schedule, training
20260326000076–000078             # System: business_rule, sys_sub_module, org_sub_module
20260326000079–000091             # Pack: fail_category, lot_item, productivity; Sales: product, product_price, PO line, fulfillment
20260326000092_rls_policies.sql   # RLS policies for all tables
20260326000093_view_contracts.sql # SQL views (app_org_context, app_nav_modules, app_user_orgs, etc.)
20260326000094_nav_view_contracts.sql # Navigation view contracts
```

ERP modules covered: sys (system), org (organization), hr (human resources), sales, pack (packing), grow (growing), invnt (inventory), ops (operations), fsafe (food safety), maint (maintenance).

### supabase/seed/

```
dev.sql              # Development seed data
```

### supabase/templates/

```
change-email-address.html   # Email template
reset-password.html         # Email template
```

## Documentation

```
docs/
  SCHEMA_CONVENTIONS.md           # SQL naming and design conventions
  schema-visual.html              # Visual schema diagram
  schemas/                        # Per-module schema documentation
    20260326_01_sys.md            # System tables
    20260326_02_org.md            # Organization tables
    20260326_03_invnt.md          # Inventory tables
    20260326_04_hr.md             # HR tables
    20260326_05_ops.md            # Operations tables
    20260326_06_grow.md           # Growing tables
    20260326_07_pack.md           # Packing tables
    20260326_08_sales.md          # Sales tables
    20260326_09_maint.md          # Maintenance tables
    20260326_10_fsafe.md          # Food safety tables
    20260326_11_future.md         # Planned future tables
  processes/                      # Workflow documentation
    20260326_01–10_*.md           # Org provisioning, user access, grow workflows,
                                  # ops tasks, pack productivity
```

## Key File Patterns and Naming Conventions

### File Naming

| Pattern | Example | Used For |
|---|---|---|
| `kebab-case.tsx` | `password-sign-in-container.tsx` | React components |
| `kebab-case.server.ts` | `org-workspace-loader.server.ts` | Server-only modules |
| `kebab-case.service.ts` | `database-webhook-handler.service.ts` | Service classes |
| `kebab-case.schema.ts` | `password-sign-in.schema.ts` | Zod validation schemas |
| `kebab-case.config.ts` | `hr-department.config.ts` | CRUD module configs |
| `kebab-case.po.ts` | `auth.po.ts` | E2E page objects |
| `*.types.ts` | `database.types.ts` | Type definition files |

### Export Patterns

- **Route pages:** `export default function PageName()` (default export, PascalCase function declaration)
- **Route loaders/actions:** `export const loader`, `export const action` (named exports)
- **Components:** `export function ComponentName()` (named export)
- **Service factories:** `createXxxService(client)` pattern
- **Server actions:** Named `xyzAction` (e.g., `crudCreateAction`)

### Import Aliases

- `@aloha/*` -- monorepo package imports (e.g., `@aloha/ui/button`, `@aloha/ui/page`)
- `~/` -- app-level imports (e.g., `~/lib/crud/registry`, `~/config/app.config`)

### CRUD Config Files

Each entity that uses the generic CRUD system has a config file in `app/lib/crud/`:

```typescript
// Example: hr-department.config.ts
export const hrDepartmentConfig: CrudModuleConfig = {
  tableName: 'hr_department',
  pkType: 'text',
  orgScoped: true,
  views: { list: 'hr_department', detail: 'hr_department' },
  columns: [...],
  formFields: [...],
  schema: z.object({...}),
};
```

Registered in `registry.ts`:
```typescript
const registry = new Map<string, CrudModuleConfig>([
  ['departments', hrDepartmentConfig],
  ['products', invntItemConfig],
]);
```

### Server-Client Boundary

Files with `.server.ts` suffix or in `.server` directories are excluded from client bundles:
- `*.server.ts` -- individual server-only files
- All Supabase client creation happens server-side
- All database queries run in loaders/actions (server-side)
- Client components receive pre-fetched data via `props.loaderData`
