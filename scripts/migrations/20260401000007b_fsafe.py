"""
Migrate Food Safety Lookup Data
=================================
Migrates fsafe_lab_test, food safety org_sites (EMP testing surfaces
and pest trap stations), and ops_corrective_action_choice from legacy
Google Sheets.

Source: https://docs.google.com/spreadsheets/d/1MbHJoJmq0w8hWz8rl9VXezmK-63MFmuK19lz3pu0dfc
  - fsafe_test_name: 14 rows → fsafe_lab_test (EMP/water tests only)
  - fsafe_site_name: 642 rows → org_site (food_safety category)
  - fsafe_log_pest_stations: 79 rows → org_site (pest_trap category)
  - fsafe_corrective_actions: 11 rows → ops_corrective_action_choice

Usage:
    python scripts/migrations/20260401000007b_fsafe.py

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
FSAFE_SHEET_ID = "1MbHJoJmq0w8hWz8rl9VXezmK-63MFmuK19lz3pu0dfc"

BUILDING_SITE_MAP = {
    ("cuke", "gh"): "jtl",
    ("cuke", "ph"): "bip_ph",
    ("lettuce", "gh"): "gh",
    ("lettuce", "ph"): "lettuce_ph",
}

ZONE_MAP = {
    "1": "zone_1", "2": "zone_2", "3": "zone_3", "4": "zone_4", "water": "water",
}

PEST_SITE_MAP = {
    ("cuke", "ph"): "bip_ph", ("cuke", "gh"): "jtl",
    ("cuke", "hi"): "hi", ("cuke", "hk"): "hk", ("cuke", "ko"): "ko",
    ("cuke", "wa"): "wa", ("cuke", "nursery"): "ne",
    ("lettuce", "ph"): "lettuce_ph", ("lettuce", "gh"): "gh",
}


def to_id(name: str) -> str:
    return re.sub(r"[^a-z0-9_]+", "_", name.lower()).strip("_") if name else ""

def proper_case(val):
    if not val or not str(val).strip():
        return val
    return str(val).strip().title()

def audit(row: dict) -> dict:
    row["created_by"] = AUDIT_USER
    row["updated_by"] = AUDIT_USER
    return row

def insert_rows(supabase, table: str, rows: list, upsert=False):
    print(f"\n--- {table} ---")
    all_data = []
    if rows:
        for i in range(0, len(rows), 100):
            batch = rows[i:i + 100]
            if upsert:
                result = supabase.table(table).upsert(batch).execute()
            else:
                result = supabase.table(table).insert(batch).execute()
            all_data.extend(result.data)
        action = "Upserted" if upsert else "Inserted"
        print(f"  {action} {len(rows)} rows")
    return all_data

def safe_numeric(val, default=None):
    try:
        v = str(val).strip().replace(",", "")
        return float(v) if v else default
    except (ValueError, TypeError):
        return default

def get_sheets():
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)
    return gspread.authorize(creds)


def migrate_lab_tests(supabase, gc):
    wb = gc.open_by_key(FSAFE_SHEET_ID)
    data = wb.worksheet("fsafe_test_name").get_all_records()
    print(f"\nProcessing {len(data)} test definitions...")

    rows = []
    for r in data:
        name = str(r.get("TestName", "")).strip()
        log = str(r.get("Log", "")).strip()
        if not name or log == "CheckList":
            continue
        is_positive = str(r.get("PositiveResult", "")).strip().upper() == "TRUE"
        if is_positive:
            row = {"id": to_id(name), "org_id": ORG_ID, "test_name": proper_case(name),
                   "result_type": "enum", "enum_options": ["Positive", "Negative"],
                   "enum_pass_options": ["Negative"]}
        else:
            row = {"id": to_id(name), "org_id": ORG_ID, "test_name": proper_case(name),
                   "result_type": "numeric", "minimum_value": safe_numeric(r.get("MinResult")),
                   "maximum_value": safe_numeric(r.get("MaxResult"))}
        rows.append(audit(row))

    insert_rows(supabase, "fsafe_lab_test", rows, upsert=True)

    supabase.table("fsafe_lab_test").upsert(audit({
        "id": "listeria_monocytogenes", "org_id": ORG_ID,
        "test_name": "Listeria Monocytogenes", "result_type": "enum",
        "enum_options": ["Positive", "Negative"], "enum_pass_options": ["Negative"],
    })).execute()
    print("  Upserted Listeria Monocytogenes lab test")


def migrate_fsafe_sites(supabase, gc):
    wb = gc.open_by_key(FSAFE_SHEET_ID)
    data = wb.worksheet("fsafe_site_name").get_all_records()
    print(f"\nProcessing {len(data)} food safety sites...")

    rows = []
    seen = set()
    for r in data:
        site_name = str(r.get("SiteName", "")).strip()
        if not site_name:
            continue
        farm = str(r.get("Farm", "")).strip().lower()
        building = str(r.get("Building", "")).strip().lower()
        zone = ZONE_MAP.get(str(r.get("Zone", "")).strip().lower())
        farm_id = farm if farm in ("cuke", "lettuce") else None
        parent_id = BUILDING_SITE_MAP.get((farm, building))
        site_id = to_id(f"{farm}_{building}_{site_name}")
        if site_id in seen:
            continue
        seen.add(site_id)
        display_name = f"{building.upper()} - {site_name}"
        rows.append(audit({"id": site_id, "org_id": ORG_ID, "farm_id": farm_id,
                           "name": display_name, "org_site_category_id": "food_safety",
                           "site_id_parent": parent_id, "zone": zone}))

    insert_rows(supabase, "org_site", rows, upsert=True)


def migrate_pest_stations(supabase, gc):
    wb = gc.open_by_key(FSAFE_SHEET_ID)
    data = wb.worksheet("fsafe_log_pest_stations").get_all_records()
    print(f"\nProcessing {len(data)} pest trap stations...")

    rows = []
    seen = set()
    for r in data:
        farm = str(r.get("Farm", "")).strip().lower()
        site_name = str(r.get("Site Name", "")).strip().lower()
        station = str(r.get("Station", "")).strip()
        if not farm or not site_name or not station:
            continue
        farm_id = farm if farm in ("cuke", "lettuce") else None
        parent_id = PEST_SITE_MAP.get((farm, site_name))
        display_name = f"{site_name.upper()} - Trap {station}"
        site_id = to_id(f"{farm}_{site_name}_trap_{station}")
        if site_id in seen:
            continue
        seen.add(site_id)
        rows.append(audit({"id": site_id, "org_id": ORG_ID, "farm_id": farm_id,
                           "name": display_name, "org_site_category_id": "pest_trap",
                           "site_id_parent": parent_id}))

    insert_rows(supabase, "org_site", rows, upsert=True)


def migrate_corrective_action_choices(supabase, gc):
    wb = gc.open_by_key(FSAFE_SHEET_ID)
    data = wb.worksheet("fsafe_corrective_actions").get_all_records()
    print(f"\nProcessing {len(data)} corrective action choices...")

    rows = []
    seen = set()
    for r in data:
        short_name = str(r.get("CorrectiveActionShortName", "")).strip()
        description = str(r.get("CorrectiveActionDescription", "")).strip() or None
        if not short_name:
            continue
        choice_id = to_id(short_name)
        if choice_id in seen:
            continue
        seen.add(choice_id)
        rows.append(audit({"id": choice_id, "org_id": ORG_ID,
                           "name": proper_case(short_name), "description": description}))

    insert_rows(supabase, "ops_corrective_action_choice", rows)


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    gc = get_sheets()

    print("=" * 60)
    print("FOOD SAFETY LOOKUPS MIGRATION")
    print("=" * 60)

    print("\nClearing food safety lookup data...")
    for t in ["ops_corrective_action_choice", "fsafe_lab_test"]:
        try:
            supabase.table(t).delete().neq("id", "__none__").execute()
        except Exception:
            pass  # May fail if referenced by results; will be upserted
    print("  Cleared")

    migrate_lab_tests(supabase, gc)
    migrate_fsafe_sites(supabase, gc)
    migrate_pest_stations(supabase, gc)
    migrate_corrective_action_choices(supabase, gc)

    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)


if __name__ == "__main__":
    main()
