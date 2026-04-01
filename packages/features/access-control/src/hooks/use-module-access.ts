'use client';

import { useMemo } from 'react';

import { useRouteLoaderData } from 'react-router';

interface ModulePermissions {
  module_slug: string;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

/**
 * Read module permissions from the current sub-module route's loader data.
 *
 * The sub-module route loader returns `moduleAccess` which contains
 * the permission flags from the app_nav_modules view.
 *
 * Returns null if no module access data is available (e.g., not on a module route).
 */
export function useModuleAccess(): ModulePermissions | null {
  const listData = useRouteLoaderData(
    'routes/home/account/modules/sub-module',
  ) as { moduleAccess?: ModulePermissions } | undefined;
  const detailData = useRouteLoaderData(
    'routes/home/account/modules/sub-module-detail',
  ) as { moduleAccess?: ModulePermissions } | undefined;
  const createData = useRouteLoaderData('sub-module-create') as
    | { moduleAccess?: ModulePermissions }
    | undefined;
  const editData = useRouteLoaderData('sub-module-edit') as
    | { moduleAccess?: ModulePermissions }
    | undefined;

  return useMemo(() => {
    const routeData = listData ?? detailData ?? createData ?? editData;
    if (!routeData?.moduleAccess) return null;

    const { module_slug, can_edit, can_delete, can_verify } =
      routeData.moduleAccess;

    return { module_slug, can_edit, can_delete, can_verify };
  }, [listData, detailData, createData, editData]);
}

/**
 * Check a specific permission on the current module.
 *
 * Returns false if no module access data is available.
 */
export function useHasPermission(
  permission: 'can_edit' | 'can_delete' | 'can_verify',
): boolean {
  const access = useModuleAccess();
  return access?.[permission] ?? false;
}
