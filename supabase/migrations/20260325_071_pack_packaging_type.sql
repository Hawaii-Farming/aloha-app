CREATE TABLE IF NOT EXISTS pack_packaging_type (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),

    name            TEXT NOT NULL,
    description     TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_packaging_type IS 'Org-defined packaging type lookup (e.g. clamshell, bag, sleeve, tray wrap). Referenced by both sales_product and pack_shelf_life.';

CREATE INDEX idx_pack_packaging_type_org_id ON pack_packaging_type (org_id);

-- Partial unique indexes handle NULL farm_id correctly
CREATE UNIQUE INDEX uq_pack_packaging_type_org_level  ON pack_packaging_type (org_id, name) WHERE farm_id IS NULL;
CREATE UNIQUE INDEX uq_pack_packaging_type_farm_level ON pack_packaging_type (org_id, farm_id, name) WHERE farm_id IS NOT NULL;
