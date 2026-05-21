import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useHouses, useCreateHouse } from '../houses.queries';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { syncQueue } from '@/sync/syncQueue';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');
jest.mock('@/sync/syncQueue');

let queryClient: QueryClient | null = null;

const wrapper = ({ children }: { children: ReactNode }) => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
});

afterEach(() => {
  queryClient?.clear();
  queryClient = null;
});

describe('useHouses', () => {
  it('returns local cached houses first, then merges remote', async () => {
    (housesRepo.listActive as jest.Mock).mockResolvedValue([
      { id: 'h1', address: {}, dealType: 'WOLSE', deposit: 100, photoIds: [], createdAt: '', updatedAt: '' },
    ]);
    (housesApi.list as jest.Mock).mockResolvedValue([
      { id: 'h1', address: {}, dealType: 'WOLSE', deposit: 100, photoIds: [], createdAt: '', updatedAt: '2026' },
      { id: 'h2', address: {}, dealType: 'JEONSE', deposit: 5000, photoIds: [], createdAt: '', updatedAt: '2026' },
    ]);
    const { result } = renderHook(() => useHouses(), { wrapper });
    await waitFor(() => expect(result.current.data?.length).toBeGreaterThanOrEqual(1));
  });
});

describe('useCreateHouse', () => {
  it('inserts locally then queues sync', async () => {
    const { result } = renderHook(() => useCreateHouse(), { wrapper });
    await result.current.mutateAsync({
      address: { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType: 'WOLSE',
      deposit: 100,
    });
    expect(housesRepo.insert).toHaveBeenCalled();
    expect(syncQueue.queueHouseCreate).toHaveBeenCalled();
  });
});
