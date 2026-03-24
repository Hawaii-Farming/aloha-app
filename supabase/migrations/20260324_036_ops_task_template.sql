CREATE TABLE IF NOT EXISTS ops_task_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),
    ops_task_id     TEXT NOT NULL REFERENCES ops_task(id),
    ops_template_id TEXT NOT NULL REFERENCES ops_template(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_ops_task_template UNIQUE (ops_task_id, ops_template_id)
);

COMMENT ON TABLE ops_task_template IS 'Many-to-many link between tasks and checklist templates. When a user creates an activity for a task, the app loads all templates linked to that task.';

CREATE INDEX idx_ops_task_template_task ON ops_task_template (ops_task_id);
CREATE INDEX idx_ops_task_template_template ON ops_task_template (ops_template_id);
