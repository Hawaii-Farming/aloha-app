# Code Conventions

This document captures the actual coding conventions observed in the aloha-app codebase. It is derived from configuration files, ESLint/Prettier rules, and representative source files.

## File Naming

All source files use **kebab-case**. The suffix indicates the file's role:

| Pattern | Role | Example |
|---------|------|---------|
| `kebab-case.tsx` | React component | `password-sign-in-form.tsx` |
| `kebab-case.server.ts` | Server-only module (never imported client-side) | `org-workspace-loader.server.ts` |
| `kebab-case.service.ts` | Service class | `database-webhook-handler.service.ts` |
| `kebab-case.schema.ts` | Zod validation schema | `password-sign-in.schema.ts` |
| `kebab-case.config.ts` | Configuration/registry entry | `hr-department.config.ts` |
| `kebab-case.po.ts` | Playwright page object | `auth.po.ts` |

Route files live directly in `app/routes/` subdirectories with no special suffix.

## Component Patterns

### Functional Components Only

Two styles coexist:

```typescript
// Route pages and standalone utilities (preferred)
export default function SubModulePage(props: Route.ComponentProps) { ... }

// Feature components with inline prop types
export const PasswordSignInContainer: React.FC<{
  onSignIn?: (userId?: string) => unknown;
}> = ({ onSignIn }) => { ... };
```

### Props

- Use `interface` for named props objects: `interface EmailPasswordSignUpContainerProps`
- Use `type` for utility types, derived types, and unions: `type Account = Tables<'accounts'>`
- Destructure props in the function signature when using `React.FC`; pass `props` object for route components

### Exports

- **Default export** for page components (function declaration, PascalCase)
- **Named exports** for `loader`, `clientLoader`, `action`, `meta`
- Route loaders use `export const loader = async (args: Route.LoaderArgs) => { ... }`

### Client Directive

Components that use browser-only APIs or hooks (react-hook-form, mutations) are marked with `'use client';` at the top.

## Import Organization

Prettier auto-sorts imports via `@trivago/prettier-plugin-sort-imports`. The configured order (from `tooling/prettier/index.mjs`):

1. Non-CSS imports
2. `server-only`
3. `react`
4. `react-dom`
5. `react-router` / `@react-router`
6. `@supabase/supabase-js`
7. Third-party modules
8. `@aloha/*` (monorepo packages)
9. `~/` (app-level imports)
10. Relative imports (`./`, `../`)

Each group is separated by a blank line. Specifiers within each import are sorted alphabetically.

### Path Aliases

- `@aloha/*` -- monorepo packages (e.g., `@aloha/ui/button`, `@aloha/ui/form`)
- `~/` -- app-level imports resolved to `./app/` (e.g., `~/lib/crud/registry`, `~/config/app.config`)
- `~/types/*` -- resolved to `./.react-router/types/*` for generated route types

## TypeScript Conventions

### Type Inference

Always use implicit type inference. Do not annotate return types or variable types that TypeScript can infer.

```typescript
// Good
const form = useForm({ resolver: zodResolver(Schema) });

// Bad
const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema) });
```

### Supabase Types

Use generated types from the database:

```typescript
import type { Tables, Enums } from '@aloha/supabase/database';

type Org = Tables<'org'>;
type Employee = Tables<'hr_employee'>;
```

In app-level code, import from `~/lib/database.types` (enforced by ESLint rule in `tooling/eslint/apps.js`).

### No `any`

`any` is forbidden. Use `unknown` with narrowing, or generated Supabase types.

### Unused Variables

Prefix with `_` to suppress the ESLint error:

```typescript
// eslint rule: argsIgnorePattern: '^_', varsIgnorePattern: '^_'
const handler = (_event: Event) => { ... };
```

### Interface vs Type

- `interface` for component props and service method parameter objects
- `type` for unions, mapped types, and types derived from Zod schemas or Supabase

## Form Handling

Forms follow a consistent pattern using react-hook-form + Zod:

### 1. Schema File (`.schema.ts`)

```typescript
// app/lib/auth/schemas/password-sign-in.schema.ts
import { z } from 'zod';
export const PasswordSignInSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
});
```

### 2. Form Component

```typescript
const form = useForm({
  resolver: zodResolver(PasswordSignInSchema),
  defaultValues: { email: '', password: '' },
});
```

Key rules:
- No explicit generic on `useForm` -- the Zod resolver infers types
- Never use `watch()` -- use `useWatch` hook instead
- Every `FormField` must include `<FormMessage />` for validation errors
- `<FormDescription>` is optional
- Form UI components come from `@aloha/ui/form`

### 3. Container Component

The container wires the form to a mutation:

```typescript
const signInMutation = useSignInWithEmailPassword();

const onSubmit = useCallback(async (credentials) => {
  const data = await signInMutation.mutateAsync(credentials);
  // handle success
}, [signInMutation]);
```

## Service Patterns

### Factory Functions

Services use a factory function that returns a class instance:

```typescript
export function getDatabaseWebhookHandlerService() {
  return new DatabaseWebhookHandlerService();
}
```

The naming convention is `createXxxService(client)` or `getXxxService()`.

### CRUD Module Configs

Each database entity gets a config file (`kebab-case.config.ts`) that defines table name, columns, form fields, search, and Zod schema:

