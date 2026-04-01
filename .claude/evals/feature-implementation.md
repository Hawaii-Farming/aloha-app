# Agent Evaluation: Full Feature Implementation

This eval tests whether the agent correctly follows Aloha patterns when implementing a complete feature spanning database, API, and UI layers.

## Eval Metadata

- **Type**: Capability eval (target: improvement over time)
- **Complexity**: High (multi-step, multi-file)
- **Expected Duration**: 15-30 minutes
- **Skills Tested**: `/feature-builder`, `/server-action-builder`, `/react-form-builder`, `/postgres-expert`

---

## Task: Implement "Projects" Feature

### Prompt

```
Implement a "Projects" feature for team accounts with the following requirements:

1. Database: Projects table with name, description, status (enum: draft/active/archived), and account_id
2. Server: CRUD actions for projects (create, update, delete, list)
3. UI: Projects list page with create/edit forms
4. Navigation: Add to team sidebar

Use the available skills for guidance. The feature should be accessible at /home/[account]/projects.
```

### Reference Solution Exists

A correct implementation requires:
- 1 schema file
- 1 migration
- 1 Zod schema file
- 1 service file
- 1 route module with loader + action
- 2-3 component files
- Config updates (paths, navigation, translations)

---

## Success Criteria (Grading Rubric)

### 1. Database Layer (25 points)

| Criterion | Points | Grader Type | Pass Condition |
|-----------|--------|-------------|----------------|
| Schema file created in `apps/web/supabase/schemas/` | 3 | Code | File exists with `.sql` extension |
| Table has correct columns | 5 | Code | Contains: id, account_id, name, description, status, created_at |
| RLS enabled | 5 | Code | Contains `enable row level security` |
| Uses helper functions in policies | 5 | Code | Contains `has_role_on_account` OR `has_permission` |
| Permissions revoked/granted correctly | 4 | Code | Contains `revoke all` AND `grant select, insert, update, delete` |
| Status enum created | 3 | Code | Contains `create type` with draft/active/archived |

**Anti-patterns to penalize (-3 each):**
- SECURITY DEFINER without access checks
- Missing `on delete cascade` for account_id FK
- No index on account_id

### 2. Server Layer (25 points)

| Criterion | Points | Grader Type | Pass Condition |
|-----------|--------|-------------|----------------|
| Zod schema in `_lib/schemas/` | 3 | Code | File exists, exports schema with `z.object` |
| Service class pattern used | 5 | Code | Contains `class` with methods, dependency injection via constructor |
| Route action uses `data()` response | 5 | Code | Import from `react-router`, returns `data()` |
| Action validates with Zod `safeParse` | 3 | Code | Contains `.safeParse()` call |
| Action returns error with status code | 3 | Code | Contains `{ status: 400 }` or `{ status: 500 }` |
| Uses `getSupabaseServerClient(request)` | 3 | Code | Passes request to client factory |
| Logging with `getLogger` | 3 | Model | Appropriate logging before/after operations |

**Anti-patterns to penalize (-3 each):**
- Manual auth checks instead of trusting RLS
- `await logger.info()` (logger methods are not promises)
- Business logic in action instead of service
- Using Next.js patterns (enhanceAction, revalidatePath, 'use server')

### 3. UI Layer (25 points)

| Criterion | Points | Grader Type | Pass Condition |
|-----------|--------|-------------|----------------|
| Components in `_components/` directory | 2 | Code | Path contains `_components/` |
| Form uses `react-hook-form` with `zodResolver` | 5 | Code | Imports both, uses `useForm({ resolver: zodResolver() })` |
| No generics on `useForm` | 3 | Code | NOT contains `useForm<` |
| Uses `@aloha/ui/form` components | 4 | Code | Imports `Form, FormField, FormItem, FormLabel, FormControl, FormMessage` |
| Uses `Trans` for strings | 3 | Code | Import from `@aloha/ui/trans`, uses `<Trans i18nKey=` |
| Uses `useFetcher` for mutations | 3 | Code | `const fetcher = useFetcher()` and `fetcher.submit()` or `<fetcher.Form>` |
| Has `data-test` attributes | 3 | Code | Contains `data-test=` on form/buttons |
| Checks `fetcher.state` for loading | 2 | Code | Contains `fetcher.state === 'submitting'` |

