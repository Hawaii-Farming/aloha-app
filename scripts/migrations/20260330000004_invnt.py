"""
Migrate Inventory Data
=======================
Migrates invnt_vendor, invnt_category from legacy Google Sheets to Supabase.

Source: https://docs.google.com/spreadsheets/d/15ppDoDWLR1TIXCO5Gy3LIvEQ9KpJmtSqNY1Cao3E1Po
  - invnt_vendor: unique SupplierName values from invnt_item_po sheet
  - invnt_category: from invnt_item_category sheet + unique ItemSubCategory from invnt_item sheet

Usage:
    python scripts/migrations/20260330000004_invnt.py

Rerunnable: clears and reinserts all data on each run.
"""

import os
import re
import gspread
from google.oauth2.service_account import Credentials
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
SHEET_ID = "15ppDoDWLR1TIXCO5Gy3LIvEQ9KpJmtSqNY1Cao3E1Po"


def to_id(name: str) -> str:
    """Convert a display name to a TEXT PK."""
    return re.sub(r"[^a-z0-9_]+", "_", name.lower()).strip("_") if name else ""


def audit(row: dict) -> dict:
    """Add audit fields to a row."""
    row["created_by"] = AUDIT_USER
    row["updated_by"] = AUDIT_USER
    return row


def insert_rows(supabase, table: str, rows: list):
    """Insert rows into a table."""
    print(f"\n--- {table} ---")
    if rows:
        # Batch in groups of 100 to avoid payload limits
        for i in range(0, len(rows), 100):
            batch = rows[i:i + 100]
            supabase.table(table).insert(batch).execute()
        print(f"  Inserted {len(rows)} rows")


def get_sheets():
    """Connect to Google Sheets."""
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)
    return gspread.authorize(creds)


def migrate_invnt_vendor(supabase, client):
    """Migrate unique vendor names from invnt_item_po SupplierName column."""
    ws = client.open_by_key(SHEET_ID).worksheet("invnt_item_po")
    records = ws.get_all_records()

    vendors = sorted(set(
        str(r.get("SupplierName", "")).strip()
        for r in records
        if str(r.get("SupplierName", "")).strip()
    ))

    rows = [
        audit({
            "id": to_id(v),
            "org_id": ORG_ID,
            "name": v,
        })
        for v in vendors
    ]
    insert_rows(supabase, "invnt_vendor", rows)
    return {v: to_id(v) for v in vendors}


def migrate_invnt_category(supabase, client):
    """Provision standard inventory categories + legacy subcategories from invnt_item."""
    sheet = client.open_by_key(SHEET_ID)

    # Standard provisioned categories (from org_provisioning process doc)
    provisioned = [
        ("Chemicals/Pesticides", None),
        ("Fertilizers", None),
        ("Seeds", None),
        ("Seeds", "Trial"),
        ("Growing", None),
        ("Packing", None),
        ("Maintenance", None),
        ("Food Safety", None),
    ]

    # Map legacy category names to new provisioned names
    LEGACY_CAT_MAP = {
        "Chems/Pestic": "Chemicals/Pesticides",
        "Fert": "Fertilizers",
        "Seeds": "Seeds",
        "Trial Seeds": "Seeds",  # maps to Seeds with subcategory Trial
        "Grow": "Growing",
        "Packaging": "Packing",
        "Maint Parts": "Maintenance",
        "Lab Supplies": "Food Safety",
    }

    # Pull subcategories from legacy invnt_item ItemSubCategory column
    ws_item = sheet.worksheet("invnt_item")
    item_records = ws_item.get_all_records()

    legacy_subs = {}
    for r in item_records:
        cat = str(r.get("ItemCategory", "")).strip()
        sub = str(r.get("ItemSubCategory", "")).strip()
        if cat and sub:
            mapped_cat = LEGACY_CAT_MAP.get(cat, cat)
            legacy_subs.setdefault(mapped_cat, set()).add(sub)

    rows = []
    seen = set()

    # Provisioned categories first
    for cat, sub in provisioned:
        row_id = to_id(sub) if sub else to_id(cat)
        if row_id not in seen:
            seen.add(row_id)
            rows.append(audit({
                "id": row_id,
                "org_id": ORG_ID,
                "category_name": cat,
                "sub_category_name": sub,
            }))

    # Legacy subcategories mapped to new category names
    for cat, subs in sorted(legacy_subs.items()):
        for sub in sorted(subs):
            row_id = to_id(sub)
            if row_id not in seen:
                seen.add(row_id)
                rows.append(audit({
                    "id": row_id,
                    "org_id": ORG_ID,
                    "category_name": cat,
                    "sub_category_name": sub,
                }))

    insert_rows(supabase, "invnt_category", rows)


