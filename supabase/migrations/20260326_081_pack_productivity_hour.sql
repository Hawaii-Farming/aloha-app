CREATE TABLE IF NOT EXISTS pack_productivity_hour (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id     UUID NOT NULL REFERENCES ops_task_tracker(id),
    pack_hour               TIMESTAMPTZ NOT NULL,

    -- Crew counts by role
    catchers                INTEGER NOT NULL DEFAULT 0,
    packers                 INTEGER NOT NULL DEFAULT 0,
    mixers                  INTEGER NOT NULL DEFAULT 0,
    boxers                  INTEGER NOT NULL DEFAULT 0,

    -- Quality & status
    is_metal_detected       BOOLEAN NOT NULL DEFAULT false,
    notes                   TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_productivity_hour IS 'Hourly pack line productivity snapshot. One row per hour per packing session. Crew counts track role assignments for that hour. Derived metrics: total_trays = SUM(cases × pack_per_case), trays_per_packer_per_minute = total_trays / (packers × 60), packed_pounds = SUM(cases × case_net_weight).';

COMMENT ON COLUMN pack_productivity_hour.pack_hour IS 'The hour being recorded (e.g. 2026-03-26 11:00); one row per clock hour';
COMMENT ON COLUMN pack_productivity_hour.is_metal_detected IS 'Whether metal was detected during this hour';

CREATE INDEX idx_pack_productivity_hour_tracker ON pack_productivity_hour (ops_task_tracker_id);
CREATE INDEX idx_pack_productivity_hour_date ON pack_productivity_hour (org_id, pack_hour);
CREATE UNIQUE INDEX uq_pack_productivity_hour ON pack_productivity_hour (ops_task_tracker_id, pack_hour);
