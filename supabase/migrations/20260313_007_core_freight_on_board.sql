-- ============================================
-- Migration: 20260313_007_core_freight_on_board
-- Description: Organization-specific delivery methods
-- ============================================

CREATE TABLE IF NOT EXISTS freight_on_board (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name   VARCHAR(50) NOT NULL,

    CONSTRAINT uq_freight_on_board UNIQUE (org_id, name)
);
