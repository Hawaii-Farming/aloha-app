# Stage 1: Build
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

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Stage 2: Production (slim)
FROM node:20-slim AS production
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/tooling ./tooling
COPY --from=build /app/packages ./packages
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000
CMD ["npx", "react-router-serve", "./build/server/index.js"]
