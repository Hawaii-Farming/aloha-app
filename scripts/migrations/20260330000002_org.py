"""
Migrate Organization Data
==========================
Migrates org, org_farm, org_site_category, org_module, org_sub_module,
and grow_pest/grow_disease from legacy Google Sheets to Supabase.

Sources:
  - org: hardcoded (Hawaii Farming)
  - org_farm: from sheet 'global_farm'
  - org_site_category: from provisioning defaults
  - org_module: copied from sys_module for the org
  - org_sub_module: copied from sys_sub_module for the org
  - grow_pest / grow_disease: hardcoded common types

Source spreadsheet: https://docs.google.com/spreadsheets/d/1VOVyYt_Mk7QJkjZFRyq3iLf6xkBrZUWarobv7tf8yZA

Usage:
    python scripts/migrations/20260330000002_org.py

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


def to_id(name: str) -> str:
    """Convert a display name to a TEXT PK (lowercase, underscores, trimmed)."""
    return re.sub(r"[^a-z0-9]+", name.lower(), "_").strip("_") if name else ""


def to_id_safe(name: str) -> str:
    """Convert a display name to a TEXT PK."""
    return re.sub(r"[^a-z0-9_]+", "_", name.lower()).strip("_") if name else ""


def insert_rows(supabase, table: str, rows: list):
    """Insert rows into a table. Prints progress."""
    print(f"\n--- {table} ---")
    if rows:
        supabase.table(table).insert(rows).execute()
        print(f"  Inserted {len(rows)} rows")


def audit(row: dict) -> dict:
    """Add audit fields to a row."""
    row["created_by"] = AUDIT_USER
    row["updated_by"] = AUDIT_USER
    return row


def migrate_org(supabase):
    """Create the Hawaii Farming organization."""
    rows = [
        audit({
            "id": ORG_ID,
            "name": "Hawaii Farming",
            "address": "66-1475 Pu'u Huluhulu Rd, Kamuela HI",
            "currency": "USD",
        }),
    ]
    insert_rows(supabase, "org", rows)


def migrate_org_farm(supabase):
    """Migrate farms from legacy Google Sheet."""
    import gspread
    from google.oauth2.service_account import Credentials

    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)
    client = gspread.authorize(creds)

    sheet = client.open_by_key("1VOVyYt_Mk7QJkjZFRyq3iLf6xkBrZUWarobv7tf8yZA")
    ws = sheet.worksheet("global_farm")
    values = ws.col_values(1)[1:]  # skip header

    farm_defaults = {
        "cuke": {"weighing_uom": "pound", "growing_uom": "bag", "volume_uom": "gallon"},
        "lettuce": {"weighing_uom": "pound", "growing_uom": "board", "volume_uom": "gallon"},
    }

    rows = []
    for i, farm_name in enumerate(values):
        farm_name = farm_name.strip()
        if not farm_name or farm_name == ORG_ID.upper() or farm_name == "HF":
            continue  # skip the org-level entry
        farm_id = to_id_safe(farm_name)
        defaults = farm_defaults.get(farm_id, {})
        rows.append(audit({
            "id": farm_id,
            "org_id": ORG_ID,
            "name": farm_name,
            **defaults,
        }))

    insert_rows(supabase, "org_farm", rows)


def migrate_org_site_category(supabase):
    """Provision default site categories for the org."""
    categories = [
        # (category_name, sub_category_name)
        ("growing", None),
        ("growing", "greenhouse"),
        ("growing", "nursery"),
        ("growing", "pond"),
        ("growing", "row"),
        ("growing", "room"),
        ("packing", None),
        ("packing", "room"),
        ("housing", None),
        ("housing", "room"),
        ("food_safety", None),
        ("pest_trap", None),
        ("storage", None),
        ("storage", "warehouse"),
        ("storage", "chemical_storage"),
        ("storage", "cold_storage"),
    ]

    rows = []
    for cat, sub in categories:
        if sub == "room" and cat != "housing":
            cat_id = f"{cat}_{sub}"
        elif sub:
            cat_id = sub
        else:
            cat_id = cat
        rows.append(audit({
            "id": to_id_safe(cat_id),
            "org_id": ORG_ID,
            "category_name": cat,
            "sub_category_name": sub,
            "display_order": len(rows) + 1,
        }))

    insert_rows(supabase, "org_site_category", rows)


def migrate_org_module(supabase):
    """Copy sys_module records into org_module for this org."""
    # Read sys_module
    result = supabase.table("sys_module").select("id, name, display_order").order("display_order").execute()

    rows = []
    for mod in result.data:
        rows.append(audit({
            "id": mod["id"],
            "org_id": ORG_ID,
            "sys_module_id": mod["id"],
            "display_name": mod["name"],
            "is_enabled": True,
            "display_order": mod["display_order"],
        }))

    insert_rows(supabase, "org_module", rows)


def migrate_org_sub_module(supabase):
    """Copy sys_sub_module records into org_sub_module for this org."""
    # Read sys_sub_module
    result = supabase.table("sys_sub_module").select(
        "id, sys_module_id, name, sys_access_level_id, display_order"
    ).order("display_order").execute()

    rows = []
    for sub in result.data:
        rows.append(audit({
            "id": sub["id"],
            "org_id": ORG_ID,
            "sys_module_id": sub["sys_module_id"],
            "sys_sub_module_id": sub["id"],
            "sys_access_level_id": sub["sys_access_level_id"],
            "display_name": sub["name"],
            "is_enabled": True,
            "display_order": sub["display_order"],
        }))

    insert_rows(supabase, "org_sub_module", rows)


def migrate_org_site(supabase):
    """Migrate org sites with parent-child hierarchy from legacy Google Sheet."""

    # -- CUKE FARM: Parent sites --
    cuke_parents = [
        audit({
            "id": "jtl",
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "name": "JTL",
            "org_site_category_id": "growing",
            "display_order": 1,
        }),
        audit({
            "id": "bip",
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "name": "BIP",
            "org_site_category_id": "growing",
            "display_order": 2,
        }),
    ]

    # JTL greenhouses (numbered 01-08)
    jtl_greenhouses = {
        "01": 1, "02": 2, "03": 3, "04": 4,
        "05": 5, "06": 6, "07": 7, "08": 8,
    }

    # BIP greenhouses (lettered) + nurseries
    bip_greenhouses = {
        "KO": 1, "HK": 2, "WA": 3, "HI": 4,
    }
    bip_nurseries = {
        "NE": 5, "NW": 6,
    }

    # Legacy sqft/rows data for lookup
    legacy_data = {
        "KO": (41506, 36), "08": (43368, 42), "01": (43196, 60),
        "HK": (45531, 64), "07": (41106, 45), "WA": (40634, 48),
        "04": (41818, 42), "02": (53817, 63), "06": (53817, 63),
        "HI": (39583, 42), "05": (43196, 59), "03": (43196, 60),
    }

    # Monitoring stations per site
    gh_default_stations = ["A", "B"]
    station_overrides = {
        "HK": ["KA", "KB", "HA", "HB"],
    }
    nursery_stations = ["Water", "Low", "High"]
    pond_stations = ["East", "West"]

    cuke_children = []

    # JTL greenhouses
    for code, order in jtl_greenhouses.items():
        sqft, _rows = legacy_data.get(code, (None, None))
        stations = station_overrides.get(code, gh_default_stations)
        site = {
            "id": code.lower(),
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "name": code,
            "org_site_category_id": "growing",
            "org_site_subcategory_id": "greenhouse",
            "site_id_parent": "jtl",
            "monitoring_stations": stations,
            "display_order": order,
        }
        if sqft:
            site["acres"] = round(sqft / 43560, 2)
        cuke_children.append(audit(site))

    # BIP greenhouses
    for code, order in bip_greenhouses.items():
        sqft, _rows = legacy_data.get(code, (None, None))
        stations = station_overrides.get(code, gh_default_stations)
        site = {
            "id": code.lower(),
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "name": code,
            "org_site_category_id": "growing",
            "org_site_subcategory_id": "greenhouse",
            "site_id_parent": "bip",
            "monitoring_stations": stations,
            "display_order": order,
        }
        if sqft:
            site["acres"] = round(sqft / 43560, 2)
        cuke_children.append(audit(site))

    # BIP nurseries
    for code, order in bip_nurseries.items():
        cuke_children.append(audit({
            "id": code.lower(),
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "name": code,
            "org_site_category_id": "growing",
            "org_site_subcategory_id": "nursery",
            "site_id_parent": "bip",
            "monitoring_stations": nursery_stations,
            "display_order": order,
        }))

    # -- LETTUCE FARM: Parent site --
    lettuce_parent = [
        audit({
            "id": "gh",
            "org_id": ORG_ID,
            "farm_id": "lettuce",
            "name": "GH",
            "org_site_category_id": "growing",
            "acres": round(108900 / 43560, 2),
            "display_order": 1,
        }),
    ]

    # Lettuce ponds (P1-P7)
    lettuce_ponds_data = {
        "P1": (5260, 20, 1), "P2": (13920, 40, 2), "P3": (13920, 40, 3),
        "P4": (13920, 40, 4), "P5": (13920, 40, 5), "P6": (13920, 40, 6),
        "P7": (13920, 40, 7),
    }

    lettuce_children = []
    for code, (sqft, _rows, order) in lettuce_ponds_data.items():
        lettuce_children.append(audit({
            "id": code.lower(),
            "org_id": ORG_ID,
            "farm_id": "lettuce",
            "name": code,
            "org_site_category_id": "growing",
            "org_site_subcategory_id": "pond",
            "site_id_parent": "gh",
            "monitoring_stations": pond_stations,
            "acres": round(sqft / 43560, 2),
            "display_order": order,
        }))

    # -- HOUSING SITES (org-wide, no farm_id) --
    housing_sites = [
        "BIP (5)", "Duplex", "JTL (1)", "JTL (2)",
        "Kawano (3)", "Kawano (4)", "Minor's", "Pete's",
        "Todd's", "South Kohala",
    ]
    housing_rows = []
    for i, name in enumerate(housing_sites):
        housing_rows.append(audit({
            "id": to_id_safe(name),
            "org_id": ORG_ID,
            "name": name,
            "org_site_category_id": "housing",
            "display_order": i + 1,
        }))

    # Insert parents first, then children, then housing
    insert_rows(supabase, "org_site", cuke_parents + lettuce_parent + housing_rows)
    print(f"  ({len(cuke_parents + lettuce_parent)} parent + {len(housing_rows)} housing sites inserted)")
    supabase.table("org_site").insert(cuke_children + lettuce_children).execute()
    print(f"  Inserted {len(cuke_children + lettuce_children)} child sites")


def migrate_grow_variety(supabase):
    """Migrate grow varieties from legacy Google Sheet."""
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)
    client = gspread.authorize(creds)
    ws = client.open_by_key("1VtEecYn-W1pbnIU1hRHfxIpkH2DtK7hj0CpcpiLoziM").worksheet("grow_variety")
    records = ws.get_all_records()

    rows = []
    for r in records:
        code = str(r.get("Variety", "")).strip()
        name = str(r.get("VarietyName", "")).strip()
        farm = str(r.get("Farm", "")).strip()
        if not code or not name:
            continue
        rows.append(audit({
            "id": code.lower(),
            "org_id": ORG_ID,
            "farm_id": to_id_safe(farm),
            "code": code,
            "name": name,
        }))

    insert_rows(supabase, "grow_variety", rows)


def migrate_grow_grade(supabase):
    """Migrate grow grades — hardcoded for Cuke farm."""
    rows = [
        audit({
            "id": "on_grade",
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "code": "1",
            "name": "On Grade",
        }),
        audit({
            "id": "off_grade",
            "org_id": ORG_ID,
            "farm_id": "cuke",
            "code": "2",
            "name": "Off Grade",
        }),
    ]
    insert_rows(supabase, "grow_grade", rows)


def migrate_grow_pest(supabase):
    """Migrate common pest types."""
    pests = [
        "Aphid", "Whitefly", "Thrips", "Spider Mite", "Mealybug",
        "Fungus Gnat", "Shore Fly", "Caterpillar", "Leafminer",
    ]
    rows = [
        audit({"id": to_id_safe(p), "name": p})
        for p in pests
    ]
    insert_rows(supabase, "grow_pest", rows)


def migrate_grow_disease(supabase):
    """Migrate common disease types."""
    diseases = [
        "Powdery Mildew", "Downy Mildew", "Botrytis", "Fusarium",
        "Pythium", "Root Rot", "Bacterial Leaf Spot", "Tipburn",
    ]
    rows = [
        audit({"id": to_id_safe(d), "name": d})
        for d in diseases
    ]
    insert_rows(supabase, "grow_disease", rows)


def main():
    if not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY in .env or environment")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Clear in reverse FK order
    print("Clearing tables in FK dependency order...")
    supabase.table("grow_disease").delete().neq("id", "___never___").execute()
    supabase.table("grow_pest").delete().neq("id", "___never___").execute()
    supabase.table("grow_grade").delete().neq("id", "___never___").execute()
    supabase.table("grow_variety").delete().neq("id", "___never___").execute()
    # Clear HR tables that reference org tables
    for t in ["hr_time_off_request", "hr_module_access", "hr_employee",
              "hr_title", "hr_work_authorization", "hr_department"]:
        try:
            supabase.table(t).delete().neq("org_id" if t != "hr_time_off_request" else "org_id", "___never___").execute()
        except Exception:
            pass
    supabase.table("org_sub_module").delete().neq("id", "___never___").execute()
    supabase.table("org_module").delete().neq("id", "___never___").execute()
    supabase.table("org_site").delete().neq("id", "___never___").execute()
    supabase.table("org_site_category").delete().neq("id", "___never___").execute()
    supabase.table("org_farm").delete().neq("id", "___never___").execute()
    supabase.table("org").delete().neq("id", "___never___").execute()
    print("  All cleared")

    migrate_org(supabase)
    migrate_org_farm(supabase)
    migrate_org_site_category(supabase)
    migrate_org_site(supabase)
    migrate_org_module(supabase)
    migrate_org_sub_module(supabase)
    migrate_grow_variety(supabase)
    migrate_grow_grade(supabase)
    migrate_grow_pest(supabase)
    migrate_grow_disease(supabase)

    print("\nOrg data migrated successfully")


if __name__ == "__main__":
    main()
