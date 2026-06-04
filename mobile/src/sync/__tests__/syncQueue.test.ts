import { syncQueue } from '../syncQueue';
import { syncQueueRepo } from '@/db/syncQueue.repo';

jest.mock('@/db/syncQueue.repo');

beforeEach(() => jest.clearAllMocks());

describe('syncQueue', () => {
  it('queueAnchorPlaceCreate enqueues create+anchorPlace op', async () => {
    (syncQueueRepo.enqueue as jest.Mock).mockResolvedValueOnce(1);
    await syncQueue.queueAnchorPlaceCreate({ id: 'a1' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'create', entity: 'anchorPlace', entityId: 'a1',
    }));
  });

  it('queueAnchorPlaceUpdate enqueues update op', async () => {
    await syncQueue.queueAnchorPlaceUpdate('a2', { label: 'x' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'update', entity: 'anchorPlace', entityId: 'a2',
    }));
  });

  it('queueAnchorPlaceDelete enqueues delete op', async () => {
    await syncQueue.queueAnchorPlaceDelete('a3');
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'delete', entity: 'anchorPlace', entityId: 'a3',
    }));
  });

  it('queuePhotoFinalize enqueues create+photo op', async () => {
    await syncQueue.queuePhotoFinalize({ photoId: 'p1', houseId: 'h1', remoteUrl: 'http://x/y.jpg' });
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'create', entity: 'photo', entityId: 'p1',
    }));
  });
});
