# Architecture

## High-Level Architecture

Aloha App is a server-side rendered multi-tenant agricultural ERP built with React Router 7 in framework/SSR mode on top of Supabase (PostgreSQL with Row Level Security). Every HTTP request is handled by a Node.js server that renders React components to a streaming HTML response via `renderToPipeableStream`.

### SSR and the Client-Server Boundary

The server/client boundary is enforced by convention and file naming:

- **Server-only files** use the `.server.ts` suffix (e.g., `org-workspace-loader.server.ts`, `server-client.server.ts`). These are never bundled into the client.
- **Route modules** export a `loader` (runs on the server) and a `default` component (runs on both server and client). Actions also run server-side.
- **Entry points**: `entry.server.tsx` handles all incoming HTTP requests with bot detection and streaming rendering. `root.tsx` wraps every route with CSRF protection, theme resolution, i18n detection, and global providers.

### Multi-Tenant Model

The app uses a dual multi-tenant model:

**Template layer (accounts/memberships):**
The inherited template provides Supabase Auth-based login, session management, and the concept of Personal/Team accounts. This powers the authentication UI shell and session cookies.

**Business layer (org/hr_employee):**
The ERP's own schema provides business-level access control:
- `org` is the tenant (organization)
- `hr_employee` is the membership table linking auth users to orgs
- `sys_access_level` defines role tiers (employee, manager, admin, owner)
- `hr_module_access` controls per-employee per-module CRUD permissions
- `org_module` / `org_sub_module` control feature toggles per org
- SQL views (`app_org_context`, `app_nav_modules`, `app_nav_sub_modules`) pre-filter data by `auth.uid()` and org membership

The long-term goal is to collapse both models so the template auth layer uses the org/hr_employee model directly.

## Layer Diagram

```
Request
  |
  v
[Entry Server]  entry.server.tsx
  |              - Bot detection
  |              - Streaming HTML via renderToPipeableStream
  v
[Root]          root.tsx
  |              - CSRF token generation
  |              - Theme resolution (cookie-based)
  |              - i18n language detection
  |              - Global providers (RootProviders)
  v
[Route Modules]  app/routes/
  |               - loader (server data fetch)
  |               - action (server mutation)
  |               - default component (SSR + hydration)
  |
  +--[Workspace Layout]  routes/workspace/layout.tsx
  |    |                   - loadOrgWorkspace() fetches org context + nav
  |    |                   - Sidebar or Header layout (cookie preference)
  |    |                   - AI Chat panel integration
  |    |
  |    +--[CRUD Routes]   routes/workspace/sub-module*.tsx
  |         |               - Config-driven list, detail, create/edit
  |         |               - Uses crud registry for table/form config
  |         v
  |    [CRUD Engine]       app/lib/crud/
  |         |               - registry.ts (Map<slug, CrudModuleConfig>)
  |         |               - crud-action.server.ts (create/update/delete/transition)
  |         |               - crud-helpers.server.ts (loadTableData, loadDetailData)
  |         |               - types.ts (CrudModuleConfig, columns, forms, workflows)
  |         v
  +--[Auth Routes]         routes/auth/
  |                         - sign-in, password-reset, callback, etc.
  |
  +--[API Routes]          routes/api/
  |                         - AI chat/form-assist endpoints
  |                         - Database webhook handler
  v
[Supabase Client]          app/lib/supabase/clients/
  |                         - server-client.server.ts (request-scoped, cookie-based)
  |                         - server-admin-client.server.ts (service role)
  |                         - browser-client.ts (client-side)
  v
[PostgreSQL + RLS]          supabase/
                            - 95 migrations (1 base schema + 94 aloha tables)
                            - 4 schema files (enums, config, accounts, privileges)
                            - RLS policies enforce org-scoping
                            - SQL views for navigation and access control
```

## Data Flow Patterns

### Server Loaders (Primary Data Fetch)

Every page load starts with a React Router `loader` running on the server:

