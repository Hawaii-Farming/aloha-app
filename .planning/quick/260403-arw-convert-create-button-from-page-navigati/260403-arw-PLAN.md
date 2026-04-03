---
phase: quick
plan: 260403-arw
type: execute
wave: 1
depends_on: []
files_modified:
  - app/routes/workspace/sub-module.tsx
  - app/components/crud/create-panel.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Create button opens a slide-in Sheet panel from the right instead of navigating to /create"
    - "Form inside the panel renders all CRUD config fields correctly including FK fields"
    - "Submitting the form creates the record and refreshes the table data"
    - "Panel closes on successful submission"
    - "Existing /create route still works as fallback"
  artifacts:
    - path: "app/components/crud/create-panel.tsx"
      provides: "Sheet-based create form panel component"
    - path: "app/routes/workspace/sub-module.tsx"
      provides: "Updated sub-module page with Sheet trigger instead of Link"
  key_links:
    - from: "app/components/crud/create-panel.tsx"
      to: "sub-module-create action"
      via: "fetcher.submit with method POST to ./create"
      pattern: "fetcher\\.submit.*create"
    - from: "app/routes/workspace/sub-module.tsx"
      to: "app/components/crud/create-panel.tsx"
      via: "CreatePanel component rendered with open state"
      pattern: "CreatePanel"
---

<objective>
Convert the Create button from a page navigation (`Link to="create"`) to a slide-in Sheet panel from the right side, following the same pattern as the AI chat panel. The form should be well-laid-out inside the panel using the existing CRUD config, and submission should POST to the existing create route action.

Purpose: Better UX -- users stay on the list page while creating records, matching the panel pattern already established by the AI chat.
Output: A reusable `CreatePanel` component and updated sub-module page.
</objective>

<context>
@app/routes/workspace/sub-module.tsx
@app/routes/workspace/sub-module-create.tsx
@app/components/ai/ai-chat-panel.tsx
@app/components/ai/ai-chat-provider.tsx
@app/lib/crud/types.ts
@app/lib/crud/render-form-field.tsx
@app/lib/crud/workflow-helpers.ts
@app/lib/crud/registry.ts

<interfaces>
From app/lib/crud/types.ts:
```typescript
export interface CrudModuleConfig<TSchema extends z.ZodType = z.ZodType> {
  tableName: string;
  pkType: 'text' | 'uuid';
  pkColumn?: string;
  orgScoped: boolean;
  views: { list: string; detail: string };
  columns: ColumnConfig[];
  search?: SearchConfig;
  filters?: FilterConfig[];
  formFields: FormFieldConfig[];
  workflow?: WorkflowConfig;
  schema: TSchema;
}
```

From app/lib/crud/render-form-field.tsx:
```typescript
export function renderFormField({
  field, control, mode, pkColumn, fkOptions,
}: RenderFormFieldParams): React.ReactNode | null;
```

From app/lib/crud/workflow-helpers.ts:
```typescript
export function buildDefaultValues(
  fields: FormFieldConfig[],
  record: Record<string, unknown> | null,
): Record<string, unknown>;
```

From sub-module.tsx loader (already returns):
```typescript
{ config, moduleAccess, subModuleAccess, accountSlug, tableData }
```

