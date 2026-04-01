-- Phase 2, Wave 2: Enable RLS on Inventory & Food Safety tables (12 tables)
-- Pattern: org-scoped SELECT/INSERT/UPDATE using user_has_org_access(org_id)
-- No DELETE policies — soft delete via UPDATE (is_deleted = true)

-- ============================================================
-- 1. invnt_item
-- ============================================================
ALTER TABLE public.invnt_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_item_select" ON public.invnt_item
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_item_insert" ON public.invnt_item
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_item_update" ON public.invnt_item
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_item TO authenticated;

-- ============================================================
-- 2. invnt_category
-- ============================================================
ALTER TABLE public.invnt_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_category_select" ON public.invnt_category
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_category_insert" ON public.invnt_category
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_category_update" ON public.invnt_category
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_category TO authenticated;

-- ============================================================
-- 3. invnt_vendor
-- ============================================================
ALTER TABLE public.invnt_vendor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_vendor_select" ON public.invnt_vendor
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_vendor_insert" ON public.invnt_vendor
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_vendor_update" ON public.invnt_vendor
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_vendor TO authenticated;

-- ============================================================
-- 4. invnt_lot
-- ============================================================
ALTER TABLE public.invnt_lot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_lot_select" ON public.invnt_lot
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_lot_insert" ON public.invnt_lot
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_lot_update" ON public.invnt_lot
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_lot TO authenticated;

-- ============================================================
-- 5. invnt_onhand
-- ============================================================
ALTER TABLE public.invnt_onhand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_onhand_select" ON public.invnt_onhand
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_onhand_insert" ON public.invnt_onhand
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_onhand_update" ON public.invnt_onhand
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_onhand TO authenticated;

-- ============================================================
-- 6. invnt_po
-- ============================================================
ALTER TABLE public.invnt_po ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_po_select" ON public.invnt_po
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_po_insert" ON public.invnt_po
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_po_update" ON public.invnt_po
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_po TO authenticated;

-- ============================================================
-- 7. invnt_po_received
-- ============================================================
ALTER TABLE public.invnt_po_received ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invnt_po_received_select" ON public.invnt_po_received
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "invnt_po_received_insert" ON public.invnt_po_received
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "invnt_po_received_update" ON public.invnt_po_received
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.invnt_po_received TO authenticated;

-- ============================================================
-- 8. fsafe_lab
-- ============================================================
ALTER TABLE public.fsafe_lab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsafe_lab_select" ON public.fsafe_lab
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_lab_insert" ON public.fsafe_lab
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_lab_update" ON public.fsafe_lab
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.fsafe_lab TO authenticated;

-- ============================================================
-- 9. fsafe_lab_test
-- ============================================================
ALTER TABLE public.fsafe_lab_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsafe_lab_test_select" ON public.fsafe_lab_test
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_lab_test_insert" ON public.fsafe_lab_test
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_lab_test_update" ON public.fsafe_lab_test
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.fsafe_lab_test TO authenticated;

-- ============================================================
-- 10. fsafe_result
-- ============================================================
ALTER TABLE public.fsafe_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsafe_result_select" ON public.fsafe_result
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_result_insert" ON public.fsafe_result
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_result_update" ON public.fsafe_result
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.fsafe_result TO authenticated;

-- ============================================================
-- 11. fsafe_test_hold
-- ============================================================
ALTER TABLE public.fsafe_test_hold ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsafe_test_hold_select" ON public.fsafe_test_hold
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_test_hold_insert" ON public.fsafe_test_hold
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_test_hold_update" ON public.fsafe_test_hold
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.fsafe_test_hold TO authenticated;

-- ============================================================
-- 12. fsafe_test_hold_po
-- ============================================================
ALTER TABLE public.fsafe_test_hold_po ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsafe_test_hold_po_select" ON public.fsafe_test_hold_po
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_test_hold_po_insert" ON public.fsafe_test_hold_po
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(org_id));

CREATE POLICY "fsafe_test_hold_po_update" ON public.fsafe_test_hold_po
  FOR UPDATE TO authenticated
  USING (public.user_has_org_access(org_id));

GRANT SELECT, INSERT, UPDATE ON public.fsafe_test_hold_po TO authenticated;
