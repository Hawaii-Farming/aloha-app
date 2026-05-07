# syntax=docker/dockerfile:1.7

# ---- Stage 1: build ----
FROM node:20-slim AS build
RUN corepack enable
WORKDIR /app

# VITE_ vars are inlined at build time
ARG VITE_SITE_URL=http://localhost:5173
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLIC_KEY
ARG VITE_PRODUCT_NAME=Aloha
ARG VITE_SITE_TITLE="Aloha Agricultural ERP"
ARG VITE_SITE_DESCRIPTION="Multi-organization agricultural ERP for farm-to-customer operations."
ARG VITE_AUTH_PASSWORD=true
ARG VITE_AUTH_MAGIC_LINK=false
ARG VITE_ENABLE_THEME_TOGGLE=true
ARG VITE_ENABLE_TEAM_ACCOUNTS=true
ARG VITE_ENABLE_TEAM_ACCOUNTS_CREATION=true
ARG VITE_ENABLE_TEAM_ACCOUNTS_DELETION=true
ARG VITE_LANGUAGE_PRIORITY=application
ARG VITE_DEFAULT_THEME_MODE=light
ARG VITE_THEME_COLOR="#ffffff"
ARG VITE_THEME_COLOR_DARK="#0a0a0a"
ARG VITE_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX=false
ARG VITE_LOCALES_PATH=public/locales
ARG VITE_ENABLE_SIDEBAR_TRIGGER=false

# Install layer — cached as long as lockfile + workspace manifests don't
# change. Copying only manifests first means a typical app source edit
# does NOT re-run pnpm install (this stage was invalidated on every push
# under the previous `COPY . .` ordering).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY e2e/package.json ./e2e/package.json
RUN find packages -mindepth 2 ! -name 'package.json' ! -path '*/.*' -type f -delete \
    && find packages -type d -empty -delete

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Source layer — invalidated on app changes, but reuses the install layer.
COPY . .
RUN pnpm build

# ---- Stage 2: production ----
FROM node:20-slim AS production
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app ./

EXPOSE 8080
CMD ["pnpm", "start"]
