import type { ReactNode } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { housesApi } from '@/api/houses.api';
import { housesRepo } from '@/db/houses.repo';
import { useAuthStore } from '@/stores/authStore';
import type { House } from '@/types';
import { HomeMapScreen } from '../HomeMapScreen';

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

const nearbyHouse: House = {
  id: 'near',
  address: {
    roadAddress: '서울시 마포구 망원로 1',
    jibunAddress: '망원동 1',
    zonecode: '04000',
    latitude: 37.556,
    longitude: 126.901,
    detail: '망원 소형집',
  },
  dealType: 'WOLSE',
  deposit: 1000,
  rent: 50,
  area: 12,
  rooms: 1,
  floor: 3,
  totalFloor: 5,
  firstImpression: 5,
  sunlight: 5,
  waterPressure: 4,
  photoIds: [],
  createdAt: '2026-05-16T00:00:00.000Z',
  updatedAt: '2026-05-16T00:00:00.000Z',
};

const outsideHouse: House = {
  id: 'outside',
  address: {
    roadAddress: '서울시 강남구 역삼로 2',
    jibunAddress: '역삼동 2',
    zonecode: '06000',
    latitude: 37.501,
    longitude: 127.039,
    detail: '역삼 오피스텔',
  },
  dealType: 'JEONSE',
  deposit: 22000,
  area: 18,
  rooms: 2,
  photoIds: [],
  createdAt: '2026-05-15T00:00:00.000Z',
  updatedAt: '2026-05-15T00:00:00.000Z',
};

function mockHouses(houses: House[]) {
  (housesRepo.listActive as jest.Mock).mockResolvedValue(houses);
  (housesApi.list as jest.Mock).mockRejectedValue(new Error('offline'));
}

function renderHome(houses: House[]) {
  mockHouses(houses);
  const nav = { navigate: jest.fn(), getParent: jest.fn() } as any;
  const screen = render(wrap(<HomeMapScreen navigation={nav} route={{} as any} />));
  return { nav, ...screen };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
    coords: { latitude: 37.5563, longitude: 126.9236 },
  });
});

afterEach(() => {
  jest.useRealTimers();
  queryClient?.clear();
  queryClient = null;
});

