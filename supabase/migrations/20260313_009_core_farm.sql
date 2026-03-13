-- ============================================
-- Migration: 20260313_009_core_farm
-- Description: Organization crop/product lines (e.g. Cuke Farm, Lettuce Farm)
-- ============================================

CREATE TABLE IF NOT EXISTS farm (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id    UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name      VARCHAR(100) NOT NULL,
    metadata  JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_farm UNIQUE (org_id, name)
);
