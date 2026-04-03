---
phase: 260402-jtc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/user-profile-dropdown.tsx
  - app/components/sidebar/workspace-sidebar.tsx
  - app/routes/workspace/layout.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Admin and owner users see an 'Organisation' link in the profile dropdown"
    - "The Organisation link navigates to /home/:account/settings"
    - "Non-admin users (employee, team_lead, manager) do not see the Organisation link"
  artifacts:
    - path: "app/components/user-profile-dropdown.tsx"
      provides: "Profile dropdown with conditional Organisation link"
    - path: "app/components/sidebar/workspace-sidebar.tsx"
      provides: "Passes account slug and access_level_id to UserProfileDropdown"
  key_links:
    - from: "app/routes/workspace/layout.tsx"
      to: "app/components/sidebar/workspace-sidebar.tsx"
      via: "currentOrg.access_level_id passed as prop"
    - from: "app/components/sidebar/workspace-sidebar.tsx"
      to: "app/components/user-profile-dropdown.tsx"
      via: "account and accessLevelId props"
---

<objective>
Add an "Organisation" link to the sidebar bottom-left profile dropdown that navigates to the org settings page. The link is only visible to users whose `sys_access_level` id is `'admin'` or `'owner'` (level >= 40).

Purpose: Let admin/owner users quickly navigate to org settings from their profile dropdown.
Output: Modified UserProfileDropdown with conditional Organisation link, updated prop chain from layout through WorkspaceSidebar.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Access level IDs (from seed data — sys_access_level table):
- 'employee' → level 10
- 'team_lead' → level 20
- 'manager' → level 30
- 'admin' → level 40  ← show Organisation link
- 'owner' → level 50  ← show Organisation link

The ADMIN_ACCESS_LEVELS to check: ['admin', 'owner']

The Organisation settings route: /home/:account/settings (defined in app/routes.ts, handled by app/routes/workspace/settings.tsx)

OrgWorkspace interface (from app/lib/workspace/org-workspace-loader.server.ts):
```typescript
interface OrgWorkspace {
  currentOrg: {
    org_id: string;
    org_name: string;
    employee_id: string;
    access_level_id: string;
  };
  // ...
}
```

WorkspaceSidebar currently receives: account, accountId, accounts, user, navigation
UserProfileDropdown currently receives: user, account (optional)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Thread access level and account into UserProfileDropdown</name>
  <files>
    app/components/user-profile-dropdown.tsx
    app/components/sidebar/workspace-sidebar.tsx
    app/routes/workspace/layout.tsx
  </files>
  <action>
    **Step 1 — Update UserProfileDropdown props** (`app/components/user-profile-dropdown.tsx`):

    Add two optional props to the component interface:
    - `account?: string` — the org slug for building the settings URL
    - `accessLevelId?: string` — the user's access level ID

    Add a constant above the component:
    ```typescript
    const ADMIN_ACCESS_LEVEL_IDS = ['admin', 'owner'];
    ```

    Inside the component, derive a boolean:
    ```typescript
    const isAdmin = !!props.accessLevelId && ADMIN_ACCESS_LEVEL_IDS.includes(props.accessLevelId);
    ```

    Add the Organisation dropdown item between the theme toggle separator and the logout separator. Place it after the theme toggle `DropdownMenuSeparator` and before the logout `DropdownMenuSeparator`. Only render when `isAdmin && props.account`:
    ```tsx
    {isAdmin && props.account ? (
      <>
        <DropdownMenuItem asChild>
          <a href={`/home/${props.account}/settings`}>
            <Building2 className="mr-2 h-4 w-4" />
            <Trans i18nKey={'common:organisation'} />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    ) : null}
    ```

    Add `Building2` to the lucide-react import (alongside `LogOut` and `Palette`).

    **Step 2 — Update WorkspaceSidebar** (`app/components/sidebar/workspace-sidebar.tsx`):

    Add `accessLevelId: string` to the WorkspaceSidebar and SidebarContainer props interfaces.

    Pass it through from SidebarContainer to UserProfileDropdown:
    ```tsx
    <UserProfileDropdown
      user={props.user}
      account={account}
      accessLevelId={props.accessLevelId}
    />
    ```

    **Step 3 — Update layout** (`app/routes/workspace/layout.tsx`):

    In `SidebarLayout`, pass `accessLevelId` to `WorkspaceSidebar`:
    ```tsx
    <WorkspaceSidebar
      account={accountSlug}
      accountId={workspace.currentOrg.org_id}
      accounts={accounts}
      user={user}
      navigation={workspace.navigation}
      accessLevelId={workspace.currentOrg.access_level_id}
    />
    ```

    Note: `workspace.currentOrg.access_level_id` is already loaded by `loadOrgWorkspace` — no loader changes needed.

    For the i18n key `common:organisation` — add it to the `public/locales/en/common.json` file if it exists. Check with `find public/locales -name "common.json"` and add `"organisation": "Organisation"` if missing. If the key is missing and no locale file exists, use a plain string `Organisation` as the Trans fallback instead (Trans renders children as fallback).
  </action>
  <verify>
    Run typechecks: `pnpm typecheck`
    Then run lint: `pnpm lint:fix`
    Then manually verify by running `pnpm dev` and checking the profile dropdown as admin vs employee user.
  </verify>
  <done>
    - TypeScript compiles without errors
    - Admin/owner users see "Organisation" item in profile dropdown linking to /home/:account/settings
    - Non-admin users (employee, team_lead, manager) do not see the Organisation item
    - Clicking Organisation navigates to /home/:account/settings
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→route | access_level_id is read from server-loaded OrgWorkspace, not from client input |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-jtc-01 | Spoofing | access_level_id prop | accept | Value flows from server-side loadOrgWorkspace which queries app_org_context view with auth.uid() — cannot be spoofed by client. Settings route itself enforces auth via requireUserLoader. |
| T-jtc-02 | Elevation of Privilege | /home/:account/settings visibility | accept | Hiding the link is a UX convenience only — the settings route must enforce its own access control. Current settings.tsx has no access restriction, which is a pre-existing concern outside this task's scope. |
</threat_model>

<verification>
1. `pnpm typecheck` — no TypeScript errors
2. `pnpm lint:fix` — no lint errors
3. Sign in as admin user (admin@hawaiifarming.com / password123 with access_level_id='owner') → profile dropdown shows "Organisation" link
4. If a lower-access user exists — profile dropdown does NOT show "Organisation" link
5. Clicking "Organisation" navigates to /home/:account/settings page
</verification>

<success_criteria>
- UserProfileDropdown accepts and uses `account` and `accessLevelId` props
- Organisation link appears for admin/owner access levels only
- Organisation link navigates to the correct /home/:account/settings path
- No TypeScript or lint errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/260402-jtc-add-organisation-link-to-sidebar-profile/260402-jtc-01-SUMMARY.md`
</output>
