-- Phase 2, Wave 3: Enable RLS on Grow module tables (24 tables)
-- Pattern: org-scoped SELECT/INSERT/UPDATE using user_has_org_access(org_id)
-- No DELETE policies — soft delete via UPDATE (is_deleted = true)

-- ============================================================
-- 1. grow_variety
-- ============================================================
ALTER TABLE public.grow_variety ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_variety_select" ON public.grow_variety
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_variety_insert" ON public.grow_variety
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_variety_update" ON public.grow_variety
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_variety TO authenticated;

-- ============================================================
-- 2. grow_grade
-- ============================================================
ALTER TABLE public.grow_grade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_grade_select" ON public.grow_grade
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_grade_insert" ON public.grow_grade
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_grade_update" ON public.grow_grade
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_grade TO authenticated;

-- ============================================================
-- 3. grow_cycle_pattern
-- ============================================================
ALTER TABLE public.grow_cycle_pattern ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_cycle_pattern_select" ON public.grow_cycle_pattern
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_cycle_pattern_insert" ON public.grow_cycle_pattern
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_cycle_pattern_update" ON public.grow_cycle_pattern
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_cycle_pattern TO authenticated;

-- ============================================================
-- 4. grow_disease
-- ============================================================
ALTER TABLE public.grow_disease ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_disease_select" ON public.grow_disease
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_disease_insert" ON public.grow_disease
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_disease_update" ON public.grow_disease
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_disease TO authenticated;

-- ============================================================
-- 5. grow_pest
-- ============================================================
ALTER TABLE public.grow_pest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_pest_select" ON public.grow_pest
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_pest_insert" ON public.grow_pest
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_pest_update" ON public.grow_pest
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_pest TO authenticated;

-- ============================================================
-- 6. grow_trial_type
-- ============================================================
ALTER TABLE public.grow_trial_type ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_trial_type_select" ON public.grow_trial_type
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_trial_type_insert" ON public.grow_trial_type
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_trial_type_update" ON public.grow_trial_type
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_trial_type TO authenticated;

-- ============================================================
-- 7. grow_seed_batch
-- ============================================================
ALTER TABLE public.grow_seed_batch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_seed_batch_select" ON public.grow_seed_batch
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_seed_batch_insert" ON public.grow_seed_batch
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_seed_batch_update" ON public.grow_seed_batch
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_seed_batch TO authenticated;

-- ============================================================
-- 8. grow_seed_mix
-- ============================================================
ALTER TABLE public.grow_seed_mix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_seed_mix_select" ON public.grow_seed_mix
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_seed_mix_insert" ON public.grow_seed_mix
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_seed_mix_update" ON public.grow_seed_mix
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_seed_mix TO authenticated;

-- ============================================================
-- 9. grow_seed_mix_item
-- ============================================================
ALTER TABLE public.grow_seed_mix_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_seed_mix_item_select" ON public.grow_seed_mix_item
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_seed_mix_item_insert" ON public.grow_seed_mix_item
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_seed_mix_item_update" ON public.grow_seed_mix_item
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_seed_mix_item TO authenticated;

-- ============================================================
-- 10. grow_task_seed_batch
-- ============================================================
ALTER TABLE public.grow_task_seed_batch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_task_seed_batch_select" ON public.grow_task_seed_batch
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_task_seed_batch_insert" ON public.grow_task_seed_batch
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_task_seed_batch_update" ON public.grow_task_seed_batch
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_task_seed_batch TO authenticated;

-- ============================================================
-- 11. grow_fertigation
-- ============================================================
ALTER TABLE public.grow_fertigation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_fertigation_select" ON public.grow_fertigation
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_insert" ON public.grow_fertigation
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_update" ON public.grow_fertigation
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_fertigation TO authenticated;

-- ============================================================
-- 12. grow_fertigation_recipe
-- ============================================================
ALTER TABLE public.grow_fertigation_recipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_fertigation_recipe_select" ON public.grow_fertigation_recipe
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_recipe_insert" ON public.grow_fertigation_recipe
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_recipe_update" ON public.grow_fertigation_recipe
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_fertigation_recipe TO authenticated;

