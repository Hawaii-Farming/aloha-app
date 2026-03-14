CREATE TABLE IF NOT EXISTS role (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(30) NOT NULL,
    level       INT NOT NULL,
    description TEXT,

    CONSTRAINT uq_role_name UNIQUE (name),
    CONSTRAINT uq_role_level UNIQUE (level)
);
