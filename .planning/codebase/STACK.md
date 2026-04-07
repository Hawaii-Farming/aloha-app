# Technology Stack

**Analysis Date:** 2026-04-07

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code, packages, tooling, and configuration
- SQL (PostgreSQL 15) - Database schemas, migrations, and RLS policies in `supabase/schemas/` and `supabase/migrations/`

**Secondary:**
- HTML/CSS - Templates via Tailwind CSS v4 utility classes; no raw CSS files
- JavaScript - Node.js build scripts and tooling entry points

## Runtime

**Environment:**
- Node.js >=20.x (root workspace requirement), >=18.x (web app compatible)
- pnpm 10.18.1 - Package manager (configured in `package.json` `packageManager` field)

**Package Manager:**
- pnpm 10.18.1
- Lockfile: `pnpm-lock.yaml` (present)
- Workspaces: Configured in `pnpm-workspace.yaml` with catalog pinning for consistent versions across packages
- Workspace catalog: `@supabase/supabase-js` 2.89.0, `@tanstack/react-query` 5.90.12, `react` 19.2.3, `zod` 3.25.74, `@types/node` 25.0.3, `@types/react` 19.2.7, `supabase` 2.67.3, `tw-animate-css` 1.4.0

## Frameworks

**Core:**
- React Router 7.12.0 (`react-router`, `@react-router/dev`, `@react-router/serve`, `@react-router/node`) - SSR/Framework mode with file-based routing via `@react-router/fs-routes` 7.12.0
- React 19.2.3 - UI rendering framework
- Vite 7.3.0 - Build tool and dev server via `@react-router/dev/vite`

**UI & Styling:**
- Tailwind CSS 4.1.18 (`tailwindcss`, `@tailwindcss/vite`) - Utility-first CSS framework
- Custom Tailwind config: `@aloha/tailwind-config/vite` plugin for Vite integration at `packages/tooling/`
- Shadcn UI - Component library built on Radix UI 1.4.3 primitives; components located in `packages/ui/src/shadcn/`
- Radix UI 1.4.3 - Accessible component primitives
- Lucide React 0.562.0 - Icon library
- Fonts: `@fontsource-variable/geist` 5.2.8, `@fontsource-variable/geist-mono` 5.2.7 (MIT-licensed)

**Form & Validation:**
- React Hook Form 7.69.0 - Client form state management
- `@hookform/resolvers` 5.2.2 - Zod resolver integration
- Zod 3.25.74 - TypeScript-first schema validation

**Data & State:**
- TanStack Query 5.90.12 (`@tanstack/react-query`) - Async client-side data fetching, caching, and synchronization
- TanStack Table 8.21.3 (`@tanstack/react-table`) - Headless data table primitives

**Theme & i18n:**
- `next-themes` 0.4.6 - Dark/light/system theme toggle support
- i18next 25.7.x - i18n framework
- react-i18next 16.5.x - React i18n provider and hooks
- `i18next-browser-languagedetector` - Auto browser language detection
- `i18next-resources-to-backend` 1.2.1 - Lazy locale loading from `public/locales`

**Utilities & Components:**
- Recharts 2.15.x - Charting and data visualization library
- `sonner` 2.0.7 - Toast notification system (exported as `@aloha/ui/sonner`)
- `clsx` 2.1.1 - Conditional class name utility
- `tailwind-merge` 3.4.0 - Tailwind CSS class merging utility
- `date-fns` 4.1.0 - Date manipulation utility library
- `input-otp` 1.4.2 - OTP input component primitives
- `react-day-picker` 9.13.0 - Date picker component
- `react-top-loading-bar` 3.0.2 - Top loading progress bar
- `tailwindcss-animate` 1.0.7 - Tailwind CSS animation utilities
- `cmdk` 1.1.1 - Command/search menu component
- `class-variance-authority` 0.7.1 - Type-safe CSS class composition

**Testing:**
- Playwright 1.57.x (`@playwright/test`) - Browser automation and E2E test framework
  - Config: `e2e/playwright.config.ts`
  - Tests: `e2e/tests/`
  - Base URL: `http://localhost:5173`
  - Timeout: 120 seconds, expect timeout 30 seconds
  - Storage state for auth persistence: `e2e/.auth/user.json`
- Vitest 4.1.3 - Unit test runner
- Supabase pgTAP - Database unit tests via `pnpm supabase:test`
  - Test location: `supabase/tests/`

