-- ============================================
-- Migration: 20260313_008_core_customer
-- Description: Organization customers with group and delivery method
-- ============================================

CREATE TABLE IF NOT EXISTS customer (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    customer_group_id UUID REFERENCES customer_group(id),
    fob_id            UUID REFERENCES freight_on_board(id),
    external_id       VARCHAR(50),
    name              VARCHAR(100) NOT NULL,
    email             VARCHAR(100),
    metadata          JSONB NOT NULL DEFAULT '{}',
    billing_address   TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_customer_org_name UNIQUE (org_id, name)
);

-- Index for looking up customers by organization
CREATE INDEX idx_customer_org_id ON customer (org_id);
