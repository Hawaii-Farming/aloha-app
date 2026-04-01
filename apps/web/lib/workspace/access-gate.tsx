'use client';

import type { ReactNode } from 'react';

import { useModuleAccess } from './use-module-access';

interface AccessGateProps {
  permission: 'can_edit' | 'can_delete' | 'can_verify';
  children: ReactNode;
  fallback?: ReactNode;
}

export function AccessGate(props: AccessGateProps) {
  const access = useModuleAccess();

  if (!access || !access[props.permission]) {
    return props.fallback ?? null;
  }

  return props.children;
}
