# External Integrations

**Analysis Date:** 2025-02-26

## APIs & External Services

**AI/LLM:**
- Anthropic Claude - AI-powered features (chat, form assistance, workflow automation)
  - SDK: `@ai-sdk/anthropic` 3.0.64 via Vercel AI SDK
  - Wrapper: `ai` 6.0.141
  - Auth: `ANTHROPIC_API_KEY` (server-only env var)
  - Endpoints:
    - `POST /api/ai/chat` - Streaming chat completions (`app/routes/api/ai/chat.ts`)
    - `POST /api/ai/form-assist` - Form field auto-population (`app/routes/api/ai/form-assist.ts`)
    - Workflow automation in `app/lib/ai/workflow-automation.server.ts`

**OAuth Providers (Optional):**
- Google OAuth - User authentication via Google
  - Config: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` (in `.env`)
  - Integration: Supabase Auth external provider (configured in `supabase/config.toml` as `[auth.external.apple]` pattern)
- Azure OAuth - User authentication via Microsoft Azure
  - Config: `AZURE_OAUTH_CLIENT_ID`, `AZURE_OAUTH_CLIENT_SECRET` (in `.env`)
  - Integration: Supabase Auth external provider

## Data Storage

**Primary Database:**
- Supabase PostgreSQL - Multi-tenant relational database
  - Type: PostgreSQL 15 (major version in `supabase/config.toml`)
  - Project: `aloha-app` (local) / `kfwqtaazdankxmdlqdak` (hosted)
  - Schemas: `public`, `storage`, `graphql_public` (exposed in API); `extensions`, `auth` (internal)
  - Client library: `@supabase/supabase-js` 2.89.0
  - Server client: `@supabase/ssr` 0.8.0 for SSR-safe session cookie handling
  - Connection:
    - Client: via `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLIC_KEY` (public anon key)
    - Server: via `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (service role, server-only)
  - Clients:
    - Server: `getSupabaseServerClient(request)` in `app/lib/supabase/clients/server-client.server.ts`
    - Server Admin: `getSupabaseAdminClient()` in `app/lib/supabase/clients/server-admin-client.server.ts`
    - Client Hook: `useSupabase<Db>()` in `app/lib/supabase/hooks/use-supabase.ts`
  - ORM: Direct query builder (no ORM layer; Supabase JS client used directly)
  - Migrations: 91+ migrations in `supabase/migrations/` numbered sequentially
  - Local dev: `supabase start` via Docker; reset with `supabase db reset`

**File Storage:**
- Supabase Storage - Cloud file hosting
  - Type: Object storage (S3-compatible)
  - Integration: Via `@supabase/supabase-js` storage client
  - Max file size: 50MiB (configured in `supabase/config.toml`)
  - Access: Public/private buckets via RLS policies

**Caching:**
- Not detected - No explicit Redis or caching layer; relies on TanStack Query client-side caching

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Built-in user management and session handling
  - Implementation: Multi-layer approach
    - **Template layer:** Supabase Auth's native `accounts` table (Supabase project's built-in auth)
    - **Business layer:** Custom `org` (tenant) + `hr_employee` (membership) tables for ERP-specific access control
  - Session management: via secure HTTP-only cookies (via `@supabase/ssr` adapter)
  - Email auth: Enabled with signup disabled (invite-only model in production; `enable_signup: false` in `supabase/config.toml`)
  - OAuth: Optional external providers (Google, Azure) configured in Supabase
  - MFA: TOTP disabled in config (can be enabled)
  - JWT expiry: 3600 seconds (1 hour)
  - Password reset: Custom email template at `supabase/templates/reset-password.html`
  - Email change confirmation: Custom template at `supabase/templates/change-email-address.html`
  - Email testing (dev only): Inbucket server on port 54324

**Access Control:**
- Row Level Security (RLS) - PostgreSQL policies enforcing org-scoped access
  - All business tables reference `org_id` and use RLS policies
  - Helper tables: `hr_employee` (links users to orgs), `sys_access_level` (5-tier role hierarchy), `hr_module_access` (per-employee CRUD permissions)
  - Policies: Org-scoped select/insert/update; soft-delete pattern (no hard DELETE grant)
  - View contracts: `app_org_context`, `app_user_orgs` in `supabase/schemas/05-view-contracts.sql`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, LogRocket, or error tracking service configured

