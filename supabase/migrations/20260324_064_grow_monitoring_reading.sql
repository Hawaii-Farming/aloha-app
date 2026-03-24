CREATE TABLE IF NOT EXISTS grow_monitoring_reading (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    site_id                     TEXT NOT NULL REFERENCES org_site(id),
    ops_task_tracker_id         UUID NOT NULL REFERENCES ops_task_tracker(id),
    grow_monitoring_point_id    TEXT NOT NULL REFERENCES grow_monitoring_point(id),
    monitoring_station          TEXT,
    reading                     NUMERIC,
    reading_boolean             BOOLEAN,
    reading_text                TEXT,
    is_out_of_range             BOOLEAN NOT NULL DEFAULT false,
    corrective_action           TEXT,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_monitoring_reading UNIQUE (ops_task_tracker_id, grow_monitoring_point_id, monitoring_station)
);

COMMENT ON TABLE grow_monitoring_reading IS 'Individual measurement recorded during a monitoring event. One row per point per station. Calculated points store the computed result for historical record.';

COMMENT ON COLUMN grow_monitoring_reading.monitoring_station IS 'Selected from org_site.monitoring_stations JSONB dropdown';
COMMENT ON COLUMN grow_monitoring_reading.reading_boolean IS 'Used when point response_type is boolean';
COMMENT ON COLUMN grow_monitoring_reading.reading_text IS 'Used when point response_type is text';
COMMENT ON COLUMN grow_monitoring_reading.is_out_of_range IS 'Auto-set by comparing reading against grow_monitoring_point.minimum_value and maximum_value';
COMMENT ON COLUMN grow_monitoring_reading.corrective_action IS 'Selected from grow_monitoring_point.corrective_actions when reading is out of range';

CREATE INDEX idx_grow_monitoring_reading_tracker ON grow_monitoring_reading (ops_task_tracker_id);
CREATE INDEX idx_grow_monitoring_reading_site ON grow_monitoring_reading (site_id);
CREATE INDEX idx_grow_monitoring_reading_point ON grow_monitoring_reading (grow_monitoring_point_id);
