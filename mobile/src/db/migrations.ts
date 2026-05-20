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

      CREATE TABLE IF NOT EXISTS residences (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        address_json TEXT NOT NULL,
        deal_type TEXT NOT NULL,
        deposit INTEGER NOT NULL,
        rent INTEGER,
        maintenance_fee INTEGER,
        area REAL,
        contract_start_date TEXT NOT NULL,
        contract_end_date TEXT NOT NULL,
        landlord_memo TEXT,
        meter_readings_json TEXT,
        is_current INTEGER NOT NULL DEFAULT 0,
        era_label TEXT,
        memo TEXT,
        water_pressure INTEGER,
        sunlight INTEGER,
        noise INTEGER,
        insulation INTEGER,
        ventilation INTEGER,
        moisture INTEGER,
        neighborhood INTEGER,
        first_impression INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY NOT NULL,
        house_id TEXT,
        residence_id TEXT,
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
      CREATE INDEX IF NOT EXISTS idx_photos_residence ON photos(residence_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, entity_id);
    `,
  },
];
