-- ============================================
-- Migration: 20260313_007_core_delivery_method
-- Description: Organization-specific delivery methods
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_method (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_delivery_method UNIQUE (org_id, name)
);
