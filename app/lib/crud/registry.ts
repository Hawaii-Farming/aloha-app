import type { CrudModuleConfig } from '~/lib/crud/types';

import { hrDepartmentConfig } from './hr-department.config';
import { invntItemConfig } from './invnt-item.config';

/**
 * Maps sub-module slugs (from URL params) to their CRUD configs.
 *
 * Each entry maps the sys_sub_module_id (used in URL routing)
 * to the CrudModuleConfig that tells the factory which Supabase
 * table/view to query and how to render columns/forms.
 */
const registry = new Map<string, CrudModuleConfig>([
  ['departments', hrDepartmentConfig],
  ['products', invntItemConfig],
]);

export function getModuleConfig(
  subModuleSlug: string,
): CrudModuleConfig | undefined {
  return registry.get(subModuleSlug);
}
