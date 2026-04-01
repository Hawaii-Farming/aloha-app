/**
 * View Contract Types
 *
 * These interfaces document the expected column shapes for the SQL views
 * that bridge the template and consumer schema. When database.types.ts
 * is populated via `pnpm supabase:web:typegen`, prefer using
 * `Tables<'app_user_profile'>` etc. These interfaces serve as
 * documentation and fallback for consumers who haven't run typegen yet.
 *
 * See: apps/web/supabase/schemas/18-view-contracts.sql
 */

/** Row shape from app_user_profile view */
export interface AppUserProfile {
  employee_id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  auth_user_id: string;
  access_level_id: string;
}

/** Row shape from app_user_orgs view */
export interface AppUserOrgs {
  org_id: string;
  org_name: string;
  auth_user_id: string;
}

/** Row shape from app_org_context view */
export interface AppOrgContext {
  org_id: string;
  org_name: string;
  employee_id: string;
  auth_user_id: string;
  access_level_id: string;
}
