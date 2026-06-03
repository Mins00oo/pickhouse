import { syncProcessor } from '../syncProcessor';
import { syncQueueRepo } from '@/db/syncQueue.repo';
import { housesApi } from '@/api/houses.api';
import { housesRepo } from '@/db/houses.repo';
import { anchorPlacesApi } from '@/api/anchorPlaces.api';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { networkMonitor } from '../networkMonitor';

jest.mock('@/db/syncQueue.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/houses.repo');
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

  it('does not send pending local photoIds with create-house payload', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      {
        id: 8,
        opType: 'create',
        entity: 'house',
        entityId: 'h1',
        payload: { id: 'h1', memo: 'with local photos', photoIds: ['p1'] },
      },
    ]);
    (housesApi.create as jest.Mock).mockResolvedValueOnce({ id: 'h1' });

    await syncProcessor.processOnce();

    expect(housesApi.create).toHaveBeenCalledWith({ id: 'h1', memo: 'with local photos' });
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

  it('processes a create-anchorPlace op then markClean and removes from queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 21, opType: 'create', entity: 'anchorPlace', entityId: 'a1', payload: { id: 'a1' } },
    ]);
    (anchorPlacesApi.create as jest.Mock).mockResolvedValueOnce({ id: 'a1' });

    await syncProcessor.processOnce();

    expect(anchorPlacesApi.create).toHaveBeenCalledWith({ id: 'a1' });
    expect(anchorPlacesRepo.markClean).toHaveBeenCalledWith('a1');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(21);
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
      { id: 13, opType: 'create', entity: 'house', entityId: 'h4', payload: { id: 'h4' } },
    ]);
    (housesApi.create as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await syncProcessor.processOnce();
    expect(syncQueueRepo.incrementAttempts).toHaveBeenCalledWith(13, expect.stringMatching(/boom/));
    expect(syncQueueRepo.remove).not.toHaveBeenCalled();
  });
});
