CREATE TABLE IF NOT EXISTS inventory_category (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    parent_id  UUID REFERENCES inventory_category(id),
    name       VARCHAR(100) NOT NULL,
    level      INT NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES profile(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES profile(id),

    CONSTRAINT uq_inventory_category UNIQUE (org_id, parent_id, name)
);

CREATE INDEX idx_inventory_category_parent ON inventory_category (parent_id);
CREATE INDEX idx_inventory_category_org_id ON inventory_category (org_id);
