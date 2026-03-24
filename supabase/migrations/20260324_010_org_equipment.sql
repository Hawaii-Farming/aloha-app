CREATE TABLE IF NOT EXISTS org_equipment (
    id                      TEXT PRIMARY KEY,
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT REFERENCES org_farm(id),
    type                    TEXT CHECK (type IN ('vehicle', 'tool', 'machine', 'ppe')),
    name                    TEXT NOT NULL,
    description             TEXT,
    assigned_to             TEXT REFERENCES hr_employee(id),
    assigned_on             DATE,
    previously_assigned_to  TEXT REFERENCES hr_employee(id),
    document_url            TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE org_equipment IS 'Equipment register for all physical assets across the organization. Farm-level or shared (farm_id null).';

COMMENT ON COLUMN org_equipment.type IS 'Equipment classification: vehicle, tool, machine, ppe';
COMMENT ON COLUMN org_equipment.assigned_to IS 'Employee currently responsible for this equipment';
COMMENT ON COLUMN org_equipment.previously_assigned_to IS 'Employee who last had this equipment before the current assignment';
