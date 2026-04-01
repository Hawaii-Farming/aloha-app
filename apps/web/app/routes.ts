import { type RouteConfig, layout, route } from '@react-router/dev/routes';

const rootRoutes = [
  route('', 'routes/index.ts'),
  route('version', 'routes/version.ts'),
  route('healthcheck', 'routes/healthcheck.ts'),
  route('home', 'routes/home/index.tsx'),
  route('update-password', 'routes/update-password.tsx'),
  route('no-access', 'routes/no-access.tsx'),
];

const apiRoutes = [
  route('api/db/webhook', 'routes/api/db/webhook.ts'),
  route('api/ai/chat', 'routes/api/ai/chat.ts'),
  route('api/ai/form-assist', 'routes/api/ai/form-assist.ts'),
];

const authLayout = layout('routes/auth/layout.tsx', [
  route('auth/sign-in', 'routes/auth/sign-in.tsx'),
  route('auth/sign-up', 'routes/auth/sign-up.tsx'),
  route('auth/password-reset', 'routes/auth/password-reset.tsx'),
  route('auth/verify', 'routes/auth/verify.tsx'),
  route('auth/callback', 'routes/auth/callback.tsx'),
  route('auth/callback/error', 'routes/auth/callback-error.tsx'),
  route('auth/confirm', 'routes/auth/confirm.tsx'),
]);

const teamAccountLayout = layout('routes/home/account/layout.tsx', [
  route('home/:account', 'routes/home/account/index.tsx'),
  // Static routes MUST come before dynamic catch-all
  route('home/:account/settings', 'routes/home/account/settings.tsx'),
  // Dynamic module routes — specific patterns before catch-all
  route('home/:account/:module', 'routes/home/account/modules/module.tsx'),
  route(
    'home/:account/:module/:subModule/create',
    'routes/home/account/modules/sub-module-create.tsx',
    { id: 'sub-module-create' },
  ),
  route(
    'home/:account/:module/:subModule/:recordId/edit',
    'routes/home/account/modules/sub-module-create.tsx',
    { id: 'sub-module-edit' },
  ),
  route(
    'home/:account/:module/:subModule/:recordId',
    'routes/home/account/modules/sub-module-detail.tsx',
  ),
  route(
    'home/:account/:module/:subModule',
    'routes/home/account/modules/sub-module.tsx',
  ),
]);

export default [
  ...rootRoutes,
  ...apiRoutes,
  authLayout,
  teamAccountLayout,
] satisfies RouteConfig;
