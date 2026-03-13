-- ============================================
-- Migration: 20260313_012_core_farm_grade
-- Description: Farm-specific harvest grades with short codes
-- ============================================

CREATE TABLE IF NOT EXISTS farm_grade (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id  UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    code    VARCHAR(10) NOT NULL,
    name    VARCHAR(50) NOT NULL,

    CONSTRAINT uq_farm_grade_code UNIQUE (farm_id, code),
    CONSTRAINT uq_farm_grade_name UNIQUE (farm_id, name)
);
