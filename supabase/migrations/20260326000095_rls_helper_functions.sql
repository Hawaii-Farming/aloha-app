-- RLS Helper Functions
--
-- Centralizes org-membership checks used by all RLS policies.
-- All functions are SECURITY DEFINER with pinned search_path to prevent injection.

-- Returns array of org_ids the current user belongs to
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(org_id), '{}')
  FROM public.hr_employee
  WHERE user_id = auth.uid()
    AND is_deleted = false;
$$;

-- Returns true if the current user belongs to the given org
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hr_employee
    WHERE org_id = target_org_id
      AND user_id = auth.uid()
      AND is_deleted = false
  );
$$;

-- Returns the hr_employee.id for the current user in a given org
CREATE OR REPLACE FUNCTION public.get_user_employee_id(target_org_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.hr_employee
  WHERE org_id = target_org_id
    AND user_id = auth.uid()
    AND is_deleted = false
  LIMIT 1;
$$;

-- Returns the numeric access level (1-5) for the current user in a given org
CREATE OR REPLACE FUNCTION public.get_user_access_level(target_org_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sal.level
  FROM public.hr_employee e
  JOIN public.sys_access_level sal ON sal.id = e.sys_access_level_id
  WHERE e.org_id = target_org_id
    AND e.user_id = auth.uid()
    AND e.is_deleted = false
  LIMIT 1;
$$;

-- Grants: allow authenticated users to call the helper functions
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_employee_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_access_level(TEXT) TO authenticated;
