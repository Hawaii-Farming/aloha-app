# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` — e.g., `password-sign-in-form.tsx`, `module-sidebar-navigation.tsx`, `ai-chat-provider.tsx`
- Server-only modules: `.server.ts` suffix — e.g., `org-workspace-loader.server.ts`, `build-system-prompt.server.ts`, `create-csrf-protect.server.ts`
- Zod schemas: `.schema.ts` suffix — e.g., `password-sign-in.schema.ts`, `password-reset.schema.ts`
- Page objects for E2E: `.po.ts` suffix — e.g., `auth.po.ts`
- Route loaders/components: `kebab-case.tsx` in route directories
- Config files: `.config.ts` suffix — e.g., `app.config.ts`, `workspace-navigation.config.tsx`, `module-icons.config.ts`

**Functions and variables:**
- camelCase for all function names — e.g., `handleGenerate()`, `extractFieldDescriptions()`, `derivePageType()`
- camelCase for local variables and parameters — e.g., `currentPath`, `state`, `setOpen`
- React components: PascalCase — e.g., `ModuleSidebarNavigation`, `PasswordSignInForm`, `AiChatProvider`

**Types:**
- `interface` for component props objects — e.g., `interface ModuleSidebarNavigationProps`, `interface AiFormAssistProps<T>`
- `type` for utility types, derived types, and unions — e.g., `type AppNavModule`, `type AppNavSubModule`
- Destructured object parameters preferred over positional arguments for complex inputs
- No explicit generics on `useForm` — Zod resolver infers types automatically

**Exports:**
- Default export for page components (function declaration, PascalCase) — e.g., `export default function App()`
- Named exports for `loader`, `action`, `meta`, and utility functions
- Server actions named `xyzAction` — e.g., `deletePersonalAccountAction`

**Unused variables:**
- Prefix with `_` to suppress ESLint warnings — e.g., `_unusedParam`, `_ignored`

## Code Style

**Formatting:**
- Tool: Prettier 3.7.4 with `@trivago/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- Settings:
  - `tabWidth: 2`
  - `useTabs: false`
  - `semi: true`
  - `printWidth: 80`
  - `singleQuote: true`
  - `arrowParens: 'always'`

**Linting:**
- ESLint 9.x with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Key rules:
  - `@typescript-eslint/no-unused-vars`: error with `argsIgnorePattern: '^_'`
  - No anonymous default exports
  - No use of `any` type — use generated Supabase `Tables<'table_name'>` and `Enums<'enum_name'>` types from `@aloha/supabase/database`
  - Avoid `any`; use explicit type inference
  - `react-i18next.Trans` must be imported from `@aloha/ui/trans`, never directly from `react-i18next`
  - Avoid importing `Database` from `@aloha/supabase/database`; use `~/lib/database.types` instead

## Import Organization

**Order (enforced by prettier-plugin-sort-imports):**
1. CSS imports (special pattern: `/^(?!.*\.css).*$/`)
2. `server-only` special marker
3. React core: `react`, `react-dom`
4. React Router: `react-router`, `@react-router/*`
5. Supabase: `@supabase/supabase-js`
6. Third-party modules (all others)
7. Workspace packages: `@aloha/*` — e.g., `@aloha/ui/button`, `@aloha/supabase/server-client`
8. App-level imports: `~/` — e.g., `~/config/auth.config`, `~/lib/i18n/i18n.server`, `~/components/root-error-boundary`
9. Relative imports: `./` or `../`

**Path aliases:**
- `@aloha/*` — monorepo packages (defined in workspace `package.json`)
- `~/` — app-level imports in `apps/web` (aliased to `./app`)
- Example: `import { cn } from '@aloha/ui/utils'` or `import appConfig from '~/config/app.config'`

**Separation and sorting:**
- Import order separation enabled (blank lines between groups)
- Specifiers within imports sorted alphabetically

## React Patterns

**Component definition:**
- `export function ComponentName(props)` — preferred for route pages and standalone utilities
- `export const ComponentName: React.FC<{...}>` — used for inline prop types in features
- Default export for page components (function declaration)

**Props:**
- Props passed as destructured parameters with type annotation
- Use `interface` for props types
- Example:
  ```typescript
  interface PasswordSignInFormProps {
    onSubmit: (params: z.infer<typeof PasswordSignInSchema>) => unknown;
    loading: boolean;
    redirecting: boolean;
  }
  
  export const PasswordSignInForm: React.FC<PasswordSignInFormProps> = ({
    onSubmit,
    loading = false,
    redirecting = false,
  }) => {
    // ...
  };
  ```

**Hooks usage:**
- `useState` preferred for simple boolean/primitive state — e.g., `const [showPassword, setShowPassword] = useState(false)`
- Single `useState` for related state (prefer state object over multiple hooks) — e.g., `const [state, setState] = useState({ open: false, loading: false, error: null })`
- `useCallback` wrapping all event handler functions passed as props
- `useRef` for values that should not trigger re-renders — e.g., `redirecting.current`
- `useEffect` is avoided; side effects handled in event handlers and server loaders
- `useMemo` for derived state and expensive computations — e.g., `context` derived from route params

**Data fetching:**
- React Query mutations (`useMutation`, `mutateAsync`) preferred over manual fetch + state
- Server state passed via React Router `loader` data as `props.loaderData`
- Client state via React Query for async operations

**Comments in code:**
- Avoid obvious comments
- Use block comments for complex logic or non-obvious intent
- JSDoc/TSDoc for exported functions and components (see `AiFormAssist` example with full usage documentation)
- Comments placed above the code they describe

**Example with JSDoc:**
```typescript
/**
 * AiFormAssist - AI-powered form filling pattern component.
 *
 * A reusable button that consumers place inside their forms. It accepts
 * a Zod schema and a form's `setValue` function, prompts the user for
 * text, sends it to an API route that uses `generateObject`, and
 * populates the form fields from the structured response.
 *
 * Usage:
 *   <AiFormAssist
 *     schema={MyFormSchema}
 *     setValue={form.setValue}
 *     fieldNames={['name', 'description', 'category']}
 *   />
 */
