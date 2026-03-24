CREATE TABLE IF NOT EXISTS grow_seed_mix_item (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT NOT NULL REFERENCES org_farm(id),
    grow_seed_mix_id TEXT NOT NULL REFERENCES grow_seed_mix(id),
    invnt_item_id   TEXT NOT NULL REFERENCES invnt_item(id),
    lot_number      TEXT,
    percentage      NUMERIC NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_seed_mix_item UNIQUE (grow_seed_mix_id, invnt_item_id)
);

COMMENT ON TABLE grow_seed_mix_item IS 'Individual seed items within a mix recipe with their proportion. Each row defines one seed and its percentage in the blend.';

COMMENT ON COLUMN grow_seed_mix_item.lot_number IS 'Supplier seed lot number for traceability';
COMMENT ON COLUMN grow_seed_mix_item.percentage IS 'Proportion in the mix (e.g. 0.6 for 60%)';
