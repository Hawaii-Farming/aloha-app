import type { NavbarSearchItem } from '~/components/navbar-search';

import type { AppNavModule, AppNavSubModule } from './types';

interface BuildSearchItemsParams {
  account: string;
  modules: AppNavModule[];
  subModules: AppNavSubModule[];
}

export function buildNavbarSearchItems({
  account,
  modules,
  subModules,
}: BuildSearchItemsParams): NavbarSearchItem[] {
  return [
    ...modules.map((mod) => ({
      path: `/home/${account}/${mod.module_slug}`,
      label: mod.display_name,
      group: 'Modules',
    })),
    ...subModules.map((sm) => ({
      path: `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`,
      label: sm.display_name,
      group: 'Pages',
    })),
  ];
}
