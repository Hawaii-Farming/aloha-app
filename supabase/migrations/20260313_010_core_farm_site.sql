CREATE TABLE IF NOT EXISTS farm_site (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id    UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id   UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    name      VARCHAR(100) NOT NULL,
    type      VARCHAR(20) NOT NULL CHECK (type IN ('nursery', 'growing', 'packing', 'storage')),
    metadata  JSONB NOT NULL DEFAULT '{}',
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES profile(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES profile(id),

    CONSTRAINT uq_farm_site UNIQUE (farm_id, name)
);
