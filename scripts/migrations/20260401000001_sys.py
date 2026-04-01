"""
Migrate System Data
====================
Migrates sys_access_level, sys_module, and sys_sub_module from legacy
Google Sheets to Supabase.

Source: https://docs.google.com/spreadsheets/d/1VOVyYt_Mk7QJkjZFRyq3iLf6xkBrZUWarobv7tf8yZA
  - sys_access_level: hardcoded 5 levels (employee, team_lead, manager, admin, owner)
  - sys_module: hardcoded 8 application modules
  - sys_sub_module: from sheet 'global_menu_icons_sub'

Legacy access level mapping:
  Sheet Level 1 -> employee (level 1)
  Sheet Level 2 -> manager (level 3)
  Sheet Level 3 -> admin (level 4)

Usage:
    python scripts/migrations/20260401000001_sys.py

Rerunnable: clears and reinserts all data on each run.
"""

import os
import re
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kfwqtaazdankxmdlqdak.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
AUDIT_USER = "data@hawaiifarming.com"

# If no service key in env, try reading from .env file
if not SUPABASE_KEY:
    try:
        with open(".env") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_KEY="):
                    SUPABASE_KEY = line.strip().split("=", 1)[1]
    except FileNotFoundError:
        pass


def to_id(name: str) -> str:
    """Convert a display name to a TEXT PK (lowercase, underscores, trimmed)."""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def insert_rows(supabase, table: str, rows: list):
    """Insert rows into a table. Prints progress."""
    print(f"\n--- {table} ---")
    if rows:
        supabase.table(table).insert(rows).execute()
        print(f"  Inserted {len(rows)} rows")


