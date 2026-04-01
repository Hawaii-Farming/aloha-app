# External Integrations

## Supabase

**Primary backend service** providing database, auth, storage, and real-time capabilities.

| Component | Details |
|-----------|---------|
| Hosted project | `kfwqtaazdankxmdlqdak` |
| Local dev | Supabase CLI (`supabase start`, port 54321) |
| Database | PostgreSQL 15 with Row Level Security |
| Auth | Email/password (magic link available but disabled by default) |
| Storage | File uploads (50 MiB max file size) |
| Studio | Local on port 54323 |
| Client SDK | `@supabase/supabase-js` 2.89.0 |
| SSR helpers | `@supabase/ssr` 0.8.0 |

### Supabase Auth Configuration

- Email/password sign-in: enabled
- Magic link sign-in: configurable via `VITE_AUTH_MAGIC_LINK` (default: false)
- Public sign-up: disabled (`enable_signup = false`) -- invite-only model
- Email confirmation: required
- Double-confirm email changes: enabled
- MFA/TOTP: disabled
- OAuth providers: Apple configured (disabled by default); supports Apple, Azure, Bitbucket, Discord, Facebook, GitHub, GitLab, Google, Keycloak, LinkedIn, Notion, Twitch, Twitter, Slack, Spotify, WorkOS, Zoom
- JWT expiry: 3600 seconds (1 hour)

## Email Providers

Pluggable mailer system with two supported providers:

| Provider | Config | Usage |
|----------|--------|-------|
| Nodemailer | `MAILER_PROVIDER=nodemailer` | Default for local dev; SMTP-based |
| Resend | `MAILER_PROVIDER=resend` | Production email API |

Local development uses Supabase's Inbucket email testing server (SMTP port 54325, web UI port 54324).

## AI / LLM Services

### Anthropic (Claude)

- SDK: `@ai-sdk/anthropic` 3.0.64
- Used via Vercel AI SDK (`ai` 6.0.141)
- API endpoints: `/api/ai/chat`, `/api/ai/form-assist`
- Auth: `ANTHROPIC_API_KEY` environment variable

### MCP Server (`@aloha/mcp-server`)

Custom Model Context Protocol server providing AI tooling access to the codebase:

| Tool Module | Purpose |
|-------------|---------|
| `database` | Database schema inspection and queries (via `postgres` 3.4.7 driver) |
| `migrations` | Migration file management |
| `components` | UI component discovery |
| `scripts` | Script execution |
| `prd-manager` | Product requirements document management |
| `prompts` | Prompt templates system |

Transport: stdio (designed for local AI tool use with Claude Code or similar).

## Webhook Integration

- **Database webhooks**: `/api/db/webhook` endpoint receives Supabase database webhook events
- Authenticated via `SUPABASE_DB_WEBHOOK_SECRET`

## CSRF Protection

- `@edge-csrf/core` 2.5.3-cloudflare-rc1
- Token generated in root loader, validated on mutations

## Environment Variables

### Public (bundled into client via `VITE_` prefix)

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_URL` | Base URL of the application |
| `VITE_PRODUCT_NAME` | Product name displayed in UI |
| `VITE_SITE_TITLE` | HTML page title |
| `VITE_SITE_DESCRIPTION` | Meta description |
| `VITE_DEFAULT_THEME_MODE` | Default theme (light/dark) |
| `VITE_THEME_COLOR` | Light mode theme color |
| `VITE_THEME_COLOR_DARK` | Dark mode theme color |
| `VITE_AUTH_PASSWORD` | Enable password auth (true/false) |
| `VITE_AUTH_MAGIC_LINK` | Enable magic link auth (true/false) |
| `VITE_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX` | Show T&C checkbox on signup |
| `VITE_LOCALES_PATH` | Path to locale JSON files |
| `VITE_ENABLE_THEME_TOGGLE` | Show theme switcher |
| `VITE_ENABLE_TEAM_ACCOUNTS` | Enable multi-org support |
| `VITE_ENABLE_TEAM_ACCOUNTS_DELETION` | Allow org deletion |
| `VITE_ENABLE_TEAM_ACCOUNTS_CREATION` | Allow org creation |
| `VITE_LANGUAGE_PRIORITY` | Language detection priority |
| `VITE_ENABLE_SIDEBAR_TRIGGER` | Show sidebar toggle |
| `VITE_SUPABASE_URL` | Supabase API URL |
| `VITE_SUPABASE_PUBLIC_KEY` | Supabase anonymous/public key |

### Server-only (never bundled)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SECRET_KEY` | Supabase service role key (admin access) |
| `SUPABASE_DB_WEBHOOK_SECRET` | Webhook signature verification |
| `ANTHROPIC_API_KEY` | Claude API authentication |
| `MAILER_PROVIDER` | Email provider selection (`nodemailer` or `resend`) |
| `EMAIL_SENDER` | From address for outgoing email |
| `EMAIL_HOST` | SMTP host (for nodemailer) |
| `EMAIL_PORT` | SMTP port (for nodemailer) |
| `EMAIL_TLS` | SMTP TLS setting |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASSWORD` | SMTP password |
| `CONTACT_EMAIL` | Recipient for contact form submissions |
| `LOGGER` | Logger implementation selection |

### Turborepo Global Env (cache-busting)

These variables are declared in `turbo.json` `globalEnv` so changes invalidate the build cache:

`ANTHROPIC_API_KEY`, `VITE_PRODUCT_NAME`, `VITE_SITE_URL`, `LOGGER`, `SUPABASE_DB_WEBHOOK_SECRET`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Deployment Targets

| Target | Status | Details |
|--------|--------|---------|
| Vercel | Available (commented out) | Preset in `react-router.config.ts` (`@vercel/react-router/vite`) |
| Self-hosted Node.js | Active | `react-router-serve ./build/server/index.js` |
| Supabase (hosted) | Active | Project `kfwqtaazdankxmdlqdak`; deploy via `supabase db push` |
| Docker | Not configured | No Dockerfile present |

SSR is enabled (`ssr: true` in `react-router.config.ts`). Production build outputs to `build/server/index.js`.

## Third-Party SDK Summary

| SDK | Version | Integration Point |
|-----|---------|-------------------|
| `@supabase/supabase-js` | 2.89.0 | Database, auth, storage, real-time |
| `@supabase/ssr` | 0.8.0 | Server-side Supabase client |
| `@ai-sdk/anthropic` | 3.0.64 | Claude LLM provider |
| `ai` (Vercel AI SDK) | 6.0.141 | AI streaming and tool use |
| `@ai-sdk/react` | 3.0.143 | React hooks for AI chat/completion |
| `@modelcontextprotocol/sdk` | 1.24.3 | MCP server for AI tooling |
| `postgres` | 3.4.7 | Direct PostgreSQL driver (MCP server only) |
| `@edge-csrf/core` | 2.5.3-cloudflare-rc1 | CSRF token generation/validation |
| `nodemailer` | (referenced) | SMTP email sending |
| `isbot` | 5.1.32 | Bot detection in SSR entry |
