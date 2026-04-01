import { Outlet } from 'react-router';

import { AppLogo } from '~/components/app-logo';
import { AuthLayoutShell } from '~/components/auth/auth-layout';

export default function AuthLayout() {
  return (
    <AuthLayoutShell Logo={AppLogo}>
      <Outlet />
    </AuthLayoutShell>
  );
}
