import { type RouteConfig, layout, route } from '@react-router/dev/routes';

const rootRoutes = [
  route('', 'routes/index.ts'),
  route('version', 'routes/version.ts'),
  route('healthcheck', 'routes/healthcheck.ts'),
  route('home', 'routes/workspace-redirect.tsx'),
  route('no-access', 'routes/no-access.tsx'),
];

const apiRoutes = [
  route('api/db/webhook', 'routes/api/db/webhook.ts'),
  route('api/ai/chat', 'routes/api/ai/chat.ts'),
  route('api/ai/form-assist', 'routes/api/ai/form-assist.ts'),
  route('api/schedule-history', 'routes/api/schedule-history.ts'),
  route('api/schedule-by-period', 'routes/api/schedule-by-period.ts'),
  route('api/housing-tenants', 'routes/api/housing-tenants.ts'),
];

const authLayout = layout('routes/auth/layout.tsx', [
  route('auth/sign-in', 'routes/auth/sign-in.tsx'),
  route('auth/password-reset', 'routes/auth/password-reset.tsx'),
  route('auth/update-password', 'routes/auth/update-password.tsx'),
  route('auth/callback', 'routes/auth/callback.tsx'),
  route('auth/callback/error', 'routes/auth/callback-error.tsx'),
]);

const workspaceLayout = layout('routes/workspace/layout.tsx', [
  route('home/:account', 'routes/workspace/home.tsx'),
  route('home/:account/settings', 'routes/workspace/settings.tsx'),
  route('home/:account/:module', 'routes/workspace/module.tsx'),
  route(
    'home/:account/:module/:subModule/create',
    'routes/workspace/sub-module-create.tsx',
    { id: 'sub-module-create' },
  ),
  route(
    'home/:account/:module/:subModule/:recordId/edit',
    'routes/workspace/sub-module-create.tsx',
    { id: 'sub-module-edit' },
  ),
  route(
    'home/:account/:module/:subModule/:recordId',
    'routes/workspace/sub-module-detail.tsx',
  ),
  route('home/:account/:module/:subModule', 'routes/workspace/sub-module.tsx'),
]);

export default [
  ...rootRoutes,
  ...apiRoutes,
  authLayout,
  workspaceLayout,
] satisfies RouteConfig;
