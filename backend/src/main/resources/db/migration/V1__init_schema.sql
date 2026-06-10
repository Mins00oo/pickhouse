-- Homes 1단계 스키마 (MySQL 8, utf8mb4)
-- UUID 컬럼은 VARCHAR(36) (CHAR(36)과 기능 동일, Hibernate validate 호환)

CREATE TABLE users (
    id                  VARCHAR(36)  NOT NULL,
    nickname            VARCHAR(50),
    status              VARCHAR(20)  NOT NULL,
    withdraw_at         DATETIME,
    delete_scheduled_at DATETIME,
    created_at          DATETIME     NOT NULL,
    updated_at          DATETIME     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE social_account (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          VARCHAR(36)  NOT NULL,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at       DATETIME     NOT NULL,
    updated_at       DATETIME     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_social_provider_uid UNIQUE (provider, provider_user_id),
    CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE refresh_token (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      VARCHAR(36)  NOT NULL,
    token_hash   VARCHAR(255) NOT NULL,
    device_id    VARCHAR(255) NOT NULL,
    device_label VARCHAR(255),
    expires_at   DATETIME     NOT NULL,
    last_used_at DATETIME     NOT NULL,
    created_at   DATETIME     NOT NULL,
    updated_at   DATETIME     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_user_device UNIQUE (user_id, device_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE house (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         VARCHAR(36)  NOT NULL,
    road_address    VARCHAR(255),
    jibun_address   VARCHAR(255),
    zipcode         VARCHAR(10),
    detail_address  VARCHAR(255),
    latitude        DOUBLE,
    longitude       DOUBLE,
    deal_type       VARCHAR(20),
    deposit         BIGINT,
    monthly_rent    BIGINT,
    sale_price      BIGINT,
    maintenance_fee BIGINT,
    exclusive_area  DECIMAL(7, 2),
    floor           INT,
    room_type       VARCHAR(20),
    house_type      VARCHAR(20),
    elevator        VARCHAR(1),
    water_pressure  VARCHAR(20),
    sunshine        VARCHAR(20),
    full_option     VARCHAR(1),
    move_in_date    DATE,
    alias           VARCHAR(100),
    memo            VARCHAR(2000),
    created_at      DATETIME     NOT NULL,
    updated_at      DATETIME     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_house_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE photo (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    house_id     BIGINT       NOT NULL,
    storage_key  VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    size         BIGINT,
    sort_order   INT,
    created_at   DATETIME     NOT NULL,
    updated_at   DATETIME     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_photo_house FOREIGN KEY (house_id) REFERENCES house (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE cm_grp (
    grp_cd     VARCHAR(30)  NOT NULL,
    grp_name   VARCHAR(100) NOT NULL,
    use_yn     VARCHAR(1)   NOT NULL,
    sort_order INT,
    created_at DATETIME     NOT NULL,
    updated_at DATETIME     NOT NULL,
    PRIMARY KEY (grp_cd)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE cm_cd (
    grp_cd     VARCHAR(30)  NOT NULL,
    cd         VARCHAR(30)  NOT NULL,
    cd_name    VARCHAR(100) NOT NULL,
    use_yn     VARCHAR(1)   NOT NULL,
    sort_order INT,
    created_at DATETIME     NOT NULL,
    updated_at DATETIME     NOT NULL,
    PRIMARY KEY (grp_cd, cd),
    CONSTRAINT fk_cmcd_grp FOREIGN KEY (grp_cd) REFERENCES cm_grp (grp_cd)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
