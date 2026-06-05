export interface Migration {
  version: number;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS houses (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        address_json TEXT NOT NULL,
        deal_type TEXT NOT NULL,
        deposit INTEGER NOT NULL,
        rent INTEGER,
        maintenance_fee INTEGER,
        area REAL,
        built_year INTEGER,
        floor INTEGER,
        total_floor INTEGER,
        available_from TEXT,
        station_distance INTEGER,
        rooms INTEGER,
        bathrooms INTEGER,
        has_balcony INTEGER,
        has_elevator INTEGER,
        has_parking INTEGER,
        options_json TEXT,
        security_json TEXT,
        garbage TEXT,
        water_pressure INTEGER,
        sunlight INTEGER,
        noise INTEGER,
        insulation INTEGER,
        ventilation INTEGER,
        moisture INTEGER,
        neighborhood INTEGER,
        first_impression INTEGER,
        memo TEXT,
        contracted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY NOT NULL,
        house_id TEXT,
        local_uri TEXT,
        remote_url TEXT,
        upload_status TEXT NOT NULL,
        taken_at TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        mime_type TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op_type TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_photos_house ON photos(house_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, entity_id);
    `,
  },
  {
    // 집 추가 위저드 신규 필드. 모두 nullable (기존 행 호환). 컨디션은 기존 컬럼 재사용 — 신설 없음.
    version: 2,
    sql: `
      ALTER TABLE houses ADD COLUMN nickname TEXT;
      ALTER TABLE houses ADD COLUMN visited_at TEXT;
      ALTER TABLE houses ADD COLUMN room_type TEXT;
      ALTER TABLE houses ADD COLUMN floor_type TEXT;
      ALTER TABLE houses ADD COLUMN direction TEXT;
      ALTER TABLE houses ADD COLUMN maintenance_includes_json TEXT;
      ALTER TABLE houses ADD COLUMN utility_estimates_json TEXT;
      ALTER TABLE houses ADD COLUMN full_option INTEGER;
    `,
  },
  {
    // 내 장소(직장/학교/기타) 최종 로컬 테이블. 로컬 DB는 초기화 가능하므로 과거 장소 테이블 이력은 남기지 않는다.
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS my_places (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        place_type TEXT NOT NULL,
        label TEXT,
        address_json TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        transport TEXT NOT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_my_places_user ON my_places(user_id);
      CREATE INDEX IF NOT EXISTS idx_my_places_user_deleted ON my_places(user_id, is_deleted);
    `,
  },
];
