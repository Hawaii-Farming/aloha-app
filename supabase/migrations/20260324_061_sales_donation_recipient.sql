CREATE TABLE IF NOT EXISTS sales_donation_recipient (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),

    name            TEXT NOT NULL,
    description     TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_sales_donation_recipient UNIQUE (org_id, name)
);

COMMENT ON TABLE sales_donation_recipient IS 'Org-defined lookup of places product can be donated to (e.g. food banks, shelters, community programs).';

CREATE INDEX idx_sales_donation_recipient_org_id ON sales_donation_recipient (org_id);