def migrate_storage_sites(supabase, client):
    """Create maintenance_storage subcategory and storage sites from ItemLocation."""

    # Add maintenance_storage subcategory to org_site_category
    supabase.table("org_site_category").insert(audit({
        "id": "maintenance_storage",
        "org_id": ORG_ID,
        "category_name": "storage",
        "sub_category_name": "maintenance_storage",
        "display_order": 5,
    })).execute()
    print("\n--- org_site_category ---")
    print("  Added maintenance_storage subcategory")

    # Get unique ItemLocation values
    ws = client.open_by_key(SHEET_ID).worksheet("invnt_item")
    records = ws.get_all_records()

    locations = set()
    for r in records:
        loc = str(r.get("ItemLocation", "")).strip()
        if loc:
            locations.add(loc)

    # Create sites from unique locations
    rows = []
    seen_ids = set()
    for loc in sorted(locations):
        site_id = to_id(loc)
        # Skip duplicates that clean to the same ID
        if site_id in seen_ids or not site_id:
            continue
        seen_ids.add(site_id)
        rows.append(audit({
            "id": site_id,
            "org_id": ORG_ID,
            "name": loc,
            "org_site_category_id": "storage",
            "org_site_subcategory_id": "maintenance_storage",
        }))

    insert_rows(supabase, "org_site", rows)