**Anti-patterns to penalize (-3 each):**
- `useForm<SomeType>` with explicit generic
- Using `watch()` instead of `useWatch`
- Hardcoded strings without `Trans`
- Missing `FormMessage` for error display
- Using `useAction` from `next-safe-action` (wrong framework)

### 4. Integration & Navigation (15 points)

| Criterion | Points | Grader Type | Pass Condition |
|-----------|--------|-------------|----------------|
| Route module in correct location | 3 | Code | Path is under `app/routes/home/account/projects/` |
| Exports `loader` and `action` | 3 | Code | Contains `export async function loader` and `export async function action` |
| Default export receives `loaderData` | 3 | Code | Contains `loaderData` in component props |
| Nav item added to team config | 3 | Code | Entry in navigation config |
| Translation key added | 3 | Code | Entry in locales JSON |

### 5. Code Quality (10 points)

| Criterion | Points | Grader Type | Pass Condition |
|-----------|--------|-------------|----------------|
| TypeScript compiles | 5 | Code | `pnpm typecheck` exits 0 |
| Lint passes | 3 | Code | `pnpm lint:fix` exits 0 |
| Format passes | 2 | Code | `pnpm format:fix` exits 0 |

---

## Grader Implementation

### Code-Based Grader (Automated)

```typescript
interface EvalResult {
  score: number;
  maxScore: number;
  passed: boolean;
  details: {
    criterion: string;
    points: number;
    maxPoints: number;
    evidence: string;
  }[];
  antiPatterns: string[];
}

async function gradeFeatureImplementation(): Promise<EvalResult> {
  const details = [];
  const antiPatterns = [];

  // 1. Check schema file
  const schemaFiles = glob('apps/web/supabase/schemas/*project*.sql');
  const schemaContent = schemaFiles.length > 0 ? read(schemaFiles[0]) : '';

  details.push({
    criterion: 'Schema file exists',
    points: schemaFiles.length > 0 ? 3 : 0,
    maxPoints: 3,
    evidence: schemaFiles[0] || 'No schema file found'
  });

  details.push({
    criterion: 'RLS enabled',
    points: schemaContent.includes('enable row level security') ? 5 : 0,
    maxPoints: 5,
    evidence: 'Checked for RLS statement'
  });

  // Check anti-patterns
  if (schemaContent.includes('security definer') &&
      !schemaContent.includes('has_permission') &&
      !schemaContent.includes('is_account_owner')) {
    antiPatterns.push('SECURITY DEFINER without access validation');
  }

  // 2. Check route module
  const routeFiles = glob('apps/web/app/routes/**/projects/**/route.tsx');
  const routeContent = routeFiles.length > 0 ? read(routeFiles[0]) : '';

  details.push({
    criterion: 'Uses data() response',
    points: routeContent.includes('data(') && routeContent.includes('react-router') ? 5 : 0,
    maxPoints: 5,
    evidence: 'Checked for data() import and usage from react-router'
  });

  // Check for Next.js anti-patterns
  if (routeContent.includes('enhanceAction') || routeContent.includes("'use server'")) {
    antiPatterns.push('Using Next.js patterns (enhanceAction or use server directive)');
  }

  // 3. Check UI files
  const componentFiles = glob('apps/web/app/routes/**/projects/_components/*.tsx');
  const formContent = componentFiles.map(f => read(f)).join('\n');

  details.push({
    criterion: 'No generics on useForm',
    points: !formContent.includes('useForm<') ? 3 : 0,
    maxPoints: 3,
    evidence: 'Checked for useForm<Type> pattern'
  });

  details.push({
    criterion: 'Uses useFetcher',
    points: formContent.includes('useFetcher') ? 3 : 0,
    maxPoints: 3,
    evidence: 'Checked for useFetcher usage'
  });

  if (formContent.includes('useForm<')) {
    antiPatterns.push('Explicit generic on useForm (should use zodResolver inference)');
  }

  if (formContent.includes('useAction') && formContent.includes('next-safe-action')) {
    antiPatterns.push('Using next-safe-action (wrong framework -- use useFetcher)');
  }

  // 5. Run verification
  const typecheckResult = await exec('pnpm typecheck');
  details.push({
    criterion: 'TypeScript compiles',
    points: typecheckResult.exitCode === 0 ? 5 : 0,
    maxPoints: 5,
    evidence: `Exit code: ${typecheckResult.exitCode}`
  });

  // Calculate totals
  const score = details.reduce((sum, d) => sum + d.points, 0);
  const maxScore = details.reduce((sum, d) => sum + d.maxPoints, 0);
  const penaltyPoints = antiPatterns.length * 3;

  return {
    score: Math.max(0, score - penaltyPoints),
    maxScore,
    passed: (score - penaltyPoints) >= maxScore * 0.8, // 80% threshold
    details,
    antiPatterns
  };
}
```

