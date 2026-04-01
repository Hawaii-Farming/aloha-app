# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### Core Technologies

- **React Router 7** in SSR/Framework mode
- **Supabase**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4** and Shadcn UI
- **Turborepo**

## Monorepo Structure

- `apps/web` - Main React Router ERP template application
- `apps/e2e` - Playwright end-to-end tests
- `packages/features/*` - Feature packages
- `packages/` - Shared packages and utilities
- `tooling/` - Build tools and development scripts

## Multi-Tenant Architecture

**Note:** This app uses a dual multi-tenant model during the foundation phase:

**Template layer (accounts/memberships):** The template's built-in auth system provides login, session management, and team account switching. This is what powers the UI shell.

**Business layer (org/hr_employee):** Aloha-app's own schema provides the ERP-specific access control — `org` is the tenant, `hr_employee` is the membership table, `sys_access_level` defines role tiers (employee→owner), `hr_module_access` controls per-employee per-module CRUD permissions, and `org_module`/`org_sub_module` control feature toggles per org.

The long-term goal is to adapt the template's auth layer to use aloha-app's org/hr_employee model directly. For now, both coexist.

## Essential Commands

### Development Workflow

```bash
pnpm dev                    # Start all apps
pnpm --filter web dev       # Main app (port 3000)
```

### Database Operations

```bash
pnpm supabase:web:start     # Start Supabase locally
pnpm supabase:web:reset     # Reset with latest schema
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase:db:diff  # Create migration
```

### Code Quality

```bash
pnpm format:fix
pnpm lint:fix
pnpm typecheck
```

- Run the typecheck command regularly to ensure your code is type-safe.
- Run the linter and the formatter when your task is complete.

## Typescript

- Write clean, clear, well-designed, explicit TypeScript
- Avoid obvious comments
- Avoid unnecessary complexity or overly abstract code
- Always use implicit type inference, unless impossible
- You must avoid using `any`
- Handle errors gracefully using try/catch and appropriate error types

## React

- Use functional components
- Add `data-test` for E2E tests where appropriate
- `useEffect` is a code smell and must be justified - avoid if possible
- Do not write many separate `useState`, prefer single state object (unless required)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Aloha App — Multi-Organization Agricultural ERP**

A multi-tenant agricultural ERP built on the aloha-react-supabase-template. Manages farm-to-customer operations: growing (seeding, harvesting, scouting, spraying, fertigation, monitoring), packing, sales, inventory, HR, operations, maintenance, and food safety.

**Supabase project:** `kfwqtaazdankxmdlqdak` (hosted)
**Schema docs:** `docs/schemas/` (per-module) and `docs/processes/` (workflows)
**Migrations:** `apps/web/supabase/migrations/` (91 aloha-app tables + template base schema)

### Constraints