def seed_access_levels(supabase):
    """Seed the 5 access levels."""
    rows = [
        {"id": "employee",  "name": "Employee",  "level": 1, "display_order": 1, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "team_lead", "name": "Team Lead", "level": 2, "display_order": 2, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "manager",   "name": "Manager",   "level": 3, "display_order": 3, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "admin",     "name": "Admin",     "level": 4, "display_order": 4, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "owner",     "name": "Owner",     "level": 5, "display_order": 5, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
    ]
    insert_rows(supabase, "sys_access_level", rows)


def seed_modules(supabase):
    """Seed the application modules."""
    modules = [
        ("grow",            "Grow"),
        ("pack",            "Pack"),
        ("food_safety",     "Food Safety"),
        ("maintenance",     "Maintenance"),
        ("inventory",       "Inventory"),
        ("human_resources", "Human Resources"),
        ("sales",           "Sales"),
        ("operations",      "Operations"),
    ]
    rows = [
        {"id": to_id(name), "name": name, "display_order": i}
        for i, (mid, name) in enumerate(modules)
    ]
    # Use the explicit IDs for consistency
    rows = [
        {"id": "operations",      "name": "Operations",      "display_order": 1, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "grow",            "name": "Grow",            "display_order": 2, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "pack",            "name": "Pack",            "display_order": 3, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "food_safety",     "name": "Food Safety",     "display_order": 4, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "maintenance",     "name": "Maintenance",     "display_order": 5, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "inventory",       "name": "Inventory",       "display_order": 6, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "sales",           "name": "Sales",           "display_order": 7, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "human_resources", "name": "Human Resources", "display_order": 8, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
    ]
    insert_rows(supabase, "sys_module", rows)


def seed_sub_modules(supabase):
    """
    Seed sub-modules from the legacy Google Sheet global_menu_icons_sub.

    Legacy level mapping:
      Level 1 → employee (sys_access_level_id = 'employee')
      Level 2 → manager  (sys_access_level_id = 'manager')
      Level 3 → admin    (sys_access_level_id = 'admin')
    """
    import gspread
    from google.oauth2.service_account import Credentials

    # Connect to Google Sheets
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)
    client = gspread.authorize(creds)

    sheet = client.open_by_key("1VOVyYt_Mk7QJkjZFRyq3iLf6xkBrZUWarobv7tf8yZA")
    ws = sheet.worksheet("global_menu_icons_sub")
    records = ws.get_all_records()

    # Map legacy levels to sys_access_level_id
    level_map = {
        "1": "employee",
        "2": "manager",
        "3": "admin",
        1: "employee",
        2: "manager",
        3: "admin",
    }

    # Map legacy main menu names to sys_module_id
    module_map = {
        "grow": "grow",
        "pack": "pack",
        "food safety": "food_safety",
        "maintenance": "maintenance",
        "inventory": "inventory",
        "human resources": "human_resources",
        "sales": "sales",
        "execute": "operations",
        "global": "operations",
    }

    rows = []
    seen = set()

    for i, record in enumerate(records):
        sub_name = record.get("SubMenuName", "").strip()
        main_name = record.get("MainMenuName", "").strip()
        level = record.get("Level", "1")

        if not sub_name or not main_name:
            continue

        sys_module_id = module_map.get(main_name.lower())
        if not sys_module_id:
            print(f"  SKIP: Unknown module '{main_name}' for sub '{sub_name}'")
            continue

        sys_access_level_id = level_map.get(level, "employee")
        sub_id = to_id(sub_name)

        # Deduplicate
        if sub_id in seen:
            continue
        seen.add(sub_id)

        rows.append({
            "id": sub_id,
            "sys_module_id": sys_module_id,
            "name": sub_name,
            "sys_access_level_id": sys_access_level_id,
            "display_order": len(rows) + 1,
            "created_by": AUDIT_USER,
            "updated_by": AUDIT_USER,
        })

    insert_rows(supabase, "sys_sub_module", rows)


def migrate_uom(supabase):
    """Migrate sys_uom from legacy Google Sheet + additional schema-required UOMs."""
    rows = [
        # From legacy Google Sheet (global_measurement_unit)
        {"code": "clip",         "name": "clip",         "category": "packaging"},
        {"code": "bag",          "name": "bag",          "category": "packaging"},
        {"code": "box",          "name": "box",          "category": "packaging"},
        {"code": "blade",        "name": "blade",        "category": "equipment"},
        {"code": "bottle",       "name": "bottle",       "category": "packaging"},
        {"code": "count",        "name": "count",        "category": "quantity"},
        {"code": "dozen",        "name": "dozen",        "category": "quantity"},
        {"code": "drum",         "name": "drum",         "category": "packaging"},
        {"code": "gallon",       "name": "gallon",       "category": "volume"},
        {"code": "board",        "name": "board",        "category": "growing"},
        {"code": "impression",   "name": "impression",   "category": "packaging"},
        {"code": "pallet",       "name": "pallet",       "category": "shipping"},
        {"code": "meter",        "name": "meter",        "category": "length"},
        {"code": "label",        "name": "label",        "category": "packaging"},
        {"code": "seed",         "name": "seed",         "category": "growing"},
        {"code": "pack",         "name": "pack",         "category": "packaging"},
        {"code": "tray",         "name": "tray",         "category": "packaging"},
        {"code": "unit",         "name": "unit",         "category": "quantity"},
        {"code": "roll",         "name": "roll",         "category": "packaging"},
        {"code": "lid",          "name": "lid",          "category": "packaging"},
        {"code": "pound",        "name": "lb",           "category": "weight"},
        {"code": "quart",        "name": "quart",        "category": "volume"},
        {"code": "ounce",        "name": "oz",           "category": "weight"},
        {"code": "gram",         "name": "g",            "category": "weight"},
        {"code": "kit",          "name": "kit",          "category": "quantity"},
        {"code": "feet",         "name": "ft",           "category": "length"},
        {"code": "fluid_ounce",  "name": "fl oz",        "category": "volume"},
        {"code": "milliliter",   "name": "mL",           "category": "volume"},
        {"code": "reactions",    "name": "reactions",     "category": "lab"},
        {"code": "cubes",       "name": "cubes",         "category": "quantity"},

        # Additional UOMs required by the new schema
        {"code": "kilogram",     "name": "kg",           "category": "weight"},
        {"code": "liter",        "name": "L",            "category": "volume"},
        {"code": "case",         "name": "case",         "category": "packaging"},
        {"code": "flat",         "name": "flat",         "category": "growing"},
        {"code": "tote",         "name": "tote",         "category": "packaging"},
        {"code": "basket",       "name": "basket",       "category": "packaging"},
        {"code": "clam",         "name": "clam",         "category": "packaging"},
        {"code": "sleeve",       "name": "sleeve",       "category": "packaging"},
        {"code": "bunch",        "name": "bunch",        "category": "quantity"},
        {"code": "head",         "name": "head",         "category": "quantity"},
        {"code": "piece",        "name": "piece",        "category": "quantity"},
        {"code": "acre",         "name": "acre",         "category": "area"},
        {"code": "inches",       "name": "in",           "category": "length"},
        {"code": "centimeter",   "name": "cm",           "category": "length"},
        {"code": "celsius",      "name": "C",            "category": "temperature"},
        {"code": "fahrenheit",   "name": "F",            "category": "temperature"},
        {"code": "ppm",          "name": "ppm",          "category": "concentration"},
        {"code": "ph",           "name": "pH",           "category": "concentration"},
        {"code": "percent",      "name": "%",            "category": "ratio"},
        {"code": "rlu",          "name": "RLU",          "category": "lab"},
        {"code": "each",         "name": "each",          "category": "quantity"},
        {"code": "hour",         "name": "hr",           "category": "time"},
        {"code": "day",          "name": "day",          "category": "time"},
    ]

    # Add audit fields
    for row in rows:
        row["created_by"] = AUDIT_USER
        row["updated_by"] = AUDIT_USER

    insert_rows(supabase, "sys_uom", rows)


def main():
    if not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY in .env or environment")
        print("  Get it from: Supabase Dashboard -> Settings -> API -> service_role key")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Clear org tables that reference sys tables first
    # Clear ALL dependent tables in reverse FK order
    print("Clearing all dependent tables...")
    for t in ["invnt_onhand", "invnt_po_received", "invnt_lot", "invnt_po", "invnt_item",
              "invnt_category", "invnt_vendor",
              "hr_time_off_request", "hr_module_access", "hr_employee",
              "hr_title", "hr_work_authorization", "hr_department",
              "grow_disease", "grow_pest", "grow_grade", "grow_variety",
              "org_sub_module", "org_module", "org_site", "org_site_category",
              "org_equipment", "org_business_rule", "org_farm", "org"]:
        try:
            supabase.table(t).delete().neq("org_id", "___never___").execute()
        except Exception:
            try:
                supabase.table(t).delete().neq("id", "___never___").execute()
            except Exception:
                pass
    print("  All dependencies cleared")

    # Clear sys tables in reverse FK order
    print("Clearing sys tables...")
    supabase.table("sys_sub_module").delete().neq("id", "___never___").execute()
    supabase.table("sys_module").delete().neq("id", "___never___").execute()
    supabase.table("sys_access_level").delete().neq("id", "___never___").execute()
    supabase.table("sys_uom").delete().neq("code", "___never___").execute()
    print("  All cleared")

    migrate_uom(supabase)
    seed_access_levels(supabase)
    seed_modules(supabase)
    seed_sub_modules(supabase)

    print("\nSystem data migrated successfully")


if __name__ == "__main__":
    main()