**Build & Development:**
- Turborepo 2.6.2 - Build orchestration via `turbo.json`
  - Task cache invalidation through `globalEnv` declarations for: `ANTHROPIC_API_KEY`, `VITE_PRODUCT_NAME`, `VITE_SITE_URL`, `LOGGER`, `SUPABASE_DB_WEBHOOK_SECRET`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `react-router typegen` - Generates route types to `.react-router/types/`
- Supabase CLI - Local database via Docker (PostgreSQL 15)

**Code Quality:**
- ESLint 9.39.2 - Linting framework (flat config format, ESLint 9.x)
  - Config: `eslint.config.mjs` with extends from `@aloha/eslint-config/apps.js` and `@aloha/eslint-config/base.js`
  - Plugins: `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`
- Prettier 3.7.4 - Code formatting
  - Config: `@aloha/prettier-config` (tabWidth: 2, useTabs: false, semi: true, printWidth: 80, singleQuote: true, arrowParens: 'always')
  - Plugin: `@trivago/prettier-plugin-sort-imports` for import sorting
  - Plugin: `prettier-plugin-tailwindcss` for class sorting
- TypeScript 5.9.3 - Strict type checking
  - Base config extends `@aloha/tsconfig/base.json` (via `packages/tooling/`)
  - Path aliases: `~/*` → `./app/*`, `~/types/*` → `./.react-router/types/*`
  - Target: `noEmit` (type-checking only)

**Development Utilities:**
- `cross-env` 10.1.0 - Cross-platform environment variable setting
- `dotenv-cli` 11.0.0 - Load `.env` files in npm scripts via `pnpm with-env`
- `isbot` 5.1.32 - Bot detection for crawler handling in SSR
- `vite-tsconfig-paths` 6.0.3 - Vite plugin for TypeScript path aliases
- `eslint-import-resolver-typescript` 4.4.4 - ESLint import resolver for TS paths

## Key Dependencies

**Server-Side & Backend:**
- `@supabase/supabase-js` 2.89.0 - Supabase JavaScript client (database, auth, realtime)
- `@supabase/ssr` 0.8.0 - SSR-compatible Supabase helpers for server client creation with session cookie management
- `postgres` 3.4.7 - PostgreSQL client (used in `packages/mcp-server/` for MCP integration)
- `supabase` 2.67.3 - Supabase CLI for local development, migrations, and type generation
- `pino` 10.1.0 - Structured server-side logging framework (see `app/lib/shared/logger/`)
- `react-router-serve` 7.12.0 - Production SSR server via `react-router-serve ./build/server/index.js`

**AI & LLM:**
- `ai` 6.0.141 - Vercel AI SDK for streaming responses
- `@ai-sdk/anthropic` 3.0.64 - Anthropic Claude integration via Vercel AI SDK
- `@ai-sdk/react` 3.0.143 - React hooks for AI SDK

**Security & Auth:**
- `@edge-csrf/core` 2.5.3-cloudflare-rc1 - CSRF token generation and verification (see `app/lib/csrf/`)
- Supabase Auth - Built-in auth via `@supabase/supabase-js` (email/password, OAuth providers)

**Email & Communication (Optional):**
- `nodemailer` 7.0.x - SMTP email sending (optional; configured via `MAILER_PROVIDER` env var)
- Alternative: Resend (swappable via `MAILER_PROVIDER=resend`)

**MCP Server:**
- `@modelcontextprotocol/sdk` 1.24.3 - MCP server SDK in `packages/mcp-server/` for Claude integration

**Type Definitions:**
- `@types/node` 25.0.3 - Node.js type definitions
- `@types/react` 19.2.7 - React type definitions
- `@types/react-dom` 19.2.3 - React DOM type definitions

**Monorepo Management:**
- `manypkg` 0.25.x - Monorepo dependency validation

## Configuration

**Build Configuration:**
- `vite.config.ts` - Vite configuration with React Router and Tailwind plugins; SSR enabled; fsevents excluded for macOS compatibility
- `react-router.config.ts` - React Router SSR config; Vercel preset available (commented out)
- `vitest.config.ts` - Vitest unit test configuration
- `turbo.json` - Turborepo task definitions and cache invalidation rules

**Type Configuration:**
- `tsconfig.json` - Root TypeScript config with path alias `~/*` → `./app/*`
- Extends `@aloha/tsconfig/base.json` from workspace packages

**Linting & Formatting:**
- `eslint.config.mjs` - ESLint flat config (flat format required for ESLint 9.x)
- `.prettierignore` - Files to exclude from Prettier formatting
- No explicit `.eslintrc` or `.prettierrc` in root — configs via `@aloha/eslint-config` and `@aloha/prettier-config` packages

