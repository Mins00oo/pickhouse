import type { ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HouseListScreen } from '../HouseListScreen';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');

let queryClient: QueryClient | null = null;

const wrap = (content: ReactNode) => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 44, right: 0, bottom: 34, left: 0 },
        }}
      >
        <NavigationContainer>{content}</NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

const houses = [
  {
    id: 'h1',
    address: {
      roadAddress: '서울시 마포구 망원동 1',
      jibunAddress: '망원동 1',
      zonecode: '04000',
      latitude: 37.556,
      longitude: 126.901,
      detail: '망원 신축',
    },
    dealType: 'WOLSE',
    deposit: 1000,
    rent: 50,
    area: 12,
    floor: 3,
    totalFloor: 5,
    firstImpression: 5,
    photoIds: [],
    createdAt: '2026-05-16T00:00:00.000Z',
    updatedAt: '2026-05-16T00:00:00.000Z',
  },
  {
    id: 'h2',
    address: {
      roadAddress: '서울시 종로구 창신동 2',
      jibunAddress: '창신동 2',
      zonecode: '03000',
    },
    dealType: 'JEONSE',
    deposit: 22000,
    area: 18,
    photoIds: [],
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  },
] as any[];

function mockHouses() {
  (housesRepo.listActive as jest.Mock).mockResolvedValue(houses);
  (housesApi.list as jest.Mock).mockRejectedValue(new Error('offline'));
}

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
  it('renders the storage list with every recorded house sorted by recent first', async () => {
    mockHouses();

    const nav = { navigate: jest.fn(), getParent: jest.fn() } as any;
    const { findByText, findByTestId } = render(
      wrap(<HouseListScreen navigation={nav} route={{} as any} />),
    );

    expect(await findByText('보관함')).toBeTruthy();
    expect(await findByText('전체 기록 2')).toBeTruthy();
    expect(await findByTestId('house-list-row-h1')).toBeTruthy();
    expect(await findByTestId('house-list-row-h2')).toBeTruthy();
  });

  it('keeps houses without coordinates in storage and marks them clearly', async () => {
    mockHouses();

    const nav = { navigate: jest.fn(), getParent: jest.fn() } as any;
    const { findByText } = render(wrap(<HouseListScreen navigation={nav} route={{} as any} />));

    expect(await findByText('서울시 종로구 창신동 2')).toBeTruthy();
    expect(await findByText('지도 위치 없음')).toBeTruthy();
  });

  it('opens the detail screen when a storage row is selected', async () => {
    mockHouses();

    const nav = { navigate: jest.fn(), getParent: jest.fn() } as any;
    const { findByTestId } = render(wrap(<HouseListScreen navigation={nav} route={{} as any} />));

    fireEvent.press(await findByTestId('house-list-row-h1'));
    expect(nav.navigate).toHaveBeenCalledWith('HouseDetail', { houseId: 'h1' });
  });
});
