# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** React Router 7 Server-Side Rendering (SSR) with clear server/client boundary

**Key Characteristics:**
- SSR-first via React Router 7 framework mode — all routes define `loader` (server) and `default` component (client)
- Strong server/client separation: `.server.ts` files and `.server` directories are never imported client-side
- Request-scoped Supabase client for session/auth handling via `@supabase/ssr`
- Multi-tenant org-scoped data access via `org` + `hr_employee` membership model
- Form state via React Router `useFetcher()` for mutations without navigation
- Data fetching via React Query (`@tanstack/react-query`) on client for async operations

## Layers

**Route Layer (React Router Framework):**
- Purpose: Define HTTP handlers (loaders, actions) and render React components
- Location: `app/routes/**/*.tsx`, `app/routes/**/*.ts`
- Contains: Page components, data loaders, form actions, layout wrappers
- Depends on: Feature packages, lib utilities, config
- Used by: React Router framework at runtime
- Pattern: Each route file exports `loader` (server), `action` (server), `default` export (component), `meta`, `ErrorBoundary`

**Layout Layer (Shared Page Chrome):**
- Purpose: Workspace chrome loaded once per section — navigation, sidebar/header, org selection
- Location: `app/routes/workspace/layout.tsx`, `app/routes/auth/layout.tsx`
- Contains: Workspace loader that hydrates navigation and org context
- Depends on: Supabase server client, workspace loaders
- Used by: Child routes via React Router layout groups
- Pattern: Layout loader runs once, passes `loaderData` to child routes; uses cookies for UI state (sidebar open/closed)

**App Library (App-Specific Utilities):**
- Purpose: Server-side utilities and hooks shared by routes
- Location: `app/lib/**/*.server.ts` (server-only), `app/lib/**/*.ts` (client/server)
- Contains: Supabase clients, workspace loaders, CSRF, i18n, auth helpers, CRUD helpers
- Depends on: Supabase SDK, external SDKs
- Used by: Routes, components, other lib modules

**Component Layer (UI Rendering):**
- Purpose: React components for pages, layouts, and reusable UI
- Location: `app/components/**/*.tsx`
- Contains: Route page components, auth forms, workspace navigation, sidebar
- Depends on: UI primitives (`@aloha/ui`), app lib utilities
- Used by: Routes

**Database Layer (PostgreSQL + RLS):**
- Purpose: Org-scoped data persistence with row-level security
- Location: `supabase/schemas/` (SQL), `app/lib/database.types.ts` (generated TypeScript)
- Contains: Tables, RLS policies, views (`app_org_context`, `app_nav_modules`, `app_user_orgs`)
- Accessed via: `getSupabaseServerClient(request)` (server) or `useSupabase()` hook (client)

## Data Flow

**Server-Side Data Loading:**

1. Client requests route → React Router calls `loader(args)` on server
2. Loader creates request-scoped Supabase client via `getSupabaseServerClient(request)`
3. Client queries org-scoped data using RLS policies (automatic tenant filtering)
4. Loader returns typed data object
5. React renders component with `loaderData` passed as props
6. HTML streams to browser via `renderToPipeableStream`

**Client-Side Async Operations:**

1. Component uses `useQuery()` from React Query to fetch additional data
2. Request includes session cookies (Supabase auth context automatically injected)
3. Server validates RLS policies on read
4. React Query caches result and manages stale-while-revalidate

**Form Mutations:**

1. Component uses `useFetcher()` from React Router
2. User submits form → `action()` handler runs on server
3. Action validates input (Zod schema), calls Supabase
4. Returns typed response or throws `redirect()` for side effects
5. Component re-renders with updated data (no full page navigation)

**Authentication Flow:**

1. User at `/auth/sign-in` → loader checks Supabase session
2. If authenticated, redirect to `/home/:org`
3. Unauthenticated user signs in via OAuth/password → Supabase callback
4. Callback route (`/auth/callback`) exchanges auth code for session
5. Session stored in request cookies (httpOnly, secure)
6. Loader on workspace layout validates session via `requireUserLoader()`
7. If invalid, redirect to sign-in

## Key Abstractions

**Workspace Loader (`loadOrgWorkspace`):**
- Purpose: Load user's orgs, current org context, and navigation for layout
- Examples: `app/lib/workspace/org-workspace-loader.server.ts`
- Pattern: Server-only function called from layout loader; returns typed `OrgWorkspace` object with current org, user orgs, and nav modules/sub-modules
- Caching: Results not cached; fresh load on every layout request

**Request-Scoped Supabase Client:**
- Purpose: Supabase client tied to request session — reads/writes auth cookies automatically
- Examples: `app/lib/supabase/clients/server-client.server.ts`
- Pattern: `getSupabaseServerClient(request)` creates new client per request using `@supabase/ssr` helpers
- Error handling: Queries return `{ data, error }` — check error and throw/redirect on auth failure

