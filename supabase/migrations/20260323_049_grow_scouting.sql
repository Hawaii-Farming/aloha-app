CREATE TABLE IF NOT EXISTS grow_scouting (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT NOT NULL REFERENCES org_farm(id),
    site_id         TEXT REFERENCES org_site(id),
    scouting_date   DATE NOT NULL,
    site_side       TEXT,
    site_row_numbers TEXT,
    notes           TEXT,
    photos          JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_scouting IS 'Scouting event header. Records a site inspection for pests and diseases. Can cover multiple seeding batches via grow_scouting_seeding.';

COMMENT ON COLUMN grow_scouting.site_side IS 'Free text describing which side of the site was scouted (e.g. East, West)';
COMMENT ON COLUMN grow_scouting.site_row_numbers IS 'Free text describing which rows were inspected (e.g. rows 3-5, all)';

CREATE INDEX idx_grow_scouting_org ON grow_scouting (org_id);
CREATE INDEX idx_grow_scouting_site ON grow_scouting (site_id);
