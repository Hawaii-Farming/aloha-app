-- ============================================
-- Migration: 20260313_002_core_organization
-- Description: Organization table for multi-org support
-- ============================================

CREATE TABLE IF NOT EXISTS organization (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(100) NOT NULL,
    address    TEXT,
    metadata   JSONB NOT NULL DEFAULT '{}',
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_organization_name UNIQUE (name),
    CONSTRAINT uq_organization_slug UNIQUE (slug)
);
