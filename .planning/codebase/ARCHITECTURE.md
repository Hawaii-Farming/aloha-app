# Architecture

**Analysis Date:** 2026-04-07

## Pattern Overview

**Overall:** SSR-first React Router 7 with request-scoped server clients and multi-tenant org-based data isolation

**Key Characteristics:**
- Strong server/client separation via `.server.ts` files (never imported client-side)
- Request-scoped Supabase clients with session cookies for auth state
- Org-scoped data access through `org` tenant + `hr_employee` membership model
- Org-wide row-level security (RLS) policies enforced at database layer
- Registry-based CRUD module mapping for dynamic list/detail/create routes
- Streaming SSR with bot detection for crawlers vs browsers

## Layers

**Routes Layer:**
- Purpose: Handle HTTP requests, define page loaders/actions, render React components
- Location: `app/routes/**/*.tsx` and `app/routes/**/*.ts`
- Contains: Page components, data loaders, form actions, layout wrappers, error boundaries
- Depends on: Feature packages, lib utilities, component libraries, configurations
- Used by: React Router 7 framework at runtime
- Pattern: Each route file exports `loader` (server), `action` (server, optional), `default` component (client), `meta`, `ErrorBoundary` (optional)

**Workspace Layout Layer:**
- Purpose: Workspace chrome (nav, sidebar, header) loaded once per section
- Location: `app/routes/workspace/layout.tsx`, `app/routes/auth/layout.tsx`
- Contains: Layout wrapper components that hydrate workspace context and navigation
- Depends on: `loadOrgWorkspace()` server function, workspace loaders
- Used by: Child routes via React Router layout groups
- Pattern: Layout loader runs once per account switch, loads org workspace data, passes via `loaderData` to child routes; sidebar open/closed state persisted in cookies

**Server Utilities Layer:**
- Purpose: Server-side functions and utilities shared by routes
- Location: `app/lib/**/*.server.ts` (server-only), `app/lib/**/*.ts` (client/server compatible)
- Contains: Supabase clients, workspace loaders, CSRF protection, i18n, auth helpers, CRUD helpers, webhook handlers
- Depends on: Supabase SDK, external SDKs (AI, email), configuration
- Used by: Routes, components, other lib modules
- Examples: `getSupabaseServerClient()`, `loadOrgWorkspace()`, `crudCreateAction()`, `buildSystemPrompt.server.ts`

**Component Layer:**
- Purpose: React components for pages, layouts, and reusable UI elements
- Location: `app/components/**/*.tsx`
- Contains: Auth forms, workspace navigation, sidebar, CRUD UI, AI chat, shared UI atoms
- Depends on: UI primitives (`@aloha/ui` package), app lib utilities, Radix UI, Tailwind CSS
- Used by: Routes, other components
- Organization: Grouped by feature (auth, ai, crud, sidebar, navbar)

**Database & Schema Layer:**
- Purpose: Org-scoped data storage with row-level security
- Location: `supabase/schemas/`, `supabase/migrations/`, `app/lib/database.types.ts` (generated)
- Contains: PostgreSQL 15 tables, RLS policies, views, functions, TypeScript types
- Accessed via: `getSupabaseServerClient(request)` (server), `useSupabase()` hook (client)
- Views enforce tenant isolation: `app_org_context`, `app_navigation`, `app_user_orgs`

**Configuration Layer:**
- Purpose: App-wide and feature-specific settings
- Location: `app/config/*.config.ts` and `app/config/*.config.tsx`
- Contains: App metadata, feature flags, auth providers, module-to-icon mappings, workspace navigation structure
- Examples: `app.config.ts`, `feature-flags.config.ts`, `module-icons.config.ts`

**UI Package:**
- Purpose: Shared, reusable component library built on Shadcn UI and Radix UI
- Location: `packages/ui/src/`
- Contains: Shadcn components (`shadcn/`), custom hooks (`hooks/`), utilities (`lib/`)
- Exported as: `@aloha/ui/*` monorepo package

## Data Flow

**Request Entry → SSR Render:**

1. Request arrives at server entry (`app/entry.server.tsx`)
2. Bot detection determines streaming vs full render
3. React Router matches request to route
4. Root loader (`app/root.tsx`) runs: creates i18n instance, reads theme cookie, generates CSRF token
5. Route-specific loader runs (e.g., workspace layout loader)
6. `loadOrgWorkspace()` called: authenticates user, queries org/employee membership, loads navigation
7. Component renders server-side, hydrates with `loaderData`
8. Streaming HTML sent to client, client React hydrates

**Form Submission → Action Handler:**

