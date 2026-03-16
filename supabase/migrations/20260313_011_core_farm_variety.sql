CREATE TABLE IF NOT EXISTS grow_variety (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id    UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    code       VARCHAR(10) NOT NULL,
    name       VARCHAR(50) NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT uq_grow_variety_code UNIQUE (farm_id, code),
    CONSTRAINT uq_grow_variety_name UNIQUE (farm_id, name)
);
