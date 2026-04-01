-- RLS Policies and Grants for core tables
--
-- Table definitions are in migrations (20260326000001 through 20260326000091).
-- This file only sets up RLS policies and grants that the migrations don't cover.

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.org ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_access_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_sub_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_sub_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_module_access ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read orgs they belong to
CREATE POLICY "org_read" ON public.org FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = org.id AND e.user_id = auth.uid() AND e.is_deleted = false
  ));

-- RLS: authenticated users can read their own employee records
CREATE POLICY "employee_read" ON public.hr_employee FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_deleted = false);

-- RLS: system lookup tables readable by any authenticated user
CREATE POLICY "sys_access_level_read" ON public.sys_access_level
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sys_module_read" ON public.sys_module
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sys_sub_module_read" ON public.sys_sub_module
  FOR SELECT TO authenticated USING (true);

-- RLS: org-scoped tables readable by employees of that org
CREATE POLICY "org_module_read" ON public.org_module
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = org_module.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

CREATE POLICY "org_sub_module_read" ON public.org_sub_module
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = org_sub_module.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

-- RLS: hr_module_access readable by the employee it belongs to
CREATE POLICY "hr_module_access_read" ON public.hr_module_access
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.id = hr_module_access.hr_employee_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT ON public.org TO authenticated;
GRANT SELECT ON public.sys_access_level TO authenticated;
GRANT SELECT ON public.hr_employee TO authenticated;
GRANT SELECT ON public.sys_module TO authenticated;
GRANT SELECT ON public.sys_sub_module TO authenticated;
GRANT SELECT ON public.org_module TO authenticated;
GRANT SELECT ON public.org_sub_module TO authenticated;
GRANT SELECT ON public.hr_module_access TO authenticated;
