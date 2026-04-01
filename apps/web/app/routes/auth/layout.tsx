import { Outlet } from 'react-router';

import { AuthLayoutShell } from '@aloha/auth/shared';

import { AppLogo } from '~/components/app-logo';

export default function AuthLayout() {
  return (
    <AuthLayoutShell Logo={AppLogo}>
      <Outlet />
    </AuthLayoutShell>
  );
}
