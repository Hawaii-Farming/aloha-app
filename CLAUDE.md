# CLAUDE.md

## Core Stack

- **React Router 7** (SSR/Framework mode) + **Vite** + **React 19** + **TypeScript**
- **Supabase** (PostgreSQL 17, Auth, RLS, Realtime)
- **Tailwind CSS 4** + **Shadcn UI** (Radix primitives) + **Lucide React** icons
- **Turborepo** monorepo with pnpm workspaces

## Project Structure

- Root — Main React Router app (`app/`, `supabase/`)
- `e2e/` — Playwright E2E tests
- `packages/ui/` — Shadcn component library (`@aloha/ui`)
- `packages/features/` — Feature packages
- `packages/tooling/` — Shared configs (ESLint, Prettier, TypeScript, Tailwind)

## Multi-Tenant Architecture

This app uses a **dual multi-tenant model** during the foundation phase:

- **Template layer** (`accounts`/`memberships`): Built-in auth — login, session management, team account switching. Powers the UI shell.
- **Business layer** (`org`/`hr_employee`): Aloha's own ERP access control — `org` is the tenant, `hr_employee` is membership, `sys_access_level` defines role tiers (employee→owner), `hr_module_access` controls per-employee CRUD permissions, `org_module`/`org_sub_module` control feature toggles per org.

Long-term goal: merge template auth into aloha's org/hr_employee model. For now, both coexist.

## Supabase: Hosted (NOT Local Docker)

This project uses **hosted Supabase** — there is no local Docker instance. Do NOT run `pnpm supabase:start`, `pnpm supabase:reset`, or any command that assumes a local Supabase container.

**NEVER directly modify, create, or delete tables/schemas on the hosted database.** All schema changes must go through migration files (`supabase/migrations/`). Only a human runs `supabase db push` to apply migrations to hosted — Claude must never run this command.

- **Create migration**: `pnpm supabase db diff` (creates a local migration file)
- **Generate types**: `npx supabase gen types --lang typescript --linked > app/lib/database.types.ts`

## Essential Commands

```bash
pnpm dev                    # Start app (port 5173)
pnpm supabase db diff       # Create migration diff (local file only)
pnpm typecheck              # Run regularly during work
pnpm format:fix && pnpm lint:fix  # Run when task is complete
# supabase db push          # HUMAN ONLY — pushes migrations to hosted Supabase
# npx supabase gen types --lang typescript --linked  # HUMAN ONLY — regenerate types from hosted
```

## Coding Preferences

### TypeScript
- Implicit type inference unless impossible — never use `any`
- `interface` for props, `type` for utilities/unions/derived types
- Handle errors with try/catch and appropriate error types

### React
- Functional components only
- **`useEffect` is a code smell** — side effects go in event handlers, loaders, or React Query. Must be justified if used.
- Prefer single `useState` object over multiple hooks for related state
- `useCallback` for event handlers passed as props
- Never use `watch()` — use `useWatch` instead
- `useFetcher()` for mutations without navigation
- React Query for client-side async data
- Server state via `loader` data as `props.loaderData`
- Add `data-test` attributes for E2E test selectors

### Forms
- Schema in separate `.schema.ts` file
- `useForm({ resolver: zodResolver(Schema) })` — no explicit generics (Zod infers)
- Always include `<FormMessage />` in every field

### Comments
- Avoid obvious comments — only comment the "why" when not clear from code

## Naming Conventions

| What | Pattern | Example |
|------|---------|---------|
| Component files | `kebab-case.tsx` | `password-sign-in-form.tsx` |
| Server-only | `.server.ts` suffix | `org-workspace-loader.server.ts` |
| Schemas | `.schema.ts` suffix | `password-sign-in.schema.ts` |
| E2E page objects | `.po.ts` suffix | `auth.po.ts` |
| Config files | `.config.ts` suffix | `module-icons.config.ts` |
| Functions | camelCase | `handleGenerate()` |
| Components | PascalCase | `ModuleSidebarNavigation` |
| Server actions | `xyzAction` | `deletePersonalAccountAction` |
| Page components | `export default function` | `export default function App()` |
| Other exports | Named exports | `export { loader, action, meta }` |

## Imports

- `@aloha/*` — monorepo packages
- `~/` — app-level imports (aliased to `./app/`)
- Prettier handles import ordering and grouping automatically

## Architecture Essentials

