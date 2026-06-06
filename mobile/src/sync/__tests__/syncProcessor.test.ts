import { syncProcessor } from '../syncProcessor';
import { syncQueueRepo } from '@/db/syncQueue.repo';
import { myPlacesApi } from '@/api/myPlaces.api';
import { myPlacesRepo } from '@/db/myPlaces.repo';
import { networkMonitor } from '../networkMonitor';

jest.mock('@/db/syncQueue.repo');
jest.mock('@/api/myPlaces.api');
jest.mock('@/db/myPlaces.repo');
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

  it('processes a create-myPlace op then markClean and removes from queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 21, opType: 'create', entity: 'myPlace', entityId: 'a1', payload: { id: 'a1' } },
    ]);
    (myPlacesApi.create as jest.Mock).mockResolvedValueOnce({ id: 'a1' });

    const ran = await syncProcessor.processOnce();

    expect(ran).toBe(true);
    expect(myPlacesApi.create).toHaveBeenCalledWith({ id: 'a1' });
    expect(myPlacesRepo.markClean).toHaveBeenCalledWith('a1');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(21);
  });

  it('processes an update-myPlace op', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 23, opType: 'update', entity: 'myPlace', entityId: 'a3', payload: { label: 'x' } },
    ]);
    (myPlacesApi.update as jest.Mock).mockResolvedValueOnce({ id: 'a3' });

    await syncProcessor.processOnce();

    expect(myPlacesApi.update).toHaveBeenCalledWith('a3', { label: 'x' });
    expect(myPlacesRepo.markClean).toHaveBeenCalledWith('a3');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(23);
  });

  it('processes a delete-myPlace op', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 22, opType: 'delete', entity: 'myPlace', entityId: 'a2', payload: {} },
    ]);
    (myPlacesApi.remove as jest.Mock).mockResolvedValueOnce(undefined);

    await syncProcessor.processOnce();

    expect(myPlacesApi.remove).toHaveBeenCalledWith('a2');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(22);
  });

  it('on failure, increments attempts and keeps op in queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 13, opType: 'create', entity: 'myPlace', entityId: 'a4', payload: { id: 'a4' } },
    ]);
    (myPlacesApi.create as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await syncProcessor.processOnce();
    expect(syncQueueRepo.incrementAttempts).toHaveBeenCalledWith(13, expect.stringMatching(/boom/));
    expect(syncQueueRepo.remove).not.toHaveBeenCalled();
  });
});
