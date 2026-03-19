CREATE TABLE IF NOT EXISTS fsafe_water_test (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT        REFERENCES farm(id),
    site_id         TEXT        REFERENCES site(id),

    lab_name        TEXT,
    lab_test_id     TEXT,

    sampled_at      TIMESTAMPTZ,
    sampled_by      TEXT        REFERENCES hr_employee(id),
    completed_at    TIMESTAMPTZ,

    ecoli_result            NUMERIC,
    salmonella_result       TEXT        CHECK (salmonella_result IN ('positive', 'negative')),
    listeria_result         TEXT        CHECK (listeria_result IN ('positive', 'negative')),
    total_coliform_result   NUMERIC,

    report_url      TEXT,
    notes           TEXT,

    verified_by     TEXT        REFERENCES hr_employee(id),
    verified_at     TIMESTAMPTZ,

    is_active       BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_fsafe_water_test_org_id  ON fsafe_water_test (org_id);
CREATE INDEX idx_fsafe_water_test_farm    ON fsafe_water_test (farm_id);
CREATE INDEX idx_fsafe_water_test_site    ON fsafe_water_test (site_id);
CREATE INDEX idx_fsafe_water_test_date    ON fsafe_water_test (org_id, sampled_at);

COMMENT ON TABLE fsafe_water_test IS 'Water test results for internal or external lab submissions. One row per test submission covering E.coli, Salmonella, Listeria, and Total Coliform results.';
COMMENT ON COLUMN fsafe_water_test.id IS 'Unique identifier for the water test record';
COMMENT ON COLUMN fsafe_water_test.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_water_test.farm_id IS 'Farm where the water sample was collected';
COMMENT ON COLUMN fsafe_water_test.site_id IS 'Site where the water sample was collected';
COMMENT ON COLUMN fsafe_water_test.lab_name IS 'Name of the lab that processed the sample; null for internal tests';
COMMENT ON COLUMN fsafe_water_test.lab_test_id IS 'Lab reference number for this submission; null for internal tests';
COMMENT ON COLUMN fsafe_water_test.sampled_at IS 'Timestamp when the water sample was collected';
COMMENT ON COLUMN fsafe_water_test.sampled_by IS 'Employee who collected the water sample';
COMMENT ON COLUMN fsafe_water_test.completed_at IS 'Timestamp when lab results were received or testing was completed';
COMMENT ON COLUMN fsafe_water_test.ecoli_result IS 'E.coli numeric result; frontend converts detection limit strings (e.g. <1, >2419) to numeric values before submission';
COMMENT ON COLUMN fsafe_water_test.salmonella_result IS 'Salmonella result; positive or negative';
COMMENT ON COLUMN fsafe_water_test.listeria_result IS 'Listeria result; positive or negative';
COMMENT ON COLUMN fsafe_water_test.total_coliform_result IS 'Total coliform numeric result; frontend converts detection limit strings (e.g. <1, >2419) to numeric values before submission';
COMMENT ON COLUMN fsafe_water_test.report_url IS 'URL or path to the lab or internal test report document';
COMMENT ON COLUMN fsafe_water_test.notes IS 'Free-text notes about the water test submission';
COMMENT ON COLUMN fsafe_water_test.verified_by IS 'Employee who verified the test result record';
COMMENT ON COLUMN fsafe_water_test.verified_at IS 'Timestamp when the test result was verified';
COMMENT ON COLUMN fsafe_water_test.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN fsafe_water_test.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_water_test.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_water_test.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_water_test.updated_by IS 'Email of the user who last updated the record';
