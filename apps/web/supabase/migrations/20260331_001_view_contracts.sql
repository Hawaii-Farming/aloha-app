-- View Contracts: Template <-> Consumer Schema Bridge
-- The template queries these views with known column contracts.

CREATE OR REPLACE VIEW public.app_user_profile
WITH (security_invoker = true)
AS
SELECT
  e.id         AS employee_id,
  e.org_id     AS org_id,
  e.first_name AS first_name,
  e.last_name  AS last_name,
  e.user_id    AS auth_user_id,
  e.sys_access_level_id AS access_level_id
FROM public.hr_employee e
WHERE e.user_id IS NOT NULL
  AND e.user_id = auth.uid()
  AND e.is_deleted = false;

CREATE OR REPLACE VIEW public.app_user_orgs
WITH (security_invoker = true)
AS
SELECT
  o.id       AS org_id,
  o.name     AS org_name,
  e.user_id  AS auth_user_id
FROM public.hr_employee e
JOIN public.org o ON o.id = e.org_id
WHERE e.user_id IS NOT NULL
  AND e.user_id = auth.uid()
  AND e.is_deleted = false
  AND o.is_deleted = false;

CREATE OR REPLACE VIEW public.app_org_context
WITH (security_invoker = true)
AS
SELECT
  o.id       AS org_id,
  o.name     AS org_name,
  e.id       AS employee_id,
  e.user_id  AS auth_user_id,
  e.sys_access_level_id AS access_level_id
FROM public.hr_employee e
JOIN public.org o ON o.id = e.org_id
WHERE e.user_id IS NOT NULL
  AND e.user_id = auth.uid()
  AND e.is_deleted = false
  AND o.is_deleted = false;

GRANT SELECT ON public.app_user_profile TO authenticated;
GRANT SELECT ON public.app_user_orgs TO authenticated;
GRANT SELECT ON public.app_org_context TO authenticated;

-- Nav View Contracts: Navigation + Access Control

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
