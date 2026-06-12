import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useHouses, useCreateHouse, useUpdateHouse, useDeleteHouse } from '../houses.queries';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/api/houses.api');
// expo-crypto.randomUUID 는 테스트 환경에서 undefined 를 반환하므로 결정적 값으로 모킹한다.
jest.mock('expo-crypto', () => ({ randomUUID: () => 'gen-uuid-1' }));

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
  it('fetches the house list directly from the backend', async () => {
    (housesApi.list as jest.Mock).mockResolvedValue([
      { id: 'h1', address: {}, dealType: 'WOLSE', deposit: 100, photoIds: [], createdAt: '', updatedAt: '2026' },
      { id: 'h2', address: {}, dealType: 'JEONSE', deposit: 5000, photoIds: [], createdAt: '', updatedAt: '2026' },
    ]);
    const { result } = renderHook(() => useHouses(), { wrapper });
    await waitFor(() => expect(result.current.data?.length).toBe(2));
    expect(housesApi.list).toHaveBeenCalled();
  });
});

describe('useCreateHouse', () => {
  it('POSTs only create request fields and normalizes date-only visitedAt', async () => {
    (housesApi.create as jest.Mock).mockImplementation((body) =>
      Promise.resolve({
        ...body,
        id: 'server-h1',
        photoIds: [],
        createdAt: '2026-06-04T06:47:30.672Z',
        updatedAt: '2026-06-04T06:47:30.672Z',
      }),
    );
    const { result } = renderHook(() => useCreateHouse(), { wrapper });
    await result.current.mutateAsync({
      address: { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType: 'WOLSE',
      deposit: 100,
      rent: 50,
      visitedAt: '2026-06-04',
    });
    expect(housesApi.create).toHaveBeenCalledTimes(1);
    const [body] = (housesApi.create as jest.Mock).mock.calls[0]!;
    expect(body.dealType).toBe('WOLSE');
    expect(body.visitedAt).toBe('2026-06-04T00:00:00.000Z');
    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('photoIds');
    expect(body).not.toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('updatedAt');
  });

  it('sends rent 0 for jeonse create requests', async () => {
    (housesApi.create as jest.Mock).mockImplementation((body) =>
      Promise.resolve({
        ...body,
        id: 'server-h1',
        photoIds: [],
        createdAt: '',
        updatedAt: '',
      }),
    );
    const { result } = renderHook(() => useCreateHouse(), { wrapper });
    await result.current.mutateAsync({
      address: { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType: 'JEONSE',
      deposit: 10000,
    });
    const [body] = (housesApi.create as jest.Mock).mock.calls[0]!;
    expect(body.rent).toBe(0);
  });
});

describe('useUpdateHouse', () => {
  it('PATCHes request fields by id and strips response/local-only fields', async () => {
    (housesApi.update as jest.Mock).mockResolvedValue({ id: 'h1', memo: 'x', photoIds: [] });
    const { result } = renderHook(() => useUpdateHouse(), { wrapper });
    await result.current.mutateAsync({
      id: 'h1',
      patch: {
        id: 'ignored',
        memo: 'x',
        photoIds: ['p1'],
        createdAt: 'ignored',
        updatedAt: 'ignored',
        visitedAt: '2026-06-04',
      } as any,
    });
    expect(housesApi.update).toHaveBeenCalledWith('h1', {
      memo: 'x',
      visitedAt: '2026-06-04T00:00:00.000Z',
    });
  });
});

describe('useDeleteHouse', () => {
  it('DELETEs the house by id', async () => {
    (housesApi.remove as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteHouse(), { wrapper });
    await result.current.mutateAsync('h1');
    expect(housesApi.remove).toHaveBeenCalledWith('h1');
  });
});
