"""
Migrate Org Business Rules
===========================
Seeds org_business_rule with business rules, workflows, calculations,
requirements, and definitions derived from the schema and process docs.

Usage:
    python scripts/migrations/20260401000006_org_business_rule.py

Rerunnable: clears and reinserts all data on each run.
"""

import os
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kfwqtaazdankxmdlqdak.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_KEY:
    try:
        with open(".env") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_KEY="):
                    SUPABASE_KEY = line.strip().split("=", 1)[1]
    except FileNotFoundError:
        pass

AUDIT_USER = "data@hawaiifarming.com"
ORG_ID = "hawaii_farming"


def rule(id, rule_type, module, title, description, rationale, applies_to, order):
    return {
        "id": id,
        "org_id": ORG_ID,
        "rule_type": rule_type,
        "module": module,
        "title": title,
        "description": description,
        "rationale": rationale,
        "applies_to": applies_to,
        "is_active": True,
        "display_order": order,
        "created_by": AUDIT_USER,
        "updated_by": AUDIT_USER,
    }


RULES = [
    # =====================================================================
    # 1. ORGANIZATION (sites) — foundation everything else depends on
    # =====================================================================
    rule(
        "site_category_subcategory_consistency", "requirement", "operations",
        "Site category/subcategory consistency",
        "org_site_category_id must reference a parent category row (sub_category_name IS NULL). "
        "org_site_subcategory_id must reference a subcategory row (sub_category_name IS NOT NULL) "
        "that belongs to the same parent category. For example, a site with category 'growing' can only "
        "have subcategories greenhouse, nursery, pond, row, growing_room, or growing_other.",
        "Prevents invalid category combinations that would break filtering and UI logic.",
        '["org_site.org_site_category_id", "org_site.org_site_subcategory_id"]',
        1,
    ),
    rule(
        "site_farm_scope", "business_rule", "operations",
        "Site farm scope rules",
        "Sites can be org-wide (farm_id = null) or farm-scoped (farm_id set). Any site category — growing, "
        "packing, storage, housing, or other — can be either org-wide or farm-scoped depending on the physical "
        "layout. Child sites inherit farm_id from their parent site.",
        "A packhouse may serve one farm or the whole org; housing may belong to a specific farm or be shared. "
        "The flexibility avoids forcing an artificial farm assignment.",
        '["org_site.farm_id", "org_site.site_id_parent"]',
        2,
    ),
    rule(
        "site_zone_classification", "definition", "operations",
        "Site zone classification",
        "The zone field (zone_1, zone_2, zone_3, zone_4, water) is available on all sites regardless of category. "
        "zone_1 always represents food contact surfaces. Zone classification is used for food safety testing "
        "site selection and EMP program compliance.",
        None,
        '["org_site.zone"]',
        3,
    ),
    rule(
        "site_acres_visibility", "business_rule", "operations",
        "Acres field visibility by site category",
        "The acres field is only visible and applicable for growing sites with no subcategory (the parent "
        "growing site itself) and for sites with subcategory greenhouse, pond, or nursery. All other site "
        "types should have acres = null.",
        "Acres only make sense for land-based growing areas, not for rooms, storage, or housing.",
        '["org_site.acres"]',
        4,
    ),
    rule(
        "site_monitoring_stations_visibility", "business_rule", "operations",
        "Monitoring stations field visibility by site category",
        "The monitoring_stations JSONB array is only visible and applicable for growing sites with subcategory "
        "greenhouse, pond, or nursery. These are the only site types that have environmental monitoring points. "
        "All other site types should have monitoring_stations = '[]'.",
        "Monitoring is done at specific stations within greenhouses, ponds, and nurseries only.",
        '["org_site.monitoring_stations"]',
        5,
    ),
    rule(
        "system_cascade_deactivation", "business_rule", "operations",
        "Parent deactivation cascades to child records",
        "When a parent record is marked as inactive (is_active = false) or soft-deleted (is_deleted = true), "
        "only configuration and lookup children are cascaded — not transactional or historical records. "
        "Examples: deactivating an org_site deactivates its child sites and equipment; deactivating a "
        "sales_product deactivates its prices. However, historical records such as sales POs, fulfillments, "
        "payroll, checklist results, and other transactional data are never cascaded — they remain intact for "
        "reporting and audit. Reactivating a parent does not automatically reactivate children — children must "
        "be reactivated individually.",
        "Prevents orphaned active config records from appearing in dropdowns while preserving historical data "
        "integrity. One-way cascade avoids unintended bulk reactivation.",
        None,
        6,
    ),

    # =====================================================================
    # 2. HR — employees needed before anything else
    # =====================================================================
    rule(
        "hr_access_level_filtering", "requirement", "human_resources",
        "Team lead and compensation manager filtering",
        "Team lead dropdown filtered to employees with sys_access_level_id = 'team_lead' or higher. "
        "Compensation manager dropdown filtered to sys_access_level_id = 'manager' or higher.",
        "Prevents assigning supervisory roles to employees without the required access level.",
        '["hr_employee.team_lead_id", "hr_employee.compensation_manager_id"]',
        7,
    ),
    rule(
        "hr_payroll_import_process", "workflow", "human_resources",
        "Payroll import from external processor",
        "Payroll data is received from the payroll processing company as an Excel file with tabs: "
        "$data (invoice summary), Hours (hours/pay breakdown), NetPay (earnings/deductions), "
        "PTOBank (YTD PTO accrual), WC (workers compensation), and TDI (temporary disability insurance). "
        "The import script merges all tabs, matches employees by payroll_id, and snapshots hr_department_id, "
        "hr_work_authorization_id, wc, pay_structure, and overtime_threshold from hr_employee at import time. "
        "is_standard is auto-set based on whether the invoice total hours exceed 5000.",
        "Employee fields are snapshotted so payroll records remain historically accurate even if the employee "
        "record changes later.",
        '["hr_payroll"]',
        8,
    ),
    rule(
        "hr_payroll_cost_allocation", "calculation", "human_resources",
        "Payroll cost allocation by scheduled task",
        "Actual payroll costs are distributed across tasks based on the ratio of planned schedule hours. "
        "For each employee per pay period: scheduled hours are matched by employee and date range, each task "
        "is mapped to its accounting category, and scheduled hours are scaled proportionally so they sum to "
        "the actual payroll total hours. Payroll costs (regular pay, overtime pay, total cost) are then split "
        "across tasks using the scaled ratio. If no schedule exists for the employee, the full cost is "
        "bucketed to their department. The report shows scheduled hours vs actual hours side by side.",
        "Enables labor cost reporting by task/account without requiring employees to clock in per task. "
        "The schedule serves as the allocation key for distributing actual payroll costs.",
        '["hr_payroll", "ops_task_schedule", "ops_task"]',
        9,
    ),
    # =====================================================================
    # 3. INVENTORY — items, POs, lots
    # =====================================================================
    rule(
        "invnt_lot_uniqueness", "requirement", "inventory",
        "Lot number uniqueness per item",
        "Unique constraint on (org_id, invnt_item_id, lot_number) prevents duplicate lot numbers for the same item.",
        "Ensures unambiguous lot traceability for inventory and food safety.",
        '["invnt_lot.lot_number", "invnt_lot.invnt_item_id"]',
        10,
    ),
    rule(
        "invnt_lot_auto_deactivate", "workflow", "inventory",
        "Lot auto-deactivation on zero onhand",
        "When the latest invnt_onhand record for a lot has onhand_quantity = 0, the lot's is_active flag is "
        "auto-set to false. Inactive lots are excluded from dropdowns where users select lot numbers "
        "(e.g. grow_spray_input, invnt_onhand). Users can manually reactivate a lot if needed.",
        "Prevents users from selecting depleted lots, reducing data entry errors.",
        '["invnt_lot.is_active", "invnt_onhand.onhand_quantity"]',
        11,
    ),
    rule(
        "invnt_auto_reorder", "workflow", "inventory",
        "Auto-create purchase order on low stock",
        "When the latest invnt_onhand record for an item falls below the item's reorder_point, a new "
        "invnt_po is automatically created with request_type = 'inventory_item' for that item.",
        "Ensures critical supplies are reordered before they run out without relying on manual monitoring.",
        '["invnt_onhand.onhand_quantity", "invnt_item.reorder_point", "invnt_po"]',
        12,
    ),
    rule(
        "invnt_po_request_types", "business_rule", "inventory",
        "Purchase order field behavior by request type",
        "Two request types with different field behavior. "
        "inventory_item: invnt_item_id is required; invnt_category_id, item_name, burn_uom, order_uom, "
        "burn_per_order, and invnt_vendor_id are auto-filled from the selected invnt_item as snapshots. "
        "non_inventory_item: invnt_item_id is hidden; invnt_category_id and item_name are manually entered; "
        "order_uom is user-selected; burn_uom defaults to the same value as order_uom; burn_per_order defaults to 1. "
        "Urgency levels: today, 2_days, 7_days, not_urgent.",
        "Inventory items already have established units and vendors so these are pre-filled. "
        "Non-inventory items are ad-hoc requests where the user defines everything, with burn_uom defaulting "
        "to order_uom since there is no separate burn/order unit distinction for one-off purchases.",
        '["invnt_po.request_type", "invnt_po.invnt_item_id", "invnt_po.burn_uom", "invnt_po.order_uom", '
        '"invnt_po.burn_per_order", "invnt_po.urgency_level"]',
        13,
    ),
    rule(
        "invnt_po_snapshot_at_order", "business_rule", "inventory",
        "PO snapshot at order time",
        "Item name (item_name_snapshot), unit of measure (uom_snapshot), and cost (unit_cost_snapshot) are "
        "captured when a PO is ordered. These snapshots are immutable and used for historical reporting.",
        "Prevents PO history from changing if the underlying item record is later modified.",
        '["invnt_po.item_name_snapshot", "invnt_po.uom_snapshot", "invnt_po.unit_cost_snapshot"]',
        14,
    ),
    rule(
        "invnt_receiving_quality_checks", "business_rule", "inventory",
        "Receiving quality checks recorded per delivery, not via checklist",
        "delivery_truck_clean and delivery_acceptable live on invnt_po_received rather than in an "
        "ops_template checklist because they must be recorded per delivery event. A single PO can have "
        "multiple partial deliveries, each requiring its own quality assessment. The ops_template system "
        "ties responses to a single ops_task_tracker activity session, not to individual receiving events.",
        "Keeps per-delivery quality checks co-located with the delivery data they are captured alongside.",
        '["invnt_po_received.delivery_truck_clean", "invnt_po_received.delivery_acceptable"]',
        15,
    ),

    # =====================================================================
    # 4. OPERATIONS — task tracker, templates, checklists
    # =====================================================================
    rule(
        "ops_response_types", "definition", "operations",
        "Checklist question response types",
        "Three response types: boolean (pass/fail toggle), numeric (value within min/max range), "
        "enum (selection from predefined options with designated pass values).",
        None,
        '["ops_template_question.response_type"]',
        16,
    ),
    rule(
        "ops_question_immutable_after_use", "business_rule", "operations",
        "Template question immutability after use",
        "An ops_template_question may be freely edited only while no ops_template_result references it. "
        "Once at least one result exists, question_text, response_type, and pass/fail settings are locked. "
        "To change wording or behavior, soft-delete the existing question and create a new one.",
        "Preserves historical accuracy of inspection and checklist results. If question text were silently "
        "changed, past results would appear to answer a different question than what was actually asked.",
        '["ops_template_question.question_text", "ops_template_question.response_type", '
        '"ops_template_question.boolean_pass_value", "ops_template_question.minimum_value", '
        '"ops_template_question.maximum_value", "ops_template_question.enum_options", '
        '"ops_template_question.enum_pass_options"]',
        17,
    ),
    rule(
        "ops_template_auto_load", "workflow", "operations",
        "Template auto-loading on task selection",
        "When an employee selects a task, all templates linked via ops_task_template are automatically loaded "
        "as checklists for that activity session.",
        "Ensures required checklists are never skipped. The link table allows one task to require multiple "
        "checklists (e.g. spraying requires pre-spray safety + PPE checklist).",
        '["ops_task_template.ops_task_id", "ops_task_template.ops_template_id"]',
        18,
    ),
    rule(
        "ops_corrective_action_auto_create", "workflow", "operations",
        "Corrective action auto-creation on checklist failure",
        "When a required checklist response fails (boolean != pass value, numeric out of range, enum not in pass options), "
        "an ops_corrective_action_taken record is automatically created with the suggested corrective action "
        "choices from the question. Non-required questions that fail are flagged but do not trigger corrective actions.",
        "Ensures non-conformances on required items are tracked immediately without relying on manual follow-up, "
        "while allowing informational metrics to be recorded without enforcement.",
        '["ops_template_result.response_boolean", "ops_template_result.response_numeric", '
        '"ops_template_result.response_enum", "ops_corrective_action_taken"]',
        19,
    ),
    rule(
        "ops_quick_fill_implicit_activity", "workflow", "operations",
        "Quick-fill implicit activity creation",
        "Submitting a checklist without a pre-created ops_task_tracker activity silently creates one with "
        "start_time = stop_time = now, is_completed = true.",
        "Allows rapid checklist completion without requiring a separate activity creation step.",
        '["ops_task_tracker.start_time", "ops_task_tracker.stop_time"]',
        20,
    ),
    rule(
        "ops_schedule_dual_mode", "definition", "operations",
        "Schedule dual mode: real-time vs planned",
        "ops_task_schedule supports two modes. Real-time: ops_task_tracker_id is set, linking the schedule "
        "entry to an ongoing activity — start/stop times, task, and farm are inherited from the tracker. "
        "Planned: ops_task_tracker_id is null, meaning the entry is a forward-looking assignment where a "
        "manager assigns employees to tasks with planned start/stop times without an active activity.",
        "Allows both real-time labor tracking and advance scheduling in the same table. "
        "The ops_task_weekly_schedule view shows only planned entries for printing.",
        '["ops_task_schedule.ops_task_tracker_id"]',
        21,
    ),
    rule(
        "ops_planned_schedule_workflow", "workflow", "operations",
        "Planned schedule generation, editing, and printing",
        "A manager can generate next week's planned schedule by copying the current week's entries as a "
        "starting point. From there, employees can be moved between tasks, reassigned to different time slots, "
        "or soft-deleted from the schedule — enabling fast bulk editing without recreating entries from scratch. "
        "The frontend renders a printable schedule for the selected week using the ops_task_weekly_schedule view, "
        "which pivots planned entries into one row per employee per task with Sun–Sat time columns, total hours, "
        "and OT threshold flag.",
        "Copying the prior week and editing in place is significantly faster than building a schedule from "
        "scratch each week. Soft-delete preserves the record for audit while removing the employee from the view.",
        '["ops_task_schedule", "ops_task_weekly_schedule"]',
        22,
    ),

    # =====================================================================
    # 5. GROW — seeding through harvest
    # =====================================================================
    rule(
        "site_growing_activity_scope", "business_rule", "grow",
        "Growing activities reference only greenhouse, pond, and nursery sites",
        "When selecting a site for growing activities (seeding, scouting, spraying, fertigation, monitoring, "
        "harvesting), sites are first filtered by the selected farm_id, then only sites with "
        "org_site_subcategory_id IN ('greenhouse', 'pond', 'nursery') are shown. "
        "Parent growing sites, growing_room, and growing_other are excluded from activity dropdowns.",
        "Growing activities occur in specific growing structures, not in support rooms or general growing areas.",
        '["grow_seed_batch", "grow_scout_result.site_id", "grow_spray_compliance", "grow_fertigation", '
        '"grow_monitoring_result", "grow_harvest_weight"]',
        23,
    ),
    rule(
        "grow_seed_source_exclusivity", "business_rule", "grow",
        "Seeding source exclusivity",
        "A seed batch must reference either a single seed item (grow_variety_id + invnt_item_id) or a seed mix "
        "(grow_seed_mix_id), never both. The CHECK constraint enforces this at the database level.",
        "Prevents ambiguous seed provenance which would compromise traceability.",
        '["grow_seed_batch.grow_variety_id", "grow_seed_batch.grow_seed_mix_id"]',
        24,
    ),
    rule(
        "grow_seed_batch_lifecycle", "workflow", "grow",
        "Seed batch status lifecycle",
        "Status progression: planned → seeded → transplanted → harvesting → harvested. "
        "For nursery sites, batches with status 'seeded' are available for scouting, spraying, fertigation, "
        "and monitoring activities. For greenhouse and pond sites, only batches with status 'transplanted' or "
        "'harvesting' are available.",
        "Nursery cycles occur before transplant; greenhouse/pond activities occur after transplant.",
        '["grow_seed_batch.status"]',
        25,
    ),
    rule(
        "grow_seeding_label_format", "business_rule", "grow",
        "Seeding label generation and printing",
        "Labels are generated from the frontend by querying seed batches filtered by seeding date and farm. "
        "Each label shows: site name + side, seeds per board (S#), board count (B#), three dates in MMdd "
        "format (S: seeding, P: pond/transplant, H: expected harvest), and variety:seed name. "
        "If boards per site > 90, the total is split into balanced chunks across multiple labels "
        "(e.g. 200 boards → 3 labels of 67, 67, 66). Labels are color-coded by seeding day of week: "
        "blue for Friday/Sunday, yellow for Saturday/Monday, no color for other days.",
        "Balanced splitting prevents label overcrowding while ensuring all boards are accounted for. "
        "Color coding lets workers visually identify seeding batches by day on the growing floor.",
        '["grow_seed_batch"]',
        26,
    ),
    rule(
        "grow_scout_type_enforcement", "business_rule", "grow",
        "Scout result type enforcement",
        "A scout result must reference either a pest (grow_pest_id) or a disease (grow_disease_id), never both. "
        "The observation_type field must match: 'pest' requires grow_pest_id, 'disease' requires grow_disease_id.",
        "Ensures clean categorization of field observations for accurate pest/disease tracking.",
        '["grow_scout_result.observation_type", "grow_scout_result.grow_pest_id", "grow_scout_result.grow_disease_id"]',
        27,
    ),
    rule(
        "grow_spray_compliance_filter", "business_rule", "grow",
        "Spray compliance product filtering",
        "When adding compliance records, only inventory items with invnt_category_id = 'chemicals_pesticides' "
        "are shown. Only compliant products are available for spraying: effective_date <= today AND "
        "(expiration_date IS NULL OR expiration_date >= today). When recording a spray input, the user is "
        "prevented from saving if (quantity × site acres) > maximum_quantity_per_acre from the compliance record.",
        "Ensures legal compliance with pesticide registration and label rate limits. The per-acre validation "
        "enforces label rate limits at data entry time.",
        '["grow_spray_compliance.effective_date", "grow_spray_compliance.expiration_date", '
        '"grow_spray_compliance.maximum_quantity_per_acre"]',
        28,
    ),
    rule(
        "grow_safety_interval_calculation", "calculation", "grow",
        "Safety interval calculation (PHI/REI)",
        "The maximum PHI days and REI hours across all spray inputs in an event governs the entire event. "
        "PHI determines earliest harvest date; REI determines earliest re-entry time.",
        "Worker safety and food safety compliance require the most restrictive interval to apply.",
        '["grow_spray_input.phi_days", "grow_spray_input.rei_hours"]',
        29,
    ),
    rule(
        "grow_harvest_tare_calculation", "calculation", "grow",
        "Harvest tare weight auto-calculation",
        "net_weight = gross_weight - (container tare_weight × number_of_containers). "
        "Tare weight is sourced from grow_harvest_container.",
        None,
        '["grow_harvest_weight.gross_weight", "grow_harvest_weight.net_weight", "grow_harvest_container.tare_weight"]',
        30,
    ),
    rule(
        "grow_monitoring_out_of_range", "business_rule", "grow",
        "Monitoring out-of-range detection",
        "Auto-flag readings outside min/max thresholds or not in enum_pass_options defined on the monitoring metric. "
        "Calculated points auto-fill using formula when all input field values are present. "
        "Only metrics where is_required = true trigger corrective action creation when out of range; "
        "non-required metrics are flagged but informational only.",
        "Early detection of environmental anomalies that could impact crop health. "
        "The is_required flag lets farms track optional readings without enforcement overhead.",
        '["grow_monitoring_result.response_numeric", "grow_monitoring_metric.minimum_value", '
        '"grow_monitoring_metric.maximum_value", "grow_monitoring_metric.is_required"]',
        31,
    ),

    # =====================================================================
    # 6. PACK — productivity, shelf life
    # =====================================================================
    rule(
        "pack_productivity_workflow", "workflow", "pack",
        "Packing productivity data entry workflow",
        "A packing supervisor creates one ops_task_tracker activity per product being packed (product is "
        "identified by ops_task_tracker.sales_product_id). At the end of each clock hour, the supervisor "
        "records a pack_productivity_hour snapshot with crew counts, cases packed, and fail counts.",
        "Hourly snapshots enable real-time productivity tracking and derived metrics per product per shift.",
        '["ops_task_tracker.sales_product_id", "pack_productivity_hour.ops_task_tracker_id", '
        '"pack_productivity_hour.pack_end_hour"]',
        32,
    ),
    rule(
        "pack_best_by_calculation", "calculation", "pack",
        "Best-by date calculation",
        "best_by_date = pack_lot.pack_date + sales_product.shelf_life_days.",
        None,
        '["pack_lot_item.best_by_date", "pack_lot.pack_date", "sales_product.shelf_life_days"]',
        33,
    ),
    rule(
        "pack_productivity_derived_metrics", "calculation", "pack",
        "Productivity derived metrics",
        "Trays = cases_packed × product.pack_per_case. Trays per packer per minute, packed pounds, "
        "and total fails are calculated on-the-fly from hourly snapshot data.",
        None,
        '["pack_productivity_hour.cases_packed", "pack_productivity_hour.packers"]',
        34,
    ),
    rule(
        "pack_metal_detection_hourly", "business_rule", "pack",
        "Metal detection recorded per hour, not via checklist",
        "is_metal_detected lives on pack_productivity_hour rather than in an ops_template checklist because "
        "it must be recorded every hour alongside the productivity snapshot. The ops_template system ties "
        "responses to a single ops_task_tracker activity session, not to individual hours within that session.",
        "Keeps the hourly quality check co-located with the hourly data it is captured alongside.",
        '["pack_productivity_hour.is_metal_detected"]',
        35,
    ),

    # =====================================================================
    # 7. SALES — POs, fulfillment
    # =====================================================================
    rule(
        "sales_po_snapshot_pricing", "business_rule", "sales",
        "Sales PO snapshot pricing",
        "Price snapshot captured at order time. Resolution order: customer-specific price (by customer_id), "
        "then customer group price (by customer_group_id), then default FOB price.",
        "Locks in agreed pricing regardless of future price list changes.",
        '["sales_po_line.unit_price_snapshot"]',
        36,
    ),
    rule(
        "sales_fulfillment_partial", "workflow", "sales",
        "Partial fulfillment support",
        "One fulfillment row per lot per order line. Supports partial fulfillment across multiple pack lots.",
        None,
        '["sales_po_fulfillment.pack_lot_id", "sales_po_fulfillment.sales_po_line_id"]',
        37,
    ),
    rule(
        "sales_palletization_workflow", "workflow", "sales",
        "Palletization capacity-aware expansion",
        "Order line quantities are expanded into pallets based on product capacity. Full pallet capacity is "
        "derived from pallet_ti × pallet_hi; maximum is maximum_case_per_pallet. Orders are split across "
        "multiple pallets when quantity exceeds maximum_case_per_pallet. "
        "Pallet types: Full (reached full_pallet threshold), Stackable (partial pallet for Costco/Sam's — can be "
        "stacked with other partials), Shareable (partial pallet for other customers — grouped by customer). "
        "Off-island orders only (FOB != Farm/Local Delivery). Box truck FOBs (HNL, Kawaihae) and specific "
        "customers are auto-assigned to box containers.",
        "Capacity-aware splitting prevents overfilling pallets while maximizing utilization. "
        "Pallet type determines how partials are combined during stacking.",
        '["sales_po_line", "sales_product.pallet_ti", "sales_product.pallet_hi", '
        '"sales_product.maximum_case_per_pallet"]',
        38,
    ),
    rule(
        "sales_containerization_workflow", "workflow", "sales",
        "Container space assignment with spillover",
        "Pallets are assigned to container spaces by type. Max spaces per type are defined in "
        "sales_container_type. Full pallets get one space each. Stackable/shareable pallets are grouped "
        "into shared spaces during the stacking step. Container type is inferred from product farm. When one "
        "container type exceeds its maximum_spaces, overflow pallets spill into available spaces in other container "
        "types. Spillover pallets are visually flagged. Once containerized, container_id, booking_id, "
        "pallet_number, and container_space are bulk-written to all matching sales_po_fulfillment rows via a "
        "form filtered by invoice date and farm.",
        "Container capacity limits match physical shipping container dimensions. Spillover logic ensures all "
        "pallets are containerized even when one container type is full. Traceability fields cascade from the "
        "form to avoid per-row data entry.",
        '["sales_po_fulfillment", "sales_container_type"]',
        39,
    ),
    rule(
        "sales_pallet_print_documents", "business_rule", "sales",
        "Pallet and shipping print documents",
        "Three printable documents are generated from palletized data: (1) Customer envelopes showing PO number "
        "and product quantities per customer. (2) Pallet papers showing shipping destination, dock, PO number, "
        "pallet X of Y, and container/pallet reference (e.g. C01/P01). (3) ASN labels with product UPC and "
        "pallet details. Pallets are sorted by container type (cucumber → box → lettuce), then by container "
        "space, with spillover pallets appearing last within each container.",
        "Physical documents accompany pallets through the cold chain to the shipping container.",
        '["sales_po_line"]',
        40,
    ),

    # =====================================================================
    # 8. FOOD SAFETY — testing, results
    # =====================================================================
    rule(
        "fsafe_test_pass_fail", "business_rule", "food_safety",
        "Food safety test pass/fail criteria",
        "Enum tests: pass when response is in enum_pass_options. Numeric tests: pass when value is within "
        "minimum_value and maximum_value thresholds. ATP tests randomly select atp_site_count zone_1 sites.",
        "Standardizes pass/fail determination across all food safety test types.",
        '["fsafe_lab_test.enum_pass_options", "fsafe_lab_test.minimum_value", '
        '"fsafe_lab_test.maximum_value", "fsafe_lab_test.atp_site_count"]',
        41,
    ),
    rule(
        "fsafe_retest_auto_create", "workflow", "food_safety",
        "Retest and vector test auto-creation",
        "When an initial food safety test fails, retest and vector test results are automatically created "
        "in fsafe_result based on the lab test configuration.",
        "Ensures failed tests are always followed up with required retesting.",
        '["fsafe_result.result_type", "fsafe_lab_test.requires_retest", "fsafe_lab_test.requires_vector_test"]',
        42,
    ),
    rule(
        "fsafe_result_type_derivation", "definition", "food_safety",
        "Food safety result type derivation",
        "Result types derived from existing fields: EMP (site_id set, fsafe_test_hold_id null), "
        "Test-and-Hold (fsafe_test_hold_id set), Water (zone = 'water').",
        None,
        '["fsafe_result.site_id", "fsafe_result.fsafe_test_hold_id"]',
        43,
    ),

    # =====================================================================
    # 9. MAINTENANCE — requests, inspections
    # =====================================================================
    rule(
        "maint_request_status_workflow", "workflow", "maintenance",
        "Maintenance request status workflow",
        "Status progression: new → pending → priority → done.",
        None,
        '["maint_request.status"]',
        44,
    ),
    rule(
        "maint_preventive_recurrence", "workflow", "maintenance",
        "Preventive maintenance auto-recurrence",
        "When recurring_frequency is set (daily, weekly, monthly, quarterly, semi_annually, annually), "
        "a new request is automatically created after the current one is marked done.",
        "Ensures preventive maintenance schedules are never missed.",
        '["maint_request.recurring_frequency", "maint_request.status"]',
        45,
    ),
    rule(
        "maint_request_scope", "definition", "maintenance",
        "Maintenance request exclusive scope",
        "A request targets either a site (site_id set, equipment_id null) or equipment (equipment_id set, "
        "site_id null), never both. Equipment location is derived from org_equipment.site_id.",
        "Avoids ambiguity; the equipment record already knows its site.",
        '["maint_request.site_id", "maint_request.equipment_id"]',
        46,
    ),
]


def main():
    if not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY in .env or environment")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Clear existing rules
    print("Clearing tables...")
    try:
        supabase.table("org_business_rule").delete().neq("id", "___never___").execute()
    except Exception:
        pass
    print("  All cleared")

    # Insert rules in batches
    print(f"\n--- org_business_rule ---")
    for i in range(0, len(RULES), 100):
        batch = RULES[i:i + 100]
        supabase.table("org_business_rule").insert(batch).execute()
    print(f"  Inserted {len(RULES)} rules")

    # Summary by module
    modules = {}
    for r in RULES:
        m = r["module"]
        modules[m] = modules.get(m, 0) + 1
    for m, c in sorted(modules.items()):
        print(f"    {m}: {c}")

    print("\nOrg business rules migrated successfully")


if __name__ == "__main__":
    main()
