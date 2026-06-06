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

  it('includes houses, photos, sync_queue tables', () => {
    const allSql = migrations.map((m) => m.sql).join('\n');
    expect(allSql).toMatch(/CREATE TABLE.*houses/);
    expect(allSql).toMatch(/CREATE TABLE.*photos/);
    expect(allSql).toMatch(/CREATE TABLE.*sync_queue/);
  });

  it('creates the my_places table with final columns and indexes in v3', () => {
    const v3 = migrations.find((m) => m.version === 3);
    expect(v3).toBeDefined();
    const sql = v3!.sql;
    expect(sql).toMatch(/CREATE TABLE.*my_places/s);
    expect(sql).toMatch(/place_type TEXT NOT NULL/);
    expect(sql).toMatch(/transport TEXT NOT NULL/);
    expect(sql).toMatch(/is_primary INTEGER NOT NULL DEFAULT 0/);
    expect(sql).toMatch(/is_deleted INTEGER NOT NULL DEFAULT 0/);
    expect(sql).toMatch(/CREATE INDEX.*idx_my_places_user.*my_places\(user_id\)/s);
    expect(sql).toMatch(/CREATE INDEX.*idx_my_places_user_deleted.*my_places\(user_id, is_deleted\)/s);
    expect(sql).not.toMatch(/UNIQUE INDEX/);
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
