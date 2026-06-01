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
