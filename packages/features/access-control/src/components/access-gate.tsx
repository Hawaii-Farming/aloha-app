'use client';

import type { ReactNode } from 'react';

import { useModuleAccess } from '../hooks/use-module-access';

interface AccessGateProps {
  permission: 'can_edit' | 'can_delete' | 'can_verify';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on the current user's module permissions.
 *
 * Reads permissions from the nearest sub-module route loader data.
 * If no module access data is found, renders fallback (or nothing).
 */
export function AccessGate(props: AccessGateProps) {
  const access = useModuleAccess();

  if (!access || !access[props.permission]) {
    return props.fallback ?? null;
  }

  return props.children;
}