- **SSR-first**: Routes export `loader` (server) + `default` component (client) + optional `action`
- **Server/client boundary**: `.server.ts` files are never imported client-side
- **Request-scoped Supabase**: `getSupabaseServerClient(request)` — new client per request with auto cookie management
- **Tenant isolation**: SQL views (`app_org_context`, `hr_rba_navigation`, `app_user_orgs`) use `auth.uid()` + `hr_employee` membership to filter rows. RLS policies enforce at database layer.
- **CRUD registry**: `getModuleConfig(subModuleSlug)` maps URL slugs → table metadata, form schemas, column definitions
- **CSRF**: Token generated in root loader, stored in meta tag, validated in form actions
- **Workspace loader**: `loadOrgWorkspace()` loads org context + navigation for layout — fresh per request
- **Auth guard**: `requireUserLoader(request)` throws `redirect('/auth/sign-in')` on auth failure

## Error Handling

- **Auth**: `requireUserLoader()` → redirect to sign-in
- **Permissions**: `requireModuleAccess()` / `requireSubModuleAccess()` → redirect to `/no-access`
- **Validation**: Zod in actions → `{ success: false, errors }` → `<FormMessage />`
- **Route errors**: `RootErrorBoundary` catches unhandled errors
- **API errors**: Return `new Response(null, { status: 500 })`
- **Database**: Check `.error` on Supabase result, throw/redirect on failure

## Data Tables

**Always use AG Grid Community** for data tables — never TanStack Table, HTML tables, or other table libraries.

- **Standard CRUD grids**: Use `AgGridListView` (drop-in, handles search, CSV export, column visibility, pagination)
- **Custom grids** (filters, toggles, pinned rows): Compose `AgGridWrapper` directly for full toolbar control
- **Theming**: AG Grid is themed to DESIGN.md via `ag-grid-theme.ts` (dark/light, Supabase-inspired)
- **Detail rows**: Use `useDetailRow` hook for row-click-to-expand (full-width detail rows)
- **Column mapping**: `mapColumnsToColDefs()` converts `CrudModuleConfig` columns to AG Grid `ColDef[]`
- **Cell renderers**: `PillRenderer`, `StatusBadgeRenderer`, `EmployeeCellRenderer`, `DatePillRenderer` — reuse existing renderers
- **Column state**: Persisted to localStorage via `saveColumnState`/`restoreColumnState`
- **MCP docs**: Use the `ag-mcp` MCP server for AG Grid API reference

## Design System

The current project is a comprehensive retheme adopting a Supabase-inspired design system. **`DESIGN.md` is the source of truth** for all visual decisions — colors, typography, spacing, component styling, and theme tokens. Read it before any UI/CSS work.

### Constraints

- Shadcn UI + Tailwind CSS 4 + Radix — no new UI libraries
- Must preserve existing `next-themes` infrastructure
- No breaking changes to component props or usage patterns
- WCAG AA color contrast in both dark and light themes

## Project Skills

| Skill | Invoke with | Use when |
|-------|-------------|----------|
| playwright-e2e | `/playwright-e2e` | E2E tests, Playwright, test automation |
| postgres-expert | `/postgres-expert` | SQL, schemas, migrations, RLS, pgTAP |
| react-form-builder | `/react-form-builder` | Forms, validation, react-hook-form |
| server-action-builder | `/server-action-builder` | Route actions, mutations, Zod validation |
| service-builder | `/service-builder` | Business logic services with DI |

<!-- GSD:project-start source:PROJECT.md -->
## Project

