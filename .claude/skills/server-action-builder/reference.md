# Route Action Reference

## React Router Action API

```typescript
import { data, redirect } from 'react-router';

// Route action -- exported from route module
export async function action({ request, params }: {
  request: Request;
  params: Record<string, string>;
}) {
  // request: standard Web Request object
  // params: URL parameters from the route pattern

  // Parse request body
  const body = await request.json();
  // OR for form data:
  // const formData = await request.formData();

  // Return data response
  return data({ success: true, result }, { status: 200 });

  // OR redirect
  throw redirect('/new-path');
}
```

### Action Parameters

| Parameter | Type                      | Description                          |
|-----------|---------------------------|--------------------------------------|
| `request` | `Request`                 | Standard Web Request object          |
| `params`  | `Record<string, string>`  | URL params from route pattern        |

### Response Patterns

```typescript
import { data, redirect } from 'react-router';

// Success response
return data({ success: true, data: result });

// Error response with status code
return data({ error: 'Validation failed', details: errors }, { status: 400 });

// Server error
return data({ error: 'Internal server error' }, { status: 500 });

// Redirect (use throw for redirects in actions)
throw redirect('/home/account/features');
```

## useFetcher API

```typescript
import { useFetcher } from 'react-router';

function MyComponent() {
  const fetcher = useFetcher();

  // Submit JSON data
  fetcher.submit(
    { name: 'value', accountId: 'uuid' },
    { method: 'POST', encType: 'application/json' },
  );

  // Submit to a specific route action
  fetcher.submit(
    { name: 'value' },
    { method: 'POST', action: '/api/features', encType: 'application/json' },
  );

  // State
  fetcher.state; // 'idle' | 'submitting' | 'loading'

  // Response data from the action
  fetcher.data; // whatever the action returned via data()
}
```

### useFetcher Properties

| Property | Type                                  | Description                          |
|----------|---------------------------------------|--------------------------------------|
| `state`  | `'idle' \| 'submitting' \| 'loading'` | Current fetcher state               |
| `data`   | `unknown`                              | Data returned from the action       |
| `submit` | `(data, options) => void`              | Programmatic form submission        |
| `Form`   | `React.ComponentType`                  | Form component bound to this fetcher|
| `load`   | `(href: string) => void`              | Load data from a route loader       |

## Route Loader API

```typescript
import { data } from 'react-router';

import { getSupabaseServerClient } from '@aloha/supabase/server-client';

// Route loader -- exported from route module
export async function loader({ request, params }: {
  request: Request;
  params: Record<string, string>;
}) {
  const client = getSupabaseServerClient(request);

  const { data: features, error } = await client
    .from('features')
    .select('*')
    .eq('account_id', params.account)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data({ features });
}

// Access in component
export default function FeaturesPage({ loaderData }: { loaderData: { features: Feature[] } }) {
  const { features } = loaderData;
  // ...
}
```

## Common Zod Patterns

```typescript
import * as z from 'zod';

// Basic schema
export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  accountId: z.string().uuid('Invalid account ID'),
});

// With transforms
export const SearchSchema = z.object({
  query: z.string().trim().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// With refinements
export const DateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date' }
);

// Enum values
export const StatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']),
});

// With intent field for multi-action routes
export const FeatureActionSchema = z.discriminatedUnion('intent', [
  z.object({ intent: z.literal('create'), name: z.string().min(1), accountId: z.string().uuid() }),
  z.object({ intent: z.literal('delete'), id: z.string().uuid() }),
]);
```

## Logging

```typescript
import { getLogger } from '@aloha/shared/logger';

const logger = await getLogger();

// Context object for all logs
const ctx = {
  name: 'action-name',
  accountId: data.accountId,
};

// Log levels
logger.info(ctx, 'Starting operation');
logger.warn({ ...ctx, warning: 'details' }, 'Warning message');
logger.error({ ...ctx, error }, 'Operation failed');
```

## Supabase Clients

```typescript
// Standard client (RLS enforced) -- always pass request for cookie-based auth
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
const client = getSupabaseServerClient(request);

// Admin client (bypasses RLS - use sparingly)
import { getSupabaseServerAdminClient } from '@aloha/supabase/server-admin-client';
const adminClient = getSupabaseServerAdminClient();
```

## Authentication in Route Actions

React Router 7 handles auth via route loaders and middleware, not inside actions directly.
The `getSupabaseServerClient(request)` reads the session from cookies. If the user is not
authenticated, Supabase RLS will reject the query.

For explicit auth checks, use the `requireUserLoader` pattern in your route's loader:

```typescript
import { requireUserLoader } from '~/lib/require-user-loader';

export async function loader({ request }: { request: Request }) {
  // Throws redirect to sign-in if not authenticated
  const user = await requireUserLoader(request);

  return data({ user });
}
```

## Error Handling

```typescript
export async function action({ request }: { request: Request }) {
  try {
    // ... perform operation
    return data({ success: true });
  } catch (error) {
    const logger = await getLogger();
    logger.error({ error }, 'Action failed');

    return data(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
```

For redirects in actions, use `throw redirect()` -- this throws a Response which React Router
handles automatically. No special error checking needed (unlike Next.js `isRedirectError`).

```typescript
// Redirect is clean -- just throw it
throw redirect(`/home/${params.account}/features/${result.id}`);
```
