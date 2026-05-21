import { syncQueueRepo, SyncOp } from '@/db/syncQueue.repo';
import { housesApi } from '@/api/houses.api';
import { housesRepo } from '@/db/houses.repo';
import { residencesApi } from '@/api/residences.api';
import { networkMonitor } from './networkMonitor';

const MAX_ATTEMPTS = 5;

function withoutPhotoIds(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const rest = { ...(payload as Record<string, unknown>) };
  delete rest.photoIds;
  return rest;
}

async function processOp(op: SyncOp): Promise<void> {
  if (op.entity === 'house') {
    if (op.opType === 'create') {
      await housesApi.create(withoutPhotoIds(op.payload) as never);
      await housesRepo.markClean(op.entityId);
    } else if (op.opType === 'update') {
      await housesApi.update(op.entityId, withoutPhotoIds(op.payload) as never);
      await housesRepo.markClean(op.entityId);
    } else if (op.opType === 'delete') {
      await housesApi.remove(op.entityId);
    }
  } else if (op.entity === 'residence') {
    if (op.opType === 'create') {
      await residencesApi.get(op.entityId).catch(() => undefined);
    }
  }
}

export const syncProcessor = {
  async processOnce(): Promise<boolean> {
    const online = await networkMonitor.isOnline();
    if (!online) return false;
    const ops = await syncQueueRepo.list();
    for (const op of ops) {
      if ((op.attempts ?? 0) >= MAX_ATTEMPTS) continue;
      try {
        await processOp(op);
        if (op.id != null) {
          await syncQueueRepo.remove(op.id);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (op.id != null) {
          await syncQueueRepo.incrementAttempts(op.id, message);
        }
      }
    }
    return true;
  },
};
