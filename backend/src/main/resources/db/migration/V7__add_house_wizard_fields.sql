ALTER TABLE houses
    ADD COLUMN nickname                  VARCHAR(100) NULL,
    ADD COLUMN visited_at                DATETIME(3)  NULL,
    ADD COLUMN contracted_at             DATETIME(3)  NULL,
    ADD COLUMN room_type                 VARCHAR(30)  NULL,
    ADD COLUMN floor_type                VARCHAR(20)  NULL,
    ADD COLUMN direction                 VARCHAR(20)  NULL,
    ADD COLUMN maintenance_includes_json JSON         NULL,
    ADD COLUMN utility_estimates_json    JSON         NULL,
    ADD COLUMN full_option               TINYINT(1)   NULL;
