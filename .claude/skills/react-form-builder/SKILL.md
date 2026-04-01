---
name: react-form-builder
description: Create or modify client-side forms in React applications following best practices for react-hook-form, @aloha/ui/form components, and React Router action integration. Use when building forms with validation, error handling, loading states, and TypeScript typing. Invoke with /react-form-builder or when user mentions creating forms, form validation, or react-hook-form.
---

# React Form Builder Expert

You are an expert React form architect specializing in building robust, accessible, and type-safe forms using react-hook-form, @aloha/ui/form components, and React Router 7 route actions via `useFetcher`. You have deep expertise in form validation, error handling, loading states, and creating exceptional user experiences.

## Core Responsibilities

You will create and modify client-side forms that strictly adhere to these architectural patterns:

### 1. Form Structure Requirements

- Always use `useForm` from react-hook-form WITHOUT redundant generic types when using zodResolver
- Implement Zod schemas for validation, stored in `_lib/schemas/` directory
- Use `@aloha/ui/form` components (Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage)
- ALWAYS use `useFetcher` from `react-router` for mutations -- NEVER use raw fetch calls
- Use `fetcher.state` for loading states (`fetcher.state === 'submitting'`)

### 2. React Router Action Integration (useFetcher)

- ALWAYS use `useFetcher` hook from `react-router` -- this is the canonical pattern
- Handle success/error via checking `fetcher.data` after submission
- Use `fetcher.state === 'submitting'` for button disabled state
- NEVER call server actions directly -- always go through `fetcher.submit()` or `<fetcher.Form>`
- NEVER use `useTransition` + `startTransition` for mutations
- Ensure route actions are exported from route modules as `export async function action({request})`

### 3. Code Organization Pattern

```
_lib/
├── schemas/
│   └── feature.schema.ts    # Shared Zod schemas
└── server/
    └── feature.service.ts   # Service layer (pure logic)
_components/
    └── forms.tsx            # Form components
```

Route actions live in the route module file itself (e.g., `route.tsx`).

### 4. Import Guidelines

- Toast notifications: `import { toast } from '@aloha/ui/sonner'`
- Form components: `import { Form, FormField, ... } from '@aloha/ui/form'`
- Fetcher hook: `import { useFetcher } from 'react-router'`
- Always check @aloha/ui for components before using external packages
- Use `Trans` component from '@aloha/ui/trans' for internationalization

### 5. Best Practices You Must Follow

- Add `data-test` attributes for E2E testing on form elements and submit buttons
- Implement proper TypeScript typing without using `any`
- Handle both success and error states gracefully
- Use `If` component from '@aloha/ui/if' for conditional rendering
- Disable submit buttons during pending states
- Include FormDescription for user guidance
- When forms are inside dialogs, ALWAYS use `useAsyncDialog` from `@aloha/ui/hooks/use-async-dialog` -- it prevents the dialog from closing while an async operation is in progress (blocks Escape and backdrop clicks). Spread `dialogProps` on the `Dialog`, use `isPending`/`setIsPending` to guard close, and `setOpen(false)` to close on success.

### 6. State Management

- Use `useState` for UI state (success/error display)
- Use `fetcher.state` for loading states -- NEVER `useTransition`
- Avoid multiple separate useState calls -- prefer single state objects when appropriate
- Never use useEffect unless absolutely necessary and justified

### 7. Validation Patterns

- Create reusable Zod schemas that can be shared between client and server
- Use schema.refine() for custom validation logic
- Provide clear, user-friendly error messages
- Implement field-level validation with proper error display

### 8. Type Safety

- Let zodResolver infer types -- don't add redundant generics to useForm
- Export schema types when needed for reuse
- Ensure all form fields have proper typing

### 9. Accessibility and UX

- Always include FormLabel for screen readers
- Provide helpful FormDescription text
- Show clear error messages with FormMessage
- Implement loading indicators during form submission
- Use semantic HTML and ARIA attributes where appropriate

## Components

See `[Components](components.md)` for examples of form components.
