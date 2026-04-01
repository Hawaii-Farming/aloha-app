-- Phase 2, Wave 1: Enable RLS on Organization & HR tables (11 tables)
-- Pattern: org-scoped SELECT/INSERT/UPDATE using user_has_org_access(org_id)
-- No DELETE policies — soft delete via UPDATE (is_deleted = true)

-- ============================================================
-- 1. org_farm
-- ============================================================
ALTER TABLE public.org_farm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_farm_select" ON public.org_farm
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "org_farm_insert" ON public.org_farm
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "org_farm_update" ON public.org_farm
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.org_farm TO authenticated;

-- ============================================================
-- 2. org_site
-- ============================================================
ALTER TABLE public.org_site ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_site_select" ON public.org_site
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "org_site_insert" ON public.org_site
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "org_site_update" ON public.org_site
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.org_site TO authenticated;

-- ============================================================
-- 3. org_equipment
-- ============================================================
ALTER TABLE public.org_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_equipment_select" ON public.org_equipment
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "org_equipment_insert" ON public.org_equipment
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "org_equipment_update" ON public.org_equipment
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.org_equipment TO authenticated;

-- ============================================================
-- 4. org_business_rule
-- ============================================================
ALTER TABLE public.org_business_rule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_business_rule_select" ON public.org_business_rule
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "org_business_rule_insert" ON public.org_business_rule
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "org_business_rule_update" ON public.org_business_rule
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.org_business_rule TO authenticated;

-- ============================================================
-- 5. hr_department
-- ============================================================
ALTER TABLE public.hr_department ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_department_select" ON public.hr_department
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_department_insert" ON public.hr_department
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_department_update" ON public.hr_department
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_department TO authenticated;

-- ============================================================
-- 6. hr_title
-- ============================================================
ALTER TABLE public.hr_title ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_title_select" ON public.hr_title
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_title_insert" ON public.hr_title
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_title_update" ON public.hr_title
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_title TO authenticated;

-- ============================================================
-- 7. hr_payroll
-- ============================================================
ALTER TABLE public.hr_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_payroll_select" ON public.hr_payroll
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_payroll_insert" ON public.hr_payroll
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_payroll_update" ON public.hr_payroll
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_payroll TO authenticated;

-- ============================================================
-- 8. hr_disciplinary_warning
-- ============================================================
ALTER TABLE public.hr_disciplinary_warning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_disciplinary_warning_select" ON public.hr_disciplinary_warning
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_disciplinary_warning_insert" ON public.hr_disciplinary_warning
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_disciplinary_warning_update" ON public.hr_disciplinary_warning
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_disciplinary_warning TO authenticated;

-- ============================================================
-- 9. hr_time_off_request
-- ============================================================
ALTER TABLE public.hr_time_off_request ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_time_off_request_select" ON public.hr_time_off_request
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_time_off_request_insert" ON public.hr_time_off_request
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_time_off_request_update" ON public.hr_time_off_request
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_time_off_request TO authenticated;

-- ============================================================
-- 10. hr_travel_request
-- ============================================================
ALTER TABLE public.hr_travel_request ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_travel_request_select" ON public.hr_travel_request
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_travel_request_insert" ON public.hr_travel_request
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_travel_request_update" ON public.hr_travel_request
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_travel_request TO authenticated;

-- ============================================================
-- 11. hr_work_authorization
-- ============================================================
ALTER TABLE public.hr_work_authorization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_work_authorization_select" ON public.hr_work_authorization
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "hr_work_authorization_insert" ON public.hr_work_authorization
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "hr_work_authorization_update" ON public.hr_work_authorization
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.hr_work_authorization TO authenticated;