1. `getSupabaseServerClient(request)` creates a request-scoped Supabase client using cookies from the incoming request
2. `requireUserLoader(request)` checks auth state; redirects to sign-in if unauthenticated
3. `loadOrgWorkspace()` fetches the current org context, user orgs, and navigation data
4. Domain-specific queries fetch page data (e.g., `loadTableData` for list views)
5. Loader returns serializable data accessible as `props.loaderData` in the component

### Server Actions (Mutations)

Form submissions and mutations use React Router actions:

1. Route exports an `action` function that runs server-side
2. Client submits via `useFetcher().submit()` (no full-page navigation) or standard form POST
3. Action parses request body, validates with Zod schemas, calls CRUD helpers
4. On success, actions typically `redirect()` back to the list view
5. On failure, actions return error objects consumed by the client

### CRUD Engine

The generic CRUD system drives most data pages:

1. `registry.ts` maps URL sub-module slugs to `CrudModuleConfig` objects
2. Each config defines: table name, PK type, list/detail view names, column definitions, form fields, optional workflow config, and a Zod validation schema
3. Four generic route files handle all CRUD operations:
   - `sub-module.tsx` -- list view with DataTable, search, sorting, pagination
   - `sub-module-create.tsx` -- create/edit form (shared route, two IDs)
   - `sub-module-detail.tsx` -- detail view with workflow transitions, delete
   - `module.tsx` -- redirects to first sub-module

### Client-Side Data (React Query)

TanStack Query is available for client-side async data needs but is secondary to server loaders. Most data flows through SSR loaders.

### UI State

- Component state: `useState` for simple local state
- Sidebar open/closed: persisted in cookies, read in layout loader
- Layout style (sidebar vs header): persisted in cookies
- Theme (light/dark/system): persisted in cookies, resolved in root loader

## Authentication and Authorization Architecture

### Authentication Flow

1. User visits any protected route
2. `requireUserLoader(request)` calls `requireUser(client)` which checks Supabase Auth session
3. If no valid session, user is redirected to `/auth/sign-in` with a `next` query param
4. After sign-in, Supabase Auth callback at `/auth/callback` completes the flow
5. Session is stored in HTTP-only cookies managed by `@supabase/ssr`

### Authorization Flow

Authorization is enforced at multiple levels:

**Database level (RLS):**
- All ERP tables have `org_id` column
- RLS policies restrict access based on `auth.uid()` and org membership
- SQL views (`app_nav_modules`, `app_nav_sub_modules`) pre-filter based on access level and module enablement

**Server level (route guards):**
- `requireModuleAccess()` queries `app_nav_modules` view; throws 403 if the user has no access to the module in the current org
- `requireSubModuleAccess()` queries `app_nav_sub_modules` view; throws 403 if no sub-module access
- Both views are RLS-protected and filter by `auth.uid()` automatically

**Client level (UI gating):**
- `<AccessGate permission="can_edit">` component conditionally renders UI elements
- `useModuleAccess()` hook provides access flags to components
- Navigation sidebar only shows modules/sub-modules the user can access (driven by view data)

### Access Level Hierarchy

`sys_access_level` defines tiers: employee, manager, admin, owner. Each tier unlocks progressively more modules and CRUD permissions via `hr_module_access` records.

## State Management Approach

The app follows a server-first state model:

| State Type | Mechanism | Example |
|---|---|---|
| Server data | React Router loaders (`props.loaderData`) | Org workspace, table data, record details |
| Mutations | React Router actions via `useFetcher()` | CRUD create/update/delete, workflow transitions |
| Async client data | TanStack React Query | Available but secondary to loaders |
| Form state | React Hook Form + Zod | Create/edit forms with validation |
| UI preferences | Cookies (read in loaders) | Theme, sidebar state, layout style |
| Component state | React `useState` | Dialog open/closed, local UI toggles |
| Global context | React context providers | Auth provider, React Query provider, AI chat provider |

Key principle: `useEffect` is avoided. Side effects are handled in event handlers and server loaders.

## Key Abstractions

### CRUD Module Config Registry

**Location:** `app/lib/crud/registry.ts`

