CREATE TABLE IF NOT EXISTS sales_container_type (
    id                      TEXT PRIMARY KEY,
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT NOT NULL REFERENCES org_farm(id),
    name                    TEXT NOT NULL,
    maximum_spaces          INTEGER NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE sales_container_type IS 'Lookup table for shipping container types per farm. Defines the available container types and their maximum pallet space capacity.';

COMMENT ON COLUMN sales_container_type.maximum_spaces IS 'Maximum number of pallet spaces available in this container type';

CREATE UNIQUE INDEX uq_sales_container_type ON sales_container_type (org_id, farm_id, name);
