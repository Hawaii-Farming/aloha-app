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

## Essential Commands

```bash
pnpm dev                    # Start app (port 5173)
pnpm supabase:start         # Start Supabase locally
pnpm supabase:reset         # Reset with latest schema
pnpm supabase:typegen       # Generate TypeScript types → app/lib/database.types.ts
pnpm supabase db diff       # Create migration diff
pnpm typecheck              # Run regularly during work
pnpm format:fix && pnpm lint:fix  # Run when task is complete
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
- **Tenant isolation**: SQL views (`app_org_context`, `app_nav_modules`, `app_user_orgs`) use `auth.uid()` + `hr_employee` membership to filter rows. RLS policies enforce at database layer.
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
