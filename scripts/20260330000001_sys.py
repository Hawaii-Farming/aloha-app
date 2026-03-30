"""
Seed System Data
=================
Seeds sys_access_level, sys_module, and sys_sub_module tables.
Sub-module access levels are mapped from legacy Google Sheet levels:
  Legacy Level 1 → employee (level 1)
  Legacy Level 2 → manager (level 3)
  Legacy Level 3 → admin (level 4)

Usage:
    python scripts/01_seed_system_data.py
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
        {"id": "employee",  "name": "Employee",  "level": 1, "display_order": 0, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "team_lead", "name": "Team Lead", "level": 2, "display_order": 1, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "manager",   "name": "Manager",   "level": 3, "display_order": 2, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "admin",     "name": "Admin",     "level": 4, "display_order": 3, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "owner",     "name": "Owner",     "level": 5, "display_order": 4, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
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
        {"id": "grow",            "name": "Grow",            "display_order": 0, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "pack",            "name": "Pack",            "display_order": 1, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "food_safety",     "name": "Food Safety",     "display_order": 2, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "maintenance",     "name": "Maintenance",     "display_order": 3, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "inventory",       "name": "Inventory",       "display_order": 4, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "human_resources", "name": "Human Resources", "display_order": 5, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "sales",           "name": "Sales",           "display_order": 6, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
        {"id": "operations",      "name": "Operations",      "display_order": 7, "created_by": AUDIT_USER, "updated_by": AUDIT_USER},
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
            "display_order": len(rows),
            "created_by": AUDIT_USER,
            "updated_by": AUDIT_USER,
        })

    insert_rows(supabase, "sys_sub_module", rows)


def main():
    if not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY in .env or environment")
        print("  Get it from: Supabase Dashboard → Settings → API → service_role key")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Clear in reverse FK order first
    print("Clearing tables in FK dependency order...")
    supabase.table("sys_sub_module").delete().neq("id", "___never___").execute()
    supabase.table("sys_module").delete().neq("id", "___never___").execute()
    supabase.table("sys_access_level").delete().neq("id", "___never___").execute()
    print("  All cleared")

    seed_access_levels(supabase)
    seed_modules(supabase)
    seed_sub_modules(supabase)

    print("\nSystem data seeded successfully")


if __name__ == "__main__":
    main()
