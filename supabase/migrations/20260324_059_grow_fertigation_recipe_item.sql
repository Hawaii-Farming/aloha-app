CREATE TABLE IF NOT EXISTS grow_fertigation_recipe_item (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    grow_fertigation_recipe_id  TEXT NOT NULL REFERENCES grow_fertigation_recipe(id),
    equipment_id                TEXT NOT NULL REFERENCES org_equipment(id),
    invnt_item_id               TEXT REFERENCES invnt_item(id),
    item_name                   TEXT NOT NULL,
    application_uom             TEXT NOT NULL REFERENCES sys_uom(code),
    quantity                    NUMERIC NOT NULL,
    burn_uom                    TEXT REFERENCES sys_uom(code),
    application_per_burn_unit   NUMERIC,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_fertigation_recipe_item IS 'Individual fertilizer items within a recipe. invnt_item_id is nullable for products not stored in-house; item_name is always set for display.';

COMMENT ON COLUMN grow_fertigation_recipe_item.invnt_item_id IS 'Null for one-off fertilizers not tracked in inventory';
COMMENT ON COLUMN grow_fertigation_recipe_item.item_name IS 'Display name; auto-filled from invnt_item if linked, manually entered otherwise';

CREATE INDEX idx_grow_fertigation_recipe_item_recipe ON grow_fertigation_recipe_item (grow_fertigation_recipe_id);
