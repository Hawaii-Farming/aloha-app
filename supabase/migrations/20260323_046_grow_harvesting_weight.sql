CREATE TABLE IF NOT EXISTS grow_harvesting_weight (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    grow_harvesting_id          UUID NOT NULL REFERENCES grow_harvesting(id),
    grow_harvest_container_id   TEXT NOT NULL REFERENCES grow_harvest_container(id),
    number_of_units                    INTEGER NOT NULL,
    weight_uom                  TEXT NOT NULL REFERENCES sys_uom(code),
    gross_weight                NUMERIC NOT NULL,
    tare_weight                 NUMERIC NOT NULL DEFAULT 0,
    net_weight                  NUMERIC NOT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_harvesting_weight IS 'Individual weigh-in for a harvest. One row per container type weighed. Quantity allows weighing multiple containers at once. Tare is auto-calculated from container tare_weight × number_of_units.';

COMMENT ON COLUMN grow_harvesting_weight.number_of_units IS 'Number of containers weighed in this entry';
COMMENT ON COLUMN grow_harvesting_weight.tare_weight IS 'Auto-calculated: grow_harvest_container.tare_weight × number_of_units';
COMMENT ON COLUMN grow_harvesting_weight.net_weight IS 'Auto-calculated: gross_weight - tare_weight';

CREATE INDEX idx_grow_harvesting_weight_harvest ON grow_harvesting_weight (grow_harvesting_id);
CREATE INDEX idx_grow_harvesting_weight_container ON grow_harvesting_weight (grow_harvest_container_id);