A `Map<string, CrudModuleConfig>` that maps URL sub-module slugs to configuration objects. Each config declaratively describes how to query, display, and mutate a database entity -- including table name, view names, column definitions, form fields, FK relationships, workflow states/transitions, and Zod validation schema.

This is the central abstraction that enables "schema-to-app" speed: adding a new entity requires only a config file and a registry entry.

### Org Workspace Loader

**Location:** `app/lib/workspace/org-workspace-loader.server.ts`

Server-only function called from the workspace layout loader. Fetches and assembles the complete workspace context:
- Current org identity (org_id, org_name, employee_id, access_level_id)
- All orgs the user belongs to (for org switcher)
- User JWT payload
- Navigation tree (modules and sub-modules filtered by access)

Returns a typed `OrgWorkspace` object consumed by the layout and all child routes.

### Module Access Guards

**Location:** `app/lib/workspace/require-module-access.server.ts`

Server-side guard functions (`requireModuleAccess`, `requireSubModuleAccess`) that query RLS-protected SQL views. If the user lacks access, they throw a 403 Response. These are called in every workspace route loader before any data fetch.

### Supabase Client Factory

**Location:** `app/lib/supabase/clients/`

Three client variants:
- `server-client.server.ts` -- request-scoped client that reads/writes session cookies; used in all loaders and actions
- `server-admin-client.server.ts` -- service role client for admin operations (bypasses RLS)
- `browser-client.ts` -- client-side Supabase client for real-time or client-only features

### AI Integration

**Location:** `app/lib/ai/`, `app/components/ai/`, `app/routes/api/ai/`

- `AiChatProvider` / `AiChatPanel` -- persistent chat panel in workspace layout
- `AiFormAssist` -- AI-assisted form filling on create/edit pages
- `workflow-automation.server.ts` -- fire-and-forget AI evaluation of workflow transitions
- API routes at `/api/ai/chat` and `/api/ai/form-assist`

### Database Webhook Handler

**Location:** `app/lib/webhooks/`

Processes Supabase database webhooks at `/api/db/webhook`. Includes signature verification, routing by table/event type, and a handler service pattern.

## Entry Points and Request Lifecycle

### 1. HTTP Request Arrives

`entry.server.tsx` receives every request. It detects bots (via `isbot`) and chooses between:
- **Bot path:** waits for `onAllReady` (full HTML before streaming)
- **Browser path:** streams on `onShellReady` (progressive rendering)

Both paths initialize i18n and render via `renderToPipeableStream`.

### 2. Root Route

`root.tsx` runs for every page request:
- Creates CSRF token
- Resolves theme from cookie
- Detects language
- Wraps the entire app in `RootProviders` (React Query, theme, auth, i18n)

### 3. Route Matching

`routes.ts` defines all routes in four groups:
- **rootRoutes:** `/` (index), `/version`, `/healthcheck`, `/home` (redirect), `/no-access`
- **apiRoutes:** `/api/db/webhook`, `/api/ai/chat`, `/api/ai/form-assist`
- **authLayout:** `/auth/*` routes wrapped in auth layout
- **workspaceLayout:** `/home/:account/*` routes wrapped in workspace layout

### 4. Workspace Layout

For all `/home/:account/*` routes, the workspace layout loader:
1. Extracts account slug from URL params
2. Creates a request-scoped Supabase client
3. Reads layout preferences from cookies
4. Calls `loadOrgWorkspace()` to fetch org context + navigation
5. Renders sidebar or header layout based on preference
6. Renders child route via `<Outlet />`

### 5. Page Route

Individual page loaders (e.g., `sub-module.tsx`):
1. Verify module/sub-module access via guard functions
2. Look up CRUD config from registry
3. Fetch data from Supabase views
4. Return serializable data to the component

### 6. Client Hydration

After streaming HTML to the browser, React hydrates the page. Client-side navigation uses React Router's SPA-style transitions, calling loaders via fetch rather than full page reloads.

### 7. Mutations

User actions (create, edit, delete, workflow transition) submit via `useFetcher()` to route actions, which run server-side and typically redirect on success.