def migrate_invnt_item(supabase, client):
    """Migrate inventory items from invnt_item sheet."""
    ws = client.open_by_key(SHEET_ID).worksheet("invnt_item")
    records = ws.get_all_records()

    # Legacy category -> new category mapping
    LEGACY_CAT_MAP = {
        "Chems/Pestic": "chemicals_pesticides",
        "Fert": "fertilizers",
        "Seeds": "seeds",
        "Trial Seeds": "seeds",
        "Grow": "growing",
        "Packaging": "packing",
        "Maint Parts": "maintenance",
        "Lab Supplies": "food_safety",
    }

    # Trial Seeds -> subcategory "trial"
    LEGACY_SUB_OVERRIDE = {
        "Trial Seeds": "trial",
    }

    # UOM mapping: legacy names -> sys_uom codes
    UOM_MAP = {
        "seeds": "seed", "pieces": "piece", "bags": "bag", "boxes": "box",
        "pounds": "pound", "rolls": "roll", "bottles": "bottle",
        "gallons": "gallon", "trays": "tray", "packs": "pack",
        "labels": "label", "cases": "case", "drums": "drum",
        "clips": "clip", "kits": "kit", "pallets": "pallet",
        "units": "unit", "dozen": "dozen", "lids": "lid",
        "quarts": "quart", "ounces": "ounce", "grams": "gram",
        "feet": "feet", "meters": "meter", "impressions": "impression",
        "blades": "blade", "reactions": "reactions",
        "fluid ounces": "fluid_ounce", "fluid_ounces": "fluid_ounce",
        "ml": "milliliter", "milliliters": "milliliter",
        # Singular forms
        "seed": "seed", "piece": "piece", "bag": "bag", "box": "box",
        "pound": "pound", "roll": "roll", "bottle": "bottle",
        "gallon": "gallon", "tray": "tray", "pack": "pack",
        "label": "label", "case": "case", "drum": "drum",
        "clip": "clip", "kit": "kit", "pallet": "pallet",
        "unit": "unit", "lid": "lid", "quart": "quart",
        "ounce": "ounce", "gram": "gram", "blade": "blade",
        "impression": "impression", "count": "count",
        "cubes": "cubes",
    }

    def safe_float(val, default=0):
        try:
            v = str(val).strip().replace(",", "")
            return float(v) if v else default
        except (ValueError, TypeError):
            return default

    def parse_bool(val):
        return str(val).strip().upper() in ("TRUE", "YES", "1")

    def map_uom(val):
        v = str(val).strip().lower()
        return UOM_MAP.get(v, v) if v else None

    rows = []
    seen = set()

    for r_raw in records:
        # Strip whitespace from all keys (legacy headers have leading/trailing spaces)
        r = {str(k).strip(): v for k, v in r_raw.items()}
        name = str(r.get("ItemName", "")).strip()
        if not name:
            continue

        item_id = to_id(name)
        if item_id in seen:
            continue
        seen.add(item_id)

        # Category mapping
        legacy_cat = str(r.get("ItemCategory", "")).strip()
        cat_id = LEGACY_CAT_MAP.get(legacy_cat)

        # Subcategory: check override first, then ItemSubCategory
        sub_id = LEGACY_SUB_OVERRIDE.get(legacy_cat)
        if not sub_id:
            sub = str(r.get("ItemSubCategory", "")).strip()
            sub_id = to_id(sub) if sub else None

        # Farm — "HF" is the org, not a farm; skip it
        farm = str(r.get("Farm", "")).strip()
        farm_id = to_id(farm) if farm and farm.upper() != "HF" else None

        # UOMs
        burn_uom = map_uom(r.get("BurnUnits", ""))
        order_uom = map_uom(r.get("OrderUnits", ""))
        onhand_uom = burn_uom  # Set onhand_uom same as burn_uom

        # Burn per order — use legacy value; default to 1 only when zero/empty AND burn_uom == order_uom
        burn_per_order = safe_float(r.get("BurnPerOrderUnit", ""))
        if burn_per_order == 0 and burn_uom and order_uom and burn_uom == order_uom:
            burn_per_order = 1
        burn_per_onhand = 1  # Since onhand_uom = burn_uom, 1:1 ratio

        # Burn rates
        burn_per_week = safe_float(r.get("EstimatedBurnPerWeek", ""))
        cushion_raw = safe_float(r.get("CushionWeeks", ""))
        lead_time = safe_float(r.get("EstimatedLeadTimeWeeks", ""))
        cushion_weeks = cushion_raw + lead_time

        # Calculate reorder point and quantity
        reorder_point = round(burn_per_week * cushion_weeks, 2)
        reorder_quantity = round(burn_per_week * cushion_weeks, 2)

        # Pallet
        is_palletized = parse_bool(r.get("Pallet", ""))
        order_per_pallet = safe_float(r.get("OrderUnitsPerPallet", ""))
        pallet_per_truckload = safe_float(r.get("PalletsPerTruckload", ""))

        # Site (storage location)
        location = str(r.get("ItemLocation", "")).strip()
        site_id = to_id(location) if location else None

        # Variety — only set if it exists in grow_variety (skip unknown codes like 'kl')
        variety = str(r.get("SeedVariety", "")).strip()
        variety_id = variety.lower() if variety else None
        VALID_VARIETIES = {v.lower() for v in ["BB","E","GA","GB","GC","GF","GG","GL","GO","GR","GT",
            "J","K","KE","MX","RB","RC","RL","RO","RR","SP","WC","WR","WS"]}
        if variety_id and variety_id not in VALID_VARIETIES:
            variety_id = None

        # Pelleted
        pelleted_raw = str(r.get("Pelleted", "")).strip()
        seed_is_pelleted = True if pelleted_raw.lower() == "true" else (False if pelleted_raw.lower() == "false" else None)

        # Status — Active vs Inactive
        status = str(r.get("ItemStatus", "")).strip().lower()
        is_active = status != "inactive"

        # Photo
        photo = str(r.get("ItemPhoto", "")).strip()
        photos = [photo] if photo else []

        # QB account
        qb = str(r.get("QuickBooksAccount", "")).strip()

        # Manufacturer from SeedMaker
        manufacturer = str(r.get("SeedMaker", "")).strip() or None

        # Maintenance part number from ModelSerialNumber
        maint_part_number = str(r.get("ModelSerialNumber", "")).strip() or None

        # Subcategory as maint_part_type for maintenance items
        maint_sub = str(r.get("ItemSubCategory", "")).strip()
        maint_part_type = maint_sub if legacy_cat == "Maint Parts" and maint_sub else None

        row = {
            "id": item_id,
            "org_id": ORG_ID,
            "farm_id": farm_id,
            "invnt_category_id": cat_id,
            "invnt_subcategory_id": sub_id,
            "name": name,
            "qb_account": qb or None,
            "burn_uom": burn_uom,
            "onhand_uom": onhand_uom,
            "order_uom": order_uom,
            "burn_per_onhand": burn_per_onhand,
            "burn_per_order": burn_per_order,
            "is_palletized": is_palletized,
            "order_per_pallet": order_per_pallet,
            "pallet_per_truckload": pallet_per_truckload,
            "is_frequently_used": parse_bool(r.get("FrequentlyOrdered", "")),
            "burn_per_week": burn_per_week,
            "cushion_weeks": cushion_weeks,
            "reorder_point_in_burn": reorder_point,
            "reorder_quantity_in_burn": reorder_quantity,
            "site_id": site_id,
            "invnt_vendor_id": None,
            "manufacturer": manufacturer,
            "grow_variety_id": variety_id,
            "seed_is_pelleted": seed_is_pelleted,
            "maint_part_type": maint_part_type,
            "maint_part_number": maint_part_number,
            "photos": photos,
            "is_active": is_active,
        }
        rows.append(audit(row))

    insert_rows(supabase, "invnt_item", rows)
    return records  # Return for downstream use


def main():
    if not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY in .env or environment")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    client = get_sheets()

    # Clear in reverse FK order
    print("Clearing tables...")
    for t in ["invnt_onhand", "invnt_po_received", "invnt_lot", "invnt_po",
              "invnt_item", "invnt_category", "invnt_vendor"]:
        try:
            supabase.table(t).delete().neq("org_id", "___never___").execute()
        except Exception:
            pass
    # Clear only maintenance_storage sites (don't touch org.py sites)
    try:
        supabase.table("org_site").delete().eq("org_site_subcategory_id", "maintenance_storage").execute()
    except Exception:
        pass
    # Clear the maintenance_storage subcategory
    try:
        supabase.table("org_site_category").delete().eq("id", "maintenance_storage").execute()
    except Exception:
        pass
    print("  All cleared")

    migrate_invnt_vendor(supabase, client)
    migrate_invnt_category(supabase, client)
    migrate_storage_sites(supabase, client)
    migrate_invnt_item(supabase, client)

    print("\nInventory data migrated successfully")


if __name__ == "__main__":
    main()