1. Client form submits via `<Form>` component or `useFetcher()`
2. Form action (e.g., `sub-module-create.tsx` action) receives FormData or JSON
3. Action handler:
   - Creates server Supabase client: `getSupabaseServerClient(request)`
   - Validates input against Zod schema
   - Calls CRUD helper (`crudCreateAction`, `crudUpdateAction`): includes `org_id` for tenant scoping
   - On success, returns redirect or new data
   - On error, re-renders form with validation errors
4. Client receives response, updates UI (via form state or navigation)

**Data Fetch (Client-side) via React Query:**

1. Component mounts, calls React Query hook (e.g., `useQuery`)
2. Query function makes fetch request to API route (e.g., `/api/db/webhook`)
3. API route handler creates server client, queries database
4. Data returned to client, React Query caches and synchronizes

**Multi-Tenant Data Isolation:**

1. All Supabase queries include implicit `org_id` filtering via RLS policies
2. Loader queries pass `org_id` from route params: `client.from('table').eq('org_id', accountSlug)`
3. RLS ensures even if `org_id` is wrong, query returns empty (no data leakage)
4. Employee membership verified through `hr_employee` table with `user_id` = current auth user
5. Module/sub-module access checked via `hr_module_access` table

**State Management:**

- **Server State:** Passed via React Router `loader` data as `props.loaderData`
- **Client State (Simple):** React `useState` for booleans, strings, simple objects
- **Client State (Related):** Single `useState` with object pattern (e.g., `{ open, loading, error }`)
- **Client State (Async):** React Query `@tanstack/react-query` for server-side data fetching and caching
- **Form State:** React Hook Form with Zod validation
- **Theme/i18n/CSRF:** Global context via `RootProviders`

## Key Abstractions

**Org Workspace Loader:**
- Purpose: Load user's orgs, current org context, navigation for layout
- Location: `app/lib/workspace/org-workspace-loader.server.ts`
- Pattern: Server-only function called from workspace layout loader; returns typed `OrgWorkspace` object with current org, user's orgs, and nav modules/sub-modules
- Returns: `{ currentOrg, userOrgs, user: JwtPayload, navigation: { modules, subModules } }`
- Caching: Results not cached; fresh load on every layout request (per request-scoped client)

**Supabase Server Client:**
- Purpose: Request-scoped database client tied to session — reads/writes auth cookies automatically
- Location: `app/lib/supabase/clients/server-client.server.ts`
- Pattern: `getSupabaseServerClient(request)` creates new client per request using `@supabase/ssr` helpers with cookie management
- Usage: All server-side data operations (loaders, actions, API routes)
- Error handling: Queries return `{ data, error }` — callers check error and throw redirect or respond with error status

**CRUD Module Registry:**
- Purpose: Map sub-module slugs (from URL) to table metadata, form schemas, column definitions
- Location: `app/lib/crud/registry.ts`
- Pattern: `getModuleConfig(subModuleSlug)` returns a `CrudModuleConfig` with:
  - `tableName`: Supabase table to query
  - `schema`: Zod validation schema for form inputs
  - `columns`: Column metadata (label, sortable, render function)
  - `views`: View names for list/detail (override table name if needed)
  - `select`: PostgREST select string for joins
  - `fkOptions`: Foreign key lookup data
- Used by: Sub-module list, detail, create, edit routes for automatic table rendering and form generation
- Example: `'employees'` maps to `hrEmployeeConfig` with table `hr_employee`

**CRUD Action Helpers:**
- Purpose: Standardized create/update/delete operations with org scoping and validation
- Location: `app/lib/crud/crud-action.server.ts`
- Pattern: `crudCreateAction()`, `crudUpdateAction()`, `crudDeleteAction()` take params: `{ client, tableName, orgId, employeeId, data, schema, ... }`
- Behavior: Validates data against schema, adds `org_id` and audit fields (`created_by`, `updated_by`), executes Supabase operation
- Returns: `{ success: true, data }` or `{ success: false, errors | error }`

**SQL Views for Tenant Filtering:**
- Purpose: Enforce tenant isolation and permission checks
- Location: `supabase/schemas/*.sql`
- Examples: `app_org_context` (current org), `app_navigation` (modules user can access), `app_user_orgs` (all orgs user belongs to)
- Pattern: Views use `auth.uid()` and `hr_employee` membership to automatically filter rows
- Usage: Loaders query views (not in generated types, use `queryUntypedView()` helper), cast result to app types

**CSRF Protection:**
- Purpose: Prevent cross-site request forgery on form submissions
- Location: `app/lib/csrf/server/create-csrf-protect.server.ts`, `app/lib/csrf/client/*`
- Pattern: Root loader generates token via `csrfProtect(request)`, stores in HTML meta tag; form actions validate token before executing mutations
- Token checked in: `verifyCsrfToken()` called in form action handlers

