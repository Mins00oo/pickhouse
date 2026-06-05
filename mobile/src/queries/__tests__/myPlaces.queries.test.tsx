import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSavePlace, useRemovePlace } from '../myPlaces.queries';
import { myPlacesRepo } from '@/db/myPlaces.repo';
import { syncQueue } from '@/sync/syncQueue';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/myPlaces.repo');
jest.mock('@/api/myPlaces.api');
jest.mock('@/sync/syncQueue');

let queryClient: QueryClient | null = null;
const wrapper = ({ children }: { children: ReactNode }) => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const addr = { roadAddress: '서울 강남구 강남대로 396', jibunAddress: '역삼동', zonecode: '', latitude: 37.5, longitude: 127.0 };

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

describe('useSavePlace', () => {
  it('upserts the place and clears sibling primaries when set as 주 통근지', async () => {
    const { result } = renderHook(() => useSavePlace(), { wrapper });
    const saved = await result.current.mutateAsync({
      placeType: 'WORKPLACE',
      address: addr,
      transport: 'TRANSIT',
      isPrimary: true,
      label: '판교 회사',
    });
    expect(myPlacesRepo.upsert).toHaveBeenCalledTimes(1);
    expect(myPlacesRepo.clearPrimaryExcept).toHaveBeenCalledWith('u1', 'WORKPLACE', saved.id);
    expect(syncQueue.queueMyPlaceCreate).toHaveBeenCalledTimes(1);
  });

  it('does NOT clear siblings when not primary', async () => {
    const { result } = renderHook(() => useSavePlace(), { wrapper });
    await result.current.mutateAsync({
      placeType: 'OTHER',
      address: addr,
      transport: 'WALK',
      isPrimary: false,
    });
    expect(myPlacesRepo.upsert).toHaveBeenCalledTimes(1);
    expect(myPlacesRepo.clearPrimaryExcept).not.toHaveBeenCalled();
  });
});

describe('useRemovePlace', () => {
  it('soft-deletes a place by id and enqueues a sync delete', async () => {
    const { result } = renderHook(() => useRemovePlace(), { wrapper });
    await result.current.mutateAsync('a1');
    await waitFor(() => expect(myPlacesRepo.softDelete).toHaveBeenCalledWith('a1'));
    expect(syncQueue.queueMyPlaceDelete).toHaveBeenCalledWith('a1');
  });
});
