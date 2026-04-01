# Route Action Examples

Real examples adapted for the Aloha codebase using React Router 7 patterns.

## Team Settings Action

Location: Route module for team settings

```typescript
import { data } from 'react-router';

import { getLogger } from '@aloha/shared/logger';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import { UpdateTeamSettingsSchema } from './_lib/schemas/team-settings.schema';

export async function action({ request }: { request: Request }) {
  const logger = await getLogger();
  const body = await request.json();
  const parsed = UpdateTeamSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return data({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ctx = {
    name: 'update-team-settings',
    accountId: parsed.data.accountId,
  };

  logger.info(ctx, 'Updating team settings');

  const client = getSupabaseServerClient(request);

  const { error } = await client
    .from('accounts')
    .update({ name: parsed.data.name })
    .eq('id', parsed.data.accountId);

  if (error) {
    logger.error({ ...ctx, error }, 'Failed to update team settings');
    return data({ error: 'Failed to update settings' }, { status: 500 });
  }

  logger.info(ctx, 'Team settings updated successfully');

  return data({ success: true });
}
```

## Action with Redirect

```typescript
import { data, redirect } from 'react-router';

import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import { CreateProjectSchema } from './_lib/schemas/project.schema';
import { createProjectService } from './_lib/server/project.service';

export async function action({ request, params }: { request: Request; params: { account: string } }) {
  const body = await request.json();
  const parsed = CreateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return data({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = getSupabaseServerClient(request);
  const service = createProjectService(client);
  const project = await service.create(parsed.data);

  // Redirect after creation
  throw redirect(`/home/${params.account}/projects/${project.id}`);
}
```

## Delete Action

```typescript
import { data } from 'react-router';

import { getLogger } from '@aloha/shared/logger';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import { DeleteItemSchema } from './_lib/schemas/item.schema';

export async function action({ request }: { request: Request }) {
  const logger = await getLogger();
  const body = await request.json();
  const parsed = DeleteItemSchema.safeParse(body);

  if (!parsed.success) {
    return data({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ctx = {
    name: 'delete-item',
    itemId: parsed.data.itemId,
  };

  logger.info(ctx, 'Deleting item');

  const client = getSupabaseServerClient(request);

  const { error } = await client
    .from('items')
    .delete()
    .eq('id', parsed.data.itemId)
    .eq('account_id', parsed.data.accountId); // RLS will also validate

  if (error) {
    logger.error({ ...ctx, error }, 'Failed to delete item');
    return data({ error: 'Failed to delete item' }, { status: 500 });
  }

  logger.info(ctx, 'Item deleted successfully');

  return data({ success: true });
}
```

## Action Handling Multiple Intents

React Router actions can handle different operations using an `intent` field:

```typescript
import { data } from 'react-router';

import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import { CreateFeatureSchema, UpdateFeatureSchema, DeleteFeatureSchema } from './_lib/schemas/feature.schema';
import { createFeatureService } from './_lib/server/feature.service';

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const intent = body.intent as string;

  const client = getSupabaseServerClient(request);
  const service = createFeatureService(client);

  switch (intent) {
    case 'create': {
      const parsed = CreateFeatureSchema.safeParse(body);

      if (!parsed.success) {
        return data({ error: parsed.error.flatten() }, { status: 400 });
      }

      const result = await service.create(parsed.data);
      return data({ success: true, data: result });
    }

    case 'update': {
      const parsed = UpdateFeatureSchema.safeParse(body);

      if (!parsed.success) {
        return data({ error: parsed.error.flatten() }, { status: 400 });
      }

      const result = await service.update(parsed.data);
      return data({ success: true, data: result });
    }

    case 'delete': {
      const parsed = DeleteFeatureSchema.safeParse(body);

      if (!parsed.success) {
        return data({ error: parsed.error.flatten() }, { status: 400 });
      }

      await service.delete(parsed.data.id);
      return data({ success: true });
    }

    default:
      return data({ error: 'Unknown intent' }, { status: 400 });
  }
}
```

## Client-Side: useFetcher with Intent

```tsx
import { useFetcher } from 'react-router';

function DeleteButton({ itemId, accountId }: { itemId: string; accountId: string }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state === 'submitting';

  return (
    <Button
      variant="destructive"
      disabled={isDeleting}
      data-test="delete-button"
      onClick={() => {
        fetcher.submit(
          { intent: 'delete', itemId, accountId },
          { method: 'POST', encType: 'application/json' },
        );
      }}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
```

## Client-Side: Handling Action Response

```tsx
import { useEffect, useRef } from 'react';

import { useFetcher } from 'react-router';
import { toast } from '@aloha/ui/sonner';

function FeatureForm() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';
  const prevState = useRef(fetcher.state);

  // Show toast when submission completes (justified useEffect -- reacting to fetcher state transition)
  if (prevState.current === 'submitting' && fetcher.state === 'idle') {
    if (fetcher.data?.success) {
      toast.success('Feature created');
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }
  prevState.current = fetcher.state;

  // ... form JSX
}
```

## Reading FormData Instead of JSON

For standard HTML form submissions (without `encType: 'application/json'`):

```typescript
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();

  const parsed = CreateFeatureSchema.safeParse({
    name: formData.get('name'),
    accountId: formData.get('accountId'),
  });

  if (!parsed.success) {
    return data({ error: parsed.error.flatten() }, { status: 400 });
  }

  // ... proceed with service call
}
```
