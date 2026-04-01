# Inline Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inline 8 packages into ``, keeping only `@aloha/ui`, `@aloha/mcp-server`, and `tooling/` as separate packages.

**Architecture:** Bottom-up inlining — move leaf packages first (no dependents), then work up the dependency chain. Each task moves files, rewrites imports, deletes the package, and verifies typecheck. Unused template hooks/files are dropped during the move.

**Tech Stack:** React Router 7, Supabase, TypeScript, Turborepo

---

## Dependency Order

```
i18n (leaf)         ──┐
csrf (leaf)         ──┤
database-webhooks   ──┤──→ shared ──→ supabase ──→ auth ──→ ai ──→ cleanup
```

Packages inlined in dependency order: i18n, csrf, webhooks can go in parallel. Then shared. Then supabase (depends on shared). Then auth (imports supabase). Then ai (imports ui, which stays). Final cleanup.

---

## Task 1: Inline @aloha/i18n

`packages/i18n/` has 6 files. `lib/i18n/` already exists with locales and settings. Merge the package files into the existing dir.

**Files:**
- Move: `packages/i18n/src/create-i18n-settings.ts` → `lib/i18n/create-i18n-settings.ts`
- Move: `packages/i18n/src/i18n-client.ts` → `lib/i18n/i18n-client.ts`
- Move: `packages/i18n/src/i18n-provider.tsx` → `lib/i18n/i18n-provider.tsx`
- Move: `packages/i18n/src/i18n-server.ts` → merge into existing `lib/i18n/i18n.server.ts`
- Move: `packages/i18n/src/parse-language-header.ts` → `lib/i18n/parse-language-header.ts`
- Skip: `packages/i18n/src/index.ts` (barrel export, not needed)
- Delete: `packages/i18n/` (entire directory after moves)
- Modify: `package.json` — remove `@aloha/i18n`

