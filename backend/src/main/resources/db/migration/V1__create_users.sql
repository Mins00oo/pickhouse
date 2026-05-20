CREATE TABLE users (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    email         VARCHAR(255) NULL,
    nickname      VARCHAR(50)  NULL,
    created_at    DATETIME(3)  NOT NULL,
    updated_at    DATETIME(3)  NOT NULL,
    deleted_at    DATETIME(3)  NULL,
    purge_after   DATETIME(3)  NULL,
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
