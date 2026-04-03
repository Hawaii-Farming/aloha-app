"""
Migrate Training Data
======================
Migrates training types, training sessions, and per-employee attendance
from legacy food safety Google Sheets.

Source: https://docs.google.com/spreadsheets/d/1MbHJoJmq0w8hWz8rl9VXezmK-63MFmuK19lz3pu0dfc
  - fsafe_log_training: 49 rows → ops_training_type + ops_training
  - fsafe_log_training_employees: 10656 rows → ops_training_attendee

Usage:
    python scripts/migrations/20260401000007d_ops_training.py

Rerunnable: clears and reinserts all data on each run.
"""

import os
import re
from datetime import datetime

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

def insert_rows(supabase, table: str, rows: list):
    print(f"\n--- {table} ---")
    all_data = []
    if rows:
        for i in range(0, len(rows), 100):
            batch = rows[i:i + 100]
            result = supabase.table(table).insert(batch).execute()
            all_data.extend(result.data)
        print(f"  Inserted {len(rows)} rows")
    return all_data

def parse_date(date_str):
    if not date_str or not str(date_str).strip():
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(date_str).strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def parse_timestamp(ts_str):
    if not ts_str or not str(ts_str).strip():
        return None
    for fmt in ("%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y"):
        try:
            return datetime.strptime(str(ts_str).strip(), fmt).isoformat()
        except ValueError:
            continue
    return None

def get_sheets():
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)
    return gspread.authorize(creds)


def migrate_training(supabase, gc):
    wb = gc.open_by_key(FSAFE_SHEET_ID)
    training_data = wb.worksheet("fsafe_log_training").get_all_records()
    attendee_data = wb.worksheet("fsafe_log_training_employees").get_all_records()

    print(f"\nProcessing {len(training_data)} training sessions, {len(attendee_data)} attendee rows...")

    # Employee lookups
    emp_result = supabase.table("hr_employee").select("id, first_name, last_name, preferred_name, company_email").execute()
    emp_by_email = {e["company_email"]: e["id"] for e in emp_result.data if e.get("company_email")}
    emp_by_name = {}
    for e in emp_result.data:
        full_upper = f"{e['last_name']} {e['first_name']}".upper()
        emp_by_name[full_upper] = e["id"]
        fn = (e.get("first_name") or "").lower()
        pn = (e.get("preferred_name") or "").lower()
        if fn:
            emp_by_name[fn] = e["id"]
        if pn:
            emp_by_name[pn] = e["id"]

    # --- Training types ---
    types = sorted(set(str(r.get("TrainingType", "")).strip() for r in training_data
                       if str(r.get("TrainingType", "")).strip()))
    type_rows = [audit({"id": to_id(t), "org_id": ORG_ID, "name": proper_case(t)}) for t in types]
    insert_rows(supabase, "ops_training_type", type_rows)

    # --- Training sessions ---
    training_rows = []
    training_id_map = {}

    for r in training_data:
        training_id = str(r.get("TrainingID", "")).strip()
        if not training_id:
            continue

        training_type = str(r.get("TrainingType", "")).strip()
        type_id = to_id(training_type) if training_type else None
        training_date = parse_date(r.get("TrainingDateTime"))

        topics_raw = str(r.get("TopicsCovered", "")).strip()
        topics = [t.strip() for t in topics_raw.split("+") if t.strip()] if topics_raw else []

        # Trainer: split on "+", resolve first non-URL name, put extras in notes
        trainer_raw = str(r.get("TrainedBy", "")).strip()
        trainer_id = None
        materials_url = None
        notes = None
        if trainer_raw:
            parts = [p.strip() for p in trainer_raw.split("+") if p.strip()]
            for part in parts:
                if part.startswith("http"):
                    materials_url = part
                    continue
                if not trainer_id:
                    trainer_id = emp_by_name.get(part.lower())

            names = [p for p in parts if not p.startswith("http")]
            urls = [p for p in parts if p.startswith("http")]
            note_parts = []
            if len(names) > 1:
                note_parts.append(f"Trainers: {', '.join(names)}")
            if urls:
                note_parts.append(f"Materials: {', '.join(urls)}")
            notes = "; ".join(note_parts) if note_parts else None

        reported_by = str(r.get("ReportedBy", "")).strip().lower() or AUDIT_USER
        verified_at = parse_timestamp(r.get("VerifiedDateTime"))
        verified_by = emp_by_email.get(str(r.get("VerifiedBy", "")).strip().lower())

        training_id_map[training_id] = len(training_rows)
        training_rows.append({
            "org_id": ORG_ID, "ops_training_type_id": type_id,
            "training_date": training_date, "topics_covered": topics,
            "trainer_id": trainer_id, "materials_url": materials_url, "notes": notes,
            "verified_at": verified_at, "verified_by": verified_by,
            "created_by": reported_by, "updated_by": reported_by,
        })

    inserted_training = insert_rows(supabase, "ops_training", training_rows)

    # --- Attendees ---
    attendee_rows = []
    skipped = 0
    dedup = set()

    for r in attendee_data:
        training_id = str(r.get("TrainingID", "")).strip()
        idx = training_id_map.get(training_id)
        if idx is None:
            skipped += 1
            continue

        ops_training_id = inserted_training[idx]["id"]
        full_name = str(r.get("FullName", "")).strip().upper()
        emp_id = emp_by_name.get(full_name)
        if not emp_id:
            skipped += 1
            continue

        dedup_key = (ops_training_id, emp_id)
        if dedup_key in dedup:
            continue
        dedup.add(dedup_key)

        attended = str(r.get("AttendedTraining", "")).strip().upper() == "TRUE"
        if not attended:
            continue

        signed_at = parse_timestamp(r.get("DigitalSignatureDateTime"))
        attendee_rows.append({
            "org_id": ORG_ID, "ops_training_id": ops_training_id,
            "hr_employee_id": emp_id, "signed_at": signed_at,
            "created_by": AUDIT_USER, "updated_by": AUDIT_USER,
        })

    insert_rows(supabase, "ops_training_attendee", attendee_rows)
    if skipped:
        print(f"  Skipped {skipped} attendee rows (unknown training or employee)")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    gc = get_sheets()

    print("=" * 60)
    print("TRAINING MIGRATION")
    print("=" * 60)

    print("\nClearing training tables...")
    supabase.table("ops_training_attendee").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("ops_training").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("ops_training_type").delete().neq("id", "__none__").execute()
    print("  Cleared")

    migrate_training(supabase, gc)

    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)


if __name__ == "__main__":
    main()