-- ============================================================
-- 13. grow_fertigation_recipe_item
-- ============================================================
ALTER TABLE public.grow_fertigation_recipe_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_fertigation_recipe_item_select" ON public.grow_fertigation_recipe_item
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_recipe_item_insert" ON public.grow_fertigation_recipe_item
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_recipe_item_update" ON public.grow_fertigation_recipe_item
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_fertigation_recipe_item TO authenticated;

-- ============================================================
-- 14. grow_fertigation_recipe_site
-- ============================================================
ALTER TABLE public.grow_fertigation_recipe_site ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_fertigation_recipe_site_select" ON public.grow_fertigation_recipe_site
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_recipe_site_insert" ON public.grow_fertigation_recipe_site
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_fertigation_recipe_site_update" ON public.grow_fertigation_recipe_site
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_fertigation_recipe_site TO authenticated;

-- ============================================================
-- 15. grow_spray_compliance
-- ============================================================
ALTER TABLE public.grow_spray_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_spray_compliance_select" ON public.grow_spray_compliance
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_spray_compliance_insert" ON public.grow_spray_compliance
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_spray_compliance_update" ON public.grow_spray_compliance
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_spray_compliance TO authenticated;

-- ============================================================
-- 16. grow_spray_equipment
-- ============================================================
ALTER TABLE public.grow_spray_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_spray_equipment_select" ON public.grow_spray_equipment
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_spray_equipment_insert" ON public.grow_spray_equipment
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_spray_equipment_update" ON public.grow_spray_equipment
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_spray_equipment TO authenticated;

-- ============================================================
-- 17. grow_spray_input
-- ============================================================
ALTER TABLE public.grow_spray_input ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_spray_input_select" ON public.grow_spray_input
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_spray_input_insert" ON public.grow_spray_input
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_spray_input_update" ON public.grow_spray_input
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_spray_input TO authenticated;

-- ============================================================
-- 18. grow_task_photo
-- ============================================================
ALTER TABLE public.grow_task_photo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_task_photo_select" ON public.grow_task_photo
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_task_photo_insert" ON public.grow_task_photo
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_task_photo_update" ON public.grow_task_photo
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_task_photo TO authenticated;

-- ============================================================
-- 19. grow_monitoring_metric
-- ============================================================
ALTER TABLE public.grow_monitoring_metric ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_monitoring_metric_select" ON public.grow_monitoring_metric
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_monitoring_metric_insert" ON public.grow_monitoring_metric
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_monitoring_metric_update" ON public.grow_monitoring_metric
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_monitoring_metric TO authenticated;

-- ============================================================
-- 20. grow_monitoring_reading
-- ============================================================
ALTER TABLE public.grow_monitoring_reading ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_monitoring_reading_select" ON public.grow_monitoring_reading
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_monitoring_reading_insert" ON public.grow_monitoring_reading
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_monitoring_reading_update" ON public.grow_monitoring_reading
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_monitoring_reading TO authenticated;

-- ============================================================
-- 21. grow_scout_observation
-- ============================================================
ALTER TABLE public.grow_scout_observation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_scout_observation_select" ON public.grow_scout_observation
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_scout_observation_insert" ON public.grow_scout_observation
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_scout_observation_update" ON public.grow_scout_observation
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_scout_observation TO authenticated;

-- ============================================================
-- 22. grow_scout_observation_row
-- ============================================================
ALTER TABLE public.grow_scout_observation_row ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_scout_observation_row_select" ON public.grow_scout_observation_row
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_scout_observation_row_insert" ON public.grow_scout_observation_row
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_scout_observation_row_update" ON public.grow_scout_observation_row
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_scout_observation_row TO authenticated;

-- ============================================================
-- 23. grow_harvest_container
-- ============================================================
ALTER TABLE public.grow_harvest_container ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_harvest_container_select" ON public.grow_harvest_container
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_harvest_container_insert" ON public.grow_harvest_container
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_harvest_container_update" ON public.grow_harvest_container
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_harvest_container TO authenticated;

-- ============================================================
-- 24. grow_harvest_weight
-- ============================================================
ALTER TABLE public.grow_harvest_weight ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grow_harvest_weight_select" ON public.grow_harvest_weight
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "grow_harvest_weight_insert" ON public.grow_harvest_weight
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "grow_harvest_weight_update" ON public.grow_harvest_weight
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.grow_harvest_weight TO authenticated;
