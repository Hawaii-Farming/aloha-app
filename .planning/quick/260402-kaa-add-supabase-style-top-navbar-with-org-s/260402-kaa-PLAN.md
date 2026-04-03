---
phase: quick
plan: 260402-kaa
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/workspace-navbar.tsx
  - app/components/sidebar/workspace-sidebar.tsx
  - app/routes/workspace/layout.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Top navbar spans full width above sidebar+content at ~h-12 with dark bg and border-b"
    - "Navbar left: SidebarTrigger collapse button then OrgSelector (standalone, not inside dropdown)"
    - "Navbar center: route-derived clickable breadcrumbs (slug-to-label, last segment non-clickable)"
    - "Navbar right: Bell icon placeholder then profile avatar dropdown"
    - "Sidebar footer (UserProfileDropdown) is removed; OrgSelector removed from profile dropdown"
  artifacts:
    - path: "app/components/workspace-navbar.tsx"
      provides: "WorkspaceNavbar component"
      exports: ["WorkspaceNavbar"]
    - path: "app/components/sidebar/workspace-sidebar.tsx"
      provides: "Sidebar without SidebarFooter block"
    - path: "app/routes/workspace/layout.tsx"
      provides: "SidebarLayout with WorkspaceNavbar inserted above Page"
  key_links:
    - from: "app/routes/workspace/layout.tsx"
      to: "app/components/workspace-navbar.tsx"
      via: "WorkspaceNavbar rendered above Page in SidebarLayout"
    - from: "app/components/workspace-navbar.tsx"
      to: "app/components/user-profile-dropdown.tsx"
      via: "UserProfileDropdown import with accountSlug, user, accounts props"
    - from: "app/components/workspace-navbar.tsx"
      to: "app/components/sidebar/org-selector.tsx"
      via: "OrgSelector import with selectedAccount, userId, accounts props"
---

<objective>
Add a Supabase-style top navbar to the workspace sidebar layout. The navbar sits full-width above the sidebar+content area and contains: sidebar collapse trigger + standalone OrgSelector on the left, route-derived breadcrumbs in the center, and a Bell placeholder + profile avatar dropdown on the right. Remove the sidebar footer (UserProfileDropdown) entirely and remove the OrgSelector embed from the profile dropdown.

Purpose: Modernize the workspace chrome to match the Supabase aesthetic — a compact, dark, border-bottomed navbar that consolidates org switching and user profile controls in a dedicated top bar rather than buried in the sidebar footer.
Output: WorkspaceNavbar component, updated WorkspaceSidebar (no footer), updated layout wiring.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app/components/sidebar/workspace-sidebar.tsx
@app/components/user-profile-dropdown.tsx
@app/components/sidebar/org-selector.tsx
@app/routes/workspace/layout.tsx

<interfaces>
<!-- Key contracts the executor needs. -->

From packages/ui/src/kit/app-breadcrumbs.tsx:
```typescript
// Reads useLocation().pathname, auto-derives clickable breadcrumbs from URL segments.
// Accepts optional label overrides via values prop.
export function AppBreadcrumbs(props: {
  values?: Record<string, string>;
  maxDepth?: number;
});
// Import: import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
```

From packages/ui/src/shadcn/sidebar.tsx:
```typescript
// Collapse toggle button; uses SidebarContext internally.
export const SidebarTrigger: React.FC<React.ComponentProps<typeof Button>>;
// Import: import { SidebarTrigger } from '@aloha/ui/shadcn-sidebar';
```

From app/components/sidebar/org-selector.tsx:
```typescript
export function OrgSelector(params: {
  selectedAccount: string;  // org slug (not id)
  userId: string;
  accounts: Array<{ label: string | null; value: string | null; image: string | null }>;
});
// Note: internally reads SidebarContext — in navbar context (no sidebar collapse state)
// the collapsed branch won't apply since SidebarContext.open=true by default in SidebarProvider.
```

From app/components/user-profile-dropdown.tsx:
```typescript
export function UserProfileDropdown(props: {
  user?: JwtPayload | null;
  accountSlug?: string;
  accessLevelId?: string;
  accounts?: Array<{ label: string | null; value: string | null; image: string | null }>;
  userId?: string;
  // NOTE: accounts/userId/accountSlug drive the embedded OrgSelector — pass them
  // but the OrgSelector section will be removed from this component in this task.
});
```