From sub-module-create.tsx loader (loads FK options):
```typescript
// FK options loaded server-side by querying fkTable for each fk field
fkOptions: Record<string, Array<{ value: string; label: string }>>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add FK options to sub-module loader and create the CreatePanel component</name>
  <files>app/routes/workspace/sub-module.tsx, app/components/crud/create-panel.tsx</files>
  <action>
**Step A -- Add fkOptions loading to sub-module.tsx loader:**

In the `loader` function of `sub-module.tsx`, after getting `config`, add the same FK options loading logic from `sub-module-create.tsx` (lines 93-114). Load FK field options by iterating `config?.formFields`, filtering for `type === 'fk'`, and querying each `fkTable` for `id` and `fkLabelColumn` scoped to `orgId = accountSlug` and `is_deleted = false`. Return `fkOptions` alongside the existing return values.

Import `SupabaseClient` type from `@supabase/supabase-js` (same as sub-module-create.tsx does).

**Step B -- Create `app/components/crud/create-panel.tsx`:**

Create a new component following the AI chat panel pattern (`ai-chat-panel.tsx`). Structure:

```
interface CreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CrudModuleConfig | undefined;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  subModuleDisplayName: string;
}
```

Component implementation:
- Use shadcn `Sheet` with `side="right"` and `SheetContent` with class `flex h-full w-3/4 flex-col sm:max-w-lg` (slightly wider than AI panel's sm:max-w-md for form fields).
- `SheetHeader` with `SheetTitle` showing `Create {subModuleDisplayName}`.
- Main content area: scrollable `div` with `className="flex-1 overflow-y-auto p-6"`.
- Inside, use `react-hook-form` with `zodResolver` using `config.schema` (fall back to a basic name+description schema if no config).
- Use `buildDefaultValues` from `~/lib/crud/workflow-helpers` with `null` record for create mode defaults.
- Render fields using `renderFormField` from `~/lib/crud/render-form-field` iterating `config.formFields`, passing `mode: 'create'`, `pkColumn: config.pkColumn ?? 'id'`, and `fkOptions`.
- Include `AiFormAssist` at the top of the form (same as sub-module-create.tsx).
- Footer area: sticky bottom with border-t, containing Submit and Cancel buttons.
- Use `useFetcher` from `react-router`. On submit, call `fetcher.submit(data, { method: 'POST', action: 'create', encType: 'application/json' })`. The `action: 'create'` ensures it POSTs to the existing `sub-module-create` route action.
- Track `fetcher.state !== 'idle'` for loading state on submit button.
- On successful response (fetcher.data with no error, fetcher.state back to idle): call `onOpenChange(false)` to close the panel, and use `useRevalidator` from `react-router` to refresh table data.
- On error response: show toast via `sonner`.
- Add `data-test="create-panel"` on the SheetContent and `data-test="create-panel-form"` on the form.
- Wrap the `Form` component from `@aloha/ui/form` around the form element (same pattern as sub-module-create.tsx).

**Step C -- Update sub-module.tsx component:**

1. Remove the `Link` import (if no longer used elsewhere -- check first, it is not used elsewhere in this file).
2. Add state: `const [createOpen, setCreateOpen] = useState(false)` (import `useState` -- already imported from React).
3. Replace the `actionSlot` content: change from `<Button asChild><Link to="create">` to `<Button size="sm" variant="brand" onClick={() => setCreateOpen(true)}>` with the same Plus icon and Trans content (remove `asChild` since it is no longer wrapping a Link).
4. After the closing `</PageBody>` tag (but inside the fragment), render `<CreatePanel open={createOpen} onOpenChange={setCreateOpen} config={config} fkOptions={fkOptions} subModuleDisplayName={subModuleAccess.display_name} />`.
5. Destructure `fkOptions` from `props.loaderData`.
6. Import `CreatePanel` from `~/components/crud/create-panel`.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm typecheck 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Create button opens a Sheet panel from the right instead of navigating away
    - Panel contains the full CRUD create form with all fields from config
    - FK combobox fields are populated with server-loaded options
    - Form submission POSTs to the existing create route action
    - Panel closes on success and table data refreshes
    - Existing /create route still works independently
    - TypeScript compiles without errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Create button now opens a slide-in Sheet panel from the right with the full create form inside, instead of navigating to a separate page.</what-built>
  <how-to-verify>
    1. Run `pnpm dev` and navigate to any sub-module list page (e.g., HR > Employees)
    2. Click the green "Create" button -- a Sheet panel should slide in from the right
    3. Verify the form fields render correctly inside the panel, well-laid-out with proper spacing
    4. If there are FK fields (e.g., department), verify the combobox loads options
    5. Fill in the form and submit -- record should be created, panel should close, table should refresh with new record
    6. Verify the /create route still works by navigating directly to it in the URL bar
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `pnpm typecheck` passes
- Create button opens Sheet panel instead of navigating
- Form renders all CRUD config fields correctly
- FK options load and display in comboboxes
- Form submission creates record via existing action
- Table refreshes after successful creation
- Existing /create route still functional
</verification>

<success_criteria>
The Create button opens a right-side Sheet panel containing a well-laid-out form. Users can create records without leaving the list page. The panel follows the same visual pattern as the AI chat panel.
</success_criteria>

<output>
After completion, create `.planning/quick/260403-arw-convert-create-button-from-page-navigati/260403-arw-SUMMARY.md`
</output>
