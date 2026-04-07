# Coding Conventions

**Analysis Date:** 2026-04-07

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` — e.g., `app-logo.tsx`, `sidebar-navigation.tsx`, `create-panel.tsx`, `navbar-search.tsx`
- Server-only modules: `.server.ts` suffix — e.g., `org-workspace-loader.server.ts`, `server-client.server.ts`, `build-system-prompt.server.ts`
- Zod schemas: `.schema.ts` suffix — e.g., `password-sign-in.schema.ts`, `password-reset.schema.ts`
- Page objects for E2E: `.po.ts` suffix — e.g., `auth.po.ts`, `crud.po.ts`
- Route loaders/components: `kebab-case.tsx` in route directories — e.g., `sub-module-create.tsx`, `workspace/layout.tsx`
- Config files: `.config.ts` or `.config.tsx` suffix — e.g., `workspace-navigation.config.tsx`, `app.config.ts`, `module-icons.config.ts`, `hr-employee.config.ts`

**Functions:**
- camelCase for all function names — e.g., `handleGenerate()`, `extractFieldDescriptions()`, `derivePageType()`, `loadTableData()`, `sanitizeSearch()`, `createMockSupabaseChain()`
- Server action functions: `xyzAction` suffix — e.g., `deletePersonalAccountAction`

**Variables & Parameters:**
- camelCase for local variables, parameters, and properties — e.g., `currentPath`, `state`, `setOpen`, `hasHandledSuccess`, `testDeptName`
- Destructured object parameters preferred over positional arguments for complex inputs

**React Components:**
- PascalCase for component names — e.g., `AppLogo`, `WorkspaceSidebar`, `CreatePanel`, `SidebarEdgeToggle`
- `interface` for component props objects — e.g., `interface CreatePanelProps`, `interface OrgAccount`
- Example from codebase:
  ```typescript
  interface CreatePanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: CrudModuleConfig | undefined;
    fkOptions: Record<string, Array<{ value: string; label: string }>>;
  }
  export function CreatePanel({
    open,
    onOpenChange,
    config,
    fkOptions,
  }: CreatePanelProps) { ... }
  ```

**Types & Interfaces:**
- `interface` for component props and object contracts
- `type` for utility types, derived types, and unions — e.g., `type AppNavModule`, `type OrgWorkspace`, `type LoadTableDataParams`
- No explicit generics on `useForm` — Zod resolver infers types automatically

**Exports:**
- Default export for page components (function declaration, PascalCase) — e.g., `export default function TeamWorkspaceLayout(props: Route.ComponentProps) { ... }`
- Named exports for `loader`, `action`, `meta`, and utility functions
- Barrel files (index.ts) can export multiple related items

**Unused Variables:**
- Prefix with `_` to suppress ESLint warnings — e.g., `_unusedParam`, `_ignored`

## Code Style

**Formatting Tool:** Prettier 3.7.4

**Format Settings:**
- `tabWidth: 2`
- `useTabs: false`
- `semi: true` — always include semicolons
- `printWidth: 80` — wrap lines at 80 characters
- `singleQuote: true` — use single quotes
- `arrowParens: 'always'` — always include parentheses around arrow function parameters

**Linting Tool:** ESLint 9.39.2 with flat config format

**Key ESLint Rules:**
- `@typescript-eslint/no-unused-vars` — error with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'`
- `react/react-in-jsx-scope` — off (React 19 doesn't require import)
- `react/prop-types` — off (use TypeScript instead)
- Import ordering and duplicate elimination enabled via plugins
- Many TypeScript linting rules disabled to prevent overly strict checking (`@typescript-eslint/no-unsafe-assignment`, `no-unsafe-argument`, etc.)

**Plugins:**
- `@trivago/prettier-plugin-sort-imports` — automatic import ordering
- `prettier-plugin-tailwindcss` — Tailwind class ordering
- TypeScript ESLint plugin for type-aware rules

## Import Organization

**Order (with blank line separation between groups):**
1. `.css` files and style imports
2. `server-only` (if used)
3. React core: `react`, `react-dom`, `react-router`, `@react-router/*`
4. Database/backend: `@supabase/supabase-js`
5. Third-party modules
6. Monorepo packages: `@aloha/*`
7. App-level imports: `~/*` (aliased to `./app/*`)
8. Relative imports: `./`, `../`

**Path Aliases:**
- `~/*` → `./app/*` for app-level imports
- `~/types/*` → `./.react-router/types/*` for React Router generated types

**Example from codebase** (`app/components/crud/create-panel.tsx`):
```typescript
import { useCallback, useRef } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';

import { Button } from '@aloha/ui/button';
import { Form } from '@aloha/ui/form';
import { If } from '@aloha/ui/if';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';
import { toast } from '@aloha/ui/sonner';
import { Trans } from '@aloha/ui/trans';

import { FormFieldGrid } from '~/components/crud/form-field-grid';
import type { CrudModuleConfig, FormFieldConfig } from '~/lib/crud/types';
import { buildDefaultValues } from '~/lib/crud/workflow-helpers';
```

**Specifier Sorting:** Within each import, specifiers are sorted alphabetically.

## Error Handling

**Server Loaders & Actions:**
- Check `.error` field on Supabase query results and throw/redirect on failure
- Use `requireUserLoader(request)` to validate session and redirect to sign-in if not authenticated — throws `redirect()` on auth failure
- Example from `require-user-loader.ts`:
  ```typescript
  export async function requireUserLoader(request: Request) {
    const client = getSupabaseServerClient(request);
    const auth = await requireUser(client);
    if (!auth.data || auth.error) {
      const nextPath = new URL(request.url).pathname;
      const redirectPath = auth.redirectTo + (nextPath ? `?next=${nextPath}` : '');
      throw redirect(redirectPath);
    }
    return auth.data;
  }
  ```
- RLS policy denials return `{ data: null, error }` — loader checks and redirects to `/no-access`

**API Routes & Actions:**
- Wrap server operations in try/catch
- Return `new Response(null, { status: 500 })` on failure
- Log errors via `console.error()` in entry handler or specific loaders

**React Components:**
- Use error boundaries for render errors — root error boundary: `components/root-error-boundary.tsx`
- Use React Query for async operations — handles error state within query objects
- Form validation via Zod schema — errors displayed via `<FormMessage />` component

**Pattern Example** from `org-workspace-loader.server.ts`:
```typescript
const { data: employees, error: empError } = await params.client
  .from('hr_employee')
  .select('id, org_id, sys_access_level_id, org:org!inner(name)')
  .eq('user_id', user.sub)
  .eq('is_deleted', false);

const allOrgs = castRows<EmployeeOrgRow>(employees);

if (empError || allOrgs.length === 0) {
  throw redirect('/no-access');
}
```

## Logging

**Framework:** Console-based logging (browser) and `pino` (server-side)

**Logger Interface:**
- `info()`, `error()`, `warn()`, `debug()`, `fatal()` methods
- Accept object + message or message-only patterns
- File: `app/lib/shared/logger/logger.ts` (interface); implementations in `impl/console.ts` and `impl/pino.ts`

**Usage:**
- Server-side errors logged in `entry.server.tsx` via `console.error(error)` on shell rendering errors
- Used sparingly in route loaders and server actions
- Not extensively used in components — rely on error boundaries instead

**Example from `entry.server.tsx`:**
```typescript
onError(error: unknown) {
  responseStatusCode = 500;
  if (shellRendered) {
    console.error(error);
  }
}
```

## Comments

**When to Comment:**
- Avoid obvious comments
- Use block comments for complex logic or non-obvious intent
- Comments placed above the code they describe
- Justified only when "why" is not immediately clear from code

**JSDoc/TSDoc:**
- Used for exported functions and components
- Full usage documentation for complex utilities
- Example from `AiFormAssist` (available in codebase):
  ```typescript
  /**
   * @name AiFormAssist
   * @description Assists user with form filling via AI suggestions
   * @param props - Form context and mode
   * @returns JSX element
   */
  export function AiFormAssist(props: AiFormAssistProps) { ... }
  ```

## Function Design

**Size:** Prefer smaller functions (<100 lines) for clarity and testability

**Parameters:** Destructured object parameters for functions with multiple inputs
- Example: `loadTableData({ client, viewName, orgId, ... })`

**Return Values:** Explicit return types for public functions
- Always annotate exported function return types
- Async functions return Promises with specific types

## React Patterns

**Component Structure:**
- Functional components using `function ComponentName()` syntax
- Props passed as destructured parameters with type annotation
- Use `interface` for props types
- Example from `app-logo.tsx`:
  ```typescript
  function LogoImage({ className }: { className?: string; width?: number }) {
    return (
      <span className={cn('text-primary ...', className)}>
        Aloha
      </span>
    );
  }
  
  export function AppLogo({
    href,
    label,
    className,
  }: {
    href?: string;
    className?: string;
    label?: string;
  }) {
    return (
      <Link aria-label={label ?? 'Home Page'} to={href ?? '/'}>
        <LogoImage className={className} />
      </Link>
    );
  }
  ```

**State Management:**
- `useState` for simple boolean/primitive state — e.g., `const [showPassword, setShowPassword] = useState(false)`
- Prefer single `useState` for related state (state object over multiple hooks) — e.g.:
  ```typescript
  const [state, setState] = useState({ open: false, loading: false, error: null });
  ```
- Never use `watch()` — use `useWatch` hook instead when needed

**Hooks:**
- `useCallback` wrapping all event handler functions passed as props
- `useRef` for values that should not trigger re-renders — e.g., `redirecting.current`, `hasHandledSuccess.current`
- **`useEffect` is a code smell — avoid if possible.** Side effects handled via:
  - Event handlers in components
  - Server loaders passing initial data
  - React Router `action` for form submissions
  - React Query for async operations
- Justified example: `NavbarSearch.tsx` uses `useEffect` to attach keyboard listener (Cmd/Ctrl+K)
- `useMemo` for derived state and expensive computations

**Form Handling:**
- Schema defined in separate `.schema.ts` file
- `useForm({ resolver: zodResolver(Schema) })` — no explicit generic type on `useForm`
- Always include `<FormMessage />` in every field to display validation errors
- `<FormDescription>` is optional
- Example from `create-panel.tsx`:
  ```typescript
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(formFields, null),
  });
  ```

**Server State & Async:**
- Server state passed via React Router `loader` data as `props.loaderData`
- React Query mutations (`useMutation`, `mutateAsync`) preferred for client-side async operations
- `useFetcher()` for form submissions without navigation
- Example from `create-panel.tsx`:
  ```typescript
  const fetcher = useFetcher();
  const form = useForm({ ... });
  const onSubmit = useCallback((data) => {
    fetcher.submit(data, { method: 'POST', action: 'create' });
  }, [fetcher]);
  ```

**Imperative State Management:**
- Use `useRef` for flags that don't trigger re-renders
- Example from `create-panel.tsx`:
  ```typescript
  const hasHandledSuccess = useRef(false);
  if (fetcher.state === 'idle' && !hasHandledSuccess.current) {
    if (fetcherData !== undefined && !fetcherData.success) {
      toast.error(fetcherData.error ?? 'Validation failed');
      hasHandledSuccess.current = true;
    }
  }
  ```

## Module Design

**Exports:**
- Named exports for utilities and service functions
- Default export for page components only
- Barrel files (index.ts) export multiple related items
- Example: `app/lib/crud/` modules export functions for CRUD operations

**Organization:**
- `app/components/` — shared UI components organized by feature (auth, ai, sidebar, crud, etc.)
- `app/lib/` — utilities organized by concern (auth, workspace, supabase, csrf, i18n, ai, crud)
- `.server.ts` files live in same directory as imports — never imported client-side
- Example structure:
  - `app/lib/crud/crud-helpers.server.ts` — server-only CRUD utilities
  - `app/lib/workspace/org-workspace-loader.server.ts` — server-only workspace loader
  - `app/lib/supabase/clients/server-client.server.ts` — server-only Supabase client

## Testing Attributes

**Data-Test Attributes:**
- Add `data-test` attribute to key UI elements for Playwright E2E test selectors
- Used in page objects to identify elements without relying on fragile selectors
- Examples from codebase:
  - `<button data-test="create-panel-submit">` → queried as `page.locator('[data-test="create-panel-submit"]')`
  - `<div data-test="crud-data-table">` → used as root for table queries
  - `<input data-test="table-search">` → search input in CRUD lists
  - `<tr>` in table body for `[data-test="crud-data-table"] tbody tr`

---

*Convention analysis: 2026-04-07*