**Database Configuration:**
- `supabase/config.toml` - Supabase local dev configuration
  - API port: 54321
  - Database (PostgreSQL 15) port: 54322
  - Studio port: 54323
  - Email testing (Inbucket) port: 54325 (SMTP), 54324 (web)
  - Storage limit: 50MiB
  - JWT expiry: 3600 seconds (1 hour)
  - Auth signup enabled locally; disabled in production
  - Email confirmation required
  - OAuth providers: Google (enabled), Azure (disabled), Apple (disabled)

**Database Migrations & Schema:**
- Schema files: `supabase/schemas/*.sql` (numbered by dependency order)
- Migrations: `supabase/migrations/` (auto-generated via `pnpm supabase db diff`)
- Email templates: `supabase/templates/*.html` for password reset and email change

## Environment Configuration

**Client-Side (VITE_ prefix - public):**
- `VITE_SITE_URL` - App base URL for auth redirects (e.g., `http://localhost:5173`)
- `VITE_PRODUCT_NAME` - Brand name (e.g., "Aloha")
- `VITE_SITE_TITLE` - Page title
- `VITE_SITE_DESCRIPTION` - Page description
- `VITE_DEFAULT_THEME_MODE` - Theme default (`light` or `dark`)
- `VITE_THEME_COLOR` - Light theme color (hex)
- `VITE_THEME_COLOR_DARK` - Dark theme color (hex)
- `VITE_LOCALES_PATH` - Locale files path (default: `public/locales`)
- `VITE_SUPABASE_URL` - Supabase API endpoint
- `VITE_SUPABASE_PUBLIC_KEY` - Supabase public anon key

**Feature Flags (VITE_ prefix - public):**
- `VITE_AUTH_PASSWORD` - Enable password authentication (`true`/`false`)
- `VITE_AUTH_MAGIC_LINK` - Enable magic link authentication (`true`/`false`)
- `VITE_AUTH_IDENTITY_LINKING` - Enable identity linking (optional)
- `VITE_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX` - Show terms checkbox during sign-up
- `VITE_ENABLE_THEME_TOGGLE` - Show theme toggle in UI
- `VITE_ENABLE_TEAM_ACCOUNTS` - Enable team account features
- `VITE_ENABLE_TEAM_ACCOUNTS_CREATION` - Allow team account creation
- `VITE_ENABLE_TEAM_ACCOUNTS_DELETION` - Allow team account deletion
- `VITE_ENABLE_SIDEBAR_TRIGGER` - Show sidebar toggle
- `VITE_LANGUAGE_PRIORITY` - Language detection priority (`application` or `browser`)

**Server-Side (private):**
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `ANTHROPIC_API_KEY` - Claude API key for AI features (chat, form assist)
- `SUPABASE_DB_WEBHOOK_SECRET` - Webhook signature verification

**Email Configuration (if using nodemailer):**
- `EMAIL_HOST` - SMTP host (e.g., `localhost` for local dev)
- `EMAIL_PORT` - SMTP port (e.g., `54325` for local Inbucket)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_TLS` - Use TLS (`true`/`false`)
- `EMAIL_SENDER` - Sender email address
- `CONTACT_EMAIL` - Contact form recipient email

**Email Provider Selection:**
- `MAILER_PROVIDER` - Choice of `nodemailer` or `resend`

**OAuth Configuration (optional):**
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret
- `AZURE_OAUTH_CLIENT_ID` - Azure OAuth client ID
- `AZURE_OAUTH_CLIENT_SECRET` - Azure OAuth client secret

**Logging (optional):**
- `LOGGER` - Log level configuration

**Template & Reference:**
- `.env.template` - Environment variable template with all defaults and descriptions

## Platform Requirements

**Development:**
- Node.js >=20.x
- pnpm 10.18.1
- Docker (optional; Supabase local dev can run via `pnpm supabase:start`)
- Supabase CLI for local database (handles PostgreSQL 15 in Docker)

**Production:**
- Node.js >=18.x (app compatible)
- Supabase hosted project (configured in Supabase console)
- Environment variables set in hosting provider (Vercel, etc.)
- SSR server runs via `react-router-serve ./build/server/index.js` on port configurable via hosting provider
- Build output: `build/` directory containing `build/server/index.js` (SSR entry point) and static assets
- Deployment preset available for Vercel (commented in `react-router.config.ts`)

---

*Stack analysis: 2026-04-07*
