---
name: server-action-builder
description: Create React Router 7 route actions with Zod validation, useFetcher, and service patterns. Use when implementing mutations, form submissions, or API operations that need authentication and validation. Invoke with /server-action-builder.
---

# Route Action Builder

You are an expert at creating type-safe route actions for Aloha following React Router 7 patterns.

## Key Concept: React Router Actions

React Router 7 does NOT have Next.js-style "server actions". Instead, mutations are handled through:
- **Route `action` exports** -- server-side functions that handle POST/PUT/DELETE requests
- **`useFetcher()`** -- client-side hook for submitting data to route actions without navigation
- **`<Form method="post">`** -- declarative form submission that triggers the route action

## Workflow

When asked to create a route action, follow these steps:

### Step 1: Create Zod Schema

Create validation schema in `_lib/schemas/`:

```typescript
// _lib/schemas/feature.schema.ts
import * as z from 'zod';

export const CreateFeatureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accountId: z.string().uuid('Invalid account ID'),
});

export type CreateFeatureInput = z.output<typeof CreateFeatureSchema>;
```

### Step 2: Create Service Layer

**North star: services are decoupled from their interface.** The service is pure logic -- it receives a database client
as a dependency, never imports one. This means the same service works whether called from a route action, an MCP tool,
a CLI command, or a plain unit test.

Create service in `_lib/server/`:

```typescript
// _lib/server/feature.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateFeatureInput } from '../schemas/feature.schema';

export function createFeatureService(client: SupabaseClient) {
  return new FeatureService(client);
}

class FeatureService {
  constructor(private readonly client: SupabaseClient) {}

  async create(data: CreateFeatureInput) {
    const { data: result, error } = await this.client
      .from('features')
      .insert({
        name: data.name,
        account_id: data.accountId,
      })
      .select()
      .single();

    if (error) throw error;

    return result;
  }
}
```

The service never calls `getSupabaseServerClient()` -- the caller provides the client. This keeps the service testable (
pass a mock client) and reusable (any interface can supply its own client).

### Step 3: Create Route Action (Thin Adapter)

The action is a **thin adapter** -- it resolves dependencies (client, logger) and delegates to the service. No business
logic lives here.

Create the action export in your route module:

```typescript
// In the route file (e.g., app/routes/home/account/features.tsx)
import { data, redirect } from 'react-router';

import { getLogger } from '@aloha/shared/logger';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import { CreateFeatureSchema } from './_lib/schemas/feature.schema';
import { createFeatureService } from './_lib/server/feature.service';

export async function action({ request }: { request: Request }) {
  const logger = await getLogger();
  const body = await request.json();
  const parsed = CreateFeatureSchema.safeParse(body);

  if (!parsed.success) {
    return data(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const client = getSupabaseServerClient(request);
  const service = createFeatureService(client);

  try {
    const result = await service.create(parsed.data);

    logger.info(
      { name: 'create-feature', featureId: result.id },
      'Feature created',
    );

    return data({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Failed to create feature');

    return data(
      { error: 'Failed to create feature' },
      { status: 500 },
    );
  }
}
```

### Step 4: Client-Side Form with useFetcher

```typescript
// _components/feature-form.tsx
import { useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFetcher } from 'react-router';
import { useForm } from 'react-hook-form';

import { Button } from '@aloha/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@aloha/ui/form';
import { Input } from '@aloha/ui/input';
import { Trans } from '@aloha/ui/trans';
import { toast } from '@aloha/ui/sonner';

import { CreateFeatureSchema } from '../_lib/schemas/feature.schema';

interface FeatureFormProps {
  accountId: string;
}

export function FeatureForm({ accountId }: FeatureFormProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';

  const form = useForm({
    resolver: zodResolver(CreateFeatureSchema),
    defaultValues: {
      name: '',
      accountId,
    },
  });

  const onSubmit = useCallback(
    (formData: { name: string; accountId: string }) => {
      fetcher.submit(formData, {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher],
  );

  if (fetcher.data?.error) {
    toast.error(fetcher.data.error);
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="features:name" />
              </FormLabel>
              <FormControl>
                <Input data-test="feature-name-input" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          data-test="submit-button"
        >
          <Trans
            i18nKey={
              isSubmitting ? 'common.submitting' : 'common.submit'
            }
          />
        </Button>
      </form>
    </Form>
  );
}
```

## Key Patterns

1. **Services are pure, interfaces are thin adapters.** The service contains all business logic. The route action (or
   MCP tool, or CLI command) is glue code that resolves dependencies and calls the service. If an MCP tool and a route
   action do the same thing, they call the same service function.
2. **Inject dependencies, don't import them in services.** Services receive their database client, logger, or any I/O
   capability as constructor arguments -- never by importing framework-specific modules. This keeps them testable with
   stubs and reusable across interfaces.
3. **Schema in separate file** - Reusable between client and server
4. **Logging** - Always log before and after operations
5. **Trust RLS** - Don't add manual auth checks (RLS handles it)
6. **Testable in isolation** - Because services accept their dependencies, you can test them with a mock client and no
   running infrastructure
7. **`getSupabaseServerClient(request)`** - Always pass the request object to create a request-scoped Supabase client
8. **Return `data()` responses** - Use React Router's `data()` utility to return typed JSON responses with status codes
9. **Use `useFetcher` on the client** - For mutations without full-page navigation

## File Structure

```
feature/
├── route.tsx                    # Route module with loader + action exports
├── _lib/
│   ├── schemas/
│   │   └── feature.schema.ts
│   └── server/
│       └── feature.service.ts
└── _components/
    └── feature-form.tsx
```

## Reference Files

See examples in:
- `[Examples](examples.md)`
- `[Reference](reference.md)`
