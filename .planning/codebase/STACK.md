# Technology Stack

**Analysis Date:** 2025-02-26

## Languages

**Primary:**
- TypeScript 5.9.x - All application code, packages, tooling, and configuration
- SQL (PostgreSQL 15) - Database schemas, migrations, and RLS policies in `supabase/schemas/` and `supabase/migrations/`
- HTML/CSS - Templates via Tailwind CSS v4 utility classes; no raw CSS files

**Secondary:**
- JavaScript (Node.js) - Build scripts and tooling entry points

## Runtime

**Environment:**
- Node.js >=20.x (root workspace requirement), >=18.x (web app compatible)
- Bun/pnpm 10.18.1 as package manager (configured in `package.json` `packageManager` field)

**Lockfile:**
- Present: `pnpm-lock.yaml`

**Workspace:**
- pnpm workspaces configured in `pnpm-workspace.yaml`
- Workspace catalog pinning at `pnpm-workspace.yaml` with versions: `@supabase/supabase-js` 2.89.0, `@tanstack/react-query` 5.90.12, `react` 19.2.3, `zod` 3.25.74

## Frameworks

**Core:**
- React Router 7.12.0 (`react-router`, `@react-router/dev`, `@react-router/serve`, `@react-router/node`) - SSR/Framework mode with file-based routing via `@react-router/fs-routes` 7.12.0
- React 19.2.3 - UI rendering framework
- Vite 7.3.0 - Build tool and dev server via `@react-router/dev/vite`

**Styling:**
- Tailwind CSS 4.1.18 (`tailwindcss`, `@tailwindcss/vite`) - Utility-first CSS framework
- Custom tailwind config: `@aloha/tailwind-config/vite` plugin for integration with Vite
- Prettier plugin `@trivago/prettier-plugin-sort-imports` - Import sorting in `prettier` 3.7.4

**UI Components:**
- Shadcn UI - Component library built on Radix UI 1.4.3 primitives; components located in `packages/ui/src/shadcn/`
- Radix UI 1.4.3 - Accessible component primitives
- Lucide React 0.562.0 - Icon library
- `next-themes` 0.4.6 - Dark/light/system theme toggle support

**Form & Validation:**
- React Hook Form 7.69.0 - Client form state management
- `@hookform/resolvers` 5.2.2 - Zod resolver integration (no explicit generics on `useForm`)
- Zod 3.25.74 - TypeScript-first schema validation; workspace-cataloged

**Client Data:**
- TanStack Query 5.90.12 (`@tanstack/react-query`) - Async client-side data fetching, caching, and synchronization
- TanStack Table 8.21.3 (`@tanstack/react-table`) - Headless data table primitives

**Internationalization:**
- i18next 25.7.x - i18n framework
- react-i18next 16.5.x - React i18n provider and hooks
- `i18next-browser-languagedetector` - Auto browser language detection
- `i18next-resources-to-backend` 1.2.1 - Lazy locale loading from `public/locales`

**Data Visualization:**
- Recharts 2.15.x - Charting and data visualization library

**Other:**
- `sonner` 2.0.7 - Toast notification system (exported as `@aloha/ui/sonner`)
- `clsx` 2.1.1 - Conditional class name utility
- `tailwind-merge` 3.4.0 - Tailwind CSS class merging utility

## Testing

**E2E Testing:**
- Playwright 1.57.x (`@playwright/test`) - Browser automation and E2E test framework
- Config: `e2e/playwright.config.ts`
- Tests: `e2e/tests/`
- Base URL: `http://localhost:5173`
- Timeout: 120 seconds, expect timeout 30 seconds

**Database Testing:**
- Supabase pgTAP - Database unit tests via `pnpm supabase:test`
- Test location: `supabase/tests/`

## Build & Development

**Build Tool:**
- Vite 7.3.0 with React Router 7 integration
- SSR enabled in `react-router.config.ts`

**Monorepo Orchestration:**
- Turborepo 2.6.2 - Build orchestration via `turbo.json`
- Task cache invalidation through `globalEnv` env var declarations

**Type Generation:**
- `react-router typegen` - Generates route types to `.react-router/types/`
- Supabase types: `pnpm supabase:typegen` generates `app/lib/database.types.ts` from local/remote schema

