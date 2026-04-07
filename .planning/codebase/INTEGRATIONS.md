# External Integrations

**Analysis Date:** 2026-04-07

## APIs & External Services

**AI & LLM:**
- Anthropic Claude - AI chat and form field extraction
  - SDK: `@ai-sdk/anthropic` 3.0.64 via Vercel AI SDK (`ai` 6.0.141)
  - Auth: `ANTHROPIC_API_KEY` env var (required to enable AI features)
  - Endpoints:
    - `/api/ai/chat` (`app/routes/api/ai/chat.ts`) - Streaming AI chat responses using `claude-sonnet-4-20250514` model
    - `/api/ai/form-assist` (`app/routes/api/ai/form-assist.ts`) - Structured form field extraction from text
  - React hooks: `@ai-sdk/react` 3.0.143 for client-side streaming UI integration

**Authentication & OAuth:**
- Supabase Auth (built-in via `@supabase/supabase-js` 2.89.0)
  - Auth methods:
    - Email/password (enabled locally, controlled by `VITE_AUTH_PASSWORD` flag)
    - Magic link (optional, controlled by `VITE_AUTH_MAGIC_LINK` flag)
    - Google OAuth (enabled locally in `supabase/config.toml`, requires `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`)
    - Azure OAuth (disabled by default, requires `AZURE_OAUTH_CLIENT_ID` and `AZURE_OAUTH_CLIENT_SECRET`)
  - Session management: SSR-compatible via `@supabase/ssr` 0.8.0 with request-scoped client in `app/lib/supabase/clients/server-client.server.ts`
  - Cookie-based session persistence for SSR

## Data Storage

**Databases:**
- **Supabase (PostgreSQL 15)**
  - Connection: `VITE_SUPABASE_URL` (public endpoint) + `VITE_SUPABASE_PUBLIC_KEY` (anon key) for client
  - Service role: `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` for admin operations
  - Client: `@supabase/supabase-js` 2.89.0
  - Local dev: Via Supabase CLI (`supabase` 2.67.3) running PostgreSQL 15 in Docker
  - Type generation: `pnpm supabase:typegen` generates `app/lib/database.types.ts` from schema
  - Schema location: `supabase/schemas/` (numbered SQL files)
  - Migrations: `supabase/migrations/` (auto-generated via `pnpm supabase db diff`)
  - Row-Level Security (RLS): All app tables use org-scoped RLS via `hr_employee` membership model
  - Multi-tenant model: `org` (tenant) + `hr_employee` (membership) with `sys_access_level` role hierarchy

**File Storage:**
- Supabase Storage (via `@supabase/supabase-js` 2.89.0)
  - Local dev: Configured in `supabase/config.toml` with 50MiB file size limit
  - Storage scope: Org-scoped (via RLS policies)

**Caching:**
- Client-side caching via TanStack Query (`@tanstack/react-query` 5.90.12)
- No distributed caching layer (Redis, Memcached) detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in, managed database: `auth.users`)
- Session management: Cookie-based for SSR, via `@supabase/ssr` 0.8.0
- CSRF protection: `@edge-csrf/core` 2.5.3-cloudflare-rc1 (see `app/lib/csrf/`)
  - Token generation in root loader
  - Verification in form actions

**Identity Linking:**
- Optional feature controlled by `VITE_AUTH_IDENTITY_LINKING` env var
- Must be enabled in Supabase console for production use

## Monitoring & Observability

**Error Tracking:**
- None detected (Sentry/Rollbar not integrated)
- Errors logged via console in `app/entry.server.tsx` and route loaders

**Logs:**
- Server-side: Pino (`pino` 10.1.0) structured logging (see `app/lib/shared/logger/`)
  - Implementations: Console and Pino via `impl/console.ts` and `impl/pino.ts`
  - Log level controlled by `LOGGER` env var
- Client-side: Console logging (minimal, not intercepted)
- Database: Supabase provides built-in query logs and audit trails

**Analytics:**
- Disabled by default in `supabase/config.toml` (`analytics.enabled = false`)

## CI/CD & Deployment

