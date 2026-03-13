-- ============================================
-- Migration: 20260313_004_core_profile
-- Description: User profile extending Supabase Auth
-- ============================================

CREATE TABLE IF NOT EXISTS profile (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name  VARCHAR(50) NOT NULL,
    phone      VARCHAR(20),
    metadata    JSONB NOT NULL DEFAULT '{}',
    is_active  BOOLEAN NOT NULL DEFAULT true
);
