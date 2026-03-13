-- ============================================
-- Migration: 20260313_006_core_customer_group
-- Description: Organization-specific customer groupings for reporting
-- ============================================

CREATE TABLE IF NOT EXISTS customer_group (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_customer_group UNIQUE (org_id, name)
);
