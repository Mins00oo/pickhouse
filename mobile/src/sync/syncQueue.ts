import { syncQueueRepo } from '@/db/syncQueue.repo';
import { House } from '@/types';

export const syncQueue = {
  async queueHouseCreate(h: House): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'house',
      entityId: h.id,
      payload: h,
    });
  },

  async queueHouseUpdate(id: string, patch: Partial<House>): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'update',
      entity: 'house',
      entityId: id,
      payload: patch,
    });
  },

  async queueHouseDelete(id: string): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'delete',
      entity: 'house',
      entityId: id,
      payload: {},
    });
  },

  async queuePhotoFinalize(payload: { photoId: string; houseId?: string; remoteUrl: string }): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'photo',
      entityId: payload.photoId,
      payload,
    });
  },
};
