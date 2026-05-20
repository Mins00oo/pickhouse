import { syncQueue } from '../syncQueue';
import { syncQueueRepo } from '@/db/syncQueue.repo';

jest.mock('@/db/syncQueue.repo');

beforeEach(() => jest.clearAllMocks());

describe('syncQueue', () => {
  it('queueHouseCreate enqueues create+house op', async () => {
    (syncQueueRepo.enqueue as jest.Mock).mockResolvedValueOnce(1);
    await syncQueue.queueHouseCreate({ id: 'h1' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'create', entity: 'house', entityId: 'h1',
    }));
  });

  it('queueHouseUpdate enqueues update op', async () => {
    await syncQueue.queueHouseUpdate('h2', { memo: 'x' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'update', entity: 'house', entityId: 'h2',
    }));
  });

  it('queueHouseDelete enqueues delete op', async () => {
    await syncQueue.queueHouseDelete('h3');
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'delete', entity: 'house', entityId: 'h3',
    }));
  });
});
