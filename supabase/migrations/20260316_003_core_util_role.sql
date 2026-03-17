CREATE TABLE IF NOT EXISTS util_role (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(30) NOT NULL,
    level       INT NOT NULL,
    description TEXT,

    CONSTRAINT uq_util_role_name UNIQUE (name),
    CONSTRAINT uq_util_role_level UNIQUE (level)
);

COMMENT ON TABLE util_role IS 'Global reference table defining five access levels for org membership: Owner (5), Admin (4), Manager (3), Verifier (2), Worker (1)';
COMMENT ON COLUMN util_role.id IS 'Unique identifier for the role';
COMMENT ON COLUMN util_role.name IS 'Display name of the role (e.g. Owner, Admin, Manager, Verifier, Worker)';
COMMENT ON COLUMN util_role.level IS 'Numeric access level used for permission comparisons; higher means more access';
COMMENT ON COLUMN util_role.description IS 'Human-readable description of the role and its permissions';
