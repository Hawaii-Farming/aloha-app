CREATE TABLE IF NOT EXISTS sales_donation_recipient (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,

    name            TEXT NOT NULL,
    description     TEXT,

    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,

    CONSTRAINT uq_sales_donation_recipient UNIQUE (org_id, name)
);

CREATE INDEX idx_sales_donation_recipient_org_id ON sales_donation_recipient (org_id);

COMMENT ON TABLE sales_donation_recipient IS 'Org-defined lookup of places product can be donated to (e.g. food banks, shelters, community programs).';
COMMENT ON COLUMN sales_donation_recipient.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN sales_donation_recipient.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_donation_recipient.name IS 'Donation recipient name, unique within the org';
COMMENT ON COLUMN sales_donation_recipient.description IS 'Optional description of the donation recipient';
COMMENT ON COLUMN sales_donation_recipient.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN sales_donation_recipient.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_donation_recipient.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_donation_recipient.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_donation_recipient.updated_by IS 'Email of the user who last updated the record';
