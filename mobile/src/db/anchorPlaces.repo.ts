import { AnchorPlace, AnchorType } from '@/types';
import { getDatabase } from './database';

// SQLite row shape — `user_id` 컬럼은 오프라인 스코핑용(UI 타입엔 없음).
type AnchorRow = {
  id: string;
  user_id: string;
  anchor_type: string;
  label: string | null;
  address_json: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

function rowToAnchor(r: AnchorRow): AnchorPlace {
  return {
    id: r.id,
    anchorType: r.anchor_type as AnchorType,
    label: r.label ?? undefined,
    address: JSON.parse(r.address_json),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const anchorPlacesRepo = {
  // 타입별 1개 보장: (user_id, anchor_type) UNIQUE 충돌 시 갱신.
  async upsert(p: AnchorPlace, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO anchor_places (
        id, user_id, anchor_type, label, address_json, latitude, longitude,
        created_at, updated_at, is_dirty
      ) VALUES (?,?,?,?,?,?,?,?,?,1)
      ON CONFLICT(user_id, anchor_type) DO UPDATE SET
        label=excluded.label,
        address_json=excluded.address_json,
        latitude=excluded.latitude,
        longitude=excluded.longitude,
        updated_at=excluded.updated_at,
        is_dirty=1`,
      p.id,
      userId,
      p.anchorType,
      p.label ?? null,
      JSON.stringify(p.address),
      p.address.latitude ?? null,
      p.address.longitude ?? null,
      p.createdAt,
      p.updatedAt,
    );
  },

  async getByType(userId: string, type: AnchorType): Promise<AnchorPlace | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<AnchorRow>(
      'SELECT * FROM anchor_places WHERE user_id = ? AND anchor_type = ?',
      userId,
      type,
    );
    return row ? rowToAnchor(row) : null;
  },

  async listActive(userId: string): Promise<AnchorPlace[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AnchorRow>(
      'SELECT * FROM anchor_places WHERE user_id = ? ORDER BY anchor_type ASC',
      userId,
    );
    return (rows ?? []).map(rowToAnchor);
  },

  // 로컬 전용 고정 슬롯 → 하드 삭제.
  async clear(userId: string, type: AnchorType): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM anchor_places WHERE user_id = ? AND anchor_type = ?',
      userId,
      type,
    );
  },
};