- **Tech stack**: React Router 7 (SSR/Framework mode), Supabase, React 19, TypeScript, Tailwind CSS 4, Shadcn UI, Turborepo — non-negotiable
- **Schema immutability**: Template must never require schema changes in consumer projects — it adapts, not the other way around
- **Code quality**: SOTA web application practices — must be easy to maintain, debug, and extend
- **Speed priority**: The entire point is fast schema-to-app. Every design decision should reduce time-to-working-app
- **AI-first**: Claude is the primary development tool. Patterns should be Claude-friendly (readable, documented, consistent)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.x - All application code, packages, and tooling
- SQL (PostgreSQL) - Database schemas and migrations in `apps/web/supabase/schemas/`
- CSS - Via Tailwind CSS v4 utility classes; no raw CSS files
## Runtime
- Node.js >=20.x (root workspace requirement), >=18.x (web app)
- pnpm 10.18.1
- Lockfile: present (`pnpm-lock.yaml`)
- Workspace: `pnpm-workspace.yaml` with catalog pinning for shared deps
## Frameworks
- React Router 7.12.0 (`react-router`, `@react-router/dev`) - SSR/Framework mode, file-based routing via `@react-router/fs-routes`
- React 19.2.3 - UI rendering
- Vite 7.x - Build tool and dev server (via `@react-router/dev/vite`)
- Tailwind CSS 4.1.18 (`tailwindcss`, `@tailwindcss/vite`) - Styling via `@aloha/tailwind-config/vite` plugin
- Shadcn UI - Component library built on `radix-ui` 1.4.3; components in `packages/ui/src/shadcn/`
- Lucide React 0.562.0 - Icon library
- `next-themes` 0.4.6 - Dark/light/system theme support
- TanStack Query 5.90.12 - Client-side data fetching and caching
- TanStack Table 8.21.x - Data table primitives
- React Hook Form 7.69.x - Form state management
- `@hookform/resolvers` 5.2.x - Zod resolver for schema validation
- Zod 3.25.74 - Schema validation (workspace catalog)
- i18next 25.7.x + react-i18next 16.5.x - i18n framework; `packages/i18n/` package
- `i18next-browser-languagedetector` - Auto language detection
- `i18next-resources-to-backend` - Lazy locale loading
- Recharts 2.15.x - Charting library
- Playwright 1.57.x (`@playwright/test`) - E2E tests in `apps/e2e/`
- Supabase pgTAP - Database unit tests via `supabase db test`
- Turborepo 2.6.2 - Monorepo task orchestration; config at `turbo.json`
- `cross-env` 10.1.x - Cross-platform env variable setting
- `manypkg` 0.25.x - Monorepo dependency validation
- `dotenv-cli` 11.x - Local `.env` loading for scripts
- Pino 10.1.x - Structured server-side logging; used via `@aloha/shared/logger`

## Key Dependencies

- `@supabase/supabase-js` 2.89.0 - Database and auth client (workspace catalog)
- `@supabase/ssr` 0.8.x - SSR-compatible Supabase client helpers; used in `packages/supabase/`
- `@edge-csrf/core` 2.5.3 - CSRF protection; `packages/utils/csrf/`
- `nodemailer` 7.0.x - SMTP email sending
- `@modelcontextprotocol/sdk` 1.24.3 - MCP server; `packages/mcp-server/`
- `sonner` 2.0.x - Toast notifications

## Configuration

- Template at `apps/web/.env.template`
- Public vars prefixed `VITE_` (bundled into client)
- Server-only vars: `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `SUPABASE_DB_WEBHOOK_SECRET`
- All env vars declared in `turbo.json` `globalEnv` for Turborepo cache invalidation
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLIC_KEY` - Supabase connection
- `SUPABASE_SECRET_KEY` - Supabase service role key (server-only)
- `VITE_SITE_URL`, `VITE_PRODUCT_NAME`, `VITE_SITE_TITLE`, `VITE_SITE_DESCRIPTION` - App metadata
- `MAILER_PROVIDER` - `nodemailer` or `resend`
- `vite.config.ts` at `apps/web/vite.config.ts`
- `react-router.config.ts` - SSR enabled, Vercel preset available but commented out
- `tsconfig.json` at root + per-package configs extending `@aloha/tsconfig`
- Prettier config: `@aloha/prettier-config`
- ESLint config: `@aloha/eslint-config` (flat config format, ESLint 9.x)

## Platform Requirements

- Node.js >=20.x
- pnpm 10.18.1
- Docker (optional)
- Supabase CLI (local dev with `supabase start`)
- Node.js >=18.x
- Vercel deployment supported (preset available in `react-router.config.ts`)
- SSR server entry at `build/server/index.js` (served by `react-router-serve`)
- Supabase hosted project required
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns

