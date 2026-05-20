import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('pickhouse.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
  );
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM _meta WHERE key = 'schema_version';",
  );
  const current = row ? parseInt(row.value, 10) : 0;
  for (const m of migrations) {
    if (m.version > current) {
      await db.execAsync(m.sql);
      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?);",
        String(m.version),
      );
    }
  }
  return db;
}

export function resetDatabaseForTests() {
  dbPromise = null;
}
