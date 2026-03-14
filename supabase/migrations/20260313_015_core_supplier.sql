-- ============================================
-- Migration: 20260313_015_core_supplier
-- Description: Organization-level suppliers for procurement
-- ============================================

CREATE TABLE IF NOT EXISTS supplier (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email          VARCHAR(100),
    phone          VARCHAR(20),
    metadata       JSONB NOT NULL DEFAULT '{}',
    is_active      BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_supplier UNIQUE (org_id, name)
);
