'use client';

import { useMemo } from 'react';

import { useRouteLoaderData } from 'react-router';

interface ModulePermissions {
  module_slug: string;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

export function useModuleAccess(): ModulePermissions | null {
  const listData = useRouteLoaderData('routes/workspace/sub-module') as
    | { moduleAccess?: ModulePermissions }
    | undefined;
  const detailData = useRouteLoaderData(
    'routes/workspace/sub-module-detail',
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

export function useHasPermission(
  permission: 'can_edit' | 'can_delete' | 'can_verify',
): boolean {
  const access = useModuleAccess();
  return access?.[permission] ?? false;
}