**Access Gate Component:**
- Purpose: Render access-denied UI if user lacks module/sub-module permissions
- Location: `app/lib/workspace/access-gate.tsx`
- Pattern: Component receives `moduleSlug`, `subModuleSlug`, checks `requireModuleAccess()` and `requireSubModuleAccess()`, throws redirect if denied
- Usage: Wrapped around sub-module pages to ensure user has permission before rendering

## Entry Points

**Root Entry Server:**
- Location: `app/entry.server.tsx`
- Triggers: Every incoming HTTP request
- Responsibilities: Bot detection (via `isbot`), streaming HTML rendering via `renderToPipeableStream`, error logging
- Pattern: Distinguishes bot requests (full render before response) from browser (streaming render after shell ready)

**Root Component & Loader:**
- Location: `app/root.tsx`
- Triggers: App startup, used for all page requests (renders as outermost component)
- Responsibilities: CSRF token generation, theme resolution (light/dark via cookie), i18n language detection, global provider setup
- Pattern: Loader runs once at app startup; provides `loaderData` with `{ language, className, theme, csrfToken }` to all child routes
- Providers: `RootProviders` wraps all children with theme context, React Query, i18n context

**Route Configuration:**
- Location: `app/routes.ts`
- Triggers: Build time and runtime routing
- Responsibilities: Declares all routes organized into layout groups
- Pattern: Three layout groups: `rootRoutes` (index, version, health), `authLayout` (sign-in, password reset), `workspaceLayout` (home, modules, CRUD)
- Dynamic routes: Workspace routes parametrized by `:account`, `:module`, `:subModule`, `:recordId`

**Workspace Layout Loader:**
- Location: `app/routes/workspace/layout.tsx`
- Triggers: All routes under `/home/:account/*`
- Responsibilities: Load org workspace (user's orgs, current org, navigation), hydrate page chrome (sidebar/header)
- Pattern: Loader calls `loadOrgWorkspace()` → queries org context and nav views → passes to layout component; sidebar open/closed state from cookie
- Returns: `{ workspace, layoutState, accountSlug }`

**API Route Handlers:**
- Location: `app/routes/api/*`
- Responsibilities: AI chat, form assist, database webhooks, OTP, account operations
- Pattern: Export `action({ request })` — parse request body, call external SDK or database, return Response or stream
- Examples:
  - `/api/ai/chat.ts`: Stream text responses from Anthropic Claude
  - `/api/ai/form-assist.ts`: Generate form field suggestions
  - `/api/db/webhook.ts`: Handle Supabase database change webhooks

## Error Handling

**Auth Errors:** `requireUserLoader(request)` or `requireUser(client)` throws `redirect('/auth/sign-in')` if session invalid or missing

**Permission Errors:** `requireModuleAccess()` / `requireSubModuleAccess()` throw `redirect('/no-access')` if user lacks permissions; RLS errors return empty result

**Validation Errors:** Zod schema validation in form action; if invalid, returns `{ success: false, errors: ... }` and re-renders form with error messages displayed via `<FormMessage />`

**Route Errors:** React Router error boundary (`RootErrorBoundary` at `app/components/root-error-boundary.tsx`) catches unhandled route errors, displays error page

**API Errors:** Route handlers return `new Response(null, { status: 500 })` on failure; logged via console or logger

**Database Errors:** Supabase operations wrapped in try/catch; errors logged and returned as user-friendly response

## Cross-Cutting Concerns

**Logging:** Files: `app/lib/shared/logger/logger.ts` (interface), `impl/console.ts`, `impl/pino.ts` (implementations). Logger interface exports: `info`, `error`, `warn`, `debug`, `fatal` methods. Server-side errors logged in entry handler and route loaders. Not used extensively in components (prefer error boundaries for render errors).

**Validation:** Zod schemas in `app/lib/auth/schemas/*.schema.ts` and CRUD module configs. Form validation happens in react-hook-form resolvers and server action handlers. Database constraints enforced via PostgreSQL schemas.

**Authentication:** Supabase Auth (via `@supabase/supabase-js`) manages sessions. Server client auto-reads/writes session cookies. Routes use `requireUser()` to verify auth before accessing protected resources. Callback handler (`auth/callback.tsx`) handles OAuth redirects.

**Authorization:** Multi-layered:
1. Database RLS policies enforce org isolation
2. `requireModuleAccess()` checks `hr_module_access` table for CRUD permissions per employee
3. `requireSubModuleAccess()` checks `org_sub_module` for feature toggles
4. `AccessGate` component wraps pages and redirects if denied

**Internationalization:** `i18next` + `react-i18next` for client; `app/lib/i18n/i18n.server.ts` for server-side translation loading. Locales in `public/locales/[lang]/*.json`. Browser language auto-detected via `i18next-browser-languagedetector`.

**CSRF Protection:** Tokens generated in root loader, stored in HTML meta tag, verified in form action handlers via `verifyCsrfToken()`.

---

*Architecture analysis: 2026-04-07*
