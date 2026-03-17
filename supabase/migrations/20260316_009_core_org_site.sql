CREATE TABLE IF NOT EXISTS org_site (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),
    name            VARCHAR(100) NOT NULL,
    category        TEXT NOT NULL,
    subcategory     TEXT,

    -- Growing site details (shown when category = growing)
    acres               NUMERIC,
    total_rows          INT,
    avg_units_per_row   NUMERIC,

    -- Equipment / asset details (shown when subcategory warrants it)
    code            VARCHAR(20),
    manufacturer    VARCHAR(100),
    model           VARCHAR(100),
    serial_number   VARCHAR(100),
    purchase_date   DATE,
    manual_url      TEXT,
    notes           TEXT,
    photos          JSONB NOT NULL DEFAULT '[]',

    -- General site details
    metadata        JSONB NOT NULL DEFAULT '{}',

    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES auth.users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES auth.users(id),
    CONSTRAINT uq_org_site UNIQUE (org_id, farm_id, name)
);

CREATE INDEX idx_org_site_org_id ON org_site (org_id);
CREATE INDEX idx_org_site_farm ON org_site (farm_id);
CREATE INDEX idx_org_site_category ON org_site (category);

COMMENT ON TABLE org_site IS 'Unified site register for all physical locations and assets across the organization. Category and subcategory drive which fields are relevant in the UI.';
COMMENT ON COLUMN org_site.id IS 'Unique identifier for the site';
COMMENT ON COLUMN org_site.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN org_site.farm_id IS 'Optional farm scope; NULL if site is shared across the org';
COMMENT ON COLUMN org_site.name IS 'Display name of the site, unique within the org+farm combination';
COMMENT ON COLUMN org_site.category IS 'Top-level classification selected from dropdown (e.g. growing, packaging, storage, maintenance)';
COMMENT ON COLUMN org_site.subcategory IS 'Second-level classification within category (e.g. greenhouse, nursery, packroom, equipment, vehicle)';
COMMENT ON COLUMN org_site.acres IS 'Acreage of the growing site';
COMMENT ON COLUMN org_site.total_rows IS 'Total number of growing rows in the site';
COMMENT ON COLUMN org_site.avg_units_per_row IS 'Average number of growing units (plants/pots) per row';
COMMENT ON COLUMN org_site.code IS 'Short identifier for equipment/assets (e.g. PUMP-01, TRACTOR-03); nullable for non-equipment sites';
COMMENT ON COLUMN org_site.manufacturer IS 'Manufacturer or brand name for equipment/assets';
COMMENT ON COLUMN org_site.model IS 'Model name or number for equipment/assets';
COMMENT ON COLUMN org_site.serial_number IS 'Manufacturer serial number for equipment/assets';
COMMENT ON COLUMN org_site.purchase_date IS 'Date the equipment/asset was acquired';
COMMENT ON COLUMN org_site.manual_url IS 'URL or path to the equipment manual or site documentation';
COMMENT ON COLUMN org_site.notes IS 'General notes about the site or asset';
COMMENT ON COLUMN org_site.photos IS 'JSON array of photo URLs';
COMMENT ON COLUMN org_site.metadata IS 'Flexible JSON for display-only details (dimensions, capacity, environmental settings)';
COMMENT ON COLUMN org_site.is_active IS 'Soft delete flag; false hides the site from active use';
COMMENT ON COLUMN org_site.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN org_site.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN org_site.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN org_site.updated_by IS 'User who last updated the record, references auth.users(id)';