**Code Quality:**
- ESLint 9.39.2 - Linting framework (flat config format, ESLint 9.x)
- `@aloha/eslint-config` - Shared ESLint config with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`
- Prettier 3.7.4 - Code formatting with `@aloha/prettier-config`
- Format config: `tabWidth: 2`, `useTabs: false`, `semi: true`, `printWidth: 80`, `singleQuote: true`, `arrowParens: 'always'`

**TypeScript:**
- TypeScript 5.9.3 - Strict type checking
- Base config extends `@aloha/tsconfig/base.json`
- Path aliases: `~/*` → `./app/*` for app-level imports, `~/types/*` → `./.react-router/types/*`

**Cross-Platform:**
- `cross-env` 10.1.0 - Cross-platform environment variable setting

**Utilities:**
- `dotenv-cli` 11.0.0 - Load `.env` files in npm scripts via `pnpm with-env`
- `isbot` 5.1.32 - Bot detection for crawler handling in SSR

## Key Dependencies

**Critical Runtime:**
- `@supabase/supabase-js` 2.89.0 - Supabase JavaScript client (database, auth, realtime)
- `@supabase/ssr` 0.8.0 - SSR-compatible Supabase helpers for server client creation with session cookie management
- `ai` 6.0.141 - Vercel AI SDK for streaming responses
- `@ai-sdk/anthropic` 3.0.64 - Anthropic Claude integration via Vercel AI SDK
- `@ai-sdk/react` 3.0.143 - React hooks for AI SDK
- `@edge-csrf/core` 2.5.3-cloudflare-rc1 - CSRF token generation and verification

**Database:**
- `supabase` 2.67.3 - Supabase CLI for local development and migrations
- `postgres` 3.4.7 - PostgreSQL client (used in `packages/mcp-server`)

**Logging:**
- `pino` 10.1.0 - Structured server-side logging framework

**Server & API:**
- `react-router-serve` 7.12.0 - Production SSR server via `react-router-serve ./build/server/index.js`
- `nodemailer` 7.0.x - SMTP email sending (optional, swappable with Resend)
- `@modelcontextprotocol/sdk` 1.24.3 - MCP server SDK in `packages/mcp-server/`

**UI & Utils:**
- `class-variance-authority` 0.7.1 - Type-safe CSS class composition (used in shadcn components)
- `date-fns` 4.1.0 - Date manipulation utility library
- `input-otp` 1.4.2 - OTP input component primitives
- `react-day-picker` 9.13.0 - Date picker component
- `react-top-loading-bar` 3.0.2 - Top loading progress bar
- `tailwindcss-animate` 1.0.7 - Tailwind CSS animation utilities
- `cmdk` 1.1.1 - Command/search menu component

**Dev Dependencies (Workspace Tooling):**
- `eslint-import-resolver-typescript` 4.4.4 - ESLint import resolver
- `@types/node` 25.0.3 - Node.js type definitions (catalog)
- `@types/react` 19.2.7 - React type definitions (catalog)
- `@types/react-dom` 19.2.3 - React DOM type definitions
- `manypkg` 0.25.x - Monorepo dependency validation
- `vite-tsconfig-paths` 6.0.3 - Vite plugin for TypeScript path aliases

## Configuration Files

**Build & Runtime:**
- `vite.config.ts` - Vite configuration with React Router and Tailwind plugins; SSR enabled
- `react-router.config.ts` - React Router SSR config; Vercel preset available (commented out)
- `tsconfig.json` - Root TypeScript config with path alias `~/*` → `./app/*`
- `.prettierrc` - Prettier configuration (via `@aloha/prettier-config`)

**Linting & Quality:**
- `.eslintrc` - ESLint config (via `@aloha/eslint-config`, flat format)

**Development:**
- `.env.template` - Environment variable template for local development
- `supabase/config.toml` - Supabase local dev configuration

## Environment Configuration

**Public Variables (bundled into client, prefixed `VITE_`):**
- `VITE_SUPABASE_URL` - Supabase API endpoint
- `VITE_SUPABASE_PUBLIC_KEY` - Supabase public anon key
- `VITE_SITE_URL` - App base URL for auth redirects
- `VITE_PRODUCT_NAME` - Brand name (e.g., "Aloha")
- `VITE_SITE_TITLE` - Page title
- `VITE_SITE_DESCRIPTION` - Page description
- `VITE_DEFAULT_THEME_MODE` - Theme default (light/dark)
- `VITE_THEME_COLOR` - Light theme color
- `VITE_THEME_COLOR_DARK` - Dark theme color
- `VITE_LOCALES_PATH` - Locale files path
- Feature flags: `VITE_ENABLE_TEAM_ACCOUNTS`, `VITE_ENABLE_SIDEBAR_TRIGGER`, `VITE_ENABLE_THEME_TOGGLE`, `VITE_LANGUAGE_PRIORITY`
- Auth flags: `VITE_AUTH_PASSWORD`, `VITE_AUTH_MAGIC_LINK`

**Server-Only Variables (never exposed to client):**
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `SUPABASE_DB_WEBHOOK_SECRET` - Webhook signature verification
- `LOGGER` - Log level configuration
- Email config: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, `EMAIL_SENDER`
- `MAILER_PROVIDER` - Email provider choice: `nodemailer` or `resend`
- Optional OAuth: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `AZURE_OAUTH_CLIENT_ID`, `AZURE_OAUTH_CLIENT_SECRET`

## Platform Requirements

**Development:**
- Node.js >=20.x
- pnpm 10.18.1
- Docker (optional; Supabase local dev can run via `pnpm supabase:start`)
- Supabase CLI for local database (handles PostgreSQL 15 in Docker)

**Production:**
- Node.js >=18.x
- Supabase hosted project (configured in Supabase console)
- Environment variables set in hosting provider (Vercel, etc.)
- SSR server runs via `react-router-serve ./build/server/index.js` on port configurable via hosting provider

**Build Output:**
- `build/` directory containing `build/server/index.js` (SSR entry point) and static assets
- Deployment preset available for Vercel (commented in `react-router.config.ts`)

---

*Stack analysis: 2025-02-26*
