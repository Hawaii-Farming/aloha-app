-- Phase 2, Wave 4: Enable RLS on Pack & Sales tables (18 tables)
-- Pattern: org-scoped SELECT/INSERT/UPDATE using user_has_org_access(org_id)
-- No DELETE policies — soft delete via UPDATE (is_deleted = true)

-- ============================================================
-- 1. pack_lot
-- ============================================================
ALTER TABLE public.pack_lot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_lot_select" ON public.pack_lot
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_lot_insert" ON public.pack_lot
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_lot_update" ON public.pack_lot
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_lot TO authenticated;

-- ============================================================
-- 2. pack_lot_item
-- ============================================================
ALTER TABLE public.pack_lot_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_lot_item_select" ON public.pack_lot_item
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_lot_item_insert" ON public.pack_lot_item
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_lot_item_update" ON public.pack_lot_item
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_lot_item TO authenticated;

-- ============================================================
-- 3. pack_fail_category
-- ============================================================
ALTER TABLE public.pack_fail_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_fail_category_select" ON public.pack_fail_category
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_fail_category_insert" ON public.pack_fail_category
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_fail_category_update" ON public.pack_fail_category
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_fail_category TO authenticated;

-- ============================================================
-- 4. pack_productivity_hour
-- ============================================================
ALTER TABLE public.pack_productivity_hour ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_productivity_hour_select" ON public.pack_productivity_hour
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_productivity_hour_insert" ON public.pack_productivity_hour
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_productivity_hour_update" ON public.pack_productivity_hour
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_productivity_hour TO authenticated;

-- ============================================================
-- 5. pack_productivity_hour_product
-- ============================================================
ALTER TABLE public.pack_productivity_hour_product ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_productivity_hour_product_select" ON public.pack_productivity_hour_product
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_productivity_hour_product_insert" ON public.pack_productivity_hour_product
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_productivity_hour_product_update" ON public.pack_productivity_hour_product
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_productivity_hour_product TO authenticated;

-- ============================================================
-- 6. pack_productivity_hour_fail
-- ============================================================
ALTER TABLE public.pack_productivity_hour_fail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_productivity_hour_fail_select" ON public.pack_productivity_hour_fail
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_productivity_hour_fail_insert" ON public.pack_productivity_hour_fail
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_productivity_hour_fail_update" ON public.pack_productivity_hour_fail
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_productivity_hour_fail TO authenticated;

-- ============================================================
-- 7. pack_shelf_life
-- ============================================================
ALTER TABLE public.pack_shelf_life ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_shelf_life_select" ON public.pack_shelf_life
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_insert" ON public.pack_shelf_life
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_update" ON public.pack_shelf_life
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_shelf_life TO authenticated;

-- ============================================================
-- 8. pack_shelf_life_metric
-- ============================================================
ALTER TABLE public.pack_shelf_life_metric ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_shelf_life_metric_select" ON public.pack_shelf_life_metric
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_metric_insert" ON public.pack_shelf_life_metric
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_metric_update" ON public.pack_shelf_life_metric
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_shelf_life_metric TO authenticated;

-- ============================================================
-- 9. pack_shelf_life_observation
-- ============================================================
ALTER TABLE public.pack_shelf_life_observation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_shelf_life_observation_select" ON public.pack_shelf_life_observation
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_observation_insert" ON public.pack_shelf_life_observation
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_observation_update" ON public.pack_shelf_life_observation
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_shelf_life_observation TO authenticated;

-- ============================================================
-- 10. pack_shelf_life_photo
-- ============================================================
ALTER TABLE public.pack_shelf_life_photo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_shelf_life_photo_select" ON public.pack_shelf_life_photo
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_photo_insert" ON public.pack_shelf_life_photo
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "pack_shelf_life_photo_update" ON public.pack_shelf_life_photo
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.pack_shelf_life_photo TO authenticated;

-- ============================================================
-- 11. sales_customer
-- ============================================================
ALTER TABLE public.sales_customer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_customer_select" ON public.sales_customer
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_customer_insert" ON public.sales_customer
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_customer_update" ON public.sales_customer
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_customer TO authenticated;

-- ============================================================
-- 12. sales_customer_group
-- ============================================================
ALTER TABLE public.sales_customer_group ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_customer_group_select" ON public.sales_customer_group
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_customer_group_insert" ON public.sales_customer_group
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_customer_group_update" ON public.sales_customer_group
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_customer_group TO authenticated;

-- ============================================================
-- 13. sales_fob
-- ============================================================
ALTER TABLE public.sales_fob ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_fob_select" ON public.sales_fob
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_fob_insert" ON public.sales_fob
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_fob_update" ON public.sales_fob
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_fob TO authenticated;

-- ============================================================
-- 14. sales_po
-- ============================================================
ALTER TABLE public.sales_po ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_po_select" ON public.sales_po
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_po_insert" ON public.sales_po
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_po_update" ON public.sales_po
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_po TO authenticated;

-- ============================================================
-- 15. sales_po_line
-- ============================================================
ALTER TABLE public.sales_po_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_po_line_select" ON public.sales_po_line
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_po_line_insert" ON public.sales_po_line
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_po_line_update" ON public.sales_po_line
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_po_line TO authenticated;

-- ============================================================
-- 16. sales_po_fulfillment
-- ============================================================
ALTER TABLE public.sales_po_fulfillment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_po_fulfillment_select" ON public.sales_po_fulfillment
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_po_fulfillment_insert" ON public.sales_po_fulfillment
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_po_fulfillment_update" ON public.sales_po_fulfillment
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_po_fulfillment TO authenticated;

-- ============================================================
-- 17. sales_product
-- ============================================================
ALTER TABLE public.sales_product ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_product_select" ON public.sales_product
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_product_insert" ON public.sales_product
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_product_update" ON public.sales_product
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_product TO authenticated;

-- ============================================================
-- 18. sales_product_price
-- ============================================================
ALTER TABLE public.sales_product_price ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_product_price_select" ON public.sales_product_price
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "sales_product_price_insert" ON public.sales_product_price
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "sales_product_price_update" ON public.sales_product_price
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.sales_product_price TO authenticated;
