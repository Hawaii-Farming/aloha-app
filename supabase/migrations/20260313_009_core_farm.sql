CREATE TABLE IF NOT EXISTS farm (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    weighing_uom_id  VARCHAR(10) REFERENCES unit_of_measure(code),
    growing_uom_id   VARCHAR(10) REFERENCES unit_of_measure(code),
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       UUID REFERENCES auth.users(id),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by       UUID REFERENCES auth.users(id),
    CONSTRAINT uq_farm UNIQUE (org_id, name)
);
