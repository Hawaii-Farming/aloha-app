# Aloha App Simplification Design

## Goal

Strip the aloha-react-supabase-template's account/membership/RBAC system, keep `org`/`hr_employee` as the sole tenant model, flatten the route structure, inline small type packages, and retain only the packages the app actually uses.

## Approach

Surgical prune (Approach A): delete unused packages and template code in-place, flatten routes, inline small type packages into `app/lib/`. Same repo, preserved git history. One layer at a time, verified after each step.

---

## Folder Structure (After)

```
apps/
  web/
    app/
      routes/
        auth/
          sign-in.tsx
          password-reset.tsx
          update-password.tsx
          callback.tsx              # OAuth callback handler
        workspace/
          layout.tsx
          home.tsx
          module.tsx
          sub-module.tsx
          sub-module-detail.tsx
          sub-module-create.tsx
          sub-module-edit.tsx
          settings.tsx
        api/
          ai-chat.tsx
          ai-form-assist.tsx
          db-webhook.tsx
        _index.tsx
        healthcheck.tsx
        no-access.tsx
      lib/
        crud/                     # CRUD configs, types, actions, helpers
        workspace/                # org-workspace-loader, require-module-access, nav types
        auth/                     # requireUserLoader, session helpers
      components/
        sidebar/                  # sidebar, module nav, account selector
        layout/                   # root providers, error boundary
    supabase/
      schemas/                    # renumbered 00-06
      migrations/

  e2e/                            # Playwright tests

packages/
  supabase/                       # DB client factory + generated types
  ui/                             # Shadcn + kit components
  shared/                         # logger + hooks (no registry/event bus)
  i18n/                           # English + Spanish
  features/
    auth/                         # email/password + Google/Microsoft OAuth
    ai/                           # chat panel + form assist
  database-webhooks/              # webhook handlers
  mcp-server/                     # MCP integration

tooling/                          # Turborepo configs (unchanged)
```

Routes are max 2 levels deep. Shared logic lives in `app/lib/`, shared components in `app/components/`.

---

## Schema Cleanup

### Keep (renumbered 00-06)

| New # | Old file | Content |
|-------|----------|---------|
| 00 | `00-privileges.sql` | DB role and privilege setup for RLS |
| 01 | `01-enums.sql` | Custom enums only (`sys_access_level`, module-related). Drop template enums (`app_permissions`) |
| 02 | `02-config.sql` | Configuration tables and feature flags |
| 03 | `03-accounts.sql` | Accounts table slimmed to what Supabase Auth needs for login/session. Drop personal/team account logic |
| 04 | `18-consumer-dev-tables.sql` | All custom tables: `org`, `org_module`, `org_sub_module`, `hr_employee`, `hr_module_access`, `hr_department`, `inv_product`, etc. |
| 05 | `19-view-contracts.sql` | `app_org_context`, `app_user_orgs` auth views |
| 06 | `20-nav-view-contracts.sql` | `app_nav_modules`, `app_nav_sub_modules` sidebar views |

### Drop

| File | Reason |
|------|--------|
| `04-roles.sql` | Template RBAC replaced by `sys_access_level` |
| `05-memberships.sql` | Template memberships replaced by `hr_employee` |
| `06-roles-permissions.sql` | Template permission mappings replaced by `hr_module_access` |
| `11-notifications.sql` | Not used |
| `12-one-time-tokens.sql` | Cutting OTP package |
| `13-mfa.sql` | Cutting MFA |
| `14-super-admin.sql` | Not used |
| `15-account-views.sql` | Replaced by custom views in 19 |
| `16-storage.sql` | Add back later if needed |
| `17-roles-seed.sql` | Seed data for dropped template roles |

---

## Auth Simplification

### What stays

- **Email/password sign-in** via Supabase `signInWithPassword`
- **Google OAuth** via `signInWithOAuth({ provider: 'google' })`
- **Microsoft OAuth** via `signInWithOAuth({ provider: 'azure' })`
- **Password reset** via Supabase `resetPasswordForEmail` flow
- **`requireUserLoader`** rewired to check `hr_employee` for org membership instead of template `memberships`
- **Session handling** unchanged (cookie-based via `@aloha/supabase`)

### What's cut

- Magic link flow
- MFA (TOTP setup, verify, disable)
- Custom OTP email verification
- View contracts referencing template `accounts`/`memberships`
- Auto-creation of personal account on sign-up

### Sign-up model: Invite-only

No public sign-up page. An admin creates an `hr_employee` record with the user's email. User signs in with Google/Microsoft OAuth (or email/password if pre-provisioned). If their email matches an `hr_employee` record, they're in. If not, they see the `/no-access` page.

---

