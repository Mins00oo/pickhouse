import { syncQueue } from '../syncQueue';
import { syncQueueRepo } from '@/db/syncQueue.repo';

jest.mock('@/db/syncQueue.repo');

beforeEach(() => jest.clearAllMocks());

describe('syncQueue', () => {
  it('queueMyPlaceCreate enqueues create+myPlace op', async () => {
    (syncQueueRepo.enqueue as jest.Mock).mockResolvedValueOnce(1);
    await syncQueue.queueMyPlaceCreate({ id: 'a1' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'create', entity: 'myPlace', entityId: 'a1',
    }));
  });

  it('queueMyPlaceUpdate enqueues update op', async () => {
    await syncQueue.queueMyPlaceUpdate('a2', { label: 'x' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'update', entity: 'myPlace', entityId: 'a2',
    }));
  });

  it('queueMyPlaceDelete enqueues delete op', async () => {
    await syncQueue.queueMyPlaceDelete('a3');
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'delete', entity: 'myPlace', entityId: 'a3',
    }));
  });

  it('queuePhotoFinalize enqueues create+photo op', async () => {
    await syncQueue.queuePhotoFinalize({ photoId: 'p1', houseId: 'h1', remoteUrl: 'http://x/y.jpg' });
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'create', entity: 'photo', entityId: 'p1',
    }));
  });
});
