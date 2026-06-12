-- Created: 2026-06-10
-- Purpose:
--   기기별 Refresh Token 회전의 동시성 충돌을 감지하고,
--   직전 토큰 재사용 시 해당 기기 세션을 폐기하기 위한 스키마 확장.
-- Changes:
--   1. 낙관적 락을 위한 version 추가
--   2. 직전 토큰 재사용 탐지를 위한 previous_token_hash 추가
--   3. 직전 토큰 유효성 판정을 위한 previous_token_expires_at 추가
--   4. 토큰 해시 조회 및 중복 방지를 위한 제약 추가

ALTER TABLE refresh_token
    ADD COLUMN previous_token_hash VARCHAR(255) NULL AFTER token_hash,
    ADD COLUMN previous_token_expires_at DATETIME NULL AFTER previous_token_hash,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER last_used_at,
    ADD CONSTRAINT uk_refresh_token_hash UNIQUE (token_hash),
    ADD CONSTRAINT uk_refresh_previous_token_hash UNIQUE (previous_token_hash);
