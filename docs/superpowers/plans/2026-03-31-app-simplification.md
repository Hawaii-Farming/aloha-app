# App Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip the template's account/membership/RBAC system, keep org/hr_employee as the sole tenant model, flatten routes to 2 levels max, inline small type packages, and delete unused packages.

**Architecture:** Surgical prune — delete packages bottom-up (leaf dependencies first), then move files to flatten the route structure, then update imports and route config, then clean up schema files. Each task produces a compilable state.

**Tech Stack:** React Router 7, Supabase, React 19, TypeScript, Tailwind CSS 4, Shadcn UI, Turborepo

**Spec:** `docs/superpowers/specs/2026-03-31-app-simplification-design.md`

---

## File Structure (After)

```
apps/web/
  app/
    routes/
      auth/sign-in.tsx
      auth/password-reset.tsx
      auth/update-password.tsx
      auth/callback.tsx
      auth/callback-error.tsx
      auth/layout.tsx
      workspace/layout.tsx
      workspace/home.tsx
      workspace/module.tsx
      workspace/sub-module.tsx
      workspace/sub-module-detail.tsx
      workspace/sub-module-create.tsx
      workspace/settings.tsx
      api/ai/chat.ts
      api/ai/form-assist.ts
      api/db/webhook.ts
      index.ts
      healthcheck.ts
      no-access.tsx
      version.ts
  lib/
    crud/
      types.ts              (inlined from @aloha/crud)
      registry.ts           (moved from modules/_config/)
      hr-department.config.ts
      inv-product.config.ts
      crud-action.server.ts
      crud-helpers.server.ts
      render-form-field.tsx
      workflow-helpers.ts
    workspace/
      types.ts              (inlined from @aloha/access-control)
      access-gate.tsx        (inlined from @aloha/access-control)
      use-module-access.ts   (inlined from @aloha/access-control)
      org-workspace-loader.server.ts
      require-module-access.server.ts
    (existing files stay: cookies.ts, require-user-loader.ts, org-storage.ts, database.types.ts, i18n/, chats/)
  config/
    (existing files stay: paths.config.ts, auth.config.ts, module-icons.config.ts, app.config.ts, feature-flags.config.ts, team-account-navigation.config.tsx)
  components/
    sidebar/
      team-account-layout-sidebar.tsx
      module-sidebar-navigation.tsx
      team-account-accounts-selector.tsx
      team-account-layout-mobile-navigation.tsx
      team-account-layout-sidebar-navigation.tsx
      team-account-layout-page-header.tsx
      team-account-navigation-menu.tsx
    (existing files stay: app-logo.tsx, root-error-boundary.tsx, root-head.tsx, root-providers.tsx, auth-provider.tsx, personal-account-dropdown-container.tsx, react-query-provider.tsx)
  supabase/
    schemas/
      00-privileges.sql
      01-enums.sql
      02-config.sql
      03-accounts.sql
      04-consumer-dev-tables.sql   (was 18-)
      05-view-contracts.sql        (was 19-)
      06-nav-view-contracts.sql    (was 20-)

packages/
  supabase/         (keep as-is)
  ui/               (keep as-is)
  shared/           (slim: remove registry + events)
  i18n/             (keep as-is)
  utils/csrf/       (keep as-is)
  features/
    auth/           (slim: remove MFA, magic link, sign-up)
    ai/             (keep as-is)
  database-webhooks/ (keep)
  mcp-server/       (keep as-is)
```

---

## Task 1: Delete leaf packages (mailers, otp, policies)

These packages have no dependents within the remaining keep-list.