**Hosting:**
- Production: React Router SSR via `react-router-serve ./build/server/index.js`
- Deployment preset available for Vercel (commented in `react-router.config.ts`)
- Environment: `NODE_ENV=production` required for build

**Build:**
- Vite 7.3.0 via `react-router build` command
- Turborepo 2.6.2 for monorepo build orchestration
- Output: `build/server/index.js` (SSR entry) + static assets

**CI Pipeline:**
- None detected in repository (GitHub Actions, GitLab CI, etc. not configured)

## Environment Configuration

**Required env vars (production):**
- `VITE_SUPABASE_URL` - Supabase API endpoint
- `VITE_SUPABASE_PUBLIC_KEY` - Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `VITE_SITE_URL` - App base URL for auth redirects
- `VITE_PRODUCT_NAME`, `VITE_SITE_TITLE` - Branding
- `ANTHROPIC_API_KEY` - Claude API key (optional, disables AI features if missing)

**Optional env vars:**
- OAuth provider secrets: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `AZURE_OAUTH_CLIENT_ID`, `AZURE_OAUTH_CLIENT_SECRET`
- Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, `EMAIL_SENDER`, `MAILER_PROVIDER`
- Logging: `LOGGER`

**Secrets location:**
- Development: `.env` file (not committed; use `.env.template` as guide)
- Production: Hosting provider env vars (Vercel, AWS, etc.)
- Never commit: `.env*` files, `credentials.json`, `*.pem`, `*.key` files

## Webhooks & Callbacks

**Incoming:**
- **Database Webhook:** `POST /api/db/webhook` (`app/routes/api/db/webhook.ts`)
  - Purpose: Handle Supabase database events (inserts, updates, deletes)
  - Verification: `SUPABASE_DB_WEBHOOK_SECRET` signature validation via `@edge-csrf/core`
  - Handler: `getDatabaseWebhookHandlerService()` in `app/lib/webhooks/database-webhook-handler.service.ts`
  - Service: `DatabaseWebhookHandler` receives `RecordChange` events and routes to appropriate handlers
  - Used for: Reactive sync between database state and UI (e.g., inventory, HR data changes)

**Outgoing:**
- Auth callbacks: Supabase redirects to `VITE_SITE_URL + /auth/callback` and `/auth/update-password` (configured in `supabase/config.toml`)

## Email Delivery (if configured)

**SMTP (Nodemailer):**
- Provider: Nodemailer (`nodemailer` 7.0.x) or Resend (swappable via `MAILER_PROVIDER`)
- Local dev: Inbucket mock SMTP server (Supabase local; port 54325)
- Production config: Via `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, `EMAIL_SENDER` env vars

**Email Types (via Supabase Auth):**
- Password reset: Template at `supabase/templates/reset-password.html`
- Email change confirmation: Template at `supabase/templates/change-email-address.html`
- Email confirmation (on signup): Subject "Confirm your email" (default Supabase template)

## Real-Time Features

**Supabase Realtime:**
- Available via `@supabase/supabase-js` 2.89.0
- Not explicitly integrated in current codebase (can be added via `supabase.channel()` API)

## MCP Server Integration

**Model Context Protocol:**
- MCP Server SDK: `@modelcontextprotocol/sdk` 1.24.3
- Location: `packages/mcp-server/`
- Database client: `postgres` 3.4.7 for direct PostgreSQL queries
- Purpose: Expose Aloha database schema and operations to Claude via MCP
- Build: `pnpm build` in `packages/mcp-server/`
- Entry: `bin.aloha-mcp-server` in `packages/mcp-server/package.json`

## Feature Flags & Conditional Integrations

**AI Features:**
- Enabled if `ANTHROPIC_API_KEY` is set
- Disabled if missing; endpoints return 501 Not Implemented
- Routes check env var before calling Claude API

**OAuth Providers:**
- Google: Configured in `supabase/config.toml` if `GOOGLE_OAUTH_CLIENT_ID` set
- Azure: Requires enabling in `supabase/config.toml` and setting env vars
- Apple: Not enabled by default; requires configuration

**Email:**
- Provider selectable via `MAILER_PROVIDER` env var
- Default: `nodemailer`
- Alternative: `resend` (swappable)

---

*Integration audit: 2026-04-07*
