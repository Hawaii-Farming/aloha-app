# Technology Stack

## Languages

| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | 5.9.3 | All application code, packages, and tooling |
| SQL (PostgreSQL) | 15 (via Supabase) | Database schemas, migrations, RLS policies, views |
| CSS | Via Tailwind CSS v4 | Utility-first styling; no raw CSS files |

## Runtime Environment

| Component | Version |
|-----------|---------|
| Node.js | >=20.x (root), >=18.x (web app) |
| Package manager | pnpm 10.18.1 |
| Lockfile | `pnpm-lock.yaml` |
| Workspace config | `pnpm-workspace.yaml` with catalog pinning |

## Core Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.3 | UI rendering |
| React Router | 7.12.0 | SSR/Framework mode routing (`@react-router/dev`, `@react-router/fs-routes`, `@react-router/node`, `@react-router/serve`) |
| Vite | 7.3.0 | Build tool and dev server |
| Tailwind CSS | 4.1.18 | Utility-first CSS framework (with `@tailwindcss/vite` 4.1.18) |
| Turborepo | 2.6.2 | Monorepo task orchestration |

## UI Component Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Radix UI (`radix-ui`) | 1.4.3 | Headless UI primitives (via Shadcn UI) |
| `@radix-ui/react-icons` | 1.3.2 | Icon set |
| Lucide React | 0.562.0 | Icon library |
| `cmdk` | 1.1.1 | Command palette component |
| `input-otp` | 1.4.2 | OTP input component |
| `react-day-picker` | 9.13.0 | Date picker component |
| `react-top-loading-bar` | 3.0.2 | Page loading indicator |
| `next-themes` | 0.4.6 | Dark/light/system theme switching |
| `sonner` | 2.0.7 | Toast notifications |
| `tw-animate-css` | 1.4.0 | Tailwind animation utilities |
| `class-variance-authority` | 0.7.1 | Component variant styling |
| `tailwind-merge` | 3.4.0 | Tailwind class deduplication |
| `clsx` | 2.1.1 | Conditional class joining |
| Recharts | (referenced in CLAUDE.md) | Charting library |

## Data & State Management

| Library | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | 2.89.0 | Database client and auth |
| `@supabase/ssr` | 0.8.0 | SSR-compatible Supabase client helpers |
| `@tanstack/react-query` | 5.90.12 | Client-side async state / data fetching |
| `@tanstack/react-table` | 8.21.3 | Headless data table primitives |
| React Hook Form | 7.69.0 | Form state management |
| `@hookform/resolvers` | 5.2.2 | Zod resolver for form validation |
| Zod | 3.25.74 (catalog), overridden to 3.25.76 | Schema validation |

## AI & LLM

| Library | Version | Purpose |
|---------|---------|---------|
| `ai` (Vercel AI SDK) | 6.0.141 | AI framework / streaming |
| `@ai-sdk/anthropic` | 3.0.64 | Anthropic provider for AI SDK |
| `@ai-sdk/react` | 3.0.143 | React hooks for AI SDK |
| `@modelcontextprotocol/sdk` | 1.24.3 | MCP server implementation |

## Internationalization

| Library | Version | Purpose |
|---------|---------|---------|
| i18next | (referenced in CLAUDE.md) | i18n framework |
| `react-i18next` | 16.5.0 | React bindings for i18next |
| `i18next-resources-to-backend` | 1.2.1 | Lazy locale loading |
| `i18next-browser-languagedetector` | (referenced in CLAUDE.md) | Auto language detection |

## Server & Infrastructure

| Library | Version | Purpose |
|---------|---------|---------|
| Pino | 10.1.0 | Structured server-side logging |
| `@edge-csrf/core` | 2.5.3-cloudflare-rc1 | CSRF protection |
| `isbot` | 5.1.32 | Bot detection in server entry |
| `cross-env` | 10.1.0 | Cross-platform env vars |
| `dotenv-cli` | 11.0.0 | Local `.env` loading |
| `date-fns` | 4.1.0 | Date utility library |

## Database

| Component | Details |
|-----------|---------|
| Engine | PostgreSQL 15 (via Supabase) |
| Client | `@supabase/supabase-js` 2.89.0 |
| ORM | None (direct Supabase client queries) |
| Type generation | `supabase gen types typescript --local` |
| Migrations | SQL files in `supabase/migrations/` |
| Schema files | `supabase/schemas/*.sql` (numbered 00-06) |
| RLS | Row Level Security on all tables via org-scoped policies |
| MCP database driver | `postgres` 3.4.7 (in MCP server package) |

## Build Tools & Dev Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 7.3.0 | Dev server and production bundler |
| `@react-router/dev` | 7.12.0 | React Router Vite plugin |
| `vite-tsconfig-paths` | 6.0.3 | Path alias resolution in Vite |
| Turborepo | 2.6.2 | Monorepo build orchestration |
| ESLint | 9.39.2 | Linting (flat config format) |
| `typescript-eslint` | 8.50.0 | TypeScript ESLint rules |
| `eslint-config-turbo` | 2.7.0 | Turborepo-aware lint rules |
| `eslint-plugin-react` | 7.37.5 | React-specific lint rules |
| `eslint-plugin-react-hooks` | 7.0.1 | React Hooks lint rules |
| `eslint-import-resolver-typescript` | 4.4.4 | TS import resolution for ESLint |
| `eslint-plugin-import` | 2.32.0 | Import order and validation |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Accessibility lint rules |
| Prettier | 3.7.4 | Code formatting |
| `@trivago/prettier-plugin-sort-imports` | 6.0.0 | Import sorting |
| `prettier-plugin-tailwindcss` | 0.7.2 | Tailwind class sorting |

## Testing

| Tool | Version | Purpose |
|------|---------|---------|
| Playwright | 1.57.0 | End-to-end browser tests (`e2e/` package) |
| Supabase pgTAP | (via Supabase CLI) | Database unit tests (`supabase db test`) |

## CI/CD

No CI/CD configuration found (no `.github/workflows/`, `vercel.json`, or `Dockerfile`). Deployment is supported via:

- Vercel preset available but commented out in `react-router.config.ts`
- `react-router-serve` for self-hosted SSR (`pnpm start`)
- Supabase CLI for database deployment (`pnpm supabase:deploy`)

## Monorepo Structure

```
aloha-app/                     # Root workspace (React Router app)
  packages/
    ui/                        # @aloha/ui - Shadcn + custom components
    mcp-server/                # @aloha/mcp-server - MCP server for AI tooling
  tooling/
    eslint/                    # @aloha/eslint-config
    prettier/                  # @aloha/prettier-config
    tailwind/                  # @aloha/tailwind-config
    typescript/                # @aloha/tsconfig
  e2e/                         # web-e2e - Playwright tests
  supabase/                    # Database schemas, migrations, seeds
```