- [ ] **Step 1: Copy source files into lib/i18n/**

```bash
cp packages/i18n/src/create-i18n-settings.ts lib/i18n/
cp packages/i18n/src/i18n-client.ts lib/i18n/
cp packages/i18n/src/i18n-provider.tsx lib/i18n/
cp packages/i18n/src/parse-language-header.ts lib/i18n/
```

- [ ] **Step 2: Merge i18n-server.ts**

Read both `packages/i18n/src/i18n-server.ts` and `lib/i18n/i18n.server.ts`. The package file has the generic `createI18nServerInstance` function. The app file likely wraps it with app-specific config. Merge them into one file at `lib/i18n/i18n.server.ts` — the app file should import from the local files instead of `@aloha/i18n/server`.

- [ ] **Step 3: Update internal imports in moved files**

In each moved file, replace `@aloha/i18n` internal imports with relative paths. E.g., if `i18n-server.ts` imports from `./create-i18n-settings`, that already works.

- [ ] **Step 4: Update all consumer imports**

Search and replace across the codebase:
- `@aloha/i18n/server` → `~/lib/i18n/i18n.server` (or the merged equivalent)
- `@aloha/i18n/client` → `~/lib/i18n/i18n-client`
- `@aloha/i18n/provider` → `~/lib/i18n/i18n-provider`
- `@aloha/i18n` (bare) → `~/lib/i18n/create-i18n-settings` (check what's actually imported)

Files to check: `components/root-providers.tsx`, `lib/i18n/i18n.server.ts`, `lib/i18n/i18n.settings.ts`

- [ ] **Step 5: Remove from package.json, delete package, pnpm install**

Remove `"@aloha/i18n": "workspace:*"` from `package.json`.
```bash
rm -rf packages/i18n
pnpm install
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: inline @aloha/i18n into lib/i18n"
```

---

## Task 2: Inline @aloha/csrf

`packages/utils/csrf/` has 10 files in client/server/schema dirs. Move to `lib/csrf/`.

**Files:**
- Create: `lib/csrf/` directory
- Move: all files from `packages/utils/csrf/src/client/` → `lib/csrf/client/`
- Move: all files from `packages/utils/csrf/src/server/` → `lib/csrf/server/`
- Move: all files from `packages/utils/csrf/src/schema/` → `lib/csrf/schema/`
- Delete: `packages/utils/csrf/` (then `packages/utils/` if empty)
- Modify: `package.json` — remove `@aloha/csrf`

- [ ] **Step 1: Copy files**

```bash
mkdir -p lib/csrf/client lib/csrf/server lib/csrf/schema
cp packages/utils/csrf/src/client/*.ts packages/utils/csrf/src/client/*.tsx lib/csrf/client/
cp packages/utils/csrf/src/server/*.ts lib/csrf/server/
cp packages/utils/csrf/src/schema/*.ts lib/csrf/schema/
```

- [ ] **Step 2: Update imports in moved files**

Check for internal cross-references between client/server/schema dirs. Update relative paths if needed.

Also check if any csrf files import from `@aloha/shared` — if so, update to `~/lib/shared/...` (shared hasn't been inlined yet, so for now keep the `@aloha/shared` import — it will be fixed in Task 4).

- [ ] **Step 3: Update consumer imports**

Replace across codebase:
- `@aloha/csrf/client` → `~/lib/csrf/client`
- `@aloha/csrf/server` → `~/lib/csrf/server`
- `@aloha/csrf/schema` → `~/lib/csrf/schema`

Files to check: `app/root.tsx`, `app/routes/workspace/settings.tsx`

- [ ] **Step 4: Remove from package.json, delete package, pnpm install**

```bash
rm -rf packages/utils/csrf
rmdir packages/utils 2>/dev/null  # remove if empty
pnpm install
```

Remove `"@aloha/csrf": "workspace:*"` from `package.json`.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add -A && git commit -m "refactor: inline @aloha/csrf into lib/csrf"
```

---

## Task 3: Inline @aloha/database-webhooks

7 files. Move to `lib/webhooks/`.

**Files:**
- Create: `lib/webhooks/`
- Move: `packages/database-webhooks/src/server/` contents → `lib/webhooks/`
- Skip: `packages/database-webhooks/src/index.ts` (barrel)
- Delete: `packages/database-webhooks/`
- Modify: `package.json` — remove `@aloha/database-webhooks`

- [ ] **Step 1: Copy files (flatten the server/ nesting)**

```bash
mkdir -p lib/webhooks
cp packages/database-webhooks/src/server/record-change.type.ts lib/webhooks/
cp packages/database-webhooks/src/server/services/database-webhook-handler.service.ts lib/webhooks/
cp packages/database-webhooks/src/server/services/database-webhook-router.service.ts lib/webhooks/
cp packages/database-webhooks/src/server/services/verifier/database-webhook-verifier.service.ts lib/webhooks/
cp packages/database-webhooks/src/server/services/verifier/postgres-database-webhook-verifier.service.ts lib/webhooks/
```

Skip the barrel `index.ts` files — update imports to point directly to files.

- [ ] **Step 2: Update internal imports**

The moved files have relative imports like `../../record-change.type`. Update to flat relative paths since everything is now in `lib/webhooks/`.

Also replace any `@aloha/shared/logger` imports with `~/lib/shared/logger` (will be fixed fully in Task 4, but use the target path).

- [ ] **Step 3: Update consumer imports**

In `app/routes/api/db/webhook.ts`, replace `@aloha/database-webhooks` import with `~/lib/webhooks/...` (point to the specific file that was the barrel export).

- [ ] **Step 4: Remove from package.json, delete package, pnpm install**

```bash
rm -rf packages/database-webhooks
pnpm install
```

Remove `"@aloha/database-webhooks": "workspace:*"` from `package.json`.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add -A && git commit -m "refactor: inline @aloha/database-webhooks into lib/webhooks"
```

---

## Task 4: Inline @aloha/shared

7 files (after earlier slimming). Move to `lib/shared/`.

**Files:**
- Create: `lib/shared/`
- Move: `packages/shared/src/logger/` → `lib/shared/logger/`
- Move: `packages/shared/src/hooks/` → `lib/shared/hooks/`
- Move: `packages/shared/src/utils.ts` → `lib/shared/utils.ts`
- Delete: `packages/shared/`
- Modify: `package.json` — remove `@aloha/shared`

- [ ] **Step 1: Copy files**

```bash
mkdir -p lib/shared/logger/impl lib/shared/hooks
cp packages/shared/src/logger/*.ts lib/shared/logger/
cp packages/shared/src/logger/impl/*.ts lib/shared/logger/impl/
cp packages/shared/src/hooks/*.ts lib/shared/hooks/
cp packages/shared/src/utils.ts lib/shared/
```

- [ ] **Step 2: Update all consumer imports**

Replace across entire codebase:
- `@aloha/shared/logger` → `~/lib/shared/logger`
- `@aloha/shared/utils` → `~/lib/shared/utils`
- `@aloha/shared/hooks` → `~/lib/shared/hooks`

Files to check:
- `app/routes/auth/sign-in.tsx` (uses `getSafeRedirectPath` from utils)
- `app/routes/auth/update-password.tsx`
- `lib/chats/.server/chat-llm.service.ts`
- `lib/chats/.server/chat-messages.service.ts`
- `lib/webhooks/database-webhook-handler.service.ts` (moved in Task 3)
- `packages/supabase/src/auth-callback.service.server.ts` (still a package — will be inlined in Task 5, use `~/lib/shared/...` target path)
- `packages/supabase/src/hooks/use-link-identity-with-provider.ts` (same)

For packages/supabase imports: update them to `~/lib/shared/...` now. They'll break temporarily since supabase is still a package with its own tsconfig. That's OK — Task 5 moves supabase into apps/web where `~/` works.

Actually, this creates a problem: `packages/supabase` can't resolve `~/` paths. Instead, for the 2 files in packages/supabase that import from @aloha/shared, just inline the specific functions directly (they're small utility functions) or leave the import as a relative path to where shared will be after Task 5 moves supabase.

**Better approach:** In the 2 supabase files that import @aloha/shared, copy the needed code inline (it's just `getSafeRedirectPath` — a one-liner, and the logger). This avoids cross-package import issues. Task 5 will clean this up when supabase moves into apps/web.

- [ ] **Step 3: Remove from package.json, delete package, pnpm install**

```bash
rm -rf packages/shared
pnpm install
```

Remove `"@aloha/shared": "workspace:*"` from `package.json`.

- [ ] **Step 4: Typecheck and commit**

```bash
pnpm typecheck
git add -A && git commit -m "refactor: inline @aloha/shared into lib/shared"
```

---

## Task 5: Inline @aloha/supabase

28 files, but 10 hooks are unused (MFA, OTP, identity linking, sign-up). Move used files to `lib/supabase/`, drop unused hooks.

**Hooks to keep (8):**
- `use-auth-change-listener.ts`
- `use-request-reset-password.ts`
- `use-sign-in-with-email-password.ts`
- `use-sign-in-with-provider.ts`
- `use-sign-out.ts`
- `use-supabase.ts`
- `use-update-user-mutation.ts`
- `use-user.ts`

**Hooks to delete (10):**
- `use-fetch-mfa-factors.ts`
- `use-link-identity-with-email-password.ts`
- `use-link-identity-with-provider.ts`
- `use-sign-in-with-otp.ts`
- `use-sign-up-with-email-password.ts`
- `use-unlink-identity.ts`
- `use-unlink-user-identity.ts`
- `use-user-factors-mutation-key.ts`
- `use-user-identities.ts`
- `use-verify-otp.ts`

**Other files to keep:**
- `clients/server-client.server.ts`
- `clients/server-admin-client.server.ts`
- `clients/browser-client.ts`
- `require-user.ts`
- `auth.ts` (used by callback route)
- `database.types.ts`
- `get-supabase-client-keys.ts`
- `get-service-role-key.ts`

**Files to delete (unused after simplification):**
- `check-requires-mfa.ts` (MFA removed)
- `auth-callback.service.server.ts` (0 imports found)

**Existing file:** `lib/database.types.ts` already exists — this is a duplicate of `packages/supabase/src/database.types.ts`. Keep the one in lib/ and make sure supabase client files reference it.

- [ ] **Step 1: Create directories and copy kept files**

```bash
mkdir -p lib/supabase/clients lib/supabase/hooks
cp packages/supabase/src/clients/server-client.server.ts lib/supabase/clients/
cp packages/supabase/src/clients/server-admin-client.server.ts lib/supabase/clients/
cp packages/supabase/src/clients/browser-client.ts lib/supabase/clients/
cp packages/supabase/src/require-user.ts lib/supabase/
cp packages/supabase/src/auth.ts lib/supabase/
cp packages/supabase/src/get-supabase-client-keys.ts lib/supabase/
cp packages/supabase/src/get-service-role-key.ts lib/supabase/
```

Copy only the 8 kept hooks:
```bash
for hook in use-auth-change-listener use-request-reset-password use-sign-in-with-email-password use-sign-in-with-provider use-sign-out use-supabase use-update-user-mutation use-user; do
  cp "packages/supabase/src/hooks/${hook}.ts" lib/supabase/hooks/
done
```

- [ ] **Step 2: Update internal imports in moved files**

In each moved file:
- Replace `@aloha/shared/logger` → `~/lib/shared/logger`
- Replace `@aloha/shared/utils` → `~/lib/shared/utils`
- Replace internal relative imports to point to new locations
- The `database.types.ts` import: update to `~/lib/database.types` (existing file)

- [ ] **Step 3: Update all consumer imports across codebase**

This is the biggest change. Replace everywhere:
- `@aloha/supabase/server-client` → `~/lib/supabase/clients/server-client.server`
- `@aloha/supabase/server-admin-client` → `~/lib/supabase/clients/server-admin-client.server`
- `@aloha/supabase/browser-client` → `~/lib/supabase/clients/browser-client`
- `@aloha/supabase/require-user` → `~/lib/supabase/require-user`
- `@aloha/supabase/auth` → `~/lib/supabase/auth`
- `@aloha/supabase/database` → `~/lib/database.types` (already exists)
- `@aloha/supabase/hooks/use-supabase` → `~/lib/supabase/hooks/use-supabase`
- `@aloha/supabase/hooks/use-sign-out` → `~/lib/supabase/hooks/use-sign-out`
- (etc. for each hook pattern)

Files to update: ~20 files in  routes, components, lib, plus files in packages/features/auth/ and packages/features/ai/ (which will be inlined in Tasks 6-7 — update them now to use `~/lib/supabase/...` since they'll be in  by the time they run).

- [ ] **Step 4: Remove from package.json, delete package, pnpm install**

```bash
rm -rf packages/supabase
pnpm install
```

Remove `"@aloha/supabase": "workspace:*"` from `package.json`.
Also update the typegen script in `package.json` — the `supabase:typegen:packages` script that generated types to `packages/supabase/src/database.types.ts` is no longer needed. Remove it or redirect to `lib/database.types.ts`.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add -A && git commit -m "refactor: inline @aloha/supabase into lib/supabase"
```

---

## Task 6: Inline @aloha/auth

19 files — 12 components + 3 schemas + 4 modules. Components go to `components/auth/`, logic goes to `lib/auth/`.

**Files:**
- Create: `components/auth/` and `lib/auth/`
- Move: `src/components/*.tsx` → `components/auth/`
- Move: `src/schemas/*.ts` → `lib/auth/schemas/`
- Move: `src/sign-in.ts` → `lib/auth/sign-in.ts`
- Move: `src/password-reset.ts` → `lib/auth/password-reset.ts`
- Move: `src/shared.ts` → `lib/auth/shared.ts`
- Move: `src/view-contracts.ts` → `lib/auth/view-contracts.ts`
- Delete: `packages/features/auth/`
- Modify: `package.json` — remove `@aloha/auth`

- [ ] **Step 1: Copy files**

```bash
mkdir -p components/auth lib/auth/schemas
# Components
cp packages/features/auth/src/components/*.tsx components/auth/
# Schemas
cp packages/features/auth/src/schemas/*.ts lib/auth/schemas/
# Logic
cp packages/features/auth/src/sign-in.ts lib/auth/
cp packages/features/auth/src/password-reset.ts lib/auth/
cp packages/features/auth/src/shared.ts lib/auth/
cp packages/features/auth/src/view-contracts.ts lib/auth/
```

- [ ] **Step 2: Update internal imports in moved files**

In component files, update:
- `@aloha/supabase/...` → `~/lib/supabase/...`
- `@aloha/ui/...` → stays as-is (ui is still a package)
- Internal cross-references between auth components: use `~/components/auth/...`
- Schema imports: use `~/lib/auth/schemas/...`

In logic files (sign-in.ts, shared.ts, etc.), update similarly.

- [ ] **Step 3: Update consumer imports**

Replace:
- `@aloha/auth/sign-in` → `~/lib/auth/sign-in`
- `@aloha/auth/password-reset` → `~/lib/auth/password-reset`
- `@aloha/auth/shared` → `~/lib/auth/shared`
- `@aloha/auth/view-contracts` → `~/lib/auth/view-contracts`

Files to check: auth route files, `org-workspace-loader.server.ts`

- [ ] **Step 4: Remove from package.json, delete package, pnpm install**

```bash
rm -rf packages/features/auth
rmdir packages/features 2>/dev/null  # may not be empty yet (ai)
pnpm install
```

Remove `"@aloha/auth": "workspace:*"` from `package.json`.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add -A && git commit -m "refactor: inline @aloha/auth into lib/auth + components/auth"
```

---

## Task 7: Inline @aloha/ai

8 files. Components to `components/ai/`, lib to `lib/ai/`.

**Files:**
- Create: `components/ai/` and `lib/ai/`
- Move: `src/components/*.tsx` → `components/ai/`
- Move: `src/lib/*.ts` → `lib/ai/`
- Skip: `src/index.ts` (barrel)
- Delete: `packages/features/ai/`
- Modify: `package.json` — remove `@aloha/ai`

Note: ai package has production dependencies (`@ai-sdk/anthropic`, `@ai-sdk/react`, `ai`). These are already in `package.json` so no changes needed there.

- [ ] **Step 1: Copy files**

```bash
mkdir -p components/ai lib/ai
cp packages/features/ai/src/components/*.tsx components/ai/
cp packages/features/ai/src/lib/*.ts lib/ai/
```

- [ ] **Step 2: Update internal imports in moved files**

In component files:
- `@aloha/ui/...` → stays as-is
- Internal cross-references between ai components/lib: use `~/components/ai/...` and `~/lib/ai/...`

- [ ] **Step 3: Update consumer imports**

Replace:
- `@aloha/ai/ai-chat-provider` → `~/components/ai/ai-chat-provider`
- `@aloha/ai/ai-chat-panel` → `~/components/ai/ai-chat-panel`
- `@aloha/ai/ai-chat-button` → `~/components/ai/ai-chat-button`
- `@aloha/ai/ai-form-assist` → `~/components/ai/ai-form-assist`
- `@aloha/ai/workflow-automation` → `~/lib/ai/workflow-automation.server`
- `@aloha/ai/build-system-prompt` → `~/lib/ai/build-system-prompt.server`
- `@aloha/ai/ai-context` → `~/lib/ai/ai-context`

Files to check: workspace layout, sub-module routes, API routes

- [ ] **Step 4: Remove from package.json, delete package, pnpm install**

```bash
rm -rf packages/features/ai
rm -rf packages/features  # should be empty now
pnpm install
```

Remove `"@aloha/ai": "workspace:*"` from `package.json`.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add -A && git commit -m "refactor: inline @aloha/ai into lib/ai + components/ai"
```

---

## Task 8: Final cleanup

- [ ] **Step 1: Clean up pnpm-workspace.yaml**

The `packages/**` glob now only covers `packages/ui/` and `packages/mcp-server/`. Verify no orphan package dirs remain:
```bash
ls packages/
```
Should show only `ui/` and `mcp-server/`. If `packages/features/` or `packages/utils/` dirs remain (empty), delete them.

- [ ] **Step 2: Update turbo.json if needed**

Check if `turbo.json` has task configs that reference deleted packages. Remove them.

- [ ] **Step 3: Clean up typegen scripts**

In `package.json`, the `supabase:typegen:packages` script wrote to `packages/supabase/src/database.types.ts` (now deleted). Remove or update this script. Keep only `supabase:typegen:app`.

- [ ] **Step 4: Run full lint, format, typecheck**

```bash
pnpm lint:fix
pnpm format:fix
pnpm typecheck
```

- [ ] **Step 5: Verify no stale @aloha imports**

```bash
grep -rn "@aloha/shared\|@aloha/i18n\|@aloha/csrf\|@aloha/database-webhooks\|@aloha/supabase\|@aloha/auth\|@aloha/ai" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".turbo" | grep -v "@aloha/ui\|@aloha/mcp-server"
```

Should return nothing. Fix any remaining.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: final cleanup after package inlining"
```
