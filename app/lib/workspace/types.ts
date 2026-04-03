/** Row shape from app_nav_modules view */
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

/** Row shape from app_nav_sub_modules view */
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
