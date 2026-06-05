CREATE TABLE photos (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    user_id       CHAR(36)     NOT NULL,
    house_id      CHAR(36)     NULL,
    object_key    VARCHAR(500) NOT NULL,
    remote_url    VARCHAR(1000) NOT NULL,
    content_type  VARCHAR(50)  NULL,
    taken_at      DATETIME(3)  NULL,
    created_at    DATETIME(3)  NOT NULL,
    deleted_at    DATETIME(3)  NULL,
    KEY ix_photos_user (user_id),
    KEY ix_photos_user_deleted (user_id, deleted_at),
    KEY ix_photos_house (house_id),
    CONSTRAINT fk_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_house FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
