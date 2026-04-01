CREATE TABLE IF NOT EXISTS org_equipment (
    id                      TEXT PRIMARY KEY,
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT REFERENCES org_farm(id),
    type                    TEXT CHECK (type IN ('vehicle', 'tool', 'machine', 'ppe')),
    name                    TEXT NOT NULL,
    code                    TEXT,
    description             TEXT,
    manufacturer            TEXT,
    model                   TEXT,
    serial_number           TEXT,
    purchase_date           DATE,
    manual_url              TEXT,
    assigned_on             DATE,
    assigned_to             TEXT REFERENCES hr_employee(id),
    previously_assigned_to  TEXT REFERENCES hr_employee(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE org_equipment IS 'Equipment register for all physical assets across the organization. Farm-level or shared (farm_id null).';

COMMENT ON COLUMN org_equipment.farm_id IS 'Inherited from parent org_farm when equipment is farm-scoped; null for org-wide equipment';
COMMENT ON COLUMN org_equipment.previously_assigned_to IS 'Auto-set by system when assigned_to changes; stores the prior assignee';
COMMENT ON COLUMN org_equipment.type IS 'vehicle, tool, machine, ppe';