### Model-Based Grader (For Nuanced Criteria)

```
You are evaluating an AI agent's implementation of a "Projects" feature in an Aloha application using React Router 7.

Review the following files and assess:

1. **Logging Quality** (0-3 points):
   - Are log messages descriptive and include relevant context (projectId)?
   - Is logging done before AND after important operations?
   - Are error cases logged with appropriate severity?

2. **Code Organization** (0-3 points):
   - Is business logic in services, not route actions?
   - Are files in the correct directories per Aloha conventions?
   - Is there appropriate separation of concerns?

3. **Error Handling** (0-3 points):
   - Are errors handled gracefully?
   - Does the UI show appropriate error states?
   - Are `data()` responses returned with correct status codes?

Provide a score for each criterion with brief justification.
```

---

## Trial Configuration

```yaml
trials: 3  # Run 3 times to account for non-determinism
pass_threshold: 0.8  # 80% of max score
metrics:
  - pass@1: "Passes on first attempt"
  - pass@3: "Passes at least once in 3 attempts"
  - pass^3: "Passes all 3 attempts (reliability)"
```

---

## Environment Setup

Before each trial:
1. Reset to clean git state: `git checkout -- .`
2. Ensure Supabase types are current: `pnpm supabase:web:typegen`
3. Verify clean typecheck: `pnpm typecheck`

After each trial:
1. Capture transcript (full conversation)
2. Capture outcome (files created/modified)
3. Run graders
4. Reset environment

---

## Expected Failure Modes

Document these to distinguish agent errors from eval problems:

| Failure | Likely Cause | Is Eval Problem? |
|---------|--------------|------------------|
| Missing RLS | Agent didn't follow postgres-expert skill | No |
| `useForm<Type>` | Agent ignored react-form-builder guidance | No |
| Wrong file path | Ambiguous task description | Maybe - clarify paths |
| Typecheck fails on unrelated code | Existing codebase issue | Yes - fix baseline |
| Agent uses different but valid approach | Eval too prescriptive | Yes - grade outcome not path |
| Uses Next.js patterns | Agent confused frameworks | No - critical failure |

---

## Iteration Log

Track eval refinements here:

| Date | Change | Reason |
|------|--------|--------|
| Initial | Created eval adapted for React Router 7 | - |
| | | |

---

## Notes

- **Grade outcomes, not paths**: If agent creates a working feature with slightly different file organization, that's acceptable
- **Partial credit**: A feature missing navigation but with working CRUD is still valuable
- **Read transcripts**: When scores are low, check if agent attempted to use skills or ignored them entirely
- **React Router 7 compliance is critical**: Any use of Next.js patterns (enhanceAction, 'use server', revalidatePath, next-safe-action) is a major penalty
