---
description: End-to-end feature implementation following Aloha patterns across database, API, and UI layers
---

# Feature Builder

You are an expert at implementing complete features in Aloha following established patterns across all layers.

You MUST use the specialized skills for each phase while building the feature.

- Database Schema: `postgres-supabase-expert`
- Server Layer: `server-action-builder`
- Forms: `forms-builder`

## Implementation Phases

### Phase 1: Database Schema

Use `postgres-supabase-expert` skill.

1. Create schema file in `apps/web/supabase/schemas/`
2. Enable RLS and create policies using helper functions
3. Generate migration: `pnpm --filter web supabase:db:diff -f feature_name`
4. Apply: `pnpm --filter web supabase migrations up`
5. Generate types: `pnpm supabase:web:typegen`

```sql
-- Example: apps/web/supabase/schemas/20-projects.sql
create table if not exists public.projects (
  id uuid unique not null default extensions.uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  name varchar(255) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (id)
);

alter table "public"."projects" enable row level security;
revoke all on public.projects from authenticated, service_role;
grant select, insert, update, delete on table public.projects to authenticated;

create policy "projects_read" on public.projects for select
  to authenticated using (
    account_id = (select auth.uid()) or
    public.has_role_on_account(account_id)
  );

create policy "projects_write" on public.projects for all
  to authenticated using (
    public.has_permission(auth.uid(), account_id, 'projects.manage'::app_permissions)
  );
```

### Phase 2: Server Layer

Use `server-action-builder` skill for detailed patterns.

**Rule: Services are decoupled from interfaces.** The service is pure logic that receives dependencies (database client,
etc.) as arguments -- it never imports framework-specific modules. The route action is a thin adapter that resolves
dependencies and calls the service. This means the same service can be called from a route action, an MCP tool, a CLI
command, or a unit test with zero changes.

Create in route's `_lib/server/` directory:

1. **Schema** (`_lib/schemas/feature.schema.ts`)
2. **Service** (`_lib/server/feature.service.ts`) -- pure logic, dependencies injected, testable in isolation
3. **Route Action** (in the route module) -- thin adapter, no business logic

### Phase 3: UI Components

Use `form-builder` skill for form patterns.

Create in route's `_components/` directory:

1. **List component** - Display items with loading states
2. **Form component** - Create/edit with validation
3. **Detail component** - Single item view

### Phase 4: Page Integration

Create page in appropriate route group:
- Team: `apps/web/app/routes/home/account/feature/`

```typescript
// apps/web/app/routes/home/account/projects.tsx
import { data } from 'react-router';

import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import { PageBody, PageHeader } from '@aloha/ui/page';

import { ProjectsList } from './_components/projects-list';

export async function loader({ request, params }: { request: Request; params: { account: string } }) {
  const client = getSupabaseServerClient(request);

  const { data: projects } = await client
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return data({ projects: projects ?? [] });
}

export default function ProjectsPage({ loaderData }: { loaderData: { projects: Project[] } }) {
  const { projects } = loaderData;

  return (
    <>
      <PageHeader title="Projects" />
      <PageBody>
        <ProjectsList projects={projects} />
      </PageBody>
    </>
  );
}
```

### Phase 5: Navigation

Add routes to sidebar navigation in `apps/web/config/team-account-navigation.config.tsx`.

## File Structure

```
apps/web/app/routes/home/account/projects/
├── route.tsx                  # Page with loader + action exports
├── [projectId]/
│   └── route.tsx              # Detail page
├── _components/
│   ├── projects-list.tsx
│   ├── project-form.tsx
│   └── project-card.tsx
└── _lib/
    ├── schemas/
    │   └── project.schema.ts
    └── server/
        └── project.service.ts
```

## Verification Checklist

### Database Layer

- [ ] Schema file created in `apps/web/supabase/schemas/`
- [ ] RLS enabled on table
- [ ] Default permissions revoked
- [ ] Specific permissions granted to `authenticated`
- [ ] RLS policies use helper functions (`has_role_on_account`, `has_permission`)
- [ ] Indexes added for foreign keys and common queries
- [ ] Timestamps triggers added if applicable
- [ ] Migration generated and applied
- [ ] TypeScript types regenerated

### Server Layer

- [ ] Zod schema in `_lib/schemas/`
- [ ] Service class in `_lib/server/` with dependencies injected (not imported)
- [ ] Service contains all business logic -- testable with mock dependencies
- [ ] Route actions are thin adapters -- resolve dependencies, call service, return `data()` response
- [ ] Actions validate input with Zod `safeParse`
- [ ] Actions return proper error responses with status codes
- [ ] Logging added for operations
- [ ] Error handling with try/catch

### UI Layer

- [ ] Components in `_components/` directory
- [ ] Forms use `react-hook-form` with `zodResolver`
- [ ] Loading states with `fetcher.state === 'submitting'`
- [ ] Error display with `Alert` component
- [ ] `data-test` attributes for E2E testing
- [ ] `Trans` component for all user-facing strings
- [ ] Toast notifications for success/error if applicable

### Page Layer

- [ ] Route module in correct location
- [ ] `loader` export for server-side data fetching
- [ ] `action` export for mutations
- [ ] Default export component receives `loaderData` prop
- [ ] `PageHeader` and `PageBody` components used

### Navigation

- [ ] Path added to `config/paths.config.ts`
- [ ] Menu item added to navigation config
- [ ] Translation key added to `public/locales/en/common.json`

### Testing

- [ ] Page Object created for E2E tests
- [ ] Basic CRUD operations tested
- [ ] Error states tested
- [ ] `data-test` selectors used in tests

### Final Verification

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Test (if tests exist)
pnpm --filter web-e2e exec playwright test feature-name --workers=1
```

When you are done, run the code quality reviewer agent to verify the code quality.
