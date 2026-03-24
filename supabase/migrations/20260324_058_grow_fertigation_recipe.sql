CREATE TABLE IF NOT EXISTS grow_fertigation_recipe (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT NOT NULL REFERENCES org_farm(id),
    name            TEXT NOT NULL,
    description     TEXT,

    -- Water Configuration
    flush_water_uom         TEXT REFERENCES sys_uom(code),
    flush_water_quantity    NUMERIC,
    top_up_water_hours      NUMERIC,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_fertigation_recipe UNIQUE (org_id, farm_id, name)
);

COMMENT ON TABLE grow_fertigation_recipe IS 'Reusable fertigation recipe defining the fertilizer mix, flush water configuration, and top-up hours. Sites are linked via grow_fertigation_recipe_site.';

COMMENT ON COLUMN grow_fertigation_recipe.flush_water_uom IS 'Unit for flush water quantity (e.g. gallons, liters)';
COMMENT ON COLUMN grow_fertigation_recipe.top_up_water_hours IS 'Hours of water top-up after fertigation';