- React components: `kebab-case.tsx` (e.g., `password-sign-in-container.tsx`, `account-selector.tsx`)
- Server-only modules: `kebab-case.server.ts` suffix (e.g., `i18n.server.ts`, `load-user-workspace.server.ts`)
- Service classes: `kebab-case.service.ts` (e.g., `account-invitations.service.ts`)
- Zod schemas: `kebab-case.schema.ts` (e.g., `password-sign-in.schema.ts`)
- Page objects for E2E: `kebab-case.po.ts` (e.g., `auth.po.ts`, `team-accounts.po.ts`)
- Route loaders/components: `kebab-case.tsx` directly in route directories
- camelCase for all function names
- Factory functions for services: `createXxxService(client)` — returns class instance (e.g., `createAccountInvitationsService`, `createTeamAccountsApi`)
- Exported server actions named `xyzAction` (e.g., `deletePersonalAccountAction`)
- React components: PascalCase
- camelCase for local variables and parameters
- Destructured object parameters preferred over positional args for complex inputs
- `interface` for component props objects (e.g., `interface EmailPasswordSignUpContainerProps`)
- `type` for utility types, derived types, and unions (e.g., `type Account = Tables<'accounts'>`)
- No explicit generics on `useForm` — Zod resolver infers types
- Avoid `any`; use generated Supabase `Tables<'table_name'>` and `Enums<'enum_name'>` types from `@aloha/supabase/database`
- Default export for page component (function declaration, PascalCase)
- Named exports for `loader`, `clientLoader`, `action`, `meta`

## Code Style

