-- Name the self-referential FK constraints so PostgREST can disambiguate them
-- in embedded resource selects (e.g. team_lead:hr_employee!fk_team_lead(preferred_name))

ALTER TABLE hr_employee
  DROP CONSTRAINT IF EXISTS hr_employee_team_lead_id_fkey,
  ADD CONSTRAINT fk_hr_employee_team_lead
    FOREIGN KEY (team_lead_id) REFERENCES hr_employee(id);

ALTER TABLE hr_employee
  DROP CONSTRAINT IF EXISTS hr_employee_compensation_manager_id_fkey,
  ADD CONSTRAINT fk_hr_employee_compensation_manager
    FOREIGN KEY (compensation_manager_id) REFERENCES hr_employee(id);
