import { syncQueueRepo } from '@/db/syncQueue.repo';
import { AnchorPlace } from '@/types';

export const syncQueue = {
  async queuePhotoFinalize(payload: { photoId: string; houseId?: string; remoteUrl: string }): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'photo',
      entityId: payload.photoId,
      payload,
    });
  },

  async queueAnchorPlaceCreate(p: AnchorPlace): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'anchorPlace',
      entityId: p.id,
      payload: p,
    });
  },

  async queueAnchorPlaceUpdate(id: string, patch: Partial<AnchorPlace>): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'update',
      entity: 'anchorPlace',
      entityId: id,
      payload: patch,
    });
  },

  async queueAnchorPlaceDelete(id: string): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'delete',
      entity: 'anchorPlace',
      entityId: id,
      payload: {},
    });
  },
};
