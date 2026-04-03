---
phase: quick
plan: 260402-wds
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/navbar-search.tsx
  - app/components/workspace-navbar.tsx
autonomous: true
must_haves:
  truths:
    - "Search trigger button visible in navbar right section"
    - "Clicking trigger or pressing Cmd+K opens command dialog"
    - "Dialog closes on Escape or clicking outside"
    - "Search input is focused when dialog opens"
  artifacts:
    - path: "app/components/navbar-search.tsx"
      provides: "Search trigger button and command dialog"
    - path: "app/components/workspace-navbar.tsx"
      provides: "Navbar with search integrated"
  key_links:
    - from: "app/components/workspace-navbar.tsx"
      to: "app/components/navbar-search.tsx"
      via: "NavbarSearch component import"
---

<objective>
Add a Supabase-style search bar trigger to the workspace navbar right section.

Purpose: Provide a command palette search experience (Cmd+K) matching Supabase's design -- a compact pill-shaped button in the navbar that opens a cmdk-powered command dialog.
Output: NavbarSearch component integrated into the navbar between breadcrumbs and AI button.
</objective>

<execution_context>
@.planning/quick/260402-wds-add-search-bar-supabase-style-to-nav-bar/260402-wds-PLAN.md
</execution_context>

<context>
@app/components/workspace-navbar.tsx
@packages/ui/src/shadcn/command.tsx
@packages/ui/src/shadcn/kbd.tsx

<interfaces>
From @aloha/ui/command:
```typescript
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator };
```

From @aloha/ui/kbd:
```typescript
export { Kbd, KbdGroup };
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create NavbarSearch component</name>
  <files>app/components/navbar-search.tsx</files>
  <action>
Create `app/components/navbar-search.tsx` with a Supabase-style search trigger and command dialog.

The trigger button:
- Pill-shaped button styled like Supabase's search bar: `border border-border bg-muted/50 hover:bg-muted` rounded-md
- Contains a Search icon (from lucide-react), placeholder text "Search..." in muted-foreground, and a Kbd showing the platform shortcut (Cmd+K on Mac, Ctrl+K elsewhere)
- Approximate width: `w-56` or similar to look proportional in the navbar
- Height should match other navbar items: `h-7` or `h-8`
- Use `text-xs` or `text-sm` for the placeholder text, `text-muted-foreground`

The command dialog:
- Use `CommandDialog` from `@aloha/ui/command` for the overlay
- State: single `useState` boolean `open` controlling dialog visibility
- Keyboard shortcut: Register a keydown listener (in a useEffect -- justified here for global keyboard shortcut) that toggles open on Cmd+K (Mac) or Ctrl+K (other). Prevent default browser behavior.
- Inside dialog: `CommandInput` with placeholder "Type a command or search...", `CommandList` with `CommandEmpty` showing "No results found.", and one `CommandGroup` heading "Suggestions" with a few placeholder `CommandItem` entries (e.g. "Dashboard", "Settings", "Modules") -- these are static for now as real search integration comes later.
- Import `Search` icon from `lucide-react`.
- Import `Kbd` from `@aloha/ui/kbd`.
- Import `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem` from `@aloha/ui/command`.
- Export named: `export function NavbarSearch()`
- Add `data-test="navbar-search-trigger"` to the trigger button.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm typecheck</automated>
  </verify>
  <done>NavbarSearch component exists, renders a pill-shaped search trigger with Cmd+K shortcut hint, opens a command dialog on click or keyboard shortcut.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate NavbarSearch into workspace navbar</name>
  <files>app/components/workspace-navbar.tsx</files>
  <action>
In `app/components/workspace-navbar.tsx`:

1. Import `NavbarSearch` from `~/components/navbar-search`.
2. Add `<NavbarSearch />` in the right section div (the one with `flex shrink-0 items-center gap-3`), placing it BEFORE the `<AiChatButton />` so the order is: NavbarSearch, AiChatButton, UserProfileDropdown.

No other changes to the navbar component.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm typecheck</automated>
  </verify>
  <done>Search trigger appears in navbar right section between breadcrumbs and AI button. Clicking it or pressing Cmd+K opens the command palette dialog.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No trust boundaries crossed -- purely client-side UI component with no data fetching or user input processing.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | I (Info Disclosure) | navbar-search.tsx | accept | No sensitive data displayed; placeholder items only |
</threat_model>

<verification>
- `pnpm typecheck` passes
- `pnpm dev` -- navbar shows search pill on right side
- Clicking search pill opens command dialog
- Cmd+K (Mac) or Ctrl+K opens command dialog
- Escape closes dialog
</verification>

<success_criteria>
Supabase-style search trigger visible in navbar right section with keyboard shortcut hint, opening a command palette dialog on click or Cmd+K.
</success_criteria>

<output>
After completion, create `.planning/quick/260402-wds-add-search-bar-supabase-style-to-nav-bar/260402-wds-SUMMARY.md`
</output>
