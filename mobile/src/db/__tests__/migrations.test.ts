import { migrations } from '../migrations';

describe('migrations', () => {
  it('has at least one version with sql', () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations[0]!.version).toBe(1);
    expect(migrations[0]!.sql).toContain('CREATE TABLE');
  });

  it('versions are sequential starting from 1', () => {
    migrations.forEach((m, i) => {
      expect(m.version).toBe(i + 1);
    });
  });

  it('includes houses, residences, photos, sync_queue tables', () => {
    const allSql = migrations.map((m) => m.sql).join('\n');
    expect(allSql).toMatch(/CREATE TABLE.*houses/);
    expect(allSql).toMatch(/CREATE TABLE.*residences/);
    expect(allSql).toMatch(/CREATE TABLE.*photos/);
    expect(allSql).toMatch(/CREATE TABLE.*sync_queue/);
  });

  it('creates the anchor_places table with a one-per-type unique index in v3', () => {
    const v3 = migrations.find((m) => m.version === 3);
    expect(v3).toBeDefined();
    const sql = v3!.sql;
    expect(sql).toMatch(/CREATE TABLE.*anchor_places/s);
    expect(sql).toMatch(/anchor_type TEXT NOT NULL/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX.*anchor_places\(user_id, anchor_type\)/s);
  });

  it('relaxes anchor_places to multi-place with transport + is_primary in v4', () => {
    const v4 = migrations.find((m) => m.version === 4);
    expect(v4).toBeDefined();
    const sql = v4!.sql;
    // 이동수단 + 주 통근지 컬럼 추가
    expect(sql).toMatch(/ALTER TABLE anchor_places ADD COLUMN transport/);
    expect(sql).toMatch(/ALTER TABLE anchor_places ADD COLUMN is_primary/);
    // 타입당 1개 제약 제거 → 여러 개 허용
    expect(sql).toMatch(/DROP INDEX.*idx_anchor_user_type/s);
  });

  it('adds the add-house wizard columns in migration v2', () => {
    const v2 = migrations.find((m) => m.version === 2);
    expect(v2).toBeDefined();
    const sql = v2!.sql;
    for (const col of [
      'nickname',
      'visited_at',
      'room_type',
      'floor_type',
      'direction',
      'maintenance_includes_json',
      'utility_estimates_json',
      'full_option',
    ]) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE houses ADD COLUMN ${col}`));
    }
  });
});