describe('HomeMapScreen', () => {
  it('shows design sample houses when the account has no records', async () => {
    const { findByText, getByPlaceholderText, getByTestId } = renderHome([]);

    expect(getByTestId('house-map-view')).toBeTruthy();
    expect(getByPlaceholderText('장소, 지명, 집 이름 검색')).toBeTruthy();
    expect(await findByText('청파동 빌라')).toBeTruthy();
    expect(await findByText('이 근처 내 집')).toBeTruthy();
  });

  it('does not mix sample houses when real records exist', async () => {
    const { findByText, queryByText } = renderHome([nearbyHouse]);

    expect(await findByText('망원 소형집')).toBeTruthy();
    expect(queryByText('청파동 빌라')).toBeNull();
  });

  it('lets the native map keep gesture control by using initialCamera instead of a controlled camera prop', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');

    expect(getByTestId('house-map-view').props.initialCamera).toEqual(
      expect.objectContaining({ latitude: 37.5563, longitude: 126.9236, zoom: 14 }),
    );
    expect(getByTestId('house-map-view').props.camera).toBeUndefined();
  });

  it('does not recenter the map when camera idle reports a zoom gesture', async () => {
    jest.useFakeTimers();
    const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
    const { findByText, getByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
    __naverMapMock.animateCameraTo.mockClear();

    fireEvent(getByTestId('house-map-view'), 'onCameraIdle', {
      latitude: 37.556,
      longitude: 126.901,
      zoom: 16,
      region: {
        latitude: 37.546,
        longitude: 126.891,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(__naverMapMock.animateCameraTo).not.toHaveBeenCalled();
    expect(getByTestId('house-map-view').props.camera).toBeUndefined();
  });

  it('rebuilds the carousel from houses inside the current map viewport after camera idle', async () => {
    jest.useFakeTimers();
    const { findByText, getByTestId, queryByText } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    expect(await findByText('역삼 오피스텔')).toBeTruthy();

    fireEvent(getByTestId('house-map-view'), 'onCameraIdle', {
      latitude: 37.556,
      longitude: 126.901,
      zoom: 14,
      region: {
        latitude: 37.546,
        longitude: 126.891,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => expect(queryByText('역삼 오피스텔')).toBeNull());
    expect(await findByText('망원 소형집')).toBeTruthy();
  });

  it('moves the native map camera when the current location button is pressed', async () => {
    const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
    __naverMapMock.animateCameraTo.mockClear();

    fireEvent.press(getByTestId('home-current-location-button'));

    expect(__naverMapMock.animateCameraTo).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 37.5563, longitude: 126.9236 }),
    );
  });

  it('renders price marker text through native map captions', async () => {
    const { findByText, getByTestId, queryByTestId, queryByText } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');

    expect(getByTestId('home-price-marker-near').props.collapsable).toBe(false);
    expect(queryByTestId('home-price-marker-badge-near')).toBeNull();
    expect(queryByText('1000/50')).toBeNull();
    expect(getByTestId('home-house-marker-near').props.caption).toEqual(
      expect.objectContaining({ text: '월 1000/50', color: '#FFFFFF', align: 'Center' }),
    );
    expect(getByTestId('home-house-marker-outside').props.caption).toEqual(
      expect.objectContaining({ text: '전 2.2억', color: '#0E1A14', align: 'Center' }),
    );
  });

  it('moves the active card border when the carousel settles on another house', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    expect(getByTestId('home-house-card-near')).toHaveStyle({ borderColor: '#0E1A14' });
    expect(getByTestId('home-house-card-outside')).toHaveStyle({ borderColor: '#EFEDE5' });

    fireEvent(getByTestId('home-house-carousel'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 330 } },
    });

    expect(getByTestId('home-house-card-near')).toHaveStyle({ borderColor: '#EFEDE5' });
    expect(getByTestId('home-house-card-outside')).toHaveStyle({ borderColor: '#0E1A14' });
  });

  it('selects the matching card when a map marker is tapped', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-house-marker-outside'));

    expect(getByTestId('home-house-card-near')).toHaveStyle({ borderColor: '#EFEDE5' });
    expect(getByTestId('home-house-card-outside')).toHaveStyle({ borderColor: '#0E1A14' });
  });

  it('opens the filter sheet from the top filter button', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));

    expect(await findByText('필터')).toBeTruthy();
    expect(await findByText('거래 유형')).toBeTruthy();
  });

  it('applies a deal type filter from the filter sheet', async () => {
    const { findByText, getByTestId, queryByText } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));

    fireEvent.press(getByTestId('filter-deal-jeonse'));

    expect(await findByText('1개 매물 보기')).toBeTruthy();
    fireEvent.press(getByTestId('filter-apply-button'));

    await waitFor(() => expect(queryByText('망원 소형집')).toBeNull());
    expect(await findByText('역삼 오피스텔')).toBeTruthy();
    expect(getByTestId('home-filter-badge')).toHaveTextContent('1');
  });

  it('resets applied filters and clears the filter badge', async () => {
    const { findByText, getByTestId, queryByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));
    fireEvent.press(getByTestId('filter-deal-jeonse'));
    fireEvent.press(getByTestId('filter-apply-button'));

    await waitFor(() => expect(getByTestId('home-filter-badge')).toHaveTextContent('1'));
    fireEvent.press(getByTestId('home-filter-button'));
    fireEvent.press(getByTestId('filter-reset-button'));

    expect(await findByText('2개 매물 보기')).toBeTruthy();
    fireEvent.press(getByTestId('filter-apply-button'));

    expect(await findByText('망원 소형집')).toBeTruthy();
    expect(await findByText('역삼 오피스텔')).toBeTruthy();
    expect(queryByTestId('home-filter-badge')).toBeNull();
  });

  it('updates filter results from area chips before applying', async () => {
    const { findByText, getByTestId, queryByText } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));
    fireEvent.press(getByTestId('filter-area-up-to-15'));

    expect(await findByText('1개 매물 보기')).toBeTruthy();
    fireEvent.press(getByTestId('filter-apply-button'));

    expect(await findByText('망원 소형집')).toBeTruthy();
    await waitFor(() => expect(queryByText('역삼 오피스텔')).toBeNull());
  });

  it('closes the filter sheet when the drag handle is pulled down', async () => {
    const { findByText, getByTestId, queryByText } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));
    expect(await findByText('필터')).toBeTruthy();

    fireEvent(getByTestId('filter-sheet-drag-zone'), 'responderGrant', {
      nativeEvent: { pageY: 100 },
    });
    fireEvent(getByTestId('filter-sheet-drag-zone'), 'responderRelease', {
      nativeEvent: { pageY: 230 },
    });

    await waitFor(() => expect(queryByText('필터')).toBeNull());
  });
});
