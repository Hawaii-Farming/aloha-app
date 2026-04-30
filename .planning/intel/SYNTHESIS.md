# Synthesis Summary

> Entry point for `gsd-roadmapper` (and humans). All numeric counts and pointers below.

## Inputs

- Mode: `merge`
- Precedence: `ADR > SPEC > PRD > DOC` (default; no per-doc overrides)
- Classifications consumed: 1 (`APPSHEET_SCRIPTS-a4f7c2e1.json`)
- Source documents synthesized: 1
- Existing context checked against:
  - /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/PROJECT.md
  - /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/ROADMAP.md
  - /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/STATE.md
  - /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/MILESTONES.md

## Doc counts by type

| Type | Count | Sources |
|---|---|---|
| ADR | 0 | — |
| SPEC | 0 | — |
| PRD | 0 | — |
| DOC | 1 | APPSHEET_SCRIPTS.md |

## Decisions

- Locked: 0
- Proposed: 6 (D-PROPOSED-01..06)
- See: `intel/decisions.md`

D-PROPOSED-06 (payroll ingest re-implementation) is no longer blocked: PROJECT.md line 57 strikes through the prior "Out of Scope: Payroll import/processing" decision, and a new Key Decisions row dated 2026-04-29 brings payroll ingest in-scope for the AppSheet Scripts Migration milestone.

## Requirements

- Extracted: 7 (none have formal acceptance — source is DOC, not PRD)
- IDs: REQ-email-weekly-schedule, REQ-process-hrb-payroll, REQ-rollover-daily-schedule, REQ-aggregate-weekly-schedule, REQ-aggregate-weekly-schedule-summary, REQ-compare-payroll-vs-schedule, REQ-seed-quarterly-review-rows
- All requirements: status `proposed` (none BLOCKED)
- See: `intel/requirements.md`

## Constraints

- Total: 9 (all informal — DOC source, not SPEC)
- Breakdown:
  - protocol: 5 (no SpreadsheetApp, no DriveApp, no MailApp, no Apps-Script PDF export, no Utilities.sleep)
  - nfr: 4 (HST tz preservation, computation fidelity, no hardcoded IDs, cron-not-manual triggers)
  - api-contract: 0
  - schema: 0 (legacy implies several table schemas, but they are not formally specified in the source)
- Retired: C-RESPECT-EXISTING-LOCKED-SCOPE (no longer applicable after 2026-04-29 PROJECT.md reversal)
- See: `intel/constraints.md`

## Context topics

- Legacy module inventory: 7 functions documented (1 emailSchedule, 1 runPayroll, 3 schedule, 1 payroll-comparison, 1 review-seed)
- Existing-app overlap map: 7 rows (which v1.0 surface each legacy function relates to)
- Suggested migration phasing: 3 phases (A schedule+review greenfield / B payroll ingest / C by-task projection)
- Open questions: 6 (incl. archival strategy, ingest trigger surface)
- See: `intel/context.md`

## Conflicts

- BLOCKERS: 0 — prior `runPayroll` BLOCKER cleared by PROJECT.md 2026-04-29 reversal
- WARNINGS (competing-variants): 0 — single-doc ingest precludes cross-PRD acceptance collisions
- INFO (auto-resolved): 4 — (1) the resolution audit trail for the cleared BLOCKER, (2) existing PROJECT.md UI/data-display contracts win on shipped surfaces with the DOC contributing the automation/computation layer, (3) no cross-ref cycles, (4) no LOCKED-vs-LOCKED contradictions
- See: `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/INGEST-CONFLICTS.md`

## Cross-references

- Per-type intel: `intel/decisions.md`, `intel/requirements.md`, `intel/constraints.md`, `intel/context.md`
- Conflicts: `.planning/INGEST-CONFLICTS.md`
- Source classification: `intel/classifications/APPSHEET_SCRIPTS-a4f7c2e1.json`
- Source document: `APPSHEET_SCRIPTS.md` (repo root)

## Status

**READY** — no blockers, no competing variants. Safe to route to `gsd-roadmapper` for the AppSheet Scripts Migration milestone. All 7 legacy automations are in-scope; payroll ingest architecture (staging tables → transformation service → `hr_ee_payroll`) is captured per the 2026-04-29 Key Decisions row. Open follow-ups for the roadmapper: source-payload archival strategy, payroll ingest trigger surface, schema parity questions for `QuickBooksAccount` and `OvertimeThreshold`.