export function AiFormAssist<T extends FieldValues>(
  props: AiFormAssistProps<T>,
) {
  // ...
}
```

## Form Handling

**Pattern:**
- Schema defined in separate `.schema.ts` file — e.g., `password-sign-in.schema.ts`
- `useForm({ resolver: zodResolver(Schema) })` — no explicit generic type on `useForm`
- Never use `watch()`; use `useWatch` hook instead
- Always include `<FormMessage />` in every field to display validation errors
- `<FormDescription>` is optional

**Example:**
```typescript
export const PasswordSignInForm: React.FC<{
  onSubmit: (params: z.infer<typeof PasswordSignInSchema>) => unknown;
  loading: boolean;
  redirecting: boolean;
}> = ({ onSubmit, loading = false, redirecting = false }) => {
  const form = useForm({
    resolver: zodResolver(PasswordSignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name={'email'}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <EmailInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
```

## Error Handling

**Strategy:** Synchronous error handling with try/catch for async operations; route-level error boundaries for render errors.

**Patterns:**
- API routes: try/catch returning `new Response(null, { status: 500 })` on failure — e.g., in `/api/ai/chat`
- Auth errors: `requireUserLoader()` throws `redirect()` to sign-in path on auth failure
- Service errors: Supabase operations check `.error` on result object and throw; callers use try/catch
- Root error boundary: `components/root-error-boundary.tsx` catches all unhandled route errors
- Server entry error handler: `handleError()` in `entry.server.tsx` logs error via console

**Example error boundary:**
```typescript
export function RootErrorBoundary() {
  const routeError = useRouteError();

  const error =
    routeError instanceof Error
      ? routeError
      : new Error(`Unknown error: ${JSON.stringify(routeError)}`);

  const status = isRouteErrorResponse(error) ? error.status : 500;

  if (status !== 404) {
    console.error(error);
  }
  // ... render error UI
}
```

## Logging

**Framework:** Console-based (`console.info`, `console.error`) or Pino for structured server-side logging.

**Implementation:**
- Files: `app/lib/shared/logger/logger.ts` (interface), `impl/console.ts`, `impl/pino.ts` (implementations)
- Logger interface exports: `info`, `error`, `warn`, `debug`, `fatal` methods
- All methods accept object + message or message-only patterns

**When to log:**
- Server-side errors in entry handler and route loaders
- Not used extensively in components (prefer error boundaries for render errors)
- Example from `entry.server.tsx`: `console.error(error)` on shell rendering errors

## Module Design

**Exports:**
- Named exports for utilities, service functions, components
- Default export for page components
- Barrel files (index.ts) can export multiple related items

**Directory structure follows domain boundaries:**
- `app/components/` — shared UI components organized by feature (auth, ai, sidebar, etc.)
- `app/lib/` — utilities organized by concern (auth, workspace, supabase, csrf, i18n, ai, crud)
- `.server.ts` files live in same directory as their imports — never imported client-side

## State Management

**Client state:**
- React `useState` for simple state (boolean flags, form input values)
- State object pattern for related state: `const [state, setState] = useState({ open: false, loading: false, error: null })`
- `useMemo` for derived state based on props/other state

**Server state:**
- React Router `loader` data passed as `props.loaderData` to route components
- No manual state management for async server data — use React Query

**Context:**
- Create context via `createContext<ValueType | null>(null)`
- Custom hook to access context: `useXxx()` pattern that throws if not in provider
- Example: `useAiChat()` throws `'useAiChat must be used within an AiChatProvider'` if called outside provider
- Memoized context value to prevent unnecessary re-renders

**Example context pattern:**
```typescript
interface AiChatContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  context: AiPageContext;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

export function AiChatProvider(props: React.PropsWithChildren<{ orgName: string }>) {
  const [open, setOpen] = useState(false);
  const context = useMemo<AiPageContext>(() => {
    // derive context from params and location
  }, [deps]);

  const value = useMemo(
    () => ({ open, setOpen, context }),
    [open, setOpen, context],
  );

  return <AiChatContext value={value}>{props.children}</AiChatContext>;
}

export function useAiChat() {
  const value = use(AiChatContext);
  if (!value) {
    throw new Error('useAiChat must be used within an AiChatProvider');
  }
  return value;
}
```

## Testing Attributes

**E2E testing:**
- Add `data-test` attribute to key UI elements for Playwright selectors
- Used in page objects to identify elements
- Example: `<button data-test="auth-submit-button">` → `await this.page.click('[data-test="auth-submit-button"]')`

---

*Convention analysis: 2026-04-02*
