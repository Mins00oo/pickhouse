import type { ReactNode } from 'react';
import * as fs from 'fs';
import * as path from 'path';
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

const nearbySecondHouse: House = {
  ...nearbyHouse,
  id: 'near-2',
  address: {
    ...nearbyHouse.address,
    latitude: 37.557,
    longitude: 126.902,
    detail: 'near second house',
  },
  deposit: 1500,
  rent: 65,
  createdAt: '2026-05-17T00:00:00.000Z',
  updatedAt: '2026-05-17T00:00:00.000Z',
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
  const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
  __naverMapMock.coordinateToScreen.mockImplementation(async ({ latitude, longitude }: any) => ({
    isValid: true,
    screenX: Math.round((longitude - 126.82) * 1500),
    screenY: Math.round((37.63 - latitude) * 1500),
  }));
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
  it('shows sample houses on the home map when the account has no records', async () => {
    const { findByText, getByPlaceholderText, getByTestId, queryByText } = renderHome([]);

    expect(getByTestId('house-map-view')).toBeTruthy();
    expect(getByPlaceholderText('장소, 지명, 집 이름 검색')).toBeTruthy();
    expect(await findByText('청파동 빌라')).toBeTruthy();
    expect(await findByText('이 근처 내 집')).toBeTruthy();
    expect(await findByText('7')).toBeTruthy();
    expect(getByTestId('home-house-marker-sample-1')).toBeTruthy();
    expect(queryByText('아직 기록한 집이 없어요')).toBeNull();
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

  it('does not automatically move to current location while showing sample houses', async () => {
    const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
    const { findByText } = renderHome([]);

    await findByText('청파동 빌라');
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());

    expect(__naverMapMock.animateCameraTo).not.toHaveBeenCalled();
  });

  it('moves to current location from sample mode only when the location button is pressed', async () => {
    const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
    const { findByText, getByTestId } = renderHome([]);

    await findByText('청파동 빌라');
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
    fireEvent.press(getByTestId('home-current-location-button'));

    expect(__naverMapMock.animateCameraTo).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 37.5563, longitude: 126.9236 }),
    );
  });

  it('uses a calmer basic map tone and removes unused map/search icons', async () => {
    const { findByText, getByTestId, queryByText } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');

    expect(getByTestId('house-map-view').props.mapType).toBe('Basic');
    expect(getByTestId('house-map-view').props.lightness).toBe(0.06);
    expect(getByTestId('house-map-view').props.symbolScale).toBe(0.86);
    expect(getByTestId('house-map-view').props.buildingHeight).toBe(0.35);
    expect(queryByText('menu-outline')).toBeNull();
    expect(queryByText('layers-outline')).toBeNull();
  });

  it('renders a custom current location marker instead of the native location overlay', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    await waitFor(() => expect(getByTestId('home-current-location-marker')).toBeTruthy());

    expect(getByTestId('house-map-view').props.locationOverlay).toBeUndefined();
  });

  it('renders the selected marker as a custom price balloon and icon-only markers for the rest', async () => {
    const { findByText, getByTestId, queryByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');

    await waitFor(() => expect(getByTestId('home-house-marker-near')).toBeTruthy());
    expect(queryByTestId('home-map-overlay-layer')).toBeNull();
    expect(getByTestId('home-house-marker-near').props.latitude).toBe(37.556);
    expect(getByTestId('home-house-marker-near').props.longitude).toBe(126.901);
    expect(getByTestId('home-house-marker-near').props.width).toBe(148);
    expect(getByTestId('home-house-marker-near').props.height).toBe(34);
    // 선택 마커: 알약 배경은 커스텀 RN 뷰, 가격 텍스트는 네이티브 caption(중앙 정렬)으로 그린다.
    expect(getByTestId('home-house-marker-near').props.caption).toEqual(
      expect.objectContaining({ text: expect.stringContaining('1,000 / 50'), align: 'Center' }),
    );
    expect(getByTestId('home-house-marker-near').props.subCaption).toBeUndefined();
    expect(queryByTestId('home-house-marker-price-near')).toBeNull();

    expect(getByTestId('home-house-marker-outside')).toBeTruthy();
    expect(getByTestId('home-house-marker-outside').props.width).toBe(36);
    expect(getByTestId('home-house-marker-outside').props.height).toBe(36);
    expect(getByTestId('home-house-marker-outside').props.caption).toBeUndefined();
    expect(getByTestId('home-house-marker-outside').props.subCaption).toBeUndefined();
    expect(queryByTestId('home-house-marker-price-outside')).toBeNull();
  });

  it('keeps house markers attached to native coordinates without screen projection', async () => {
    const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
    __naverMapMock.coordinateToScreen.mockClear();
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');

    expect(getByTestId('home-house-marker-near').props.latitude).toBe(37.556);
    expect(getByTestId('home-house-marker-near').props.longitude).toBe(126.901);
    expect(__naverMapMock.coordinateToScreen).not.toHaveBeenCalled();
  });

  it('does not recalculate screen marker positions when the camera changes', async () => {
    jest.useFakeTimers();
    const { __naverMapMock } = jest.requireMock('@mj-studio/react-native-naver-map');
    __naverMapMock.coordinateToScreen.mockClear();
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');

    fireEvent(getByTestId('house-map-view'), 'onCameraChanged', {
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
      jest.advanceTimersByTime(80);
    });

    expect(__naverMapMock.coordinateToScreen).not.toHaveBeenCalled();
    expect(getByTestId('home-house-marker-near').props.style).toBeUndefined();
  });

  it('shows an icon count cluster without the word 매물 when zoomed out', async () => {
    const { findByText, getByTestId, queryByText } = renderHome([nearbyHouse, nearbySecondHouse]);

    await findByText('망원 소형집');
    fireEvent(getByTestId('house-map-view'), 'onCameraIdle', {
      latitude: 37.556,
      longitude: 126.901,
      zoom: 11,
      region: {
        latitude: 37.546,
        longitude: 126.891,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      },
    });

    expect(getByTestId('home-house-cluster-near-near-2')).toBeTruthy();
    expect(getByTestId('home-house-cluster-near-near-2').props.caption).toEqual(
      expect.objectContaining({ text: '2', align: 'Center' }),
    );
    expect(getByTestId('home-house-cluster-near-near-2').props.subCaption).toBeUndefined();
    expect(queryByText('매물')).toBeNull();
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

  it('opens the house input flow from the home add button', async () => {
    const { findByText, getByTestId, nav } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-add-house-button'));

    expect(nav.navigate).toHaveBeenCalledWith('HouseInput', undefined);
  });

  it('switches from map mode to an opaque full-screen list mode and back', async () => {
    const { findByText, getByText, getByTestId, queryByTestId, queryByText } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    expect(queryByText('목록 보기')).toBeNull();
    expect(queryByText('지도 보기')).toBeNull();
    fireEvent.press(getByText('목록'));

    expect(queryByTestId('home-map-overlay-layer')).toBeNull();
    expect(getByTestId('home-full-list-mode')).toHaveStyle({ backgroundColor: '#FFFFFF' });
    expect(getByTestId('home-full-list-row-near')).toBeTruthy();
    expect(getByTestId('home-full-list-row-outside')).toBeTruthy();
    expect(queryByTestId('home-result-sheet')).toBeNull();
    expect(queryByTestId('home-house-carousel')).toBeNull();
    expect(queryByTestId('home-current-location-button')).toBeNull();
    expect(getByText('지도')).toBeTruthy();

    fireEvent.press(getByText('지도'));

    expect(queryByTestId('home-full-list-mode')).toBeNull();
    expect(getByTestId('home-result-sheet')).toBeTruthy();
    expect(getByTestId('home-house-carousel')).toBeTruthy();
  });

  it('shows the card sheet (not the full list) in map mode', async () => {
    const { findByText, getByTestId, queryByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    // 시트 드래그/스냅 동작은 @gorhom/bottom-sheet 가 담당하므로 구조만 검증한다
    expect(getByTestId('home-result-sheet')).toBeTruthy();
    expect(getByTestId('home-house-carousel')).toBeTruthy();
    expect(getByTestId('home-list-toggle')).toBeTruthy();
    expect(queryByTestId('home-full-list-mode')).toBeNull();
  });

  it('shares search query between the map header and full list mode header', async () => {
    const { findByText, getByPlaceholderText, getByText, queryByText } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.changeText(getByPlaceholderText('장소, 지명, 집 이름 검색'), '역삼');
    fireEvent.press(getByText('목록'));

    expect(getByPlaceholderText('장소, 지명, 집 이름 검색').props.value).toBe('역삼');
    expect(await findByText('역삼 오피스텔')).toBeTruthy();
    expect(queryByText('망원 소형집')).toBeNull();
  });

  it('ships scaled native marker assets so map pins stay sharp on retina screens', () => {
    const markerRoot = path.join(process.cwd(), 'assets', 'map-markers');
    const markerNames = ['marker-house', 'marker-cluster', 'marker-current-location', 'marker-price-selected'];

    markerNames.forEach((name) => {
      expect(fs.existsSync(path.join(markerRoot, `${name}.png`))).toBe(true);
      expect(fs.existsSync(path.join(markerRoot, `${name}@2x.png`))).toBe(true);
      expect(fs.existsSync(path.join(markerRoot, `${name}@3x.png`))).toBe(true);
    });
  });

  it('sorts current home results from the visible sort menu', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-sort-button'));
    fireEvent.press(getByTestId('home-sort-price-asc'));

    fireEvent(getByTestId('home-house-carousel'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 0 } },
    });

    expect(getByTestId('home-house-card-near')).toHaveStyle({ borderColor: '#0E1A14' });
    expect(getByTestId('home-sort-label')).toHaveTextContent('가격 낮은 순');
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

    expect(await findByText('1개 집 보기')).toBeTruthy();
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

    expect(await findByText('2개 집 보기')).toBeTruthy();
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

    expect(await findByText('1개 집 보기')).toBeTruthy();
    fireEvent.press(getByTestId('filter-apply-button'));

    expect(await findByText('망원 소형집')).toBeTruthy();
    await waitFor(() => expect(queryByText('역삼 오피스텔')).toBeNull());
  });

  it('hides monthly rent range and excludes it from the badge when jeonse is selected', async () => {
    const { findByText, getByTestId, queryByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));
    fireEvent.press(getByTestId('filter-deal-jeonse'));

    expect(queryByTestId('filter-rent-section')).toBeNull();
    fireEvent.press(getByTestId('filter-apply-button'));

    await waitFor(() => expect(getByTestId('home-filter-badge')).toHaveTextContent('1'));
  });

  it('locks filter body scroll while a range thumb is being dragged', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse, outsideHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));

    expect(getByTestId('filter-body').props.scrollEnabled).toBe(true);
    fireEvent(getByTestId('filter-deposit-range'), 'responderGrant', {
      nativeEvent: { locationX: 10 },
    });

    expect(getByTestId('filter-body').props.scrollEnabled).toBe(false);
    fireEvent(getByTestId('filter-deposit-range'), 'responderRelease');

    expect(getByTestId('filter-body').props.scrollEnabled).toBe(true);
  });

  it('snaps the filter sheet between heights when the header is dragged', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));
    expect(await findByText('필터')).toBeTruthy();

    expect(getByTestId('filter-sheet')).toHaveStyle({ height: 520 });
    fireEvent(getByTestId('filter-sheet-drag-zone'), 'responderGrant', {
      nativeEvent: { pageY: 500 },
    });
    fireEvent(getByTestId('filter-sheet-drag-zone'), 'responderMove', {
      nativeEvent: { pageY: 340 },
    });
    expect(getByTestId('filter-sheet')).toHaveStyle({ height: 680 });
    fireEvent(getByTestId('filter-sheet-drag-zone'), 'responderRelease', {
      nativeEvent: { pageY: 340 },
    });

    expect(getByTestId('filter-sheet')).toHaveStyle({ height: 700 });
  });

  it('does not close the filter sheet from content scrolling', async () => {
    const { findByText, getByTestId } = renderHome([nearbyHouse]);

    await findByText('망원 소형집');
    fireEvent.press(getByTestId('home-filter-button'));
    expect(await findByText('필터')).toBeTruthy();

    fireEvent.scroll(getByTestId('filter-body'), {
      nativeEvent: { contentOffset: { y: 180 } },
    });

    expect(getByTestId('filter-sheet')).toBeTruthy();
  });

  it('closes the filter sheet when the drag handle is pulled down far enough', async () => {
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
