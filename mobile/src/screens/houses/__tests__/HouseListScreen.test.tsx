import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseListScreen } from '../HouseListScreen';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');

let queryClient: QueryClient | null = null;

const wrap = (c: React.ReactNode) => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
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

describe('HouseListScreen', () => {
  it('renders house addresses from the data source', async () => {
    (housesRepo.listActive as jest.Mock).mockResolvedValue([
      {
        id: 'h1',
        address: { roadAddress: '서울시 종로구 1', jibunAddress: '', zonecode: '03000' },
        dealType: 'WOLSE', deposit: 1000, rent: 50, photoIds: [], createdAt: '2026-01', updatedAt: '2026-01',
      },
    ]);
    (housesApi.list as jest.Mock).mockRejectedValue(new Error('offline'));

    const nav = { navigate: jest.fn() } as any;
    const { findByText } = render(wrap(<HouseListScreen navigation={nav} route={{} as any} />));
    await waitFor(async () => {
      expect(await findByText(/종로구/)).toBeTruthy();
    });
  });
});
