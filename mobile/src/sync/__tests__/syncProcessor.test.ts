import { syncProcessor } from '../syncProcessor';
import { syncQueueRepo } from '@/db/syncQueue.repo';
import { housesApi } from '@/api/houses.api';
import { housesRepo } from '@/db/houses.repo';
import { networkMonitor } from '../networkMonitor';

jest.mock('@/db/syncQueue.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/houses.repo');
jest.mock('../networkMonitor');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncProcessor', () => {
  it('skips when offline', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(false);
    const ran = await syncProcessor.processOnce();
    expect(ran).toBe(false);
    expect(syncQueueRepo.list).not.toHaveBeenCalled();
  });

  it('processes a create-house op then removes from queue and marks clean', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 7, opType: 'create', entity: 'house', entityId: 'h1', payload: { id: 'h1' } },
    ]);
    (housesApi.create as jest.Mock).mockResolvedValueOnce({ id: 'h1' });

    const ran = await syncProcessor.processOnce();

    expect(ran).toBe(true);
    expect(housesApi.create).toHaveBeenCalledWith({ id: 'h1' });
    expect(housesRepo.markClean).toHaveBeenCalledWith('h1');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(7);
  });

  it('processes update-house then markClean and removes from queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 9, opType: 'update', entity: 'house', entityId: 'h2', payload: { id: 'h2', memo: 'x' } },
    ]);
    (housesApi.update as jest.Mock).mockResolvedValueOnce({ id: 'h2' });
    await syncProcessor.processOnce();
    expect(housesApi.update).toHaveBeenCalledWith('h2', { id: 'h2', memo: 'x' });
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(9);
  });

  it('processes delete-house', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 11, opType: 'delete', entity: 'house', entityId: 'h3', payload: {} },
    ]);
    (housesApi.remove as jest.Mock).mockResolvedValueOnce(undefined);
    await syncProcessor.processOnce();
    expect(housesApi.remove).toHaveBeenCalledWith('h3');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(11);
  });

  it('on failure, increments attempts and keeps op in queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 13, opType: 'create', entity: 'house', entityId: 'h4', payload: { id: 'h4' } },
    ]);
    (housesApi.create as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await syncProcessor.processOnce();
    expect(syncQueueRepo.incrementAttempts).toHaveBeenCalledWith(13, expect.stringMatching(/boom/));
    expect(syncQueueRepo.remove).not.toHaveBeenCalled();
  });
});
