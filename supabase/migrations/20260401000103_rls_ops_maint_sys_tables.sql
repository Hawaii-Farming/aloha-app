-- Phase 2, Wave 5: Enable RLS on Operations, Maintenance & System tables (16 tables)
-- Pattern: org-scoped SELECT/INSERT/UPDATE using user_has_org_access(org_id)
-- Exception: sys_uom uses public SELECT-only (system lookup table)
-- No DELETE policies — soft delete via UPDATE (is_deleted = true)

-- ============================================================
-- 1. ops_task
-- ============================================================
ALTER TABLE public.ops_task ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_task_select" ON public.ops_task
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_insert" ON public.ops_task
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_update" ON public.ops_task
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_task TO authenticated;

-- ============================================================
-- 2. ops_task_schedule
-- ============================================================
ALTER TABLE public.ops_task_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_task_schedule_select" ON public.ops_task_schedule
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_schedule_insert" ON public.ops_task_schedule
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_schedule_update" ON public.ops_task_schedule
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_task_schedule TO authenticated;

-- ============================================================
-- 3. ops_task_template
-- ============================================================
ALTER TABLE public.ops_task_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_task_template_select" ON public.ops_task_template
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_template_insert" ON public.ops_task_template
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_template_update" ON public.ops_task_template
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_task_template TO authenticated;

-- ============================================================
-- 4. ops_task_tracker
-- ============================================================
ALTER TABLE public.ops_task_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_task_tracker_select" ON public.ops_task_tracker
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_tracker_insert" ON public.ops_task_tracker
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_task_tracker_update" ON public.ops_task_tracker
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_task_tracker TO authenticated;

-- ============================================================
-- 5. ops_template
-- ============================================================
ALTER TABLE public.ops_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_template_select" ON public.ops_template
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_insert" ON public.ops_template
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_update" ON public.ops_template
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_template TO authenticated;

-- ============================================================
-- 6. ops_template_category
-- ============================================================
ALTER TABLE public.ops_template_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_template_category_select" ON public.ops_template_category
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_category_insert" ON public.ops_template_category
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_category_update" ON public.ops_template_category
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_template_category TO authenticated;

-- ============================================================
-- 7. ops_template_question
-- ============================================================
ALTER TABLE public.ops_template_question ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_template_question_select" ON public.ops_template_question
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_question_insert" ON public.ops_template_question
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_question_update" ON public.ops_template_question
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_template_question TO authenticated;

-- ============================================================
-- 8. ops_template_response
-- ============================================================
ALTER TABLE public.ops_template_response ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_template_response_select" ON public.ops_template_response
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_response_insert" ON public.ops_template_response
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_template_response_update" ON public.ops_template_response
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_template_response TO authenticated;

-- ============================================================
-- 9. ops_training
-- ============================================================
ALTER TABLE public.ops_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_training_select" ON public.ops_training
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_training_insert" ON public.ops_training
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_training_update" ON public.ops_training
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_training TO authenticated;

-- ============================================================
-- 10. ops_training_attendee
-- ============================================================
ALTER TABLE public.ops_training_attendee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_training_attendee_select" ON public.ops_training_attendee
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_training_attendee_insert" ON public.ops_training_attendee
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_training_attendee_update" ON public.ops_training_attendee
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_training_attendee TO authenticated;

-- ============================================================
-- 11. ops_training_type
-- ============================================================
ALTER TABLE public.ops_training_type ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_training_type_select" ON public.ops_training_type
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_training_type_insert" ON public.ops_training_type
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_training_type_update" ON public.ops_training_type
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_training_type TO authenticated;

-- ============================================================
-- 12. ops_corrective_action_choice
-- ============================================================
ALTER TABLE public.ops_corrective_action_choice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_corrective_action_choice_select" ON public.ops_corrective_action_choice
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_corrective_action_choice_insert" ON public.ops_corrective_action_choice
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_corrective_action_choice_update" ON public.ops_corrective_action_choice
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_corrective_action_choice TO authenticated;

-- ============================================================
-- 13. ops_corrective_action_taken
-- ============================================================
ALTER TABLE public.ops_corrective_action_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_corrective_action_taken_select" ON public.ops_corrective_action_taken
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "ops_corrective_action_taken_insert" ON public.ops_corrective_action_taken
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "ops_corrective_action_taken_update" ON public.ops_corrective_action_taken
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.ops_corrective_action_taken TO authenticated;

-- ============================================================
-- 14. maint_request
-- ============================================================
ALTER TABLE public.maint_request ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_request_select" ON public.maint_request
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "maint_request_insert" ON public.maint_request
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "maint_request_update" ON public.maint_request
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.maint_request TO authenticated;

-- ============================================================
-- 15. maint_request_invnt_item
-- ============================================================
ALTER TABLE public.maint_request_invnt_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_request_invnt_item_select" ON public.maint_request_invnt_item
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "maint_request_invnt_item_insert" ON public.maint_request_invnt_item
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "maint_request_invnt_item_update" ON public.maint_request_invnt_item
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.maint_request_invnt_item TO authenticated;

-- ============================================================
-- 16. sys_uom — System lookup table (public SELECT-only)
-- ============================================================
ALTER TABLE public.sys_uom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sys_uom_select" ON public.sys_uom
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.sys_uom TO authenticated;
