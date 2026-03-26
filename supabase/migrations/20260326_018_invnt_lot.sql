CREATE TABLE IF NOT EXISTS invnt_lot (
    id                          TEXT PRIMARY KEY,
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    invnt_item_id               TEXT NOT NULL REFERENCES invnt_item(id),
    lot_number                  TEXT NOT NULL,
    lot_expiry_date             DATE,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE invnt_lot IS 'Tracks unique inventory lots by item and lot number; quantities updated on receive and on-hand changes; lot is complete when received minus on-hand equals zero';

CREATE UNIQUE INDEX uq_invnt_lot_org_item ON invnt_lot (org_id, invnt_item_id, id);