**Files:**
- Delete: `packages/mailers/` (entire directory — core, shared, resend, nodemailer)
- Delete: `packages/otp/` (entire directory)
- Delete: `packages/policies/` (entire directory)
- Modify: `apps/web/package.json` — remove `@aloha/mailers`, `@aloha/otp` dependencies
- Modify: `pnpm-workspace.yaml` — no change needed (glob covers all packages/**)

- [ ] **Step 1: Delete mailers, otp, policies directories**

```bash
rm -rf packages/mailers packages/otp packages/policies
```

- [ ] **Step 2: Remove dependencies from apps/web/package.json**

Remove these lines from `dependencies`:
```
"@aloha/mailers": "workspace:*",
"@aloha/otp": "workspace:*",
```

- [ ] **Step 3: Delete the OTP API route**

```bash
rm -rf apps/web/app/routes/api/otp
```

- [ ] **Step 4: Remove OTP route from routes.ts**

In `apps/web/app/routes.ts`, remove:
```ts
route('api/otp/send', 'routes/api/otp/send.ts'),
```

- [ ] **Step 5: Run pnpm install to update lockfile**

```bash
pnpm install
```

- [ ] **Step 6: Verify typecheck**

```bash
pnpm typecheck
```

Fix any remaining import errors (e.g., if `@aloha/otp` or `@aloha/mailers` is imported anywhere else).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: delete mailers, otp, policies packages"
```

---

## Task 2: Delete team-accounts package and related routes

**Files:**
- Delete: `packages/features/team-accounts/` (entire directory)
- Delete: `apps/web/app/routes/home/account/members.tsx`
- Delete: `apps/web/app/routes/home/account/_lib/members-page-loader.ts`
- Delete: `apps/web/app/routes/api/accounts.ts`
- Delete: `apps/web/app/routes/identities.tsx`
- Modify: `apps/web/package.json` — remove `@aloha/team-accounts`
- Modify: `apps/web/app/routes.ts` — remove members route, accounts API route, identities route

- [ ] **Step 1: Delete team-accounts package**

```bash
rm -rf packages/features/team-accounts
```

- [ ] **Step 2: Delete related route files**

```bash
rm apps/web/app/routes/home/account/members.tsx
rm apps/web/app/routes/home/account/_lib/members-page-loader.ts
rm apps/web/app/routes/api/accounts.ts
rm apps/web/app/routes/identities.tsx
```

- [ ] **Step 3: Remove @aloha/team-accounts from apps/web/package.json**

Remove from `dependencies`:
```
"@aloha/team-accounts": "workspace:*",
```

- [ ] **Step 4: Update routes.ts — remove deleted routes**

In `apps/web/app/routes.ts`:

Remove from `rootRoutes`:
```ts
route('identities', 'routes/identities.tsx'),
```

Remove from `apiRoutes`:
```ts
route('api/accounts', 'routes/api/accounts.ts'),
```

Remove from `teamAccountLayout`:
```ts
route('home/:account/members', 'routes/home/account/members.tsx'),
```

- [ ] **Step 5: Update paths.config.ts — remove members path**

In `apps/web/config/paths.config.ts`:

Remove from `PathsSchema.app`:
```ts
accountMembers: z.string().min(1),
```

Remove from the parsed config:
```ts
accountMembers: `/home/[account]/members`,
```

- [ ] **Step 6: Remove sign-up path from paths.config.ts**

Since we're invite-only, also remove:
```ts
signUp: z.string().min(1),
```
and
```ts
signUp: '/auth/sign-up',
```

And remove `verifyMfa`:
```ts
verifyMfa: z.string().min(1),
```
and
```ts
verifyMfa: '/auth/verify',
```

- [ ] **Step 7: Run pnpm install and typecheck**

```bash
pnpm install && pnpm typecheck
```

Fix any broken imports referencing `@aloha/team-accounts`, `pathsConfig.auth.signUp`, `pathsConfig.auth.verifyMfa`, or `pathsConfig.app.accountMembers`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: delete team-accounts package and related routes"
```

---

## Task 3: Delete auth routes for sign-up, verify, confirm

**Files:**
- Delete: `apps/web/app/routes/auth/sign-up.tsx`
- Delete: `apps/web/app/routes/auth/verify.tsx`
- Delete: `apps/web/app/routes/auth/confirm.tsx`
- Modify: `apps/web/app/routes.ts` — remove these auth routes
- Modify: `apps/web/app/routes/auth/sign-in.tsx` — remove link to sign-up page

- [ ] **Step 1: Delete route files**

```bash
rm apps/web/app/routes/auth/sign-up.tsx
rm apps/web/app/routes/auth/verify.tsx
rm apps/web/app/routes/auth/confirm.tsx
```

- [ ] **Step 2: Remove routes from routes.ts**

In `apps/web/app/routes.ts`, remove from `authLayout`:
```ts
route('auth/sign-up', 'routes/auth/sign-up.tsx'),
route('auth/verify', 'routes/auth/verify.tsx'),
route('auth/confirm', 'routes/auth/confirm.tsx'),
```

- [ ] **Step 3: Update sign-in.tsx — remove sign-up link**

In `apps/web/app/routes/auth/sign-in.tsx`, remove the entire sign-up link block at the bottom:
```tsx
<div className={'flex justify-center'}>
  <Button asChild variant={'link'} size={'sm'}>
    <Link to={pathsConfig.auth.signUp} prefetch={'render'}>
      <Trans i18nKey={'auth:doNotHaveAccountYet'} />
    </Link>
  </Button>
</div>
```

Also remove the `Link` import if no longer used, and `Button` if no longer used in this file.

- [ ] **Step 4: Strip auth package — delete MFA and magic link files**

```bash
rm packages/features/auth/src/mfa.ts
rm packages/features/auth/src/components/magic-link-auth-container.tsx
rm packages/features/auth/src/components/multi-factor-challenge-container.tsx
rm packages/features/auth/src/components/sign-up-methods-container.tsx
rm packages/features/auth/src/components/password-sign-up-container.tsx
rm packages/features/auth/src/components/password-sign-up-form.tsx
rm packages/features/auth/src/components/resend-auth-link-form.tsx
rm packages/features/auth/src/components/terms-and-conditions-form-field.tsx
rm packages/features/auth/src/schemas/password-sign-up.schema.ts
rm packages/features/auth/src/sign-up.ts
```

- [ ] **Step 5: Update auth package exports**

Check `packages/features/auth/package.json` for exports that reference deleted files. Remove any export entries for `mfa`, `sign-up`, `magic-link`, etc.

- [ ] **Step 6: Strip auth.config.ts — remove magicLink**

In `apps/web/config/auth.config.ts`, remove `magicLink` from the schema and config:
```ts
// Remove from AuthConfigSchema.providers:
magicLink: z.boolean({ description: 'Enable magic link authentication.' }),
// Remove from the parsed config:
magicLink: import.meta.env.VITE_AUTH_MAGIC_LINK === 'true',
```

Add `'azure'` to the oAuth array for Microsoft support:
```ts
oAuth: ['google', 'azure'],
```

- [ ] **Step 7: Typecheck and fix**

```bash
pnpm typecheck
```

Fix any remaining imports of deleted auth components.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: remove sign-up, MFA, magic link auth flows (invite-only model)"
```

---

## Task 4: Slim @aloha/shared — remove registry and events

**Files:**
- Delete: `packages/shared/src/registry/index.ts` (and directory)
- Delete: `packages/shared/src/events/index.tsx` (and directory)
- Modify: `packages/shared/package.json` — remove exports for registry and events

- [ ] **Step 1: Delete registry and events**

```bash
rm -rf packages/shared/src/registry packages/shared/src/events
```

- [ ] **Step 2: Update package.json exports**

In `packages/shared/package.json`, remove any export entries for `./registry` and `./events`.

- [ ] **Step 3: Search for remaining imports**

```bash
grep -rn "@aloha/shared/registry\|@aloha/shared/events\|AppEventsProvider\|useAppEvents\|createRegistry" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".turbo"
```

Remove or replace any found references. The `AppEventsProvider` is likely in `root-providers.tsx` — remove it from the provider tree.

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: remove registry and event bus from @aloha/shared"
```

---

## Task 5: Inline access-control and crud types into app/lib

**Files:**
- Create: `apps/web/lib/workspace/types.ts` — from `packages/features/access-control/src/view-contracts.ts`
- Create: `apps/web/lib/workspace/access-gate.tsx` — from `packages/features/access-control/src/components/access-gate.tsx`
- Create: `apps/web/lib/workspace/use-module-access.ts` — from `packages/features/access-control/src/hooks/use-module-access.ts`
- Create: `apps/web/lib/crud/types.ts` — from `packages/features/crud/src/types.ts`
- Delete: `packages/features/access-control/` (entire directory)
- Delete: `packages/features/crud/` (entire directory)
- Modify: `apps/web/package.json` — remove `@aloha/access-control`, `@aloha/crud`

- [ ] **Step 1: Create workspace types file**

Create `apps/web/lib/workspace/types.ts`:
```ts
/** Row shape from app_nav_modules view */
export interface AppNavModule {
  module_id: string;
  org_id: string;
  module_slug: string;
  display_name: string;
  display_order: number;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

/** Row shape from app_nav_sub_modules view */
export interface AppNavSubModule {
  sub_module_id: string;
  org_id: string;
  module_slug: string;
  sub_module_slug: string;
  display_name: string;
  display_order: number;
}

/** Module permissions for component-level access gates */
export interface ModulePermissions {
  module_slug: string;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}
```

- [ ] **Step 2: Create access-gate component**

Create `apps/web/lib/workspace/access-gate.tsx`:
```tsx
'use client';

import type { ReactNode } from 'react';

import { useModuleAccess } from './use-module-access';

interface AccessGateProps {
  permission: 'can_edit' | 'can_delete' | 'can_verify';
  children: ReactNode;
  fallback?: ReactNode;
}

export function AccessGate(props: AccessGateProps) {
  const access = useModuleAccess();

  if (!access || !access[props.permission]) {
    return props.fallback ?? null;
  }

  return props.children;
}
```

- [ ] **Step 3: Create use-module-access hook**

Create `apps/web/lib/workspace/use-module-access.ts`. This will need route ID updates after Task 7 (route flattening), but for now copy it with current route IDs:
```ts
'use client';

import { useMemo } from 'react';

import { useRouteLoaderData } from 'react-router';

interface ModulePermissions {
  module_slug: string;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

export function useModuleAccess(): ModulePermissions | null {
  const listData = useRouteLoaderData(
    'routes/home/account/modules/sub-module',
  ) as { moduleAccess?: ModulePermissions } | undefined;
  const detailData = useRouteLoaderData(
    'routes/home/account/modules/sub-module-detail',
  ) as { moduleAccess?: ModulePermissions } | undefined;
  const createData = useRouteLoaderData('sub-module-create') as
    | { moduleAccess?: ModulePermissions }
    | undefined;
  const editData = useRouteLoaderData('sub-module-edit') as
    | { moduleAccess?: ModulePermissions }
    | undefined;

  return useMemo(() => {
    const routeData = listData ?? detailData ?? createData ?? editData;
    if (!routeData?.moduleAccess) return null;

    const { module_slug, can_edit, can_delete, can_verify } =
      routeData.moduleAccess;

    return { module_slug, can_edit, can_delete, can_verify };
  }, [listData, detailData, createData, editData]);
}

export function useHasPermission(
  permission: 'can_edit' | 'can_delete' | 'can_verify',
): boolean {
  const access = useModuleAccess();
  return access?.[permission] ?? false;
}
```

- [ ] **Step 4: Create crud types file**

Create `apps/web/lib/crud/types.ts` — copy the full content from `packages/features/crud/src/types.ts` (all interfaces: `ColumnConfig`, `FilterConfig`, `SearchConfig`, `FormFieldConfig`, `WorkflowStateConfig`, `WorkflowTransitionFields`, `WorkflowConfig`, `CrudModuleConfig`).

- [ ] **Step 5: Delete the packages**

```bash
rm -rf packages/features/access-control packages/features/crud
```

- [ ] **Step 6: Remove from apps/web/package.json**

Remove:
```
"@aloha/access-control": "workspace:*",
"@aloha/crud": "workspace:*",
```

- [ ] **Step 7: Update all imports**

Replace all occurrences of:
- `@aloha/access-control/view-contracts` → `~/lib/workspace/types`
- `@aloha/access-control/components` → `~/lib/workspace/access-gate`
- `@aloha/access-control/hooks` → `~/lib/workspace/use-module-access`
- `@aloha/crud/types` → `~/lib/crud/types`

Files to update:
- `apps/web/app/routes/home/account/_lib/org-workspace-loader.server.ts`
- `apps/web/app/routes/home/account/_lib/require-module-access.server.ts`
- `apps/web/app/routes/home/account/modules/_config/registry.ts`
- `apps/web/app/routes/home/account/modules/_lib/render-form-field.tsx`
- `apps/web/app/routes/home/account/modules/_lib/workflow-helpers.ts`
- `apps/web/app/routes/home/account/modules/sub-module-detail.tsx`

- [ ] **Step 8: pnpm install and typecheck**

```bash
pnpm install && pnpm typecheck
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: inline access-control and crud types into app/lib"
```

---

## Task 6: Move CRUD files to lib/crud/

**Files:**
- Move: `routes/home/account/modules/_config/registry.ts` → `lib/crud/registry.ts`
- Move: `routes/home/account/modules/_config/hr-department.config.ts` → `lib/crud/hr-department.config.ts`
- Move: `routes/home/account/modules/_config/inv-product.config.ts` → `lib/crud/inv-product.config.ts`
- Move: `routes/home/account/modules/_lib/crud-action.server.ts` → `lib/crud/crud-action.server.ts`
- Move: `routes/home/account/modules/_lib/crud-helpers.server.ts` → `lib/crud/crud-helpers.server.ts`
- Move: `routes/home/account/modules/_lib/render-form-field.tsx` → `lib/crud/render-form-field.tsx`
- Move: `routes/home/account/modules/_lib/workflow-helpers.ts` → `lib/crud/workflow-helpers.ts`

- [ ] **Step 1: Move config files**

```bash
mv apps/web/app/routes/home/account/modules/_config/registry.ts apps/web/lib/crud/registry.ts
mv apps/web/app/routes/home/account/modules/_config/hr-department.config.ts apps/web/lib/crud/hr-department.config.ts
mv apps/web/app/routes/home/account/modules/_config/inv-product.config.ts apps/web/lib/crud/inv-product.config.ts
```

- [ ] **Step 2: Move lib files**

```bash
mv apps/web/app/routes/home/account/modules/_lib/crud-action.server.ts apps/web/lib/crud/crud-action.server.ts
mv apps/web/app/routes/home/account/modules/_lib/crud-helpers.server.ts apps/web/lib/crud/crud-helpers.server.ts
mv apps/web/app/routes/home/account/modules/_lib/render-form-field.tsx apps/web/lib/crud/render-form-field.tsx
mv apps/web/app/routes/home/account/modules/_lib/workflow-helpers.ts apps/web/lib/crud/workflow-helpers.ts
```

- [ ] **Step 3: Delete empty config and lib dirs**

```bash
rmdir apps/web/app/routes/home/account/modules/_config
rmdir apps/web/app/routes/home/account/modules/_lib
```

- [ ] **Step 4: Update internal imports within moved files**

In `apps/web/lib/crud/registry.ts`, update:
```ts
// OLD
import type { CrudModuleConfig } from '@aloha/crud/types';
import { hrDepartmentConfig } from './hr-department.config';
import { invProductConfig } from './inv-product.config';

// NEW
import type { CrudModuleConfig } from './types';
import { hrDepartmentConfig } from './hr-department.config';
import { invProductConfig } from './inv-product.config';
```

In `apps/web/lib/crud/render-form-field.tsx`, update:
```ts
// OLD
import type { FormFieldConfig } from '@aloha/crud/types';
// NEW
import type { FormFieldConfig } from './types';
```

In `apps/web/lib/crud/workflow-helpers.ts`, update:
```ts
// OLD
import type { FormFieldConfig, WorkflowConfig } from '@aloha/crud/types';
// NEW
import type { FormFieldConfig, WorkflowConfig } from './types';
```

In each config file (`hr-department.config.ts`, `inv-product.config.ts`), update:
```ts
// OLD
import type { CrudModuleConfig } from '@aloha/crud/types';
// NEW
import type { CrudModuleConfig } from './types';
```

- [ ] **Step 5: Update imports in route files that reference these moved files**

The route files still live at their old paths (will be moved in Task 7). For now, update their imports to point to `~/lib/crud/...`:

In `apps/web/app/routes/home/account/modules/sub-module.tsx`:
```ts
// OLD
import { requireModuleAccess, requireSubModuleAccess } from '../_lib/require-module-access.server';
import { getModuleConfig } from './_config/registry';
import { loadTableData } from './_lib/crud-helpers.server';

// NEW
import { requireModuleAccess, requireSubModuleAccess } from '~/lib/workspace/require-module-access.server';
import { getModuleConfig } from '~/lib/crud/registry';
import { loadTableData } from '~/lib/crud/crud-helpers.server';
```

Apply similar updates to:
- `sub-module-create.tsx` — update imports for `org-workspace-loader.server`, `require-module-access.server`, `registry`, `crud-action.server`, `crud-helpers.server`, `render-form-field`, `workflow-helpers`
- `sub-module-detail.tsx` — update imports for `org-workspace-loader.server`, `require-module-access.server`, `registry`, `crud-action.server`, `crud-helpers.server`, `workflow-helpers`
- `module.tsx` — update import for `require-module-access.server`

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: move CRUD files from routes to lib/crud/"
```

---

## Task 7: Move workspace loaders and sidebar components

**Files:**
- Move: `routes/home/account/_lib/org-workspace-loader.server.ts` → `lib/workspace/org-workspace-loader.server.ts`
- Move: `routes/home/account/_lib/require-module-access.server.ts` → `lib/workspace/require-module-access.server.ts`
- Move: all 7 files from `routes/home/account/_components/` → `components/sidebar/`

- [ ] **Step 1: Move workspace loaders**

```bash
mv apps/web/app/routes/home/account/_lib/org-workspace-loader.server.ts apps/web/lib/workspace/org-workspace-loader.server.ts
mv apps/web/app/routes/home/account/_lib/require-module-access.server.ts apps/web/lib/workspace/require-module-access.server.ts
rmdir apps/web/app/routes/home/account/_lib
```

- [ ] **Step 2: Create sidebar directory and move components**

```bash
mkdir -p apps/web/components/sidebar
mv apps/web/app/routes/home/account/_components/module-sidebar-navigation.tsx apps/web/components/sidebar/
mv apps/web/app/routes/home/account/_components/team-account-layout-sidebar.tsx apps/web/components/sidebar/
mv apps/web/app/routes/home/account/_components/team-account-accounts-selector.tsx apps/web/components/sidebar/
mv apps/web/app/routes/home/account/_components/team-account-layout-mobile-navigation.tsx apps/web/components/sidebar/
mv apps/web/app/routes/home/account/_components/team-account-layout-sidebar-navigation.tsx apps/web/components/sidebar/
mv apps/web/app/routes/home/account/_components/team-account-layout-page-header.tsx apps/web/components/sidebar/
mv apps/web/app/routes/home/account/_components/team-account-navigation-menu.tsx apps/web/components/sidebar/
rmdir apps/web/app/routes/home/account/_components
```

- [ ] **Step 3: Update imports in moved workspace files**

In `apps/web/lib/workspace/org-workspace-loader.server.ts`, update:
```ts
// OLD
import type { AppNavModule, AppNavSubModule } from '@aloha/access-control/view-contracts';
import type { AppOrgContext, AppUserOrgs } from '@aloha/auth/view-contracts';
// NEW
import type { AppNavModule, AppNavSubModule } from './types';
import type { AppOrgContext, AppUserOrgs } from '@aloha/auth/view-contracts';
```

In `apps/web/lib/workspace/require-module-access.server.ts`, update:
```ts
// OLD
import type { AppNavModule as NavModule, AppNavSubModule as NavSubModule } from '@aloha/access-control/view-contracts';
// NEW
import type { AppNavModule as NavModule, AppNavSubModule as NavSubModule } from './types';
```

- [ ] **Step 4: Update imports in sidebar components**

In each sidebar component, update relative imports to use `~/` paths:
- `~/config/module-icons.config` (already correct)
- `~/config/paths.config` (already correct)
- `~/lib/org-storage` (already correct)
- `~/components/personal-account-dropdown-container` (already correct)
- `~/components/app-logo` (already correct)
- Cross-references between sidebar components: change relative `./` or `../` imports to `~/components/sidebar/...`

In `team-account-navigation-menu.tsx`, update:
```ts
// OLD
import { TeamAccountAccountsSelector } from '~/routes/home/account/_components/team-account-accounts-selector';
// NEW
import { TeamAccountAccountsSelector } from '~/components/sidebar/team-account-accounts-selector';
```

- [ ] **Step 5: Update imports in the layout file**

In `apps/web/app/routes/home/account/layout.tsx`, update:
```ts
// OLD
import { TeamAccountLayoutMobileNavigation } from './_components/team-account-layout-mobile-navigation';
import { TeamAccountLayoutSidebar } from './_components/team-account-layout-sidebar';
import { TeamAccountNavigationMenu } from './_components/team-account-navigation-menu';
import { loadOrgWorkspace } from './_lib/org-workspace-loader.server';
// NEW
import { TeamAccountLayoutMobileNavigation } from '~/components/sidebar/team-account-layout-mobile-navigation';
import { TeamAccountLayoutSidebar } from '~/components/sidebar/team-account-layout-sidebar';
import { TeamAccountNavigationMenu } from '~/components/sidebar/team-account-navigation-menu';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: move workspace loaders and sidebar components out of routes"
```

---

## Task 8: Flatten route structure — move routes to workspace/

**Files:**
- Move: `routes/home/account/layout.tsx` → `routes/workspace/layout.tsx`
- Move: `routes/home/account/index.tsx` → `routes/workspace/home.tsx`
- Move: `routes/home/account/settings.tsx` → `routes/workspace/settings.tsx`
- Move: `routes/home/account/modules/module.tsx` → `routes/workspace/module.tsx`
- Move: `routes/home/account/modules/sub-module.tsx` → `routes/workspace/sub-module.tsx`
- Move: `routes/home/account/modules/sub-module-create.tsx` → `routes/workspace/sub-module-create.tsx`
- Move: `routes/home/account/modules/sub-module-detail.tsx` → `routes/workspace/sub-module-detail.tsx`
- Move: `routes/home/index.tsx` → update to use workspace paths
- Move: `routes/update-password.tsx` → `routes/auth/update-password.tsx`
- Rewrite: `routes.ts` — new flat structure

- [ ] **Step 1: Create workspace route directory**

```bash
mkdir -p apps/web/app/routes/workspace
```

- [ ] **Step 2: Move route files**

```bash
mv apps/web/app/routes/home/account/layout.tsx apps/web/app/routes/workspace/layout.tsx
mv apps/web/app/routes/home/account/index.tsx apps/web/app/routes/workspace/home.tsx
mv apps/web/app/routes/home/account/settings.tsx apps/web/app/routes/workspace/settings.tsx
mv apps/web/app/routes/home/account/modules/module.tsx apps/web/app/routes/workspace/module.tsx
mv apps/web/app/routes/home/account/modules/sub-module.tsx apps/web/app/routes/workspace/sub-module.tsx
mv apps/web/app/routes/home/account/modules/sub-module-create.tsx apps/web/app/routes/workspace/sub-module-create.tsx
mv apps/web/app/routes/home/account/modules/sub-module-detail.tsx apps/web/app/routes/workspace/sub-module-detail.tsx
mv apps/web/app/routes/update-password.tsx apps/web/app/routes/auth/update-password.tsx
```

- [ ] **Step 3: Move home redirect page**

```bash
mv apps/web/app/routes/home/index.tsx apps/web/app/routes/workspace-redirect.tsx
mv apps/web/app/routes/home/_lib/home-loader.server.ts apps/web/lib/workspace/home-loader.server.ts
```

- [ ] **Step 4: Delete the old routes/home/ directory**

```bash
rm -rf apps/web/app/routes/home
```

- [ ] **Step 5: Rewrite routes.ts**

Replace the entire content of `apps/web/app/routes.ts`:

```ts
import { type RouteConfig, layout, route } from '@react-router/dev/routes';

const rootRoutes = [
  route('', 'routes/index.ts'),
  route('version', 'routes/version.ts'),
  route('healthcheck', 'routes/healthcheck.ts'),
  route('home', 'routes/workspace-redirect.tsx'),
  route('no-access', 'routes/no-access.tsx'),
];

const apiRoutes = [
  route('api/db/webhook', 'routes/api/db/webhook.ts'),
  route('api/ai/chat', 'routes/api/ai/chat.ts'),
  route('api/ai/form-assist', 'routes/api/ai/form-assist.ts'),
];

const authLayout = layout('routes/auth/layout.tsx', [
  route('auth/sign-in', 'routes/auth/sign-in.tsx'),
  route('auth/password-reset', 'routes/auth/password-reset.tsx'),
  route('auth/update-password', 'routes/auth/update-password.tsx'),
  route('auth/callback', 'routes/auth/callback.tsx'),
  route('auth/callback/error', 'routes/auth/callback-error.tsx'),
]);

const workspaceLayout = layout('routes/workspace/layout.tsx', [
  route('home/:account', 'routes/workspace/home.tsx'),
  route('home/:account/settings', 'routes/workspace/settings.tsx'),
  route('home/:account/:module', 'routes/workspace/module.tsx'),
  route(
    'home/:account/:module/:subModule/create',
    'routes/workspace/sub-module-create.tsx',
    { id: 'sub-module-create' },
  ),
  route(
    'home/:account/:module/:subModule/:recordId/edit',
    'routes/workspace/sub-module-create.tsx',
    { id: 'sub-module-edit' },
  ),
  route(
    'home/:account/:module/:subModule/:recordId',
    'routes/workspace/sub-module-detail.tsx',
  ),
  route(
    'home/:account/:module/:subModule',
    'routes/workspace/sub-module.tsx',
  ),
]);

export default [
  ...rootRoutes,
  ...apiRoutes,
  authLayout,
  workspaceLayout,
] satisfies RouteConfig;
```

- [ ] **Step 6: Update paths.config.ts**

In `apps/web/config/paths.config.ts`, update the password update path:
```ts
// OLD
passwordUpdate: '/update-password',
// NEW
passwordUpdate: '/auth/update-password',
```

- [ ] **Step 7: Update imports in moved route files**

In `apps/web/app/routes/workspace/home.tsx`:
```ts
// OLD
import { homeLoader } from './_lib/home-loader.server';
// NEW
import { homeLoader } from '~/lib/workspace/home-loader.server';
```

Update the `~/types/...` imports in each moved file. After running `pnpm --filter web react-router:typegen`, the type paths will regenerate. For now, temporarily comment out or fix the type imports based on the new route locations.

In route files that reference `~/routes/home/account/_components/...`, update to `~/components/sidebar/...` (should already be done from Task 7).

In `module.tsx`, update the hardcoded redirect path — it still uses `/home/...` URL paths which is correct (URL paths haven't changed, only file locations).

- [ ] **Step 8: Update workspace-redirect.tsx**

In `apps/web/app/routes/workspace-redirect.tsx`, update:
```ts
// OLD
import { homeLoader } from './_lib/home-loader.server';
// NEW
import { homeLoader } from '~/lib/workspace/home-loader.server';
```

- [ ] **Step 9: Update use-module-access.ts route IDs**

In `apps/web/lib/workspace/use-module-access.ts`, update the route loader data IDs to match the new routes.ts:
```ts
// OLD
const listData = useRouteLoaderData('routes/home/account/modules/sub-module') ...
const detailData = useRouteLoaderData('routes/home/account/modules/sub-module-detail') ...
// NEW
const listData = useRouteLoaderData('routes/workspace/sub-module') ...
const detailData = useRouteLoaderData('routes/workspace/sub-module-detail') ...
```

- [ ] **Step 10: Regenerate route types and typecheck**

```bash
cd apps/web && pnpm react-router:typegen && cd ../..
pnpm typecheck
```

Fix any remaining type import paths (the `~/types/app/routes/...` paths will have changed).

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "refactor: flatten routes — move to workspace/ and auth/ structure"
```

---

## Task 9: Clean up Supabase schema files

**Files:**
- Delete: `apps/web/supabase/schemas/04-roles.sql`
- Delete: `apps/web/supabase/schemas/05-memberships.sql`
- Delete: `apps/web/supabase/schemas/06-roles-permissions.sql`
- Delete: `apps/web/supabase/schemas/11-notifications.sql`
- Delete: `apps/web/supabase/schemas/12-one-time-tokens.sql`
- Delete: `apps/web/supabase/schemas/13-mfa.sql`
- Delete: `apps/web/supabase/schemas/14-super-admin.sql`
- Delete: `apps/web/supabase/schemas/15-account-views.sql`
- Delete: `apps/web/supabase/schemas/16-storage.sql`
- Delete: `apps/web/supabase/schemas/17-roles-seed.sql`
- Rename: `18-consumer-dev-tables.sql` → `04-consumer-dev-tables.sql`
- Rename: `19-view-contracts.sql` → `05-view-contracts.sql`
- Rename: `20-nav-view-contracts.sql` → `06-nav-view-contracts.sql`

- [ ] **Step 1: Delete unused schema files**

```bash
cd apps/web/supabase/schemas
rm 04-roles.sql 05-memberships.sql 06-roles-permissions.sql
rm 11-notifications.sql 12-one-time-tokens.sql 13-mfa.sql
rm 14-super-admin.sql 15-account-views.sql 16-storage.sql 17-roles-seed.sql
```

- [ ] **Step 2: Rename remaining files**

```bash
mv 18-consumer-dev-tables.sql 04-consumer-dev-tables.sql
mv 19-view-contracts.sql 05-view-contracts.sql
mv 20-nav-view-contracts.sql 06-nav-view-contracts.sql
cd ../../../..
```

- [ ] **Step 3: Clean up 01-enums.sql**

Edit `apps/web/supabase/schemas/01-enums.sql` to remove the template's `app_permissions` enum type if present. Keep only custom enums used by the app (`sys_access_level`, etc.).

- [ ] **Step 4: Clean up 03-accounts.sql**

Edit `apps/web/supabase/schemas/03-accounts.sql` to remove personal/team account logic. Keep only what Supabase Auth needs — likely the `accounts` table with basic fields and the trigger that creates an account on `auth.users` insert. Remove any references to `account_type`, `is_personal_account`, `primary_owner_user_id` if those are template-only concepts not used by your org model.

Review carefully — some RLS policies in this file may reference functions defined in the deleted schema files (e.g., `is_super_admin()`, `has_permission()`). Remove those policies.

- [ ] **Step 5: Verify schema loads cleanly**

```bash
pnpm supabase:web:reset
```

This will apply all schemas from scratch. Fix any SQL errors from missing references.

- [ ] **Step 6: Regenerate TypeScript types**

```bash
pnpm supabase:web:typegen
```

- [ ] **Step 7: Typecheck after type regen**

```bash
pnpm typecheck
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: clean up Supabase schema — remove template tables, renumber files"
```

---

## Task 10: Final cleanup — lint, format, verify

**Files:**
- Modify: Various files for lint/format fixes

- [ ] **Step 1: Run linter and formatter**

```bash
pnpm lint:fix
pnpm format:fix
```

- [ ] **Step 2: Full typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Verify no stale imports remain**

Search for any remaining references to deleted packages:
```bash
grep -rn "@aloha/team-accounts\|@aloha/access-control\|@aloha/crud\|@aloha/mailers\|@aloha/otp\|@aloha/policies" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".turbo"
```

Also search for old route paths:
```bash
grep -rn "routes/home/account" apps/web/app/ --include="*.ts" --include="*.tsx"
```

Fix any remaining references.

- [ ] **Step 4: Verify dev server starts**

```bash
pnpm --filter web dev
```

Confirm the app loads at localhost:3000, sign-in page renders, and after login the workspace sidebar shows modules.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: final cleanup — lint, format, fix stale imports"
```

---

## Dependency Order

```
Task 1 (delete leaf packages)
  → Task 2 (delete team-accounts)
    → Task 3 (delete auth routes)
    → Task 4 (slim @aloha/shared)
      → Task 5 (inline types)
        → Task 6 (move CRUD files)
        → Task 7 (move workspace/sidebar files)
          → Task 8 (flatten routes)
            → Task 9 (schema cleanup)
              → Task 10 (final cleanup)
```

Tasks 6 and 7 can run in parallel after Task 5. All other tasks are sequential.
