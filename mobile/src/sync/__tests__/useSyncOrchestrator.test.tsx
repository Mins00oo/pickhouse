import { renderHook, waitFor } from '@testing-library/react-native';
import { useSyncOrchestrator } from '../useSyncOrchestrator';
import { syncProcessor } from '../syncProcessor';
import { networkMonitor } from '../networkMonitor';
import { photosRepo } from '@/db/photos.repo';
import { useAuthStore } from '@/stores/authStore';

jest.mock('../syncProcessor');
jest.mock('../networkMonitor');
jest.mock('@/db/photos.repo');
jest.mock('@/photos/photoUploader');

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
});

describe('useSyncOrchestrator', () => {
  it('waits for queued entity sync before uploading pending photos', async () => {
    let finishSync!: () => void;
    (syncProcessor.processOnce as jest.Mock).mockImplementationOnce(
      () => new Promise<boolean>((resolve) => {
        finishSync = () => resolve(true);
      }),
    );
    (networkMonitor.isOnline as jest.Mock).mockResolvedValue(true);
    (photosRepo.listPending as jest.Mock).mockResolvedValue([]);

    renderHook(() => useSyncOrchestrator());

    await waitFor(() => expect(syncProcessor.processOnce).toHaveBeenCalled());
    await Promise.resolve();
    await Promise.resolve();
    expect(photosRepo.listPending).not.toHaveBeenCalled();

    finishSync();

    await waitFor(() => expect(photosRepo.listPending).toHaveBeenCalled());
  });
});
