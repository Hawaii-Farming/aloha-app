CREATE TABLE IF NOT EXISTS grow_harvest_weight (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    grow_harvest_id          UUID NOT NULL REFERENCES grow_harvest(id),
    grow_harvest_container_id   TEXT NOT NULL REFERENCES grow_harvest_container(id),
    number_of_containers                    INTEGER NOT NULL,
    weight_uom                  TEXT NOT NULL REFERENCES sys_uom(code),
    gross_weight                NUMERIC NOT NULL,
    net_weight                  NUMERIC NOT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_harvest_weight IS 'Individual weigh-in for a harvest. One row per container type weighed. Tare is calculated on the fly from grow_harvest_container.tare_weight × number_of_containers.';

COMMENT ON COLUMN grow_harvest_weight.net_weight IS 'gross_weight minus calculated tare (grow_harvest_container.tare_weight × number_of_containers)';

CREATE INDEX idx_grow_harvest_weight_harvest ON grow_harvest_weight (grow_harvest_id);
CREATE INDEX idx_grow_harvest_weight_container ON grow_harvest_weight (grow_harvest_container_id);
