/**
 * Nav View Contract Types
 *
 * These interfaces document the expected column shapes for the SQL views
 * that provide navigation and access control data. When database.types.ts
 * is populated via `pnpm supabase:web:typegen`, prefer using
 * `Tables<'app_nav_modules'>` etc. These interfaces serve as
 * documentation and fallback.
 *
 * See: apps/web/supabase/schemas/20-nav-view-contracts.sql
 */

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
