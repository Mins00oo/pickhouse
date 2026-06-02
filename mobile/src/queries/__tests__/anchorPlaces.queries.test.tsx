import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSavePlace, useRemovePlace } from '../anchorPlaces.queries';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/anchorPlaces.repo');

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
      anchorType: 'WORKPLACE',
      address: addr,
      transport: 'TRANSIT',
      isPrimary: true,
      label: '판교 회사',
    });
    expect(anchorPlacesRepo.upsert).toHaveBeenCalledTimes(1);
    expect(anchorPlacesRepo.clearPrimaryExcept).toHaveBeenCalledWith('u1', 'WORKPLACE', saved.id);
  });

  it('does NOT clear siblings when not primary', async () => {
    const { result } = renderHook(() => useSavePlace(), { wrapper });
    await result.current.mutateAsync({
      anchorType: 'OTHER',
      address: addr,
      transport: 'WALK',
      isPrimary: false,
    });
    expect(anchorPlacesRepo.upsert).toHaveBeenCalledTimes(1);
    expect(anchorPlacesRepo.clearPrimaryExcept).not.toHaveBeenCalled();
  });
});

describe('useRemovePlace', () => {
  it('removes a place by id', async () => {
    const { result } = renderHook(() => useRemovePlace(), { wrapper });
    await result.current.mutateAsync('a1');
    await waitFor(() => expect(anchorPlacesRepo.remove).toHaveBeenCalledWith('a1'));
  });
});