See `.planning/PROJECT.md` for current milestone scope, requirements, and constraints.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - All application code, packages, tooling, and configuration
- SQL (PostgreSQL 15) - Database schemas, migrations, and RLS policies in `supabase/schemas/` and `supabase/migrations/`
- HTML/CSS - Templates via Tailwind CSS v4 utility classes; no raw CSS files
- JavaScript - Node.js build scripts and tooling entry points
## Runtime
- Node.js >=20.x (root workspace requirement), >=18.x (web app compatible)
- pnpm 10.18.1 - Package manager (configured in `package.json` `packageManager` field)
- pnpm 10.18.1
- Lockfile: `pnpm-lock.yaml` (present)
- Workspaces: Configured in `pnpm-workspace.yaml` with catalog pinning for consistent versions across packages
- Workspace catalog: `@supabase/supabase-js` 2.89.0, `@tanstack/react-query` 5.90.12, `react` 19.2.3, `zod` 3.25.74, `@types/node` 25.0.3, `@types/react` 19.2.7, `supabase` 2.67.3, `tw-animate-css` 1.4.0
## Frameworks
- React Router 7.12.0 (`react-router`, `@react-router/dev`, `@react-router/serve`, `@react-router/node`) - SSR/Framework mode with file-based routing via `@react-router/fs-routes` 7.12.0
- React 19.2.3 - UI rendering framework
- Vite 7.3.0 - Build tool and dev server via `@react-router/dev/vite`
- Tailwind CSS 4.1.18 (`tailwindcss`, `@tailwindcss/vite`) - Utility-first CSS framework
- Custom Tailwind config: `@aloha/tailwind-config/vite` plugin for Vite integration at `packages/tooling/`
- Shadcn UI - Component library built on Radix UI 1.4.3 primitives; components located in `packages/ui/src/shadcn/`
- Radix UI 1.4.3 - Accessible component primitives
- Lucide React 0.562.0 - Icon library
- Fonts: `@fontsource-variable/geist` 5.2.8, `@fontsource-variable/geist-mono` 5.2.7 (MIT-licensed)
- React Hook Form 7.69.0 - Client form state management
- `@hookform/resolvers` 5.2.2 - Zod resolver integration
- Zod 3.25.74 - TypeScript-first schema validation
- TanStack Query 5.90.12 (`@tanstack/react-query`) - Async client-side data fetching, caching, and synchronization
- TanStack Table 8.21.3 (`@tanstack/react-table`) - Headless data table primitives
- `next-themes` 0.4.6 - Dark/light/system theme toggle support
- i18next 25.7.x - i18n framework
- react-i18next 16.5.x - React i18n provider and hooks
- `i18next-browser-languagedetector` - Auto browser language detection
- `i18next-resources-to-backend` 1.2.1 - Lazy locale loading from `public/locales`
- Recharts 2.15.x - Charting and data visualization library
- `sonner` 2.0.7 - Toast notification system (exported as `@aloha/ui/sonner`)
- `clsx` 2.1.1 - Conditional class name utility
- `tailwind-merge` 3.4.0 - Tailwind CSS class merging utility
- `date-fns` 4.1.0 - Date manipulation utility library
- `input-otp` 1.4.2 - OTP input component primitives
- `react-day-picker` 9.13.0 - Date picker component
- `react-top-loading-bar` 3.0.2 - Top loading progress bar
- `tailwindcss-animate` 1.0.7 - Tailwind CSS animation utilities
- `cmdk` 1.1.1 - Command/search menu component
- `class-variance-authority` 0.7.1 - Type-safe CSS class composition
- Playwright 1.57.x (`@playwright/test`) - Browser automation and E2E test framework
- Vitest 4.1.3 - Unit test runner
- Supabase pgTAP - Database unit tests via `pnpm supabase:test`
- Turborepo 2.6.2 - Build orchestration via `turbo.json`
- `react-router typegen` - Generates route types to `.react-router/types/`
- Supabase CLI - Local database via Docker (PostgreSQL 15)
- ESLint 9.39.2 - Linting framework (flat config format, ESLint 9.x)
- Prettier 3.7.4 - Code formatting
- TypeScript 5.9.3 - Strict type checking
- `cross-env` 10.1.0 - Cross-platform environment variable setting
- `dotenv-cli` 11.0.0 - Load `.env` files in npm scripts via `pnpm with-env`
- `isbot` 5.1.32 - Bot detection for crawler handling in SSR
- `vite-tsconfig-paths` 6.0.3 - Vite plugin for TypeScript path aliases
- `eslint-import-resolver-typescript` 4.4.4 - ESLint import resolver for TS paths
## Key Dependencies
- `@supabase/supabase-js` 2.89.0 - Supabase JavaScript client (database, auth, realtime)
- `@supabase/ssr` 0.8.0 - SSR-compatible Supabase helpers for server client creation with session cookie management
- `postgres` 3.4.7 - PostgreSQL client (used in `packages/mcp-server/` for MCP integration)
- `supabase` 2.67.3 - Supabase CLI for local development, migrations, and type generation
- `pino` 10.1.0 - Structured server-side logging framework (see `app/lib/shared/logger/`)
- `react-router-serve` 7.12.0 - Production SSR server via `react-router-serve ./build/server/index.js`
- `ai` 6.0.141 - Vercel AI SDK for streaming responses
- `@ai-sdk/anthropic` 3.0.64 - Anthropic Claude integration via Vercel AI SDK
- `@ai-sdk/react` 3.0.143 - React hooks for AI SDK
- `@edge-csrf/core` 2.5.3-cloudflare-rc1 - CSRF token generation and verification (see `app/lib/csrf/`)
- Supabase Auth - Built-in auth via `@supabase/supabase-js` (email/password, OAuth providers)
- `nodemailer` 7.0.x - SMTP email sending (optional; configured via `MAILER_PROVIDER` env var)
- Alternative: Resend (swappable via `MAILER_PROVIDER=resend`)
- `@modelcontextprotocol/sdk` 1.24.3 - MCP server SDK in `packages/mcp-server/` for Claude integration
- `@types/node` 25.0.3 - Node.js type definitions
- `@types/react` 19.2.7 - React type definitions
- `@types/react-dom` 19.2.3 - React DOM type definitions
- `manypkg` 0.25.x - Monorepo dependency validation
## Configuration
- `vite.config.ts` - Vite configuration with React Router and Tailwind plugins; SSR enabled; fsevents excluded for macOS compatibility
- `react-router.config.ts` - React Router SSR config; Vercel preset available (commented out)
- `vitest.config.ts` - Vitest unit test configuration
- `turbo.json` - Turborepo task definitions and cache invalidation rules
- `tsconfig.json` - Root TypeScript config with path alias `~/*` → `./app/*`
- Extends `@aloha/tsconfig/base.json` from workspace packages
- `eslint.config.mjs` - ESLint flat config (flat format required for ESLint 9.x)
- `.prettierignore` - Files to exclude from Prettier formatting
- No explicit `.eslintrc` or `.prettierrc` in root — configs via `@aloha/eslint-config` and `@aloha/prettier-config` packages
- `supabase/config.toml` - Supabase local dev configuration
- Schema files: `supabase/schemas/*.sql` (numbered by dependency order)
- Migrations: `supabase/migrations/` (auto-generated via `pnpm supabase db diff`)
- Email templates: `supabase/templates/*.html` for password reset and email change
## Environment Configuration
- `VITE_SITE_URL` - App base URL for auth redirects (e.g., `http://localhost:5173`)
- `VITE_PRODUCT_NAME` - Brand name (e.g., "Aloha")
- `VITE_SITE_TITLE` - Page title
- `VITE_SITE_DESCRIPTION` - Page description
- `VITE_DEFAULT_THEME_MODE` - Theme default (`light` or `dark`)
- `VITE_THEME_COLOR` - Light theme color (hex)
- `VITE_THEME_COLOR_DARK` - Dark theme color (hex)
- `VITE_LOCALES_PATH` - Locale files path (default: `public/locales`)
- `VITE_SUPABASE_URL` - Supabase API endpoint
- `VITE_SUPABASE_PUBLIC_KEY` - Supabase public anon key
- `VITE_AUTH_PASSWORD` - Enable password authentication (`true`/`false`)
- `VITE_AUTH_MAGIC_LINK` - Enable magic link authentication (`true`/`false`)
- `VITE_AUTH_IDENTITY_LINKING` - Enable identity linking (optional)
- `VITE_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX` - Show terms checkbox during sign-up
- `VITE_ENABLE_THEME_TOGGLE` - Show theme toggle in UI
- `VITE_ENABLE_TEAM_ACCOUNTS` - Enable team account features
- `VITE_ENABLE_TEAM_ACCOUNTS_CREATION` - Allow team account creation
- `VITE_ENABLE_TEAM_ACCOUNTS_DELETION` - Allow team account deletion
- `VITE_ENABLE_SIDEBAR_TRIGGER` - Show sidebar toggle
- `VITE_LANGUAGE_PRIORITY` - Language detection priority (`application` or `browser`)
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `ANTHROPIC_API_KEY` - Claude API key for AI features (chat, form assist)
- `SUPABASE_DB_WEBHOOK_SECRET` - Webhook signature verification
- `EMAIL_HOST` - SMTP host (e.g., `localhost` for local dev)
- `EMAIL_PORT` - SMTP port (e.g., `54325` for local Inbucket)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_TLS` - Use TLS (`true`/`false`)
- `EMAIL_SENDER` - Sender email address
- `CONTACT_EMAIL` - Contact form recipient email
- `MAILER_PROVIDER` - Choice of `nodemailer` or `resend`
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret
- `AZURE_OAUTH_CLIENT_ID` - Azure OAuth client ID
- `AZURE_OAUTH_CLIENT_SECRET` - Azure OAuth client secret
- `LOGGER` - Log level configuration
- `.env.template` - Environment variable template with all defaults and descriptions
## Platform Requirements
- Node.js >=20.x
- pnpm 10.18.1
- Docker (optional; Supabase local dev can run via `pnpm supabase:start`)
- Supabase CLI for local database (handles PostgreSQL 15 in Docker)
- Node.js >=18.x (app compatible)
- Supabase hosted project (configured in Supabase console)
- Environment variables set in hosting provider (Vercel, etc.)
- SSR server runs via `react-router-serve ./build/server/index.js` on port configurable via hosting provider
- Build output: `build/` directory containing `build/server/index.js` (SSR entry point) and static assets
- Deployment preset available for Vercel (commented in `react-router.config.ts`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: `kebab-case.tsx` — e.g., `app-logo.tsx`, `sidebar-navigation.tsx`, `create-panel.tsx`, `navbar-search.tsx`
- Server-only modules: `.server.ts` suffix — e.g., `org-workspace-loader.server.ts`, `server-client.server.ts`, `build-system-prompt.server.ts`
- Zod schemas: `.schema.ts` suffix — e.g., `password-sign-in.schema.ts`, `password-reset.schema.ts`
- Page objects for E2E: `.po.ts` suffix — e.g., `auth.po.ts`, `crud.po.ts`
- Route loaders/components: `kebab-case.tsx` in route directories — e.g., `sub-module-create.tsx`, `workspace/layout.tsx`
- Config files: `.config.ts` or `.config.tsx` suffix — e.g., `workspace-navigation.config.tsx`, `app.config.ts`, `module-icons.config.ts`, `hr-employee.config.ts`
- camelCase for all function names — e.g., `handleGenerate()`, `extractFieldDescriptions()`, `derivePageType()`, `loadTableData()`, `sanitizeSearch()`, `createMockSupabaseChain()`
- Server action functions: `xyzAction` suffix — e.g., `deletePersonalAccountAction`
- camelCase for local variables, parameters, and properties — e.g., `currentPath`, `state`, `setOpen`, `hasHandledSuccess`, `testDeptName`
- Destructured object parameters preferred over positional arguments for complex inputs
- PascalCase for component names — e.g., `AppLogo`, `WorkspaceSidebar`, `CreatePanel`, `SidebarEdgeToggle`
- `interface` for component props objects — e.g., `interface CreatePanelProps`, `interface OrgAccount`
- Example from codebase:
- `interface` for component props and object contracts
- `type` for utility types, derived types, and unions — e.g., `type AppNavModule`, `type OrgWorkspace`, `type LoadTableDataParams`
- No explicit generics on `useForm` — Zod resolver infers types automatically
- Default export for page components (function declaration, PascalCase) — e.g., `export default function TeamWorkspaceLayout(props: Route.ComponentProps) { ... }`
- Named exports for `loader`, `action`, `meta`, and utility functions
- Barrel files (index.ts) can export multiple related items
- Prefix with `_` to suppress ESLint warnings — e.g., `_unusedParam`, `_ignored`
## Code Style
- `tabWidth: 2`
- `useTabs: false`
- `semi: true` — always include semicolons
- `printWidth: 80` — wrap lines at 80 characters
- `singleQuote: true` — use single quotes
- `arrowParens: 'always'` — always include parentheses around arrow function parameters
- `@typescript-eslint/no-unused-vars` — error with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'`
- `react/react-in-jsx-scope` — off (React 19 doesn't require import)
- `react/prop-types` — off (use TypeScript instead)
- Import ordering and duplicate elimination enabled via plugins
- Many TypeScript linting rules disabled to prevent overly strict checking (`@typescript-eslint/no-unsafe-assignment`, `no-unsafe-argument`, etc.)
- `@trivago/prettier-plugin-sort-imports` — automatic import ordering
- `prettier-plugin-tailwindcss` — Tailwind class ordering
- TypeScript ESLint plugin for type-aware rules
## Import Organization
- `~/*` → `./app/*` for app-level imports
- `~/types/*` → `./.react-router/types/*` for React Router generated types
## Error Handling
- Check `.error` field on Supabase query results and throw/redirect on failure
- Use `requireUserLoader(request)` to validate session and redirect to sign-in if not authenticated — throws `redirect()` on auth failure
- Example from `require-user-loader.ts`:
- RLS policy denials return `{ data: null, error }` — loader checks and redirects to `/no-access`
- Wrap server operations in try/catch
- Return `new Response(null, { status: 500 })` on failure
- Log errors via `console.error()` in entry handler or specific loaders
- Use error boundaries for render errors — root error boundary: `components/root-error-boundary.tsx`
- Use React Query for async operations — handles error state within query objects
- Form validation via Zod schema — errors displayed via `<FormMessage />` component
## Logging
- `info()`, `error()`, `warn()`, `debug()`, `fatal()` methods
- Accept object + message or message-only patterns
- File: `app/lib/shared/logger/logger.ts` (interface); implementations in `impl/console.ts` and `impl/pino.ts`
- Server-side errors logged in `entry.server.tsx` via `console.error(error)` on shell rendering errors
- Used sparingly in route loaders and server actions
- Not extensively used in components — rely on error boundaries instead
## Comments
- Avoid obvious comments
- Use block comments for complex logic or non-obvious intent
- Comments placed above the code they describe
- Justified only when "why" is not immediately clear from code
- Used for exported functions and components
- Full usage documentation for complex utilities
- Example from `AiFormAssist` (available in codebase):
## Function Design
- Example: `loadTableData({ client, viewName, orgId, ... })`
- Always annotate exported function return types
- Async functions return Promises with specific types
## React Patterns
- Functional components using `function ComponentName()` syntax
- Props passed as destructured parameters with type annotation
- Use `interface` for props types
- Example from `app-logo.tsx`:
- `useState` for simple boolean/primitive state — e.g., `const [showPassword, setShowPassword] = useState(false)`
- Prefer single `useState` for related state (state object over multiple hooks) — e.g.:
- Never use `watch()` — use `useWatch` hook instead when needed
- `useCallback` wrapping all event handler functions passed as props
- `useRef` for values that should not trigger re-renders — e.g., `redirecting.current`, `hasHandledSuccess.current`
- **`useEffect` is a code smell — avoid if possible.** Side effects handled via:
- Justified example: `NavbarSearch.tsx` uses `useEffect` to attach keyboard listener (Cmd/Ctrl+K)
- `useMemo` for derived state and expensive computations
- Schema defined in separate `.schema.ts` file
- `useForm({ resolver: zodResolver(Schema) })` — no explicit generic type on `useForm`
- Always include `<FormMessage />` in every field to display validation errors
- `<FormDescription>` is optional
- Example from `create-panel.tsx`:
- Server state passed via React Router `loader` data as `props.loaderData`
- React Query mutations (`useMutation`, `mutateAsync`) preferred for client-side async operations
- `useFetcher()` for form submissions without navigation
- Example from `create-panel.tsx`:
- Use `useRef` for flags that don't trigger re-renders
- Example from `create-panel.tsx`:
## Module Design
- Named exports for utilities and service functions
- Default export for page components only
- Barrel files (index.ts) export multiple related items
- Example: `app/lib/crud/` modules export functions for CRUD operations
- `app/components/` — shared UI components organized by feature (auth, ai, sidebar, crud, etc.)
- `app/lib/` — utilities organized by concern (auth, workspace, supabase, csrf, i18n, ai, crud)
- `.server.ts` files live in same directory as imports — never imported client-side
- Example structure:
## Testing Attributes
- Add `data-test` attribute to key UI elements for Playwright E2E test selectors
- Used in page objects to identify elements without relying on fragile selectors
- Examples from codebase:
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Strong server/client separation via `.server.ts` files (never imported client-side)
- Request-scoped Supabase clients with session cookies for auth state
- Org-scoped data access through `org` tenant + `hr_employee` membership model
- Org-wide row-level security (RLS) policies enforced at database layer
- Registry-based CRUD module mapping for dynamic list/detail/create routes
- Streaming SSR with bot detection for crawlers vs browsers
## Layers
- Purpose: Handle HTTP requests, define page loaders/actions, render React components
- Location: `app/routes/**/*.tsx` and `app/routes/**/*.ts`
- Contains: Page components, data loaders, form actions, layout wrappers, error boundaries
- Depends on: Feature packages, lib utilities, component libraries, configurations
- Used by: React Router 7 framework at runtime
- Pattern: Each route file exports `loader` (server), `action` (server, optional), `default` component (client), `meta`, `ErrorBoundary` (optional)
- Purpose: Workspace chrome (nav, sidebar, header) loaded once per section
- Location: `app/routes/workspace/layout.tsx`, `app/routes/auth/layout.tsx`
- Contains: Layout wrapper components that hydrate workspace context and navigation
- Depends on: `loadOrgWorkspace()` server function, workspace loaders
- Used by: Child routes via React Router layout groups
- Pattern: Layout loader runs once per account switch, loads org workspace data, passes via `loaderData` to child routes; sidebar open/closed state persisted in cookies
- Purpose: Server-side functions and utilities shared by routes
- Location: `app/lib/**/*.server.ts` (server-only), `app/lib/**/*.ts` (client/server compatible)
- Contains: Supabase clients, workspace loaders, CSRF protection, i18n, auth helpers, CRUD helpers, webhook handlers
- Depends on: Supabase SDK, external SDKs (AI, email), configuration
- Used by: Routes, components, other lib modules
- Examples: `getSupabaseServerClient()`, `loadOrgWorkspace()`, `crudCreateAction()`, `buildSystemPrompt.server.ts`
- Purpose: React components for pages, layouts, and reusable UI elements
- Location: `app/components/**/*.tsx`
- Contains: Auth forms, workspace navigation, sidebar, CRUD UI, AI chat, shared UI atoms
- Depends on: UI primitives (`@aloha/ui` package), app lib utilities, Radix UI, Tailwind CSS
- Used by: Routes, other components
- Organization: Grouped by feature (auth, ai, crud, sidebar, navbar)
- Purpose: Org-scoped data storage with row-level security
- Location: `supabase/schemas/`, `supabase/migrations/`, `app/lib/database.types.ts` (generated)
- Contains: PostgreSQL 15 tables, RLS policies, views, functions, TypeScript types
- Accessed via: `getSupabaseServerClient(request)` (server), `useSupabase()` hook (client)
- Views enforce tenant isolation: `app_org_context`, `hr_rba_navigation`, `app_user_orgs`
- Purpose: App-wide and feature-specific settings
- Location: `app/config/*.config.ts` and `app/config/*.config.tsx`
- Contains: App metadata, feature flags, auth providers, module-to-icon mappings, workspace navigation structure
- Examples: `app.config.ts`, `feature-flags.config.ts`, `module-icons.config.ts`
- Purpose: Shared, reusable component library built on Shadcn UI and Radix UI
- Location: `packages/ui/src/`
- Contains: Shadcn components (`shadcn/`), custom hooks (`hooks/`), utilities (`lib/`)
- Exported as: `@aloha/ui/*` monorepo package
## Data Flow
- **Server State:** Passed via React Router `loader` data as `props.loaderData`
- **Client State (Simple):** React `useState` for booleans, strings, simple objects
- **Client State (Related):** Single `useState` with object pattern (e.g., `{ open, loading, error }`)
- **Client State (Async):** React Query `@tanstack/react-query` for server-side data fetching and caching
- **Form State:** React Hook Form with Zod validation
- **Theme/i18n/CSRF:** Global context via `RootProviders`
## Key Abstractions
- Purpose: Load user's orgs, current org context, navigation for layout
- Location: `app/lib/workspace/org-workspace-loader.server.ts`
- Pattern: Server-only function called from workspace layout loader; returns typed `OrgWorkspace` object with current org, user's orgs, and nav modules/sub-modules
- Returns: `{ currentOrg, userOrgs, user: JwtPayload, navigation: { modules, subModules } }`
- Caching: Results not cached; fresh load on every layout request (per request-scoped client)
- Purpose: Request-scoped database client tied to session — reads/writes auth cookies automatically
- Location: `app/lib/supabase/clients/server-client.server.ts`
- Pattern: `getSupabaseServerClient(request)` creates new client per request using `@supabase/ssr` helpers with cookie management
- Usage: All server-side data operations (loaders, actions, API routes)
- Error handling: Queries return `{ data, error }` — callers check error and throw redirect or respond with error status
- Purpose: Map sub-module slugs (from URL) to table metadata, form schemas, column definitions
- Location: `app/lib/crud/registry.ts`
- Pattern: `getModuleConfig(subModuleSlug)` returns a `CrudModuleConfig` with:
- Used by: Sub-module list, detail, create, edit routes for automatic table rendering and form generation
- Example: `'employees'` maps to `hrEmployeeConfig` with table `hr_employee`
- Purpose: Standardized create/update/delete operations with org scoping and validation
- Location: `app/lib/crud/crud-action.server.ts`
- Pattern: `crudCreateAction()`, `crudUpdateAction()`, `crudDeleteAction()` take params: `{ client, tableName, orgId, employeeId, data, schema, ... }`
- Behavior: Validates data against schema, adds `org_id` and audit fields (`created_by`, `updated_by`), executes Supabase operation
- Returns: `{ success: true, data }` or `{ success: false, errors | error }`
- Purpose: Enforce tenant isolation and permission checks
- Location: `supabase/schemas/*.sql`
- Examples: `app_org_context` (current org), `hr_rba_navigation` (modules user can access), `app_user_orgs` (all orgs user belongs to)
- Pattern: Views use `auth.uid()` and `hr_employee` membership to automatically filter rows
- Usage: Loaders query views (not in generated types, use `queryUntypedView()` helper), cast result to app types
- Purpose: Prevent cross-site request forgery on form submissions
- Location: `app/lib/csrf/server/create-csrf-protect.server.ts`, `app/lib/csrf/client/*`
- Pattern: Root loader generates token via `csrfProtect(request)`, stores in HTML meta tag; form actions validate token before executing mutations
- Token checked in: `verifyCsrfToken()` called in form action handlers
- Purpose: Render access-denied UI if user lacks module/sub-module permissions
- Location: `app/lib/workspace/access-gate.tsx`
- Pattern: Component receives `moduleSlug`, `subModuleSlug`, checks `requireModuleAccess()` and `requireSubModuleAccess()`, throws redirect if denied
- Usage: Wrapped around sub-module pages to ensure user has permission before rendering
## Entry Points
- Location: `app/entry.server.tsx`
- Triggers: Every incoming HTTP request
- Responsibilities: Bot detection (via `isbot`), streaming HTML rendering via `renderToPipeableStream`, error logging
- Pattern: Distinguishes bot requests (full render before response) from browser (streaming render after shell ready)
- Location: `app/root.tsx`
- Triggers: App startup, used for all page requests (renders as outermost component)
- Responsibilities: CSRF token generation, theme resolution (light/dark via cookie), i18n language detection, global provider setup
- Pattern: Loader runs once at app startup; provides `loaderData` with `{ language, className, theme, csrfToken }` to all child routes
- Providers: `RootProviders` wraps all children with theme context, React Query, i18n context
- Location: `app/routes.ts`
- Triggers: Build time and runtime routing
- Responsibilities: Declares all routes organized into layout groups
- Pattern: Three layout groups: `rootRoutes` (index, version, health), `authLayout` (sign-in, password reset), `workspaceLayout` (home, modules, CRUD)
- Dynamic routes: Workspace routes parametrized by `:account`, `:module`, `:subModule`, `:recordId`
- Location: `app/routes/workspace/layout.tsx`
- Triggers: All routes under `/home/:account/*`
- Responsibilities: Load org workspace (user's orgs, current org, navigation), hydrate page chrome (sidebar/header)
- Pattern: Loader calls `loadOrgWorkspace()` → queries org context and nav views → passes to layout component; sidebar open/closed state from cookie
- Returns: `{ workspace, layoutState, accountSlug }`
- Location: `app/routes/api/*`
- Responsibilities: AI chat, form assist, database webhooks, OTP, account operations
- Pattern: Export `action({ request })` — parse request body, call external SDK or database, return Response or stream
- Examples:
## Error Handling
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| playwright-e2e | Write, review, or debug end-to-end tests using Playwright. Use when creating test suites, fixing flaky tests, implementing UI interaction sequences, or ensuring test reliability. Invoke with /playwright-e2e or when user mentions e2e tests, Playwright, or test automation. | `.claude/skills/playwright-e2e/SKILL.md` |
| postgres-supabase-expert | Create, review, optimize, or test PostgreSQL and Supabase database code including SQL code, schemas, migrations, functions, triggers, RLS policies, and PgTAP tests. Use when writing and designing schemas, reviewing SQL for safety, writing migrations, implementing row-level security, or optimizing queries. Invoke with /postgres-supabase-expert or when user mentions database, SQL, migrations, RLS, or schema design. | `.claude/skills/postgres-expert/SKILL.md` |
| react-form-builder | Create or modify client-side forms in React applications following best practices for react-hook-form, @aloha/ui/form components, and React Router action integration. Use when building forms with validation, error handling, loading states, and TypeScript typing. Invoke with /react-form-builder or when user mentions creating forms, form validation, or react-hook-form. | `.claude/skills/react-form-builder/SKILL.md` |
| server-action-builder | Create React Router 7 route actions with Zod validation, useFetcher, and service patterns. Use when implementing mutations, form submissions, or API operations that need authentication and validation. Invoke with /server-action-builder. | `.claude/skills/server-action-builder/SKILL.md` |
| service-builder | Build pure, interface-agnostic services with injected dependencies. Use when creating business logic that must work across route actions, MCP tools, CLI commands, or tests. Invoke with /service-builder. | `.claude/skills/service-builder/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
