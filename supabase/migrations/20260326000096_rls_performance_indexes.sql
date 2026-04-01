-- Performance indexes for RLS policy evaluation
--
-- Composite index on hr_employee for the primary RLS lookup pattern.
-- Covering index on sys_access_level for access level helper.
-- org_id indexes on all business tables missing them.

-- hr_employee: composite index for RLS helper function lookups
-- (user_id, org_id, is_deleted) covers the WHERE clause in all helper functions
CREATE INDEX IF NOT EXISTS idx_hr_employee_rls_lookup
  ON public.hr_employee (user_id, org_id, is_deleted);

-- sys_access_level: covering index for get_user_access_level()
CREATE INDEX IF NOT EXISTS idx_sys_access_level_id_level
  ON public.sys_access_level (id, level);

-- org_id indexes on business tables that are missing them (38 tables)

-- Growth module
CREATE INDEX IF NOT EXISTS idx_grow_cycle_pattern_org_id ON public.grow_cycle_pattern (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_disease_org_id ON public.grow_disease (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_fertigation_org_id ON public.grow_fertigation (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_fertigation_recipe_org_id ON public.grow_fertigation_recipe (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_fertigation_recipe_item_org_id ON public.grow_fertigation_recipe_item (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_fertigation_recipe_site_org_id ON public.grow_fertigation_recipe_site (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_grade_org_id ON public.grow_grade (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_harvest_container_org_id ON public.grow_harvest_container (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_harvest_weight_org_id ON public.grow_harvest_weight (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_monitoring_metric_org_id ON public.grow_monitoring_metric (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_monitoring_reading_org_id ON public.grow_monitoring_reading (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_pest_org_id ON public.grow_pest (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_scout_observation_org_id ON public.grow_scout_observation (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_scout_observation_row_org_id ON public.grow_scout_observation_row (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_seed_mix_org_id ON public.grow_seed_mix (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_seed_mix_item_org_id ON public.grow_seed_mix_item (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_spray_compliance_org_id ON public.grow_spray_compliance (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_spray_equipment_org_id ON public.grow_spray_equipment (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_spray_input_org_id ON public.grow_spray_input (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_task_photo_org_id ON public.grow_task_photo (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_task_seed_batch_org_id ON public.grow_task_seed_batch (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_trial_type_org_id ON public.grow_trial_type (org_id);
CREATE INDEX IF NOT EXISTS idx_grow_variety_org_id ON public.grow_variety (org_id);

-- Inventory module
CREATE INDEX IF NOT EXISTS idx_invnt_lot_org_id ON public.invnt_lot (org_id);
CREATE INDEX IF NOT EXISTS idx_invnt_vendor_org_id ON public.invnt_vendor (org_id);

-- Operations module
CREATE INDEX IF NOT EXISTS idx_ops_task_template_org_id ON public.ops_task_template (org_id);
CREATE INDEX IF NOT EXISTS idx_maint_request_invnt_item_org_id ON public.maint_request_invnt_item (org_id);

-- Organization module
CREATE INDEX IF NOT EXISTS idx_org_business_rule_org_id ON public.org_business_rule (org_id);
CREATE INDEX IF NOT EXISTS idx_org_equipment_org_id ON public.org_equipment (org_id);
CREATE INDEX IF NOT EXISTS idx_org_farm_org_id ON public.org_farm (org_id);

-- Pack/Productivity module
CREATE INDEX IF NOT EXISTS idx_pack_fail_category_org_id ON public.pack_fail_category (org_id);
CREATE INDEX IF NOT EXISTS idx_pack_productivity_hour_org_id ON public.pack_productivity_hour (org_id);
CREATE INDEX IF NOT EXISTS idx_pack_productivity_hour_fail_org_id ON public.pack_productivity_hour_fail (org_id);
CREATE INDEX IF NOT EXISTS idx_pack_productivity_hour_product_org_id ON public.pack_productivity_hour_product (org_id);

-- Sales module
CREATE INDEX IF NOT EXISTS idx_sales_customer_group_org_id ON public.sales_customer_group (org_id);
CREATE INDEX IF NOT EXISTS idx_sales_fob_org_id ON public.sales_fob (org_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_org_id ON public.sales_product (org_id);

-- HR module
CREATE INDEX IF NOT EXISTS idx_hr_module_access_org_id ON public.hr_module_access (org_id);
