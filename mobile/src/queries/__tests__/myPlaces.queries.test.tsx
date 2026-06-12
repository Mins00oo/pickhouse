import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { myPlacesApi } from '@/api/myPlaces.api';
import { useAuthStore } from '@/stores/authStore';
import { useMyPlaces, useRemovePlace, useSavePlace } from '../myPlaces.queries';

jest.mock('@/api/myPlaces.api');
jest.mock('expo-crypto', () => ({ randomUUID: () => 'place-1' }));

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

const address = {
  roadAddress: '서울 강남구 강남대로 396',
  jibunAddress: '역삼동',
  zonecode: '',
  latitude: 37.5,
  longitude: 127,
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
});

afterEach(() => {
  queryClient?.clear();
  queryClient = null;
});

it('loads places directly from the backend', async () => {
  (myPlacesApi.list as jest.Mock).mockResolvedValueOnce([]);
  const { result } = renderHook(() => useMyPlaces(), { wrapper });
  await waitFor(() => expect(result.current.data).toEqual([]));
});

it('creates and removes places directly through the backend API', async () => {
  (myPlacesApi.create as jest.Mock).mockImplementation((place) => Promise.resolve(place));
  (myPlacesApi.remove as jest.Mock).mockResolvedValue(undefined);
  const save = renderHook(() => useSavePlace(), { wrapper });
  await save.result.current.mutateAsync({
    placeType: 'WORKPLACE',
    address,
    transport: 'TRANSIT',
    isPrimary: true,
    label: '판교 회사',
  });
  expect(myPlacesApi.create).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'place-1', label: '판교 회사' }),
  );

  const remove = renderHook(() => useRemovePlace(), { wrapper });
  await remove.result.current.mutateAsync('place-1');
  expect(myPlacesApi.remove).toHaveBeenCalledWith('place-1');
});
