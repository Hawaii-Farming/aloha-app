## Conflict Detection Report

### BLOCKERS (0)

(No blockers. The prior BLOCKER for `runPayroll` vs PROJECT.md "Out of Scope: Payroll import/processing" is RESOLVED — PROJECT.md line 57 now strikes through the prior out-of-scope line and a new Key Decisions row dated 2026-04-29 explicitly brings payroll ingest in-scope for the AppSheet Scripts Migration milestone.)

### WARNINGS (0)

(No competing-variants conflicts: single-source ingest precludes cross-doc requirement collisions.)

### INFO (4)

[INFO] Resolved: prior BLOCKER on `runPayroll` cleared by explicit scope reversal
  Note: Earlier synthesis surfaced a BLOCKER because APPSHEET_SCRIPTS.md `runPayroll` defined an in-app HRB payroll ingest pipeline that contradicted the then-locked PROJECT.md "Out of Scope: Payroll import/processing — hr_payroll is imported externally, this project only displays it" line. The user has now reversed that decision: PROJECT.md line 57 marks the original out-of-scope text as struck through with a "REVERSED 2026-04-29" annotation, and the Key Decisions table includes a new dated row "Payroll processing brought in-scope (2026-04-29) — AppSheet Scripts Migration milestone replaces legacy Google Apps Script `runPayroll`; HRB ingest pipeline moves into Supabase (staging tables → transformation service → `hr_ee_payroll`)". REQ-process-hrb-payroll moves from BLOCKED to a normal proposed requirement, and the related constraint C-RESPECT-EXISTING-LOCKED-SCOPE is retired as no-longer-applicable to payroll ingest.
  source (existing, reversed): /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/PROJECT.md line 57 + Key Decisions row dated 2026-04-29
  source (incoming): /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`runPayroll`)

[INFO] Auto-resolved: existing PROJECT.md UI/data-display contracts > incoming DOC on shipped surfaces
  Note: Default precedence is `ADR > SPEC > PRD > DOC`. APPSHEET_SCRIPTS.md classified as DOC (confidence: high, no manifest override). Where the legacy automation overlaps with shipped v1.0 features (Scheduler, Hours Comparison, Payroll Comparison, Employee Review submodules), existing PROJECT.md "Validated" context wins on UI/data-display contracts. The incoming DOC contributes only the *automation/computation* layer that produces the data those existing surfaces render — captured as proposed requirements in `intel/requirements.md` for the roadmapper to refine, not as overrides to shipped UX.
  source (existing): /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/PROJECT.md (Validated requirements + Key Decisions tables)
  source (incoming): /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md

[INFO] No cross-ref cycles
  Note: The classification has `cross_refs: []`. Single-doc ingest, zero edges, cycle detection trivially passes.
  source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/intel/classifications/APPSHEET_SCRIPTS-a4f7c2e1.json

[INFO] No LOCKED-vs-LOCKED contradictions
  Note: APPSHEET_SCRIPTS.md is `locked: false` and the only ingest doc; no LOCKED ADRs in the ingest set. The previously-flagged DOC-vs-existing-locked-context contradiction has been cleared by the 2026-04-29 reversal in PROJECT.md.
  source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/intel/classifications/APPSHEET_SCRIPTS-a4f7c2e1.json
