import { syncProcessor } from '../syncProcessor';
import { syncQueueRepo } from '@/db/syncQueue.repo';
import { anchorPlacesApi } from '@/api/anchorPlaces.api';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { networkMonitor } from '../networkMonitor';

jest.mock('@/db/syncQueue.repo');
jest.mock('@/api/anchorPlaces.api');
jest.mock('@/db/anchorPlaces.repo');
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

  it('processes a create-anchorPlace op then markClean and removes from queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 21, opType: 'create', entity: 'anchorPlace', entityId: 'a1', payload: { id: 'a1' } },
    ]);
    (anchorPlacesApi.create as jest.Mock).mockResolvedValueOnce({ id: 'a1' });

    const ran = await syncProcessor.processOnce();

    expect(ran).toBe(true);
    expect(anchorPlacesApi.create).toHaveBeenCalledWith({ id: 'a1' });
    expect(anchorPlacesRepo.markClean).toHaveBeenCalledWith('a1');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(21);
  });

  it('processes an update-anchorPlace op', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 23, opType: 'update', entity: 'anchorPlace', entityId: 'a3', payload: { label: 'x' } },
    ]);
    (anchorPlacesApi.update as jest.Mock).mockResolvedValueOnce({ id: 'a3' });

    await syncProcessor.processOnce();

    expect(anchorPlacesApi.update).toHaveBeenCalledWith('a3', { label: 'x' });
    expect(anchorPlacesRepo.markClean).toHaveBeenCalledWith('a3');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(23);
  });

  it('processes a delete-anchorPlace op', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 22, opType: 'delete', entity: 'anchorPlace', entityId: 'a2', payload: {} },
    ]);
    (anchorPlacesApi.remove as jest.Mock).mockResolvedValueOnce(undefined);

    await syncProcessor.processOnce();

    expect(anchorPlacesApi.remove).toHaveBeenCalledWith('a2');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(22);
  });

  it('on failure, increments attempts and keeps op in queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 13, opType: 'create', entity: 'anchorPlace', entityId: 'a4', payload: { id: 'a4' } },
    ]);
    (anchorPlacesApi.create as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await syncProcessor.processOnce();
    expect(syncQueueRepo.incrementAttempts).toHaveBeenCalledWith(13, expect.stringMatching(/boom/));
    expect(syncQueueRepo.remove).not.toHaveBeenCalled();
  });
});
