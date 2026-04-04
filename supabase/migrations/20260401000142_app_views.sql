-- App Views & RLS: Navigation & Access Control
-- ==============================================
-- RLS policies on hr_employee and org, plus one navigation view
-- that powers the frontend workspace shell.
--
-- View:
--   app_navigation — one row per accessible sub-module, with parent module
--                    info and ABAC permissions included on each row
--
-- Layers:
--   Layer 1 — Feature toggle: org_module.is_enabled / org_sub_module.is_enabled
--   Layer 2 — RBAC: employee access_level >= sub_module minimum_access_level
--   Layer 3 — ABAC: hr_module_access per-employee per-module permissions

-- ============================================================
-- Grants: authenticated role needs SELECT on underlying tables
-- ============================================================

GRANT SELECT ON public.org TO authenticated;
GRANT SELECT ON public.hr_employee TO authenticated;
GRANT SELECT ON public.sys_access_level TO authenticated;
GRANT SELECT ON public.sys_module TO authenticated;
GRANT SELECT ON public.sys_sub_module TO authenticated;
GRANT SELECT ON public.org_module TO authenticated;
GRANT SELECT ON public.org_sub_module TO authenticated;
GRANT SELECT ON public.hr_module_access TO authenticated;

-- ============================================================
-- Helper: get org_ids for the current user (SECURITY DEFINER
-- to avoid infinite recursion when called from hr_employee RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.hr_employee
  WHERE user_id = auth.uid()
    AND is_deleted = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;

-- ============================================================
-- RLS: hr_employee (org-scoped)
-- ============================================================
-- Any authenticated employee in the same org can read all employees.
-- This allows managers/admins to see the full roster.
-- Uses get_user_org_ids() to avoid self-referential recursion.
-- Write permissions are enforced in the app layer via hr_module_access.

ALTER TABLE public.hr_employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_employee_read" ON public.hr_employee
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- Write/update enforced in app layer via hr_module_access.
-- Mutations use service_role key, so no INSERT/UPDATE policies needed.

-- ============================================================
-- RLS: org (read by any authenticated user with membership)
-- ============================================================

ALTER TABLE public.org ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read" ON public.org
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_org_ids()));

-- ============================================================
-- app_navigation
-- ============================================================
-- Returns one row per accessible sub-module with parent module info.
-- Applies all three access control layers:
--   Layer 1 — org_module.is_enabled + org_sub_module.is_enabled
--   Layer 2 — employee access_level.level >= sub_module access_level.level
--   Layer 3 — hr_module_access.is_enabled + permission flags
--
-- Used by:
--   - Workspace loader: build sidebar (group rows by module_slug)
--   - requireModuleAccess: filter by org_id + module_slug (any row gives permissions)
--   - requireSubModuleAccess: filter by org_id + module_slug + sub_module_slug
--
-- module_slug     = sys_module.id      (e.g. 'human_resources')
-- sub_module_slug = sys_sub_module.id  (e.g. 'employees')

CREATE OR REPLACE VIEW public.app_navigation AS
SELECT
    om.org_id,
    -- Module columns
    om.id               AS module_id,
    sm.id               AS module_slug,
    om.display_name     AS module_display_name,
    om.display_order    AS module_display_order,
    -- Sub-module columns
    osm.id              AS sub_module_id,
    ssm.id              AS sub_module_slug,
    osm.display_name    AS sub_module_display_name,
    osm.display_order   AS sub_module_display_order,
    -- ABAC permissions (module-level)
    ma.can_edit,
    ma.can_delete,
    ma.can_verify
FROM public.hr_employee e
JOIN public.sys_access_level emp_al  ON emp_al.id = e.sys_access_level_id
JOIN public.org_sub_module osm       ON osm.org_id = e.org_id
JOIN public.org_module om            ON om.org_id = osm.org_id
                                    AND om.sys_module_id = osm.sys_module_id
JOIN public.sys_module sm            ON sm.id = osm.sys_module_id
JOIN public.sys_sub_module ssm       ON ssm.id = osm.sys_sub_module_id
JOIN public.sys_access_level req_al  ON req_al.id = osm.sys_access_level_id
JOIN public.hr_module_access ma      ON ma.hr_employee_id = e.id
                                    AND ma.org_module_id = om.id
WHERE e.user_id = auth.uid()
  AND e.is_deleted = false
  AND om.is_enabled = true          -- Layer 1: parent module enabled
  AND om.is_deleted = false
  AND osm.is_enabled = true         -- Layer 1: sub-module enabled
  AND osm.is_deleted = false
  AND ma.is_enabled = true          -- Layer 3: employee module access
  AND ma.is_deleted = false
  AND emp_al.level >= req_al.level; -- Layer 2: RBAC tier check

GRANT SELECT ON public.app_navigation TO authenticated;
