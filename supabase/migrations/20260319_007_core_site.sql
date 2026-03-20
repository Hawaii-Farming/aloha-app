CREATE TABLE IF NOT EXISTS site (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),
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

    -- General site details
    metadata        JSONB NOT NULL DEFAULT '{}',

    is_food_contact_surface BOOLEAN NOT NULL DEFAULT false,
    zone            TEXT CHECK (zone IN ('zone_1', 'zone_2', 'zone_3', 'zone_4')),
    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    CONSTRAINT uq_site UNIQUE (org_id, farm_id, name)
);

CREATE INDEX idx_site_org_id ON site (org_id);
CREATE INDEX idx_site_farm ON site (farm_id);
CREATE INDEX idx_site_category ON site (category);

COMMENT ON TABLE site IS 'Unified site register for all physical locations and assets across the organization. Category and subcategory drive which fields are relevant in the UI.';
COMMENT ON COLUMN site.id IS 'Human-readable identifier derived from site name (trimmed lowercase)';
COMMENT ON COLUMN site.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN site.farm_id IS 'Optional farm scope; NULL if site is shared across the org';
COMMENT ON COLUMN site.name IS 'Display name of the site, unique within the org+farm combination';
COMMENT ON COLUMN site.category IS 'Top-level classification selected from dropdown (e.g. growing, packaging, storage, maintenance)';
COMMENT ON COLUMN site.subcategory IS 'Second-level classification within category (e.g. greenhouse, nursery, packroom, equipment, vehicle)';
COMMENT ON COLUMN site.acres IS 'Acreage of the growing site';
COMMENT ON COLUMN site.total_rows IS 'Total number of growing rows in the site';
COMMENT ON COLUMN site.avg_units_per_row IS 'Average number of growing units (plants/pots) per row';
COMMENT ON COLUMN site.code IS 'Short identifier for equipment/assets (e.g. PUMP-01, TRACTOR-03); nullable for non-equipment sites';
COMMENT ON COLUMN site.manufacturer IS 'Manufacturer or brand name for equipment/assets';
COMMENT ON COLUMN site.model IS 'Model name or number for equipment/assets';
COMMENT ON COLUMN site.serial_number IS 'Manufacturer serial number for equipment/assets';
COMMENT ON COLUMN site.purchase_date IS 'Date the equipment/asset was acquired';
COMMENT ON COLUMN site.manual_url IS 'URL or path to the equipment manual or site documentation';
COMMENT ON COLUMN site.notes IS 'General notes about the site or asset';
COMMENT ON COLUMN site.photos IS 'JSON array of photo URLs';
COMMENT ON COLUMN site.metadata IS 'Flexible JSON for display-only details (dimensions, capacity, environmental settings)';
COMMENT ON COLUMN site.is_food_contact_surface IS 'Whether this site or surface comes into contact with food; requires sanitization before reuse if true';
COMMENT ON COLUMN site.zone IS 'EMP zone classification for this site as defined in food safety documentation: zone_1, zone_2, zone_3, zone_4; null if not applicable';
COMMENT ON COLUMN site.is_deleted IS 'Soft delete flag; false hides the site from active use';
COMMENT ON COLUMN site.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN site.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN site.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN site.updated_by IS 'Email of the user who last updated the record';
