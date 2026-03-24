CREATE TABLE IF NOT EXISTS org_farm (
    id               TEXT PRIMARY KEY,
    org_id           TEXT NOT NULL REFERENCES org(id),
    name             TEXT NOT NULL,
    weighing_uom  TEXT REFERENCES sys_uom(code),
    growing_uom   TEXT REFERENCES sys_uom(code),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by       TEXT,
    is_deleted        BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_org_farm UNIQUE (org_id, name)
);

COMMENT ON TABLE org_farm IS 'Represents a crop or product line within an organization (e.g. Cuke Farm, Lettuce Farm). Each farm has its own sites, varieties, grades, and products. Farm-level defaults reference units of measure for weighing and growing operations.';

COMMENT ON COLUMN org_farm.weighing_uom IS 'Default unit of measure for weighing operations on this farm (e.g. lb, kg)';
COMMENT ON COLUMN org_farm.growing_uom IS 'Default unit of measure for growing/harvest tracking on this farm';
