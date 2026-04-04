/** Row shape from app_navigation view */
export interface AppNavigationRow {
  org_id: string;
  module_id: string;
  module_slug: string;
  module_display_name: string;
  module_display_order: number;
  sub_module_id: string;
  sub_module_slug: string;
  sub_module_display_name: string;
  sub_module_display_order: number;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

/** Module derived from app_navigation rows (grouped by module_slug) */
export interface AppNavModule {
  module_id: string;
  org_id: string;
  module_slug: string;
  display_name: string;
  display_order: number;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

/** Sub-module derived from app_navigation rows */
export interface AppNavSubModule {
  sub_module_id: string;
  org_id: string;
  module_slug: string;
  sub_module_slug: string;
  display_name: string;
  display_order: number;
}

/** Module permissions for component-level access gates */
export interface ModulePermissions {
  module_slug: string;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}
