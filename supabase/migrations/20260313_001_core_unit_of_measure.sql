CREATE TABLE IF NOT EXISTS unit_of_measure (
    code         VARCHAR(10) PRIMARY KEY,
    name         VARCHAR(50) NOT NULL,
    category     VARCHAR(30) NOT NULL,
    CONSTRAINT uq_unit_of_measure_name UNIQUE (name)
);

CREATE INDEX idx_unit_of_measure_category ON unit_of_measure (category);