## Package Changes

### Keep

| Package | Action | Notes |
|---------|--------|-------|
| `@aloha/supabase` | Keep as-is | DB client factory + generated types |
| `@aloha/ui` | Keep as-is | Shadcn + kit components |
| `@aloha/shared` | Slim down | Keep logger + hooks. Remove `createRegistry()`, event bus |
| `@aloha/i18n` | Keep as-is | English + Spanish |
| `@aloha/features/auth` | Slim down | Email/password + Google/Microsoft OAuth + `requireUserLoader`. No MFA, magic link, OTP, template view contracts |
| `@aloha/features/ai` | Keep as-is | Chat panel + form assist |
| `@aloha/database-webhooks` | Keep | Rewire to handle org/hr_employee events instead of template membership events |
| `@aloha/mcp-server` | Keep as-is | MCP integration |

### Delete

| Package | Reason |
|---------|--------|
| `@aloha/features/team-accounts` | Replaced by org/hr_employee model |
| `@aloha/features/access-control` | Types inlined into `app/lib/workspace/types.ts` |
| `@aloha/features/crud` | Types inlined into `app/lib/crud/types.ts` |
| `@aloha/policies` | Not needed; RLS + hr_module_access handles permissions |
| `@aloha/otp` | Not needed; no custom email verification |
| `@aloha/mailers/*` (core, shared, resend, nodemailer) | Not needed; no email sending |

---

## File Migration Map

### Moved (restructured)

| From | To |
|------|-----|
| `routes/home/account/modules/_config/*` | `app/lib/crud/` |
| `routes/home/account/modules/_lib/*` | `app/lib/crud/` |
| `routes/home/account/_lib/org-workspace-loader.server.ts` | `app/lib/workspace/` |
| `routes/home/account/_lib/require-module-access.server.ts` | `app/lib/workspace/` |
| `routes/home/account/_components/*sidebar*` | `app/components/sidebar/` |
| `routes/home/account/_components/*layout*` | `app/components/layout/` |
| `routes/home/account/modules/*.tsx` (route components) | `routes/workspace/` (flattened) |
| `routes/home/account/layout.tsx` | `routes/workspace/layout.tsx` |
| Access-control types from `@aloha/features/access-control` | `app/lib/workspace/types.ts` |
| CRUD types from `@aloha/features/crud` | `app/lib/crud/types.ts` |

### Deleted

| What | Why |
|------|-----|
| `packages/features/team-accounts/` | Replaced by org/hr_employee |
| `packages/features/access-control/` | Inlined |
| `packages/features/crud/` | Inlined |
| `packages/policies/` | Not needed |
| `packages/otp/` | Not needed |
| `packages/mailers/` | Not needed |
| `routes/home/` (entire tree after moves) | Replaced by `routes/workspace/` |
| `routes/identities/` | Template identity management |
| `routes/auth/sign-up.tsx` | No public sign-up (invite-only) |
| `routes/auth/verify.tsx` | OTP email verification (cut with OTP) |
| `routes/auth/confirm.tsx` | Template email confirmation (cut with OTP) |
| Schema files 04, 05, 06, 11-17 | Template tables not used |

### Kept as-is

- `e2e/`
- `packages/supabase/`, `packages/ui/`, `packages/i18n/`
- `packages/features/ai/`
- `packages/database-webhooks/`, `packages/mcp-server/`
- `tooling/`
- Root configs (`turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json`)

---

## Data Flow

### Login to Workspace

1. User hits `/` -> redirected to `/auth/sign-in`
2. User clicks "Sign in with Google" (or Microsoft, or email/password)
3. Supabase Auth creates session, cookie set
4. Redirect to `/workspace`
5. `requireUserLoader` checks session, queries `hr_employee` for matching `auth.uid()`
6. No `hr_employee` record -> `/no-access`
7. Found -> `org-workspace-loader` fetches user's orgs, picks active org, loads `app_nav_modules` + `app_nav_sub_modules`
8. Sidebar renders modules/sub-modules

### Multi-tenant Switching

- User may belong to multiple orgs via multiple `hr_employee` records
- Org switcher in sidebar queries `app_user_orgs` view
- Switching org reloads workspace loader with new modules/sub-modules

### CRUD Flow

- `workspace/sub-module.tsx` reads module + sub-module from URL params
- Looks up CRUD config from `lib/crud/registry.ts`
- Config defines: table name, columns, fields, validation schema
- List/detail/create/edit rendered from config, queries scoped to active `org_id` via RLS

### AI Flow

- Chat button floats on every workspace page
- AI context auto-derived: org, module, sub-module, page type
- Chat hits `/api/ai-chat` -> system prompt built with context -> Claude responds
