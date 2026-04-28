/** Row shape from hr_rba_navigation view. The Proper Case `id` is also
 *  the display name, URL segment, and registry/icon lookup key — there
 *  are no separate slug or display_name columns. */
export interface AppNavigationRow {
  org_id: string;
  module_id: string;
  module_display_order: number;
  sub_module_id: string;
  sub_module_display_order: number;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

/** Module derived from hr_rba_navigation rows (grouped by module_slug) */
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

/** Sub-module derived from hr_rba_navigation rows */
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
