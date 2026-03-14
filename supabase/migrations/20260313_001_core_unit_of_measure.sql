CREATE TABLE IF NOT EXISTS unit_of_measure (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    category     VARCHAR(30) NOT NULL,

    CONSTRAINT uq_unit_of_measure_name UNIQUE (name),
    CONSTRAINT uq_unit_of_measure_abbreviation UNIQUE (abbreviation)
);

CREATE INDEX idx_unit_of_measure_category ON unit_of_measure (category);
