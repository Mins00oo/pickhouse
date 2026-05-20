import { getDatabase } from './database';

export type SyncOpType = 'create' | 'update' | 'delete';
export type SyncEntity = 'house' | 'residence' | 'photo';

export interface SyncOp {
  id?: number;
  opType: SyncOpType;
  entity: SyncEntity;
  entityId: string;
  payload: unknown;
  attempts?: number;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

type SyncRow = {
  id: number;
  op_type: SyncOpType;
  entity: SyncEntity;
  entity_id: string;
  payload_json: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function rowToOp(r: SyncRow): SyncOp {
  return {
    id: r.id,
    opType: r.op_type,
    entity: r.entity,
    entityId: r.entity_id,
    payload: JSON.parse(r.payload_json),
    attempts: r.attempts,
    lastError: r.last_error ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const syncQueueRepo = {
  async enqueue(op: SyncOp): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const res = await db.runAsync(
      `INSERT INTO sync_queue (
        op_type, entity, entity_id, payload_json, attempts, last_error, created_at, updated_at
      ) VALUES (?,?,?,?,0,NULL,?,?)`,
      op.opType,
      op.entity,
      op.entityId,
      JSON.stringify(op.payload),
      now,
      now,
    );
    return res.lastInsertRowId;
  },

  async list(): Promise<SyncOp[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SyncRow>(
      'SELECT * FROM sync_queue ORDER BY id ASC',
    );
    return rows.map(rowToOp);
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
  },

  async incrementAttempts(id: number, error: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sync_queue SET attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?',
      error,
      new Date().toISOString(),
      id,
    );
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sync_queue');
  },
};
