CREATE TABLE IF NOT EXISTS farm (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id    UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name      VARCHAR(100) NOT NULL,
    metadata  JSONB NOT NULL DEFAULT '{}',
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES profile(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES profile(id),

    CONSTRAINT uq_farm UNIQUE (org_id, name)
);