**Org-Scoped RLS Views:**
- Purpose: SQL views that enforce tenant filtering — queries automatically scoped to current user's org
- Examples: `app_org_context` (current org), `app_nav_modules` (modules user can access), `app_user_orgs` (all orgs user belongs to)
- Pattern: Views use `auth.uid()` and `hr_employee` membership to filter rows
- Usage: Loader queries untyped views (not in generated types), casts result to app types

**Module Registry (CRUD):**
- Purpose: Dynamic config mapping module slug → table schema, columns, API endpoint
- Examples: `app/lib/crud/registry.ts`
- Pattern: `getModuleConfig(moduleSlug)` returns column defs, form schema, validation rules
- Used by: Sub-module list, detail, and create/edit routes for table rendering and form generation

**CSRF Protection:**
- Purpose: Prevent cross-site request forgery on form submissions
- Examples: `app/lib/csrf/server/create-csrf-protect.server.ts`, `app/lib/csrf/client/`
- Pattern: Root loader generates token via `csrfProtect(request)`, stores in HTML meta tag
- Usage: Form actions validate token before executing mutations

## Entry Points

**HTTP Entry (`app/entry.server.tsx`):**
- Triggers: Every incoming HTTP request
- Responsibilities: Bot detection (via `isbot`), streaming HTML rendering via `renderToPipeableStream`, error logging
- Pattern: Distinguishes bot requests (full render before response) from browser (streaming render on shell ready)

**Root Component (`app/root.tsx`):**
- Triggers: All page requests (renders as outermost component for every route)
- Responsibilities: CSRF token generation, theme resolution (light/dark), i18n language detection, global providers setup
- Pattern: Loader runs once at app startup; provides `loaderData` with `language`, `theme`, `csrfToken` to all routes
- Providers: `RootProviders` wraps all children with theme, React Query, i18n context

**Route Configuration (`app/routes.ts`):**
- Triggers: Build time and runtime routing
- Responsibilities: Declares all routes organized into layout groups
- Pattern: Three layout groups: `rootRoutes` (index, version, health), `authLayout` (sign-in, password reset), `workspaceLayout` (home, modules, CRUD)
- Dynamic: Workspace routes parametrized by `account`, `module`, `subModule`, `recordId`

**Workspace Layout (`app/routes/workspace/layout.tsx`):**
- Triggers: All routes under `/home/:account/*`
- Responsibilities: Load org workspace (user's orgs, current org, navigation), hydrate page chrome (sidebar/header)
- Pattern: Loader calls `loadOrgWorkspace()` → queries org context and nav views → passes to layout component
- State: Sidebar open/closed persisted in cookie

**API Routes (`app/routes/api/**/*.ts`):**
- Triggers: POST requests to `/api/*` paths
- Responsibilities: AI chat, form assist, database webhooks, OTP, account operations
- Pattern: Export `action({ request })` — parse request body, call external SDK or database, return Response or stream
- Examples:
  - `/api/ai/chat` — accepts chat messages, calls Anthropic Claude, streams response
  - `/api/db/webhook` — receives Supabase database change events
  - `/api/otp/send` — generates OTP token for passwordless auth

## Error Handling

**Strategy:** Server errors redirect or throw responses; client errors caught by error boundaries

**Patterns:**

- **Auth errors:** `requireUserLoader(request)` throws `redirect('/auth/sign-in')` if session invalid
- **RLS errors:** Supabase queries return `{ data: null, error }` on permission denial; loader checks error and throws `redirect('/no-access')`
- **Validation errors:** Zod schema in action validates input; if invalid, re-render form with error messages
- **Route errors:** React Router error boundary (`RootErrorBoundary`) catches unhandled route errors, displays generic error page
- **API errors:** Route handlers return `new Response(null, { status: 500 })` on failure
- **Database errors:** Try/catch around Supabase operations; log and return user-friendly error response

## Cross-Cutting Concerns

**Logging:** Pino (structured logging) on server via `app/lib/shared/logger`; console.error on client; all errors in `entry.server.tsx` handler

**Validation:** Zod schemas in `app/lib/*/schemas/*.schema.ts` files; validated in loaders, actions, and API handlers before database writes

**Authentication:** Supabase Auth (session in httpOnly cookie); checked via `requireUserLoader(request)` at protected route entry points

**Authorization:** Org-scoped RLS at database level; module/submodule access checked via `requireModuleAccess()` helper before querying table

**Internationalization:** i18next with `app/lib/i18n/i18n.server.ts` for SSR; language detected from request accept-language header, stored in cookie; `<Trans>` component renders i18n keys on client

---

*Architecture analysis: 2026-04-02*