**Logging:**
- Framework: Pino 10.1.0 (server-side structured logging)
- Integration: Via `@aloha/shared/logger` package
- Environment: Controlled by `LOGGER` env var
- Storage: Logs written to stdout/stderr; external aggregation not configured

## CI/CD & Deployment

**Hosting:**
- Vercel - Suggested deployment platform (preset commented in `react-router.config.ts`)
- Or any Node.js host supporting SSR
- Docker-ready: Dockerfile can be added to `build/` output

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI config in repo root
- E2E tests available via Playwright (`pnpm test` in `e2e/` directory) but no CI workflow configured

**Build & Serve:**
- Development: `pnpm dev` (Vite dev server on port 5173)
- Production: `pnpm build` then `pnpm start` (runs `react-router-serve ./build/server/index.js`)

## Environment Configuration

**Required env vars for production:**
- `VITE_SUPABASE_URL` - Supabase API endpoint
- `VITE_SUPABASE_PUBLIC_KEY` - Supabase public anon key
- `SUPABASE_SECRET_KEY` - Supabase service role key (server-only)
- `ANTHROPIC_API_KEY` - Claude API key (if AI features enabled)
- `VITE_SITE_URL` - Site URL for auth redirects (must match Supabase allowed redirect URLs)
- `MAILER_PROVIDER` - Email provider: `nodemailer` or `resend`
- Email SMTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` (if nodemailer)
- `SUPABASE_DB_WEBHOOK_SECRET` - Webhook signature verification secret

**Secrets location:**
- Development: `.env` file (git-ignored, created from `.env.template`)
- Production: Environment variables in hosting provider (Vercel, etc.)
- Never committed: `.env`, `.env.*` files in `.gitignore`

## Webhooks & Callbacks

**Incoming (from External Sources):**
- Supabase Database Webhooks - Real-time database change notifications
  - Endpoint: `POST /api/db/webhook` (`app/routes/api/db/webhook.ts`)
  - Secret: `SUPABASE_DB_WEBHOOK_SECRET` for signature verification
  - Verifier: `PostgresDatabaseWebhookVerifierService` in `app/lib/webhooks/postgres-database-webhook-verifier.service.ts`
  - Factory pattern: `createDatabaseWebhookVerifier()` in `app/lib/webhooks/database-webhook-verifier-factory.ts`
  - Supporte trigger types: Database insert/update/delete events

**Outgoing (from App to External Systems):**
- Not detected - No outgoing webhook triggers to external services configured

**Auth Callbacks:**
- Supabase OAuth redirect: `http://localhost:5173/auth/callback` (configured in `supabase/config.toml`)
- Password reset link: Redirect via email template to `/auth/update-password`

## Email Services

**Provider Options:**
- Nodemailer (default) - SMTP email sending via `nodemailer` 7.0.x
  - Configuration: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`
  - Usage: Server actions for password resets, invitations, notifications
  - Provider selection: `MAILER_PROVIDER=nodemailer` in `.env`

- Resend (optional) - Alternative email provider with API key
  - Not actively integrated; support structure exists for swappability
  - Provider selection: `MAILER_PROVIDER=resend` in `.env`
  - Would require `RESEND_API_KEY` env var

**Email Templates:**
- Password reset: `supabase/templates/reset-password.html`
- Email change confirmation: `supabase/templates/change-email-address.html`
- Configured in `supabase/config.toml` `[auth.email.template.*]` sections

## MCP Server Integration

**Model Context Protocol (MCP):**
- Package: `packages/mcp-server/`
- Dependencies: `@modelcontextprotocol/sdk` 1.24.3, `postgres` 3.4.7
- Purpose: Enable Claude AI to query the database schema and generate code
- Usage: Consumed by Claude in AI Code sessions

## Rate Limiting

**Supabase Auth:**
- Email rate limit: 1000 requests per configured window (in `supabase/config.toml`)

## API Response Limits

**Supabase API:**
- Max rows returned: 1000 (configured in `supabase/config.toml` `max_rows`)
- Payload size: Limited by max_rows to prevent accidental/malicious large requests

---

*Integration audit: 2025-02-26*
