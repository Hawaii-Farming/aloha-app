CREATE TABLE IF NOT EXISTS invnt_vendor (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email          VARCHAR(100),
    phone          VARCHAR(20),
    address        TEXT,
    payment_terms  VARCHAR(50),
    lead_time      NUMERIC,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     UUID REFERENCES auth.users(id),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by     UUID REFERENCES auth.users(id),
    CONSTRAINT uq_invnt_vendor UNIQUE (org_id, name)
);
