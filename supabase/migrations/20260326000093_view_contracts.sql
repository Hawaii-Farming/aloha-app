-- View Contracts: Template <-> Consumer Schema Bridge
-- The template queries these views with known column contracts.
-- Consumers write SQL views that map their schema into these shapes.
-- See: .planning/phases/02-auth-and-multi-org-foundation/02-RESEARCH.md
--
-- IMPORTANT: All views use security_invoker=true so RLS on underlying
-- tables still applies. Each view also filters on auth.uid() as defense-in-depth.

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
