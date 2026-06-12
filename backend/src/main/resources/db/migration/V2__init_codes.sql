-- Homes 공통코드 시딩 (의미 문자열 코드값)

INSERT INTO cm_grp (grp_cd, grp_name, use_yn, sort_order, created_at, updated_at) VALUES
    ('USER_STATUS',     '회원상태',   'Y', 1, NOW(), NOW()),
    ('HOUSE_DEAL_TYPE', '거래유형',   'Y', 2, NOW(), NOW()),
    ('HOUSE_ROOM_TYPE', '방유형',     'Y', 3, NOW(), NOW()),
    ('HOUSE_TYPE',      '집유형',     'Y', 4, NOW(), NOW()),
    ('HOUSE_ELEVATOR',  '엘리베이터', 'Y', 5, NOW(), NOW()),
    ('HOUSE_WATER',     '수압',       'Y', 6, NOW(), NOW()),
    ('HOUSE_SUNSHINE',  '햇빛방향',   'Y', 7, NOW(), NOW()),
    ('HOUSE_FULL_OPTION','풀옵션여부','Y', 8, NOW(), NOW());

INSERT INTO cm_cd (grp_cd, cd, cd_name, use_yn, sort_order, created_at, updated_at) VALUES
    -- 회원상태
    ('USER_STATUS', 'ACTIVE', '이용중', 'Y', 1, NOW(), NOW()),
    ('USER_STATUS', 'LEFT',   '탈퇴',   'Y', 2, NOW(), NOW()),
    -- 거래유형
    ('HOUSE_DEAL_TYPE', 'JEONSE', '전세', 'Y', 1, NOW(), NOW()),
    ('HOUSE_DEAL_TYPE', 'WOLSE',  '월세', 'Y', 2, NOW(), NOW()),
    ('HOUSE_DEAL_TYPE', 'MAEMAE', '매매', 'Y', 3, NOW(), NOW()),
    -- 방유형
    ('HOUSE_ROOM_TYPE', 'ONE_ROOM',   '원룸',  'Y', 1, NOW(), NOW()),
    ('HOUSE_ROOM_TYPE', 'ONE_HALF',   '1.5룸', 'Y', 2, NOW(), NOW()),
    ('HOUSE_ROOM_TYPE', 'TWO_ROOM',   '투룸',  'Y', 3, NOW(), NOW()),
    ('HOUSE_ROOM_TYPE', 'THREE_ROOM', '쓰리룸','Y', 4, NOW(), NOW()),
    -- 집유형
    ('HOUSE_TYPE', 'VILLA',     '빌라',     'Y', 1, NOW(), NOW()),
    ('HOUSE_TYPE', 'OFFICETEL', '오피스텔', 'Y', 2, NOW(), NOW()),
    ('HOUSE_TYPE', 'APART',     '아파트',   'Y', 3, NOW(), NOW()),
    -- 엘리베이터
    ('HOUSE_ELEVATOR', 'Y', '있음', 'Y', 1, NOW(), NOW()),
    ('HOUSE_ELEVATOR', 'N', '없음', 'Y', 2, NOW(), NOW()),
    -- 수압
    ('HOUSE_WATER', 'HIGH', '좋음', 'Y', 1, NOW(), NOW()),
    ('HOUSE_WATER', 'MID',  '보통', 'Y', 2, NOW(), NOW()),
    ('HOUSE_WATER', 'LOW',  '약함', 'Y', 3, NOW(), NOW()),
    -- 햇빛방향
    ('HOUSE_SUNSHINE', 'SOUTH', '남향', 'Y', 1, NOW(), NOW()),
    ('HOUSE_SUNSHINE', 'EAST',  '동향', 'Y', 2, NOW(), NOW()),
    ('HOUSE_SUNSHINE', 'WEST',  '서향', 'Y', 3, NOW(), NOW()),
    ('HOUSE_SUNSHINE', 'NORTH', '북향', 'Y', 4, NOW(), NOW()),
    -- 풀옵션여부
    ('HOUSE_FULL_OPTION', 'Y', '풀옵션',   'Y', 1, NOW(), NOW()),
    ('HOUSE_FULL_OPTION', 'N', '해당없음', 'Y', 2, NOW(), NOW());
