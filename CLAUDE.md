# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### Core Technologies

- **React Router 7** in SSR/Framework mode
- **Supabase**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4** and Shadcn UI
- **Turborepo**

## Project Structure

- Root - Main React Router ERP application (app/, lib/, components/, config/, supabase/)
- `e2e/` - Playwright end-to-end tests
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
pnpm dev                    # Start app (port 5173)
pnpm dev:all                # Start all packages in parallel via turbo
```

### Database Operations

```bash
pnpm supabase:start         # Start Supabase locally
pnpm supabase:reset         # Reset with latest schema
pnpm supabase:typegen       # Generate TypeScript types
pnpm supabase db diff       # Create migration diff
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

**Aloha Supabase Theme**

A comprehensive retheme of the Aloha agricultural ERP to adopt a Supabase-inspired design system. The work applies a dark-mode-native aesthetic with emerald green accents, border-based depth, and geometric typography (Geist/Geist Mono) to all existing Shadcn UI components — plus adds a matching light theme. This is purely a visual/CSS layer project; no business logic, framework, or library changes.

**Core Value:** Every screen in Aloha looks and feels like a premium Supabase-quality product — cohesive, professional, and consistent across both dark and light themes.

### Constraints

- **Tech stack**: Shadcn UI + Tailwind CSS 4 + Radix — no new UI libraries
- **Font licensing**: Must use free fonts (Geist is MIT-licensed, good to go)
- **Theme toggle**: Must preserve existing next-themes infrastructure
- **Component API**: No breaking changes to component props or usage patterns
- **Accessibility**: Color contrast ratios must meet WCAG AA in both themes
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.x - All application code, packages, tooling, and configuration
- SQL (PostgreSQL 15) - Database schemas, migrations, and RLS policies in `supabase/schemas/` and `supabase/migrations/`
- HTML/CSS - Templates via Tailwind CSS v4 utility classes; no raw CSS files
- JavaScript (Node.js) - Build scripts and tooling entry points
## Runtime
- Node.js >=20.x (root workspace requirement), >=18.x (web app compatible)
- Bun/pnpm 10.18.1 as package manager (configured in `package.json` `packageManager` field)
- Present: `pnpm-lock.yaml`
- pnpm workspaces configured in `pnpm-workspace.yaml`
- Workspace catalog pinning at `pnpm-workspace.yaml` with versions: `@supabase/supabase-js` 2.89.0, `@tanstack/react-query` 5.90.12, `react` 19.2.3, `zod` 3.25.74
## Frameworks
- React Router 7.12.0 (`react-router`, `@react-router/dev`, `@react-router/serve`, `@react-router/node`) - SSR/Framework mode with file-based routing via `@react-router/fs-routes` 7.12.0
- React 19.2.3 - UI rendering framework
- Vite 7.3.0 - Build tool and dev server via `@react-router/dev/vite`
- Tailwind CSS 4.1.18 (`tailwindcss`, `@tailwindcss/vite`) - Utility-first CSS framework
- Custom tailwind config: `@aloha/tailwind-config/vite` plugin for integration with Vite
- Prettier plugin `@trivago/prettier-plugin-sort-imports` - Import sorting in `prettier` 3.7.4
- Shadcn UI - Component library built on Radix UI 1.4.3 primitives; components located in `packages/ui/src/shadcn/`
- Radix UI 1.4.3 - Accessible component primitives
- Lucide React 0.562.0 - Icon library
- `next-themes` 0.4.6 - Dark/light/system theme toggle support
- React Hook Form 7.69.0 - Client form state management
- `@hookform/resolvers` 5.2.2 - Zod resolver integration (no explicit generics on `useForm`)
- Zod 3.25.74 - TypeScript-first schema validation; workspace-cataloged
- TanStack Query 5.90.12 (`@tanstack/react-query`) - Async client-side data fetching, caching, and synchronization
- TanStack Table 8.21.3 (`@tanstack/react-table`) - Headless data table primitives
- i18next 25.7.x - i18n framework
- react-i18next 16.5.x - React i18n provider and hooks
- `i18next-browser-languagedetector` - Auto browser language detection
- `i18next-resources-to-backend` 1.2.1 - Lazy locale loading from `public/locales`
- Recharts 2.15.x - Charting and data visualization library
- `sonner` 2.0.7 - Toast notification system (exported as `@aloha/ui/sonner`)
- `clsx` 2.1.1 - Conditional class name utility
- `tailwind-merge` 3.4.0 - Tailwind CSS class merging utility
## Testing
- Playwright 1.57.x (`@playwright/test`) - Browser automation and E2E test framework
- Config: `e2e/playwright.config.ts`
- Tests: `e2e/tests/`
- Base URL: `http://localhost:5173`
- Timeout: 120 seconds, expect timeout 30 seconds
- Supabase pgTAP - Database unit tests via `pnpm supabase:test`
- Test location: `supabase/tests/`
## Build & Development
- Vite 7.3.0 with React Router 7 integration
- SSR enabled in `react-router.config.ts`
- Turborepo 2.6.2 - Build orchestration via `turbo.json`
- Task cache invalidation through `globalEnv` env var declarations
- `react-router typegen` - Generates route types to `.react-router/types/`
- Supabase types: `pnpm supabase:typegen` generates `app/lib/database.types.ts` from local/remote schema
- ESLint 9.39.2 - Linting framework (flat config format, ESLint 9.x)
- `@aloha/eslint-config` - Shared ESLint config with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`
- Prettier 3.7.4 - Code formatting with `@aloha/prettier-config`
- Format config: `tabWidth: 2`, `useTabs: false`, `semi: true`, `printWidth: 80`, `singleQuote: true`, `arrowParens: 'always'`
- TypeScript 5.9.3 - Strict type checking
- Base config extends `@aloha/tsconfig/base.json`
- Path aliases: `~/*` → `./app/*` for app-level imports, `~/types/*` → `./.react-router/types/*`
- `cross-env` 10.1.0 - Cross-platform environment variable setting
- `dotenv-cli` 11.0.0 - Load `.env` files in npm scripts via `pnpm with-env`
- `isbot` 5.1.32 - Bot detection for crawler handling in SSR
## Key Dependencies
- `@supabase/supabase-js` 2.89.0 - Supabase JavaScript client (database, auth, realtime)
- `@supabase/ssr` 0.8.0 - SSR-compatible Supabase helpers for server client creation with session cookie management
- `ai` 6.0.141 - Vercel AI SDK for streaming responses
- `@ai-sdk/anthropic` 3.0.64 - Anthropic Claude integration via Vercel AI SDK
- `@ai-sdk/react` 3.0.143 - React hooks for AI SDK
- `@edge-csrf/core` 2.5.3-cloudflare-rc1 - CSRF token generation and verification
- `supabase` 2.67.3 - Supabase CLI for local development and migrations
- `postgres` 3.4.7 - PostgreSQL client (used in `packages/mcp-server`)
- `pino` 10.1.0 - Structured server-side logging framework
- `react-router-serve` 7.12.0 - Production SSR server via `react-router-serve ./build/server/index.js`
- `nodemailer` 7.0.x - SMTP email sending (optional, swappable with Resend)
- `@modelcontextprotocol/sdk` 1.24.3 - MCP server SDK in `packages/mcp-server/`
- `class-variance-authority` 0.7.1 - Type-safe CSS class composition (used in shadcn components)
- `date-fns` 4.1.0 - Date manipulation utility library
- `input-otp` 1.4.2 - OTP input component primitives
- `react-day-picker` 9.13.0 - Date picker component
- `react-top-loading-bar` 3.0.2 - Top loading progress bar
- `tailwindcss-animate` 1.0.7 - Tailwind CSS animation utilities
- `cmdk` 1.1.1 - Command/search menu component
- `eslint-import-resolver-typescript` 4.4.4 - ESLint import resolver
- `@types/node` 25.0.3 - Node.js type definitions (catalog)
- `@types/react` 19.2.7 - React type definitions (catalog)
- `@types/react-dom` 19.2.3 - React DOM type definitions
- `manypkg` 0.25.x - Monorepo dependency validation
- `vite-tsconfig-paths` 6.0.3 - Vite plugin for TypeScript path aliases
## Configuration Files
- `vite.config.ts` - Vite configuration with React Router and Tailwind plugins; SSR enabled
- `react-router.config.ts` - React Router SSR config; Vercel preset available (commented out)
- `tsconfig.json` - Root TypeScript config with path alias `~/*` → `./app/*`
- `.prettierrc` - Prettier configuration (via `@aloha/prettier-config`)
- `.eslintrc` - ESLint config (via `@aloha/eslint-config`, flat format)
- `.env.template` - Environment variable template for local development
- `supabase/config.toml` - Supabase local dev configuration
## Environment Configuration
- `VITE_SUPABASE_URL` - Supabase API endpoint
- `VITE_SUPABASE_PUBLIC_KEY` - Supabase public anon key
- `VITE_SITE_URL` - App base URL for auth redirects
- `VITE_PRODUCT_NAME` - Brand name (e.g., "Aloha")
- `VITE_SITE_TITLE` - Page title
- `VITE_SITE_DESCRIPTION` - Page description
- `VITE_DEFAULT_THEME_MODE` - Theme default (light/dark)
- `VITE_THEME_COLOR` - Light theme color
- `VITE_THEME_COLOR_DARK` - Dark theme color
- `VITE_LOCALES_PATH` - Locale files path
- Feature flags: `VITE_ENABLE_TEAM_ACCOUNTS`, `VITE_ENABLE_SIDEBAR_TRIGGER`, `VITE_ENABLE_THEME_TOGGLE`, `VITE_LANGUAGE_PRIORITY`
- Auth flags: `VITE_AUTH_PASSWORD`, `VITE_AUTH_MAGIC_LINK`
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `SUPABASE_DB_WEBHOOK_SECRET` - Webhook signature verification
- `LOGGER` - Log level configuration
- Email config: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, `EMAIL_SENDER`
- `MAILER_PROVIDER` - Email provider choice: `nodemailer` or `resend`
- Optional OAuth: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `AZURE_OAUTH_CLIENT_ID`, `AZURE_OAUTH_CLIENT_SECRET`
## Platform Requirements
- Node.js >=20.x
- pnpm 10.18.1
- Docker (optional; Supabase local dev can run via `pnpm supabase:start`)
- Supabase CLI for local database (handles PostgreSQL 15 in Docker)
- Node.js >=18.x
- Supabase hosted project (configured in Supabase console)
- Environment variables set in hosting provider (Vercel, etc.)
- SSR server runs via `react-router-serve ./build/server/index.js` on port configurable via hosting provider
- `build/` directory containing `build/server/index.js` (SSR entry point) and static assets
- Deployment preset available for Vercel (commented in `react-router.config.ts`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: `kebab-case.tsx` — e.g., `password-sign-in-form.tsx`, `module-sidebar-navigation.tsx`, `ai-chat-provider.tsx`
- Server-only modules: `.server.ts` suffix — e.g., `org-workspace-loader.server.ts`, `build-system-prompt.server.ts`, `create-csrf-protect.server.ts`
- Zod schemas: `.schema.ts` suffix — e.g., `password-sign-in.schema.ts`, `password-reset.schema.ts`
- Page objects for E2E: `.po.ts` suffix — e.g., `auth.po.ts`
- Route loaders/components: `kebab-case.tsx` in route directories
- Config files: `.config.ts` suffix — e.g., `app.config.ts`, `workspace-navigation.config.tsx`, `module-icons.config.ts`
- camelCase for all function names — e.g., `handleGenerate()`, `extractFieldDescriptions()`, `derivePageType()`
- camelCase for local variables and parameters — e.g., `currentPath`, `state`, `setOpen`
- React components: PascalCase — e.g., `ModuleSidebarNavigation`, `PasswordSignInForm`, `AiChatProvider`
- `interface` for component props objects — e.g., `interface ModuleSidebarNavigationProps`, `interface AiFormAssistProps<T>`
- `type` for utility types, derived types, and unions — e.g., `type AppNavModule`, `type AppNavSubModule`
- Destructured object parameters preferred over positional arguments for complex inputs
- No explicit generics on `useForm` — Zod resolver infers types automatically
- Default export for page components (function declaration, PascalCase) — e.g., `export default function App()`
- Named exports for `loader`, `action`, `meta`, and utility functions
- Server actions named `xyzAction` — e.g., `deletePersonalAccountAction`
- Prefix with `_` to suppress ESLint warnings — e.g., `_unusedParam`, `_ignored`
## Code Style
- Tool: Prettier 3.7.4 with `@trivago/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- Settings:
- ESLint 9.x with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Key rules:
## Import Organization
- `@aloha/*` — monorepo packages (defined in workspace `package.json`)
- `~/` — app-level imports in `apps/web` (aliased to `./app`)
- Example: `import { cn } from '@aloha/ui/utils'` or `import appConfig from '~/config/app.config'`
- Import order separation enabled (blank lines between groups)
- Specifiers within imports sorted alphabetically
## React Patterns
- `export function ComponentName(props)` — preferred for route pages and standalone utilities
- `export const ComponentName: React.FC<{...}>` — used for inline prop types in features
- Default export for page components (function declaration)
- Props passed as destructured parameters with type annotation
- Use `interface` for props types
- Example:
- `useState` preferred for simple boolean/primitive state — e.g., `const [showPassword, setShowPassword] = useState(false)`
- Single `useState` for related state (prefer state object over multiple hooks) — e.g., `const [state, setState] = useState({ open: false, loading: false, error: null })`
- `useCallback` wrapping all event handler functions passed as props
- `useRef` for values that should not trigger re-renders — e.g., `redirecting.current`
- `useEffect` is avoided; side effects handled in event handlers and server loaders
- `useMemo` for derived state and expensive computations — e.g., `context` derived from route params
- React Query mutations (`useMutation`, `mutateAsync`) preferred over manual fetch + state
- Server state passed via React Router `loader` data as `props.loaderData`
- Client state via React Query for async operations
- Avoid obvious comments
- Use block comments for complex logic or non-obvious intent
- JSDoc/TSDoc for exported functions and components (see `AiFormAssist` example with full usage documentation)
- Comments placed above the code they describe
## Form Handling
- Schema defined in separate `.schema.ts` file — e.g., `password-sign-in.schema.ts`
- `useForm({ resolver: zodResolver(Schema) })` — no explicit generic type on `useForm`
- Never use `watch()`; use `useWatch` hook instead
- Always include `<FormMessage />` in every field to display validation errors
- `<FormDescription>` is optional
## Error Handling
- API routes: try/catch returning `new Response(null, { status: 500 })` on failure — e.g., in `/api/ai/chat`
- Auth errors: `requireUserLoader()` throws `redirect()` to sign-in path on auth failure
- Service errors: Supabase operations check `.error` on result object and throw; callers use try/catch
- Root error boundary: `components/root-error-boundary.tsx` catches all unhandled route errors
- Server entry error handler: `handleError()` in `entry.server.tsx` logs error via console
## Logging
- Files: `app/lib/shared/logger/logger.ts` (interface), `impl/console.ts`, `impl/pino.ts` (implementations)
- Logger interface exports: `info`, `error`, `warn`, `debug`, `fatal` methods
- All methods accept object + message or message-only patterns
- Server-side errors in entry handler and route loaders
- Not used extensively in components (prefer error boundaries for render errors)
- Example from `entry.server.tsx`: `console.error(error)` on shell rendering errors
## Module Design
- Named exports for utilities, service functions, components
- Default export for page components
- Barrel files (index.ts) can export multiple related items
- `app/components/` — shared UI components organized by feature (auth, ai, sidebar, etc.)
- `app/lib/` — utilities organized by concern (auth, workspace, supabase, csrf, i18n, ai, crud)
- `.server.ts` files live in same directory as their imports — never imported client-side
## State Management
- React `useState` for simple state (boolean flags, form input values)
- State object pattern for related state: `const [state, setState] = useState({ open: false, loading: false, error: null })`
- `useMemo` for derived state based on props/other state
- React Router `loader` data passed as `props.loaderData` to route components
- No manual state management for async server data — use React Query
- Create context via `createContext<ValueType | null>(null)`
- Custom hook to access context: `useXxx()` pattern that throws if not in provider
- Example: `useAiChat()` throws `'useAiChat must be used within an AiChatProvider'` if called outside provider
- Memoized context value to prevent unnecessary re-renders
## Testing Attributes
- Add `data-test` attribute to key UI elements for Playwright selectors
- Used in page objects to identify elements
- Example: `<button data-test="auth-submit-button">` → `await this.page.click('[data-test="auth-submit-button"]')`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- SSR-first via React Router 7 framework mode — all routes define `loader` (server) and `default` component (client)
- Strong server/client separation: `.server.ts` files and `.server` directories are never imported client-side
- Request-scoped Supabase client for session/auth handling via `@supabase/ssr`
- Multi-tenant org-scoped data access via `org` + `hr_employee` membership model
- Form state via React Router `useFetcher()` for mutations without navigation
- Data fetching via React Query (`@tanstack/react-query`) on client for async operations
## Layers
- Purpose: Define HTTP handlers (loaders, actions) and render React components
- Location: `app/routes/**/*.tsx`, `app/routes/**/*.ts`
- Contains: Page components, data loaders, form actions, layout wrappers
- Depends on: Feature packages, lib utilities, config
- Used by: React Router framework at runtime
- Pattern: Each route file exports `loader` (server), `action` (server), `default` export (component), `meta`, `ErrorBoundary`
- Purpose: Workspace chrome loaded once per section — navigation, sidebar/header, org selection
- Location: `app/routes/workspace/layout.tsx`, `app/routes/auth/layout.tsx`
- Contains: Workspace loader that hydrates navigation and org context
- Depends on: Supabase server client, workspace loaders
- Used by: Child routes via React Router layout groups
- Pattern: Layout loader runs once, passes `loaderData` to child routes; uses cookies for UI state (sidebar open/closed)
- Purpose: Server-side utilities and hooks shared by routes
- Location: `app/lib/**/*.server.ts` (server-only), `app/lib/**/*.ts` (client/server)
- Contains: Supabase clients, workspace loaders, CSRF, i18n, auth helpers, CRUD helpers
- Depends on: Supabase SDK, external SDKs
- Used by: Routes, components, other lib modules
- Purpose: React components for pages, layouts, and reusable UI
- Location: `app/components/**/*.tsx`
- Contains: Route page components, auth forms, workspace navigation, sidebar
- Depends on: UI primitives (`@aloha/ui`), app lib utilities
- Used by: Routes
- Purpose: Org-scoped data persistence with row-level security
- Location: `supabase/schemas/` (SQL), `app/lib/database.types.ts` (generated TypeScript)
- Contains: Tables, RLS policies, views (`app_org_context`, `app_nav_modules`, `app_user_orgs`)
- Accessed via: `getSupabaseServerClient(request)` (server) or `useSupabase()` hook (client)
## Data Flow
## Key Abstractions
- Purpose: Load user's orgs, current org context, and navigation for layout
- Examples: `app/lib/workspace/org-workspace-loader.server.ts`
- Pattern: Server-only function called from layout loader; returns typed `OrgWorkspace` object with current org, user orgs, and nav modules/sub-modules
- Caching: Results not cached; fresh load on every layout request
- Purpose: Supabase client tied to request session — reads/writes auth cookies automatically
- Examples: `app/lib/supabase/clients/server-client.server.ts`
- Pattern: `getSupabaseServerClient(request)` creates new client per request using `@supabase/ssr` helpers
- Error handling: Queries return `{ data, error }` — check error and throw/redirect on auth failure
- Purpose: SQL views that enforce tenant filtering — queries automatically scoped to current user's org
- Examples: `app_org_context` (current org), `app_nav_modules` (modules user can access), `app_user_orgs` (all orgs user belongs to)
- Pattern: Views use `auth.uid()` and `hr_employee` membership to filter rows
- Usage: Loader queries untyped views (not in generated types), casts result to app types
- Purpose: Dynamic config mapping module slug → table schema, columns, API endpoint
- Examples: `app/lib/crud/registry.ts`
- Pattern: `getModuleConfig(moduleSlug)` returns column defs, form schema, validation rules
- Used by: Sub-module list, detail, and create/edit routes for table rendering and form generation
- Purpose: Prevent cross-site request forgery on form submissions
- Examples: `app/lib/csrf/server/create-csrf-protect.server.ts`, `app/lib/csrf/client/`
- Pattern: Root loader generates token via `csrfProtect(request)`, stores in HTML meta tag
- Usage: Form actions validate token before executing mutations
## Entry Points
- Triggers: Every incoming HTTP request
- Responsibilities: Bot detection (via `isbot`), streaming HTML rendering via `renderToPipeableStream`, error logging
- Pattern: Distinguishes bot requests (full render before response) from browser (streaming render on shell ready)
- Triggers: All page requests (renders as outermost component for every route)
- Responsibilities: CSRF token generation, theme resolution (light/dark), i18n language detection, global providers setup
- Pattern: Loader runs once at app startup; provides `loaderData` with `language`, `theme`, `csrfToken` to all routes
- Providers: `RootProviders` wraps all children with theme, React Query, i18n context
- Triggers: Build time and runtime routing
- Responsibilities: Declares all routes organized into layout groups
- Pattern: Three layout groups: `rootRoutes` (index, version, health), `authLayout` (sign-in, password reset), `workspaceLayout` (home, modules, CRUD)
- Dynamic: Workspace routes parametrized by `account`, `module`, `subModule`, `recordId`
- Triggers: All routes under `/home/:account/*`
- Responsibilities: Load org workspace (user's orgs, current org, navigation), hydrate page chrome (sidebar/header)
- Pattern: Loader calls `loadOrgWorkspace()` → queries org context and nav views → passes to layout component
- State: Sidebar open/closed persisted in cookie
- Triggers: POST requests to `/api/*` paths
- Responsibilities: AI chat, form assist, database webhooks, OTP, account operations
- Pattern: Export `action({ request })` — parse request body, call external SDK or database, return Response or stream
- Examples:
## Error Handling
- **Auth errors:** `requireUserLoader(request)` throws `redirect('/auth/sign-in')` if session invalid
- **RLS errors:** Supabase queries return `{ data: null, error }` on permission denial; loader checks error and throws `redirect('/no-access')`
- **Validation errors:** Zod schema in action validates input; if invalid, re-render form with error messages
- **Route errors:** React Router error boundary (`RootErrorBoundary`) catches unhandled route errors, displays generic error page
- **API errors:** Route handlers return `new Response(null, { status: 500 })` on failure
- **Database errors:** Try/catch around Supabase operations; log and return user-friendly error response
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
