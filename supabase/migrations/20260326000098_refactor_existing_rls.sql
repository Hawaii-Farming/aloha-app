-- Refactor existing RLS policies to use helper functions.
-- Add INSERT/UPDATE policies to the 8 tables that currently only have SELECT.
-- No DELETE policies — soft delete via UPDATE (is_deleted = true) per convention.

-- ============================================================
-- 1. org — refactor SELECT, add INSERT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "org_read" ON public.org;
CREATE POLICY "org_read" ON public.org
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(id));

CREATE POLICY "org_insert" ON public.org
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(id));

CREATE POLICY "org_update" ON public.org
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(id));

GRANT INSERT, UPDATE ON public.org TO authenticated;

-- ============================================================
-- 2. hr_employee — refactor SELECT (user sees own records + same-org),
--    add INSERT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "employee_read" ON public.hr_employee;

-- Employees can see all employees in orgs they belong to
CREATE POLICY "employee_read" ON public.hr_employee
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "employee_insert" ON public.hr_employee
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "employee_update" ON public.hr_employee
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT INSERT, UPDATE ON public.hr_employee TO authenticated;

-- ============================================================
-- 3. org_module — refactor SELECT, add INSERT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "org_module_read" ON public.org_module;
CREATE POLICY "org_module_read" ON public.org_module
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "org_module_insert" ON public.org_module
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "org_module_update" ON public.org_module
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT INSERT, UPDATE ON public.org_module TO authenticated;

-- ============================================================
-- 4. org_sub_module — refactor SELECT, add INSERT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "org_sub_module_read" ON public.org_sub_module;
CREATE POLICY "org_sub_module_read" ON public.org_sub_module
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "org_sub_module_insert" ON public.org_sub_module
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "org_sub_module_update" ON public.org_sub_module
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT INSERT, UPDATE ON public.org_sub_module TO authenticated;

-- ============================================================
-- 5. hr_module_access — refactor SELECT, add INSERT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "hr_module_access_read" ON public.hr_module_access;

-- Employees can see module access for all employees in their org
CREATE POLICY "hr_module_access_read" ON public.hr_module_access
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_module_access_insert" ON public.hr_module_access
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_module_access_update" ON public.hr_module_access
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT INSERT, UPDATE ON public.hr_module_access TO authenticated;

-- ============================================================
-- System tables: no changes needed (SELECT-only with USING (true))
-- sys_access_level, sys_module, sys_sub_module keep existing policies
-- ============================================================
