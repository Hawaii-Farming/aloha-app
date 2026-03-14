CREATE TABLE IF NOT EXISTS customer (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    customer_group_id UUID REFERENCES customer_group(id),
    delivery_method_id UUID REFERENCES delivery_method(id),
    external_id       VARCHAR(50),
    name              VARCHAR(100) NOT NULL,
    email             VARCHAR(100),
    metadata          JSONB NOT NULL DEFAULT '{}',
    billing_address   TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        UUID REFERENCES profile(id),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        UUID REFERENCES profile(id),

    CONSTRAINT uq_customer_org_name UNIQUE (org_id, name)
);

CREATE INDEX idx_customer_org_id ON customer (org_id);
