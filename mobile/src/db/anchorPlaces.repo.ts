import { AnchorPlace, AnchorType, TransportMode } from '@/types';
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
  transport: string | null;
  is_primary: number | null;
  created_at: string;
  updated_at: string;
};

function rowToAnchor(r: AnchorRow): AnchorPlace {
  return {
    id: r.id,
    anchorType: r.anchor_type as AnchorType,
    label: r.label ?? undefined,
    address: JSON.parse(r.address_json),
    transport: (r.transport as TransportMode) ?? 'CAR', // 기존 행(NULL) 호환 → 기본 자동차
    isPrimary: r.is_primary === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const anchorPlacesRepo = {
  // id 기준 upsert — 신규(새 id)와 수정(기존 id)을 모두 처리. 타입당 여러 개 허용.
  async upsert(p: AnchorPlace, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO anchor_places (
        id, user_id, anchor_type, label, address_json, latitude, longitude,
        transport, is_primary, created_at, updated_at, is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,0)
      ON CONFLICT(id) DO UPDATE SET
        anchor_type=excluded.anchor_type,
        label=excluded.label,
        address_json=excluded.address_json,
        latitude=excluded.latitude,
        longitude=excluded.longitude,
        transport=excluded.transport,
        is_primary=excluded.is_primary,
        updated_at=excluded.updated_at,
        is_dirty=1`,
      p.id,
      userId,
      p.anchorType,
      p.label ?? null,
      JSON.stringify(p.address),
      p.address.latitude ?? null,
      p.address.longitude ?? null,
      p.transport,
      p.isPrimary ? 1 : 0,
      p.createdAt,
      p.updatedAt,
    );
  },

  // 같은 타입의 다른 주 통근지를 해제(타입당 주 통근지 최대 1개 보장).
  async clearPrimaryExcept(userId: string, anchorType: AnchorType, exceptId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE anchor_places SET is_primary = 0, is_dirty = 1 WHERE user_id = ? AND anchor_type = ? AND id <> ?',
      userId,
      anchorType,
      exceptId,
    );
  },

  async findById(id: string): Promise<AnchorPlace | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<AnchorRow>(
      'SELECT * FROM anchor_places WHERE id = ? AND is_deleted = 0',
      id,
    );
    return row ? rowToAnchor(row) : null;
  },

  async listActive(userId: string): Promise<AnchorPlace[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AnchorRow>(
      'SELECT * FROM anchor_places WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
      userId,
    );
    return (rows ?? []).map(rowToAnchor);
  },

  // 서버 동기화 대비 소프트 삭제(houses 미러).
  async softDelete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE anchor_places SET is_deleted = 1, is_dirty = 1, updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      id,
    );
  },

  async markClean(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE anchor_places SET is_dirty = 0 WHERE id = ?', id);
  },

  async listDirty(): Promise<AnchorPlace[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AnchorRow>(
      'SELECT * FROM anchor_places WHERE is_dirty = 1',
    );
    return (rows ?? []).map(rowToAnchor);
  },
};