- Tool: Prettier with `@trivago/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- `tabWidth: 2`, `useTabs: false`
- `semi: true`
- `printWidth: 80`
- `singleQuote: true`
- `arrowParens: 'always'`
- ESLint with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Unused vars error: prefix with `_` to suppress (e.g., `_unusedParam`)
- `Trans` must be imported from `@aloha/ui/trans`, never directly from `react-i18next`

## Import Organization

- `@aloha/*` — monorepo packages (e.g., `@aloha/ui/button`, `@aloha/supabase/server-client`)
- `~/` — app-level imports in `apps/web` (e.g., `~/config/auth.config`, `~/lib/i18n/i18n.server`)

## Component Patterns

- `export function ComponentName(props)` — preferred for route pages and standalone utilities
- `export const ComponentName: React.FC<{...}>` — used in some feature packages for inline prop types

## State Management

- Single `useState` for simple boolean state (e.g., `showVerifyEmailAlert`)
- `useCallback` wrapping all event handler functions that are passed as props
- `useRef` for values that should not trigger re-renders (e.g., `redirecting.current`)
- `useEffect` is avoided; side effects are handled in event handlers and server loaders
- Prefer React Query mutations (`useMutation`, `mutateAsync`) over manual fetch + state for async operations

## Form Handling

- Schema defined in a separate `.schema.ts` file
- `useForm({ resolver: zodResolver(Schema) })` — no explicit generic on `useForm`
- Never use `watch()` — use `useWatch` hook instead
- Always include `<FormMessage />` in every field to display validation errors
- `<FormDescription>` is optional

## Error Handling
## Logging
## Comments
## Module Design
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Server-side rendering via React Router 7 in framework/SSR mode — routes define both `loader` (server data fetch) and `default` (React component)
- Clear server/client boundary: server-only files live under `.server` directories or have `.server.ts` suffixes and are never imported client-side
- Multi-tenant dual-account model: every user has a Personal Account and can belong to multiple Team Accounts; all data is scoped to `account_id`
- Feature packages in `packages/features/*` encapsulate domain logic (auth, access-control, team-accounts, ai, crud); apps consume these packages
- Plugin/gateway pattern for email — abstract interfaces with swappable providers (Resend, Nodemailer)
- Registry pattern for extensibility — `createRegistry()` in `packages/shared/src/registry/` enables dependency injection without direct coupling
- Policy engine in `packages/policies/src/` for business rule evaluation with ALL/ANY operators, stages, and LRU caching
## Layers
- Purpose: React Router route modules — each file exports `loader`, `action`, and `default` component
- Location: `apps/web/app/routes/`
- Contains: Page components, data loaders, form actions, layout wrappers
- Depends on: Feature packages, lib utilities, config
- Used by: React Router framework at runtime
- Purpose: Shared page chrome (sidebar/header navigation) loaded once per section
- Location: `apps/web/app/routes/*/layout.tsx`
- Contains: Workspace loaders, navigation components, layout style switching (sidebar vs header)
- Depends on: Feature packages, cookies, workspace loaders
- Purpose: Domain-specific components, server actions, and services isolated per feature
- Location: `packages/features/{auth,access-control,team-accounts,ai,crud}/src/`
- Contains: React components, server service classes, Zod schemas, action handlers
- Depends on: `packages/supabase`, `packages/ui`, `packages/shared`
- Used by: App routes (via `@aloha/{feature}` imports)
- Purpose: Cross-cutting concerns — Supabase client factory, mailers, CSRF, i18n
- Location: `packages/{supabase,mailers,i18n,otp}/`
- Contains: Client factories, abstract interfaces, concrete provider implementations
- Depends on: External SDKs only
- Used by: Feature packages and app routes
- Purpose: Primitives shared across all packages — logger, registry factory, event bus, React hooks
- Location: `packages/shared/src/`
- Contains: `createRegistry()`, logger implementations (console/pino), utility hooks
- Depends on: Nothing internal
- Used by: All other packages
- Purpose: Component library — Shadcn UI wrappers, custom components, utility functions
- Location: `packages/ui/src/`
- Contains: Shadcn components in `shadcn/`, custom components in `kit/`, `cn()` utility
- Depends on: Tailwind CSS 4, Radix UI primitives
- Purpose: Supabase PostgreSQL with Row Level Security
- Location: `apps/web/supabase/schemas/` (SQL schemas numbered 00–20)
- Contains: Tables, RLS policies, helper functions, views
- Accessed via: `getSupabaseServerClient(request)` (server) or `useSupabase()` hook (client)
## Data Flow
- Server state: React Router loader data passed as `props.loaderData` to route components
- Client state: React Query (`@tanstack/react-query`) for async client-side data
- Form state: React Router `useFetcher()` for mutations without full navigation
- UI state: React `useState` within components; sidebar open/close state persisted in cookies
## Key Abstractions
- Purpose: Lazy dependency injection — register named implementations, retrieve at runtime
- Examples: `packages/shared/src/registry/index.ts`
- Pattern: Factory registry with setup callbacks; used for mailers
- Purpose: Business rule evaluation engine with ALL/ANY group operators and stage-aware filtering
- Examples: `packages/policies/src/evaluator.ts`
- Pattern: Declarative policy functions evaluated against immutable contexts; LRU caching for performance
- Purpose: Centralized data fetching for the current user/team context needed by layouts
- Examples: `apps/web/app/routes/home/account/_lib/team-account-workspace-loader.server.ts`
- Pattern: Server-only `.server.ts` files called from layout loaders; return typed workspace objects
- Purpose: Request-scoped Supabase client that reads/writes session cookies
- Examples: `packages/supabase/src/clients/server-client.server.ts`
- Pattern: `getSupabaseServerClient(request)` creates a new client per request using `@supabase/ssr`'s `createServerClient`
## Entry Points
- Location: `apps/web/app/entry.server.tsx`
- Triggers: Every incoming HTTP request
- Responsibilities: Bot detection, streaming HTML rendering via `renderToPipeableStream`, error logging
- Location: `apps/web/app/root.tsx`
- Triggers: All page requests (wraps every route)
- Responsibilities: CSRF token generation, theme resolution, i18n language detection, global providers (`RootProviders`), global error boundary
- Location: `apps/web/app/routes.ts`
- Triggers: Build time and runtime routing
- Responsibilities: Declares all routes organized into layout groups: `rootRoutes`, `apiRoutes`, `authLayout`, `teamAccountLayout`
- Location: `apps/web/app/routes/api/`
- Triggers: POST requests from client or external webhooks
- Responsibilities: AI endpoints (`/api/ai/chat`, `/api/ai/form-assist`), database webhooks (`/api/db/webhook`), OTP (`/api/otp/send`), account management (`/api/accounts`)
## Error Handling
- Root error boundary: `apps/web/components/root-error-boundary.tsx` — catches all unhandled route errors
- Server entry error handler: `handleError()` in `entry.server.tsx` logs error via server logger
- API routes: try/catch returning `new Response(null, { status: 500 })` on failure
- Auth errors: `requireUserLoader()` throws `redirect()` to sign-in path on auth failure
- Service errors: Supabase operations check `.error` on result object and throw; callers use try/catch
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

