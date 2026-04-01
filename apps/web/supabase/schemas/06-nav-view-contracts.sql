-- Nav View Contracts: Navigation + Access Control
-- The template queries these views with known column contracts.
-- Consumers write SQL views that map their schema into these shapes.
--
-- IMPORTANT: All views use security_invoker=true so RLS on underlying
-- tables still applies. Each view also filters on auth.uid() as defense-in-depth.
-- IMPORTANT: Views return ALL modules/sub-modules for the user across ALL orgs.
-- The workspace loader MUST filter by org_id at query time.

CREATE OR REPLACE VIEW public.app_nav_modules
WITH (security_invoker = true)
AS
SELECT
  om.id               AS module_id,
  om.org_id            AS org_id,
  om.sys_module_id     AS module_slug,
  om.display_name      AS display_name,
  om.display_order     AS display_order,
  hma.can_edit         AS can_edit,
  hma.can_delete       AS can_delete,
  hma.can_verify       AS can_verify
FROM public.org_module om
JOIN public.hr_module_access hma
  ON hma.org_module_id = om.id
  AND hma.is_enabled = true
  AND hma.is_deleted = false
JOIN public.hr_employee e
  ON e.id = hma.hr_employee_id
  AND e.user_id = auth.uid()
  AND e.is_deleted = false
WHERE om.is_enabled = true
  AND om.is_deleted = false;

CREATE OR REPLACE VIEW public.app_nav_sub_modules
WITH (security_invoker = true)
AS
SELECT
  osm.id                AS sub_module_id,
  osm.org_id            AS org_id,
  osm.sys_module_id     AS module_slug,
  osm.sys_sub_module_id AS sub_module_slug,
  osm.display_name      AS display_name,
  osm.display_order     AS display_order
FROM public.org_sub_module osm
JOIN public.hr_employee e
  ON e.org_id = osm.org_id
  AND e.user_id = auth.uid()
  AND e.is_deleted = false
JOIN public.sys_access_level sal_user
  ON sal_user.id = e.sys_access_level_id
JOIN public.sys_access_level sal_required
  ON sal_required.id = osm.sys_access_level_id
WHERE osm.is_enabled = true
  AND osm.is_deleted = false
  AND sal_user.level >= sal_required.level;

GRANT SELECT ON public.app_nav_modules TO authenticated;
GRANT SELECT ON public.app_nav_sub_modules TO authenticated;
