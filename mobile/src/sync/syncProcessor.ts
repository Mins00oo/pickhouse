import { syncQueueRepo, SyncOp } from '@/db/syncQueue.repo';
import { myPlacesApi } from '@/api/myPlaces.api';
import { myPlacesRepo } from '@/db/myPlaces.repo';
import { networkMonitor } from './networkMonitor';

const MAX_ATTEMPTS = 5;

async function processOp(op: SyncOp): Promise<void> {
  if (op.entity === 'myPlace') {
    if (op.opType === 'create') {
      await myPlacesApi.create(op.payload as never);
      await myPlacesRepo.markClean(op.entityId);
    } else if (op.opType === 'update') {
      await myPlacesApi.update(op.entityId, op.payload as never);
      await myPlacesRepo.markClean(op.entityId);
    } else if (op.opType === 'delete') {
      await myPlacesApi.remove(op.entityId);
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
