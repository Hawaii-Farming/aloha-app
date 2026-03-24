CREATE TABLE IF NOT EXISTS org_site (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),
    name            TEXT NOT NULL,
    category        TEXT NOT NULL,
    subcategory     TEXT,

    -- Growing site details (shown when category = growing)
    acres               NUMERIC,
    total_rows          INT,
    avg_units_per_row   NUMERIC,

    -- Equipment / asset details (shown when subcategory warrants it)
    code            TEXT,
    manufacturer    TEXT,
    model           TEXT,
    serial_number   TEXT,
    purchase_date   DATE,
    manual_url      TEXT,
    notes           TEXT,
    photos          JSONB NOT NULL DEFAULT '[]',

    -- Monitoring
    monitoring_stations JSONB NOT NULL DEFAULT '[]',

    -- General site details
    metadata        JSONB NOT NULL DEFAULT '{}',

    is_food_contact_surface BOOLEAN NOT NULL DEFAULT false,
    zone            TEXT CHECK (zone IN ('zone_1', 'zone_2', 'zone_3', 'zone_4')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_org_site UNIQUE (org_id, farm_id, name)
);

COMMENT ON TABLE org_site IS 'Unified site register for all physical locations and assets across the organization. The category and subcategory fields drive which additional fields are relevant in the UI. Sites can be scoped to a specific farm or shared org-wide.';

CREATE INDEX idx_org_site_org_id ON org_site (org_id);
CREATE INDEX idx_org_site_farm ON org_site (farm_id);
CREATE INDEX idx_org_site_category ON org_site (category);

COMMENT ON COLUMN org_site.category IS 'Top-level classification selected from dropdown (e.g. growing, packaging, storage, maintenance)';
COMMENT ON COLUMN org_site.subcategory IS 'Second-level classification within category (e.g. greenhouse, nursery, packroom, equipment, vehicle)';
COMMENT ON COLUMN org_site.code IS 'Short identifier for equipment/assets (e.g. PUMP-01, TRACTOR-03); nullable for non-equipment sites';
COMMENT ON COLUMN org_site.metadata IS 'Flexible JSON for display-only details (dimensions, capacity, environmental settings)';
COMMENT ON COLUMN org_site.is_food_contact_surface IS 'Whether this site or surface comes into contact with food; requires sanitization before reuse if true';
COMMENT ON COLUMN org_site.zone IS 'EMP zone classification for this site as defined in food safety documentation: zone_1, zone_2, zone_3, zone_4; null if not applicable';