SidebarLayout in layout.tsx derives:
```typescript
const accounts = workspace.userOrgs.map(({ org_id, org_name }) => ({
  label: org_name,
  value: org_id,   // <-- this is org_id (UUID), but OrgSelector uses it as the select value
  image: null,
}));
// accountSlug = accountSlug (URL slug string)
// user = workspace.user (JwtPayload)
// workspace.currentOrg.access_level_id = accessLevelId
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create WorkspaceNavbar component</name>
  <files>app/components/workspace-navbar.tsx</files>
  <action>
Create `app/components/workspace-navbar.tsx` as a new client component.

Props interface:
```typescript
interface WorkspaceNavbarProps {
  account: string;           // org slug (for OrgSelector selectedAccount)
  accountId: string;         // org id (for OrgSelector userId match not needed — this is orgId)
  accounts: Array<{ label: string | null; value: string | null; image: string | null }>;
  user: JwtPayload;
  accessLevelId: string;
}
```

Layout (full-width bar, `h-12`, `border-b`, dark bg using `bg-background`, sticky):
```
[SidebarTrigger] [vertical separator] [OrgSelector]   [AppBreadcrumbs (flex-1 center)]   [Bell icon] [UserProfileDropdown avatar]
```

Implementation details:
- Outer div: `flex h-12 w-full items-center border-b bg-background px-3 gap-3` — matches Supabase compact navbar style
- Left section (`flex items-center gap-2 shrink-0`):
  - `<SidebarTrigger className="h-7 w-7 text-muted-foreground" />` from `@aloha/ui/shadcn-sidebar`
  - `<Separator orientation="vertical" className="h-4" />` from `@aloha/ui/separator`
  - `<OrgSelector selectedAccount={account} userId={user.id} accounts={accounts} />`
- Center section (`flex flex-1 items-center justify-center`):
  - `<AppBreadcrumbs maxDepth={4} />` from `@aloha/ui/app-breadcrumbs`
  - Pass `values` to humanize known slugs: the `account` slug → workspace.currentOrg label isn't available here; rely on AppBreadcrumbs' built-in unslugify (`_` and `-` to spaces, capitalize). Note: AppBreadcrumbs uses `replace(/-/g, ' ')` — for underscore slugs like `human_resources`, add a custom unslugify override. Since AppBreadcrumbs accepts `values` as a Record mapping path segments to display labels, pass an empty object and let the component's Trans+unslugify handle it. Underscores in slugs won't be handled by the existing `unslugify` (only replaces `-`). To fix this for the `account` segment: do not try to override inside WorkspaceNavbar since we don't have the org name prop — accept the slug display for now (the component renders URL segments as-is with `-` replaced, underscores stay). This is acceptable for v1.
- Right section (`flex items-center gap-2 shrink-0`):
  - Bell icon: `<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>` — import Bell from lucide-react, Button from `@aloha/ui/button`
  - `<UserProfileDropdown user={user} accountSlug={account} accessLevelId={accessLevelId} />` — do NOT pass `accounts` or `userId` here, so the embedded OrgSelector section in the dropdown won't render (the conditional `props.accounts && props.accounts.length > 1 && props.userId` guards it). This is the cleanest way to remove it from the dropdown without modifying that component.

Do NOT pass `accounts`/`userId` to `UserProfileDropdown` in the navbar — this suppresses the OrgSelector section inside the dropdown without requiring a code change to that component.

Use `'use client';` directive at top since this uses hooks (SidebarTrigger uses SidebarContext, OrgSelector uses useNavigate/SidebarContext, UserProfileDropdown uses useTheme/useUser).
  </action>
  <verify>
    `pnpm typecheck` passes with no errors in the new file.
  </verify>
  <done>WorkspaceNavbar renders: SidebarTrigger + OrgSelector on left, AppBreadcrumbs centered, Bell + profile avatar on right. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Remove sidebar footer and wire navbar into layout</name>
  <files>
    app/components/sidebar/workspace-sidebar.tsx
    app/routes/workspace/layout.tsx
  </files>
  <action>
**workspace-sidebar.tsx — remove SidebarFooter:**

Remove the entire `<SidebarFooter>` block (lines 78–89 in current file):
```tsx
// DELETE this entire block:
<SidebarFooter>
  <SidebarContent>
    <UserProfileDropdown ... />
  </SidebarContent>
