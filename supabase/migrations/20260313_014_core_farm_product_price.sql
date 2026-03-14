-- ============================================
-- Migration: 20260313_014_core_farm_product_price
-- Description: Product pricing with date ranges and tiered priority
-- ============================================
-- Pricing tiers (lookup priority):
--   1. Customer-specific: customer_id set
--   2. Group-specific: customer_group_id set, customer_id null
--   3. Default: both customer_id and customer_group_id null

CREATE TABLE IF NOT EXISTS farm_product_price (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    product_id         UUID NOT NULL REFERENCES farm_product(id) ON DELETE CASCADE,
    delivery_method_id UUID NOT NULL REFERENCES delivery_method(id),
    customer_id        UUID REFERENCES customer(id),
    customer_group_id  UUID REFERENCES customer_group(id),
    price              NUMERIC NOT NULL,
    effective_from     DATE NOT NULL,
    effective_to       DATE,
    is_active          BOOLEAN NOT NULL DEFAULT true
);

-- Index for price lookups by product and delivery method
CREATE INDEX idx_farm_product_price_lookup ON farm_product_price (product_id, delivery_method_id, effective_from);

-- Index for RLS filtering
CREATE INDEX idx_farm_product_price_org_id ON farm_product_price (org_id);
