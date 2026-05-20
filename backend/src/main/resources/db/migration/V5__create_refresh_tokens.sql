CREATE TABLE refresh_tokens (
    id          CHAR(36)    NOT NULL PRIMARY KEY,
    user_id     CHAR(36)    NOT NULL,
    jti         CHAR(36)    NOT NULL,
    expires_at  DATETIME(3) NOT NULL,
    revoked     TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME(3) NOT NULL,
    UNIQUE KEY uk_refresh_jti (jti),
    KEY ix_refresh_user (user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
