import { syncQueueRepo } from '@/db/syncQueue.repo';
import { MyPlace } from '@/types';

export const syncQueue = {
  async queuePhotoFinalize(payload: { photoId: string; houseId?: string; remoteUrl: string }): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'photo',
      entityId: payload.photoId,
      payload,
    });
  },

  async queueMyPlaceCreate(p: MyPlace): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'myPlace',
      entityId: p.id,
      payload: p,
    });
  },

  async queueMyPlaceUpdate(id: string, patch: Partial<MyPlace>): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'update',
      entity: 'myPlace',
      entityId: id,
      payload: patch,
    });
  },

  async queueMyPlaceDelete(id: string): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'delete',
      entity: 'myPlace',
      entityId: id,
      payload: {},
    });
  },
};
