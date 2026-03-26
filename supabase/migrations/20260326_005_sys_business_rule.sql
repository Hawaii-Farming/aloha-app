CREATE TABLE IF NOT EXISTS sys_business_rule (
    id                  TEXT PRIMARY KEY,
    rule_type           TEXT NOT NULL CHECK (rule_type IN ('business_rule', 'workflow', 'calculation', 'requirement', 'definition')),
    module              TEXT,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    rationale           TEXT,
    applies_to          JSONB NOT NULL DEFAULT '[]',
    display_order       INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE sys_business_rule IS 'Central registry for all business rules, workflows, calculations, customer requirements, and glossary definitions. Queryable by employees (tooltips), developers (context), and AI (alignment). org_id null for system-wide rules.';

COMMENT ON COLUMN sys_business_rule.rule_type IS 'business_rule, workflow, calculation, requirement, definition';
COMMENT ON COLUMN sys_business_rule.applies_to IS 'JSON array of table.column references this rule applies to (e.g. ["invnt_onhand.invnt_lot_id"])';

CREATE INDEX idx_sys_business_rule_type ON sys_business_rule (rule_type);
CREATE INDEX idx_sys_business_rule_module ON sys_business_rule (module);