</SidebarFooter>
```

Also remove unused imports: `SidebarFooter` from `@aloha/ui/shadcn-sidebar`, `UserProfileDropdown` from `~/components/user-profile-dropdown`.

Remove props that are no longer needed by `SidebarContainer` and `WorkspaceSidebar` — specifically `accounts`, `user`, `userId`, and `accessLevelId` are now only needed for the removed footer. BUT check: they are still forwarded as props to SidebarContainer. After removing the footer, `accounts`, `user`, and `accessLevelId` are unused inside `SidebarContainer`. Remove them from both `WorkspaceSidebar` and `SidebarContainer` prop types and usages.

Keep `account` prop (still used by `StaticNavigationItems` and `ModuleSidebarNavigation`), `accountId` (keep for potential future use, or remove if truly unused — check `SidebarContainer` body after removal), `navigation` (still used by `ModuleSidebarNavigation`).

After removal, check if `accountId` is referenced anywhere in `SidebarContainer`'s JSX — if not, remove it too. Clean up all unused props, destructuring, and imports.

Also adjust `SidebarContent` className: currently `mt-5 h-[calc(100%-80px)] overflow-y-auto`. Since the footer is gone, change to `mt-2 flex-1 overflow-y-auto` (sidebar now has full height for content).

**layout.tsx — insert WorkspaceNavbar above Page:**

Import `WorkspaceNavbar` from `~/components/workspace-navbar`.

In `SidebarLayout`, wrap the existing `<SidebarProvider>` content with a flex column so the navbar sits above the sidebar+page area:

```tsx
<SidebarProvider defaultOpen={layoutState.open}>
  <div className="flex h-screen w-full flex-col">
    <WorkspaceNavbar
      account={accountSlug}
      accountId={workspace.currentOrg.org_id}
      accounts={accounts}
      user={user}
      accessLevelId={workspace.currentOrg.access_level_id}
    />
    <div className="flex flex-1 min-h-0">
      <Page style={'sidebar'}>
        <PageNavigation>
          <WorkspaceSidebar
            account={accountSlug}
            navigation={workspace.navigation}
          />
        </PageNavigation>
        <PageMobileNavigation className={'flex items-center justify-between'}>
          <AppLogo />
          <div className={'flex space-x-4'}>
            <MobileNavigation
              userId={user.id}
              accounts={accounts}
              account={accountSlug}
            />
          </div>
        </PageMobileNavigation>
        {props.children}
      </Page>
    </div>
  </div>
</SidebarProvider>
```

Note: `WorkspaceSidebar` props must be updated to match the slimmed-down props interface (after removing user/accounts/accessLevelId from it). Pass only `account` and `navigation`.

Update `WorkspaceSidebar` call in layout to only pass the props that remain after cleanup.

Run `pnpm typecheck` and fix any type errors from prop mismatches.
  </action>
  <verify>
    1. `pnpm typecheck` passes with zero errors.
    2. `pnpm lint:fix` and `pnpm format:fix` complete cleanly.
    3. `pnpm dev` starts without runtime errors.
    4. Navigate to `/home/:account/*` — navbar visible at top with org selector, breadcrumbs, bell, and profile avatar. Sidebar footer absent.
  </verify>
  <done>
    - SidebarFooter removed from workspace-sidebar.tsx, unused props/imports cleaned up.
    - WorkspaceNavbar renders at top of workspace layout above sidebar.
    - Profile dropdown in navbar shows user menu without the OrgSelector section (since accounts/userId not passed).
    - OrgSelector is standalone in navbar left.
    - No TypeScript or lint errors.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client render | Navbar is client-only; no server data exposed beyond what layout already passes |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-kaa-01 | Information Disclosure | OrgSelector (navbar) | accept | Org list already loaded in layout loader; no new data exposure; same data was in sidebar |
| T-kaa-02 | Spoofing | UserProfileDropdown (navbar) | accept | Auth state unchanged; dropdown uses existing useSignOut/useUser hooks with Supabase session |
</threat_model>

<verification>
After both tasks complete:
- `pnpm typecheck` — zero errors
- `pnpm lint:fix` — clean
- `pnpm format:fix` — clean
- Dev server loads workspace route showing navbar with: collapse trigger, org selector, breadcrumbs auto-derived from URL, bell icon, profile avatar
- Sidebar has no footer
- Profile dropdown opens and shows theme toggle + sign out (no org selector section)
</verification>

<success_criteria>
- WorkspaceNavbar component exists at `app/components/workspace-navbar.tsx`
- Navbar renders full-width above sidebar at ~h-12 with border-b
- Left: SidebarTrigger + separator + OrgSelector
- Center: AppBreadcrumbs (route-derived, clickable segments except last)
- Right: Bell icon (no badge) + UserProfileDropdown (avatar trigger only)
- Sidebar footer removed; no UserProfileDropdown in sidebar
- OrgSelector not rendered inside UserProfileDropdown in navbar (accounts/userId props not passed)
- Zero TypeScript errors, zero lint errors
</success_criteria>

<output>
After completion, create `.planning/quick/260402-kaa-add-supabase-style-top-navbar-with-org-s/260402-kaa-SUMMARY.md`
</output>