```typescript
export const hrDepartmentConfig: CrudModuleConfig<typeof hrDepartmentSchema> = {
  tableName: 'hr_department',
  pkType: 'text',
  views: { list: 'hr_department', detail: 'hr_department' },
  columns: [...],
  formFields: [...],
  schema: hrDepartmentSchema,
};
```

Configs are registered in `app/lib/crud/registry.ts` mapping URL slugs to configs.

### Server Actions

CRUD operations are handled by generic functions in `crud-action.server.ts`:

- `crudCreateAction` -- insert with org_id and audit columns
- `crudUpdateAction` -- update by PK within org scope
- `crudDeleteAction` -- soft delete (sets `is_deleted = true`)
- `crudTransitionAction` -- workflow state transitions with optional timestamp/employee fields

All accept a `CrudActionParams` object with `client`, `tableName`, `orgId`, `employeeId`.

## State Management

### Server State

- React Router `loader` data passed via `props.loaderData`
- No client-side re-fetching of loader data

### Client Async State

- TanStack Query (`useMutation`, `mutateAsync`) for all async client-side operations
- Custom hooks wrap mutations: `useSignInWithEmailPassword()`, `useSignOut()`, etc.

### UI State

- Single `useState` for simple boolean flags
- `useCallback` wraps all event handlers passed as props
- `useRef` for values that should not trigger re-renders
- `useEffect` is avoided -- side effects belong in event handlers and server loaders

### Form State

- React Hook Form manages form state
- React Router `useFetcher()` for mutations without full navigation

## Error Handling

### Route Level

- `RootErrorBoundary` in `app/components/root-error-boundary.tsx` catches all unhandled route errors
- Uses `isRouteErrorResponse()` to differentiate 404 from 500
- Displays i18n-aware error/404 pages

### Server Entry

- `handleError()` in `entry.server.tsx` logs errors via `console.error`

### Auth

- `requireUserLoader(request)` checks authentication and throws `redirect()` to sign-in if unauthenticated
- Includes `?next=` parameter to preserve the intended destination

### Supabase Operations

- Check `.error` on query results; throw `new Response(message, { status })` on failure
- CRUD actions return `{ success: false, error: message }` objects rather than throwing

### Service Layer

- try/catch around service logic
- Errors logged with structured context via Pino logger
- Re-throw after logging for upstream handling

## CSS / Styling

### Tailwind CSS 4

- All styling via Tailwind utility classes
- No raw CSS files (except the single `styles/global.css` entry point)
- `cn()` utility from `@aloha/ui/utils` for conditional class composition (wraps `clsx` + `tailwind-merge`)
- Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`
- Functions recognized for class sorting: `tw`, `clsx`, `cn`

### Shadcn UI

- Base components in `packages/ui/src/shadcn/` (button, card, form, input, etc.)
- Custom/composed components in `packages/ui/src/kit/`
- Imported as `@aloha/ui/button`, `@aloha/ui/form`, etc.
- Radix UI primitives underpin Shadcn components
- Lucide React for icons

### Layout

- `data-test` attributes on key interactive elements for E2E testing
- Responsive design via Tailwind breakpoints (`md:`, `sm:`, etc.)
- Dark/light/system theme support via `next-themes`

## Code Style (Prettier + ESLint)

### Prettier (`tooling/prettier/index.mjs`)

- `tabWidth: 2`, `useTabs: false`
- `semi: true`
- `printWidth: 80`
- `singleQuote: true`
- `arrowParens: 'always'`

### ESLint (`tooling/eslint/`)

Flat config format (ESLint 9.x) with three layers:

1. **base.js** -- `eslint:recommended` + `typescript-eslint:recommended` + React + Turbo
2. **apps.js** -- app-specific: bans importing `Database` type directly from `@aloha/supabase/database`
3. **react.js** -- `eslint-plugin-react` flat recommended + `eslint-plugin-react-hooks` flat recommended

Key rules:
- `react/react-in-jsx-scope: off` (React 19 auto-import)
- `react/prop-types: off`
- `@typescript-eslint/no-unused-vars: error` with `_` prefix ignore
- `no-restricted-imports` bans `Trans` from `react-i18next` (must use `@aloha/ui/trans`)
- `@typescript-eslint/only-throw-error: off` (allows throwing `redirect()`)

## i18n

- Framework: i18next + react-i18next
- `Trans` component must be imported from `@aloha/ui/trans` (enforced by ESLint)
- Server-side instance created per request via `createI18nServerInstance(request)`
- Language detection via `i18next-browser-languagedetector`

## Routing

Routes are manually declared in `app/routes.ts` (not filesystem-based):

```typescript
const workspaceLayout = layout('routes/workspace/layout.tsx', [
  route('home/:account', 'routes/workspace/home.tsx'),
  route('home/:account/:module/:subModule', 'routes/workspace/sub-module.tsx'),
]);
```

Route types are generated via `react-router typegen` into `.react-router/types/`.

## Database Conventions

See `supabase/CLAUDE.md` for full details. Key points:

- Soft delete everywhere (`is_deleted` column, never hard DELETE)
- Audit columns: `created_by`, `updated_by` (reference `hr_employee.id`), `created_at`, `updated_at`
- Org-scoped RLS via `hr_employee` membership check
- PK types: TEXT for human-readable IDs, UUID for system-generated
- Every business table has `org_id TEXT REFERENCES org(id)`
