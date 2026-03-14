CREATE TABLE IF NOT EXISTS org_member (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id    UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    role_id   UUID NOT NULL REFERENCES role(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES profile(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES profile(id),

    CONSTRAINT uq_org_member UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_member_user_id ON org_member (user_id);
