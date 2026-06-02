import {
  type ComponentProps,
  type ComponentRef,
  type ComponentType,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NaverMapMarkerOverlay, NaverMapView, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseStackParamList, MainTabParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { useAnchorPlaces } from '@/queries/anchorPlaces.queries';
import { useHouseCommute, type PrimaryAnchors } from '@/queries/anchorDistances.queries';
import { SAMPLE_HOUSES } from '@/screens/houses/houseSampleData';
import {
  DEFAULT_MAP_CENTER,
  deriveCommuteMode,
  filterHousesByKeyword,
  filterHousesByRegion,
  formatHousePrice,
  formatHousePriceShort,
  getDealTypeLabel,
  getHouseCoordinate,
  getHouseMeta,
  getHouseSubtitle,
  getHouseTitle,
  pickPrimaryAnchors,
  type MapCoordinate,
  type MapRegion,
} from '@/screens/houses/houseMapUtils';
import { conditionColor, radii, spacing, typography } from '@/theme';
import { House } from '@/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Map'>;
type CameraIdleParams = {
  latitude: number;
  longitude: number;
  zoom?: number;
  region: MapRegion;
};

type DealFilter = 'ALL' | 'WOLSE' | 'JEONSE';
type AreaBucket = 'UP_TO_5' | 'UP_TO_10' | 'UP_TO_15' | 'UP_TO_20' | 'OVER_20';
type RoomBucket = 'STUDIO' | 'ONE_HALF' | 'TWO' | 'THREE_PLUS';
type NumericRange = { min: number; max: number };
type HomeViewMode = 'MAP' | 'LIST';
type HomeSortMode = 'RECENT' | 'DISTANCE' | 'PRICE_ASC';
type FilterSheetSnap = 'PEEK' | 'HALF' | 'FULL';
type HomeMarkerItem =
  | { type: 'house'; house: House; coordinate: MapCoordinate }
  | {
      type: 'cluster';
      id: string;
      coordinate: MapCoordinate;
      count: number;
      houseIds: string[];
      representativeHouseId: string;
    };
type HomeFilterState = {
  dealType: DealFilter;
  deposit: NumericRange;
  rent: NumericRange;
  areaBuckets: AreaBucket[];
  roomBuckets: RoomBucket[];
};

const CAMERA_IDLE_DEBOUNCE_MS = 1200;
const MAP_INITIAL_ZOOM = 14;
const CARD_WIDTH = 320;
const CARD_GAP = 10;
const CARD_SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const INDIVIDUAL_MARKER_MIN_ZOOM = 13;
// 야놀자식 물방울 핀(coral) + 선택 시 가격 알약. 모두 RN 도형 children 으로 그려
// iOS New Arch 의 텍스트 글리프 캡처 누락 문제를 피하고, 가격/카운트 텍스트만 네이티브 caption 으로 얹는다.
const PIN_WIDTH = 34; // 물방울 핀 너비
const PIN_HEIGHT = 44; // 물방울 핀 높이(꼬리 포함)
const CLUSTER_MARKER_SIZE = 46;
const SELECTED_CALLOUT_HEIGHT = 50;
const CALLOUT_TEXT_LEFT = 42; // 아이콘박스(좌10 + 24) + 간격8 → 좌우 여백 균형
const CURRENT_LOCATION_MARKER_SIZE = 44;

// 선택 콜아웃 너비 — 아이콘 + 좌측정렬 2줄(가격 줄 기준)에 딱 맞게(야놀자식). 좌10/우12 대칭 여백. 클램프.
function calloutWidth(priceText: string): number {
  const textW = Math.max(Math.round(priceText.length * 7.2), 28);
  return Math.min(Math.max(CALLOUT_TEXT_LEFT + textW + 12, 92), 184);
}
type TestableMarkerProps = ComponentProps<typeof NaverMapMarkerOverlay> & { testID?: string };
const TestableNaverMapMarkerOverlay = NaverMapMarkerOverlay as ComponentType<TestableMarkerProps>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CURRENT_LOCATION_MARKER_IMAGE = require('../../../assets/map-markers/marker-current-location.png');

// Phase 2 스캐폴드: 네이버 커스텀 지도 스타일. 값이 있을 때만 적용한다.
// customStyleId 는 네이티브에 연결되므로 최초 활성화 시 EAS 재빌드가 한 번 필요하다.
const NAVER_MAP_STYLE_ID = process.env.EXPO_PUBLIC_NAVER_MAP_STYLE_ID ?? '';
const SAMPLE_MAP_CENTER = getAverageCoordinate(SAMPLE_HOUSES) ?? DEFAULT_MAP_CENTER;
const INITIAL_CAMERA = {
  latitude: DEFAULT_MAP_CENTER.latitude,
  longitude: DEFAULT_MAP_CENTER.longitude,
  zoom: MAP_INITIAL_ZOOM,
};
const SAMPLE_INITIAL_CAMERA = {
  latitude: SAMPLE_MAP_CENTER.latitude,
  longitude: SAMPLE_MAP_CENTER.longitude,
  zoom: MAP_INITIAL_ZOOM,
};
const FILTER_SNAP_HEIGHTS: Record<FilterSheetSnap, number> = {
  PEEK: 320,
  HALF: 520,
  FULL: 700,
};
// 결과 시트는 드래그 없이 한 장의 카드 + 헤더가 딱 맞게 보이는 고정 높이로 둔다.
// 실제 높이는 기기 하단 인셋(홈 인디케이터)을 더해 카드가 가리지 않도록 한다.
const SHEET_BASE_HEIGHT = 242;
const DEPOSIT_LIMITS: NumericRange = { min: 0, max: 30000 };
const RENT_LIMITS: NumericRange = { min: 0, max: 150 };
const DEFAULT_HOME_FILTER: HomeFilterState = {
  dealType: 'ALL',
  deposit: DEPOSIT_LIMITS,
  rent: RENT_LIMITS,
  areaBuckets: [],
  roomBuckets: [],
};
const AREA_OPTIONS: { key: AreaBucket; label: string; testID: string }[] = [
  { key: 'UP_TO_5', label: '~5평', testID: 'filter-area-up-to-5' },
  { key: 'UP_TO_10', label: '~10평', testID: 'filter-area-up-to-10' },
  { key: 'UP_TO_15', label: '~15평', testID: 'filter-area-up-to-15' },
  { key: 'UP_TO_20', label: '~20평', testID: 'filter-area-up-to-20' },
  { key: 'OVER_20', label: '20평~', testID: 'filter-area-over-20' },
];
const ROOM_OPTIONS: { key: RoomBucket; label: string; testID: string }[] = [
  { key: 'STUDIO', label: '원룸', testID: 'filter-room-studio' },
  { key: 'ONE_HALF', label: '1.5룸', testID: 'filter-room-one-half' },
  { key: 'TWO', label: '투룸', testID: 'filter-room-two' },
  { key: 'THREE_PLUS', label: '쓰리룸+', testID: 'filter-room-three-plus' },
];
const SORT_OPTIONS: { key: HomeSortMode; label: string; testID: string }[] = [
  { key: 'RECENT', label: '최근 본 순', testID: 'home-sort-recent' },
  { key: 'DISTANCE', label: '가까운 순', testID: 'home-sort-distance' },
  { key: 'PRICE_ASC', label: '가격 낮은 순', testID: 'home-sort-price-asc' },
];

export function HomeMapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NaverMapViewRef>(null);
  const cameraIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCenteredOnUser = useRef(false);
  const { data = [] } = useHouses();
  const isSampleMode = data.length === 0;
  const houses = isSampleMode ? SAMPLE_HOUSES : data;
  const [query, setQuery] = useState('');
  const [activeHouseId, setActiveHouseId] = useState<string | null>(null);
  const [viewportRegion, setViewportRegion] = useState<MapRegion | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState(MAP_INITIAL_ZOOM);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [homeFilter, setHomeFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  const [viewMode, setViewMode] = useState<HomeViewMode>('MAP');
  const [mapType, setMapType] = useState<'Basic' | 'Satellite'>('Basic');
  const sheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const [sortMode, setSortMode] = useState<HomeSortMode>('RECENT');
  const [sortOpen, setSortOpen] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const { data: anchorPlaces = [] } = useAnchorPlaces();
  const primaryAnchors = useMemo(() => pickPrimaryAnchors(anchorPlaces), [anchorPlaces]);
  const commuteMode = useMemo(() => deriveCommuteMode(anchorPlaces), [anchorPlaces]);

  const baseVisibleHouses = useMemo(() => {
    const inViewport = filterHousesByRegion(houses, viewportRegion);
    return filterHousesByKeyword(inViewport, query);
  }, [houses, query, viewportRegion]);

  const visibleHouses = useMemo(
    () => sortHomeHouses(filterHousesByHomeFilter(baseVisibleHouses, homeFilter), sortMode, userLocation),
    [baseVisibleHouses, homeFilter, sortMode, userLocation],
  );

  const activeHouse = useMemo(() => {
    const selected = visibleHouses.find((house) => house.id === activeHouseId);
    return selected ?? visibleHouses[0] ?? null;
  }, [activeHouseId, visibleHouses]);

  const activeFilterCount = useMemo(() => countActiveFilters(homeFilter), [homeFilter]);

  const markerItems = useMemo(
    () => buildHomeMarkerItems(visibleHouses, activeHouse?.id ?? null, mapZoomLevel),
    [activeHouse?.id, mapZoomLevel, visibleHouses],
  );

  useEffect(() => {
    let mounted = true;

    async function requestLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          if (mounted) setLocationMessage('현재 위치 권한이 꺼져 있어요');
          return;
        }

        const current = await Location.getCurrentPositionAsync();
        if (!mounted) return;

        const coordinate = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setUserLocation(coordinate);
        setLocationMessage(null);
      } catch {
        if (mounted) setLocationMessage('현재 위치를 불러오지 못했어요');
      }
    }

    requestLocation();

    return () => {
      mounted = false;
      if (cameraIdleTimer.current) clearTimeout(cameraIdleTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isSampleMode || !userLocation || hasCenteredOnUser.current) return;
    hasCenteredOnUser.current = true;
    mapRef.current?.animateCameraTo({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      zoom: 15,
      duration: 500,
    });
  }, [isSampleMode, userLocation]);

  const handleCameraIdle = useCallback((params: CameraIdleParams) => {
    setMapZoomLevel((current) => params.zoom ?? current);
    if (cameraIdleTimer.current) clearTimeout(cameraIdleTimer.current);
    cameraIdleTimer.current = setTimeout(() => {
      setViewportRegion(params.region);
    }, CAMERA_IDLE_DEBOUNCE_MS);
  }, []);

  const handleCameraChanged = useCallback((params: CameraIdleParams) => {
    setMapZoomLevel((current) => params.zoom ?? current);
  }, []);

  const handleCurrentLocationPress = () => {
    if (!userLocation) {
      setLocationMessage('현재 위치 권한이 꺼져 있어요');
      return;
    }

    mapRef.current?.animateCameraTo({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      zoom: 15,
      duration: 500,
    });
  };

  const handleClusterPress = (cluster: Extract<HomeMarkerItem, { type: 'cluster' }>) => {
    setActiveHouseId(cluster.representativeHouseId);
    mapRef.current?.animateCameraTo({
      latitude: cluster.coordinate.latitude,
      longitude: cluster.coordinate.longitude,
      zoom: Math.max(mapZoomLevel + 2, INDIVIDUAL_MARKER_MIN_ZOOM),
      duration: 320,
    });
  };

  const openHouseDetail = (houseId: string) => {
    const rootNavigation =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    rootNavigation.navigate('HouseDetail', { houseId });
  };

  const openHouseInput = () => {
    const rootNavigation =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    rootNavigation.navigate('HouseInput', undefined);
  };

  const openPlaces = () => {
    const rootNavigation =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    rootNavigation.navigate('Places');
  };

  const handleSelectHouseFromMarker = useCallback((houseId: string) => {
    // 시트는 고정 높이라 스냅 이동이 필요 없다. 캐러셀이 선택된 카드로 자동 스크롤한다.
    setActiveHouseId(houseId);
  }, []);

  const toggleHomeViewMode = () => {
    if (viewMode === 'MAP') {
      setViewMode('LIST');
      return;
    }

    setViewMode('MAP');
    sheetRef.current?.snapToIndex(0);
  };

  const sheetFixedHeight = SHEET_BASE_HEIGHT + insets.bottom + (commuteMode === 'none' ? 52 : 0);
  const peekSheetHeight = sheetFixedHeight;
  const mapFloatingBottom = peekSheetHeight + 14;
  const listToggleBottom = viewMode === 'MAP' ? peekSheetHeight + 14 : 16 + insets.bottom;
  const logoBottomMargin = Math.max(peekSheetHeight - 4, 0);

  return (
    <View style={styles.root}>
      <NaverMapView
        ref={mapRef}
        testID="house-map-view"
        style={StyleSheet.absoluteFill}
        initialCamera={isSampleMode ? SAMPLE_INITIAL_CAMERA : INITIAL_CAMERA}
        animationDuration={260}
        mapType={mapType}
        {...(NAVER_MAP_STYLE_ID
          ? {
              customStyleId: NAVER_MAP_STYLE_ID,
              onCustomStyleLoadFailed: ({ message }: { message: string }) => {
                // 스타일 로드 실패 시 기본 지도로 자연스럽게 폴백한다.
                console.warn('Naver custom map style load failed', message);
              },
            }
          : null)}
        lightness={0.06}
        symbolScale={0.86}
        buildingHeight={0.35}
        isShowCompass={false}
        isShowLocationButton={false}
        isShowScaleBar={false}
        isShowZoomControls={false}
        logoAlign="BottomLeft"
        logoMargin={{ bottom: logoBottomMargin, left: 14 }}
        locale="ko"
        onTapMap={() => Keyboard.dismiss()}
        onCameraChanged={handleCameraChanged}
        onCameraIdle={handleCameraIdle}
      >
        <HomeNativeMarkers
          markerItems={markerItems}
          selectedHouseId={activeHouse?.id ?? null}
          userLocation={userLocation}
          onSelectHouse={handleSelectHouseFromMarker}
          onSelectCluster={handleClusterPress}
        />
      </NaverMapView>

      {viewMode === 'MAP' ? (
        <View testID="home-top-overlay" pointerEvents="box-none" style={[styles.topOverlay, { top: insets.top + 5 }]}>
          <HomeSearchFilterBar
            query={query}
            activeFilterCount={activeFilterCount}
            onQueryChange={setQuery}
            onFilterPress={() => setFilterOpen(true)}
          />
        </View>
      ) : null}

      {viewMode === 'MAP' && locationMessage ? (
        <View style={[styles.locationBanner, { top: insets.top + 64 }]}>
          <Text style={styles.locationBannerText}>{locationMessage}</Text>
        </View>
      ) : null}

      {viewMode === 'MAP' ? (
        <View pointerEvents="box-none" style={[styles.mapTools, { bottom: mapFloatingBottom }]}>
          <Pressable
            testID="home-layers-button"
            accessibilityRole="button"
            accessibilityLabel="지도 종류 전환"
            onPress={() => setMapType((current) => (current === 'Basic' ? 'Satellite' : 'Basic'))}
            style={styles.mapToolButton}
          >
            <Ionicons name="layers-outline" size={18} color={homeColors.ink70} />
          </Pressable>
          <Pressable
            testID="home-current-location-button"
            accessibilityRole="button"
            accessibilityLabel="현재 위치로 이동"
            onPress={handleCurrentLocationPress}
            style={styles.mapToolButton}
          >
            <Ionicons name="navigate-outline" size={18} color={homeColors.ink70} />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        testID="home-list-toggle"
        accessibilityRole="button"
        onPress={toggleHomeViewMode}
        style={[styles.listToggle, viewMode === 'LIST' && styles.listToggleOnList, { bottom: listToggleBottom }]}
      >
        <Ionicons name={viewMode === 'MAP' ? 'list' : 'map-outline'} size={16} color={homeColors.ink} />
        <Text style={styles.listToggleText}>{viewMode === 'MAP' ? '목록' : '지도'}</Text>
      </Pressable>

      {viewMode === 'MAP' ? (
        <HomeCarousel
          houses={visibleHouses}
          hasAnyHouses={houses.length > 0}
          selectedHouseId={activeHouse?.id ?? null}
          sortMode={sortMode}
          sortOpen={sortOpen}
          sheetRef={sheetRef}
          sheetHeight={sheetFixedHeight}
          bottomInset={insets.bottom}
          primaryAnchors={primaryAnchors}
          commuteMode={commuteMode}
          onRegisterAnchor={openPlaces}
          onSelectHouse={setActiveHouseId}
          onOpenHouse={openHouseDetail}
          onCreateHouse={openHouseInput}
          onSortOpenChange={setSortOpen}
          onSortChange={(nextSortMode) => {
            setSortMode(nextSortMode);
            setSortOpen(false);
          }}
        />
      ) : null}

      {viewMode === 'LIST' ? (
        <HomeFullListMode
          houses={visibleHouses}
          hasAnyHouses={houses.length > 0}
          selectedHouseId={activeHouse?.id ?? null}
          query={query}
          activeFilterCount={activeFilterCount}
          sortMode={sortMode}
          sortOpen={sortOpen}
          topInset={insets.top}
          onQueryChange={setQuery}
          onFilterPress={() => setFilterOpen(true)}
          onSelectHouse={setActiveHouseId}
          onOpenHouse={openHouseDetail}
          onCreateHouse={openHouseInput}
          onSortOpenChange={setSortOpen}
          onSortChange={(nextSortMode) => {
            setSortMode(nextSortMode);
            setSortOpen(false);
          }}
        />
      ) : null}

      {filterOpen ? (
        <FilterSheet
          sourceHouses={baseVisibleHouses}
          appliedFilter={homeFilter}
          onApply={(nextFilter) => {
            setHomeFilter(nextFilter);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}
    </View>
  );
}

function HomeNativeMarkers({
  markerItems,
  selectedHouseId,
  userLocation,
  onSelectHouse,
  onSelectCluster,
}: {
  markerItems: HomeMarkerItem[];
  selectedHouseId: string | null;
  userLocation: MapCoordinate | null;
  onSelectHouse: (houseId: string) => void;
  onSelectCluster: (cluster: Extract<HomeMarkerItem, { type: 'cluster' }>) => void;
}) {
  return (
    <>
      {markerItems.map((item) => {
        if (item.type === 'cluster') {
          // 줌아웃: 코랄 물방울 핀 + 카운트(숫자) 네이티브 caption.
          return (
            <TestableNaverMapMarkerOverlay
              key={item.id}
              testID={`home-house-cluster-${item.id}`}
              latitude={item.coordinate.latitude}
              longitude={item.coordinate.longitude}
              width={CLUSTER_MARKER_SIZE}
              height={CLUSTER_MARKER_SIZE}
              anchor={{ x: 0.5, y: 0.5 }}
              isForceShowIcon
              zIndex={80}
              caption={{
                text: String(item.count),
                align: 'Center',
                color: homeColors.white,
                haloColor: 'transparent',
                textSize: 15,
                requestedWidth: CLUSTER_MARKER_SIZE,
              }}
              onTap={() => onSelectCluster(item)}
            >
              <ClusterPinShape />
            </TestableNaverMapMarkerOverlay>
          );
        }

        const selected = item.house.id === selectedHouseId;
        if (selected) {
          // 야놀자식 콜아웃: 흰 알약 + 코랄 집 아이콘 + 좌측정렬 2줄(거래유형 / 가격) + 꼬리.
          // 모든 요소를 root 의 "직속 자식"으로 절대배치(라이브러리 문서 예시 구조) → 텍스트도 렌더된다.
          const isJeonse = item.house.dealType === 'JEONSE';
          const dealLabel = getMarkerDealTypeLabel(item.house);
          const priceText = formatHousePriceShort(item.house).replace(/^전세\s*/, '');
          const cw = calloutWidth(priceText);
          return (
            <TestableNaverMapMarkerOverlay
              key={item.house.id}
              testID={`home-house-marker-${item.house.id}`}
              latitude={item.coordinate.latitude}
              longitude={item.coordinate.longitude}
              width={cw}
              height={SELECTED_CALLOUT_HEIGHT}
              anchor={{ x: 0.5, y: 1 }}
              isForceShowIcon
              zIndex={120}
              onTap={() => onSelectHouse(item.house.id)}
            >
              <SelectedCallout
                width={cw}
                dealLabel={dealLabel}
                priceText={priceText}
                labelColor={isJeonse ? homeColors.primary : homeColors.coral}
              />
            </TestableNaverMapMarkerOverlay>
          );
        }
        // 미선택: 코랄 물방울 하우스 핀(도형).
        return (
          <TestableNaverMapMarkerOverlay
            key={item.house.id}
            testID={`home-house-marker-${item.house.id}`}
            latitude={item.coordinate.latitude}
            longitude={item.coordinate.longitude}
            width={PIN_WIDTH}
            height={PIN_HEIGHT}
            anchor={{ x: 0.5, y: 1 }}
            isForceShowIcon
            zIndex={60}
            onTap={() => onSelectHouse(item.house.id)}
          >
            <HousePinShape />
          </TestableNaverMapMarkerOverlay>
        );
      })}

      {userLocation ? (
        <TestableNaverMapMarkerOverlay
          testID="home-current-location-marker"
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          width={CURRENT_LOCATION_MARKER_SIZE}
          height={CURRENT_LOCATION_MARKER_SIZE}
          anchor={{ x: 0.5, y: 0.5 }}
          image={CURRENT_LOCATION_MARKER_IMAGE}
          isForceShowIcon
          zIndex={200}
        />
      ) : null}
    </>
  );
}

function HomeSearchFilterBar({
  query,
  activeFilterCount,
  onQueryChange,
  onFilterPress,
}: {
  query: string;
  activeFilterCount: number;
  onQueryChange: (value: string) => void;
  onFilterPress: () => void;
}) {
  return (
    <View testID="home-top-bar" style={styles.topBar}>
      <View style={styles.searchPill}>
        <Ionicons name="menu" size={18} color={homeColors.ink70} style={styles.searchMenuIcon} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="장소, 지명, 집 이름 검색"
          placeholderTextColor={homeColors.ink70}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
        <View style={styles.searchButton}>
          <Ionicons name="search" size={17} color={homeColors.white} />
        </View>
      </View>

      <Pressable
        testID="home-filter-button"
        accessibilityRole="button"
        accessibilityLabel="필터"
        onPress={onFilterPress}
        style={styles.filterButton}
      >
        <Ionicons name="options-outline" size={21} color={homeColors.white} />
        {activeFilterCount > 0 ? (
          <View testID="home-filter-badge" style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function HomeCarousel({
  houses,
  hasAnyHouses,
  selectedHouseId,
  sortMode,
  sortOpen,
  sheetRef,
  sheetHeight,
  bottomInset,
  primaryAnchors,
  commuteMode,
  onRegisterAnchor,
  onSelectHouse,
  onOpenHouse,
  onCreateHouse,
  onSortOpenChange,
  onSortChange,
}: {
  houses: House[];
  hasAnyHouses: boolean;
  selectedHouseId: string | null;
  sortMode: HomeSortMode;
  sortOpen: boolean;
  sheetRef: RefObject<ComponentRef<typeof BottomSheet>>;
  sheetHeight: number;
  bottomInset: number;
  primaryAnchors: PrimaryAnchors;
  commuteMode: 'none' | 'work' | 'school' | 'both';
  onRegisterAnchor: () => void;
  onSelectHouse: (houseId: string) => void;
  onOpenHouse: (houseId: string) => void;
  onCreateHouse: () => void;
  onSortOpenChange: (open: boolean) => void;
  onSortChange: (sortMode: HomeSortMode) => void;
}) {
  const carouselRef = useRef<ScrollView>(null);
  const snapPoints = useMemo(() => [sheetHeight], [sheetHeight]);
  const activeIndex = Math.max(
    0,
    houses.findIndex((house) => house.id === selectedHouseId),
  );

  useEffect(() => {
    carouselRef.current?.scrollTo?.({
      x: activeIndex * CARD_SNAP_INTERVAL,
      animated: true,
    });
  }, [activeIndex]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (houses.length === 0) return;

    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_SNAP_INTERVAL);
    const nextIndex = Math.min(Math.max(rawIndex, 0), houses.length - 1);
    const nextHouse = houses[nextIndex];
    if (nextHouse) onSelectHouse(nextHouse.id);
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableHandlePanningGesture={false}
      enableContentPanningGesture={false}
      enableOverDrag={false}
      handleComponent={null}
      backgroundStyle={styles.sheetBackground}
      style={styles.sheetShadow}
    >
      <BottomSheetView testID="home-result-sheet" style={styles.sheetBody}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleGroup}>
            <Text style={styles.sheetTitle}>이 근처 내 집</Text>
            <Text style={styles.sheetCount}>{houses.length}</Text>
          </View>
          <Pressable
            testID="home-sort-button"
            accessibilityRole="button"
            onPress={() => onSortOpenChange(!sortOpen)}
            style={styles.sortPill}
          >
            <Text testID="home-sort-label" style={styles.sortText}>
              {getSortLabel(sortMode)}
            </Text>
            <Ionicons name="chevron-down" size={12} color={homeColors.muted} />
          </Pressable>
        </View>

        {sortOpen ? (
          <View style={styles.sortMenu}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                testID={option.testID}
                accessibilityRole="button"
                onPress={() => onSortChange(option.key)}
                style={[styles.sortMenuItem, option.key === sortMode && styles.activeSortMenuItem]}
              >
                <Text style={[styles.sortMenuText, option.key === sortMode && styles.activeSortMenuText]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {commuteMode === 'none' ? (
          <View style={styles.commuteBanner}>
            <View style={styles.commuteBannerIcon}>
              <Ionicons name="navigate" size={14} color={homeColors.primary} />
            </View>
            <Text style={styles.commuteBannerText} numberOfLines={1}>
              직장·학교 등록하고 <Text style={styles.commuteBannerStrong}>통근시간</Text> 보기
            </Text>
            <Pressable
              testID="home-commute-register"
              accessibilityRole="button"
              onPress={onRegisterAnchor}
              style={styles.commuteBannerBtn}
            >
              <Text style={styles.commuteBannerBtnText}>등록</Text>
            </Pressable>
          </View>
        ) : null}

        {houses.length > 0 ? (
          <ScrollView
            ref={carouselRef}
            testID="home-house-carousel"
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_SNAP_INTERVAL}
            decelerationRate="fast"
            keyboardShouldPersistTaps="handled"
            onMomentumScrollEnd={handleMomentumScrollEnd}
            contentContainerStyle={[styles.cardScroller, { paddingBottom: bottomInset + spacing.sm }]}
          >
            {houses.map((house) => (
              <HomeHouseCard
                key={house.id}
                house={house}
                active={house.id === selectedHouseId}
                primaryAnchors={primaryAnchors}
                commuteMode={commuteMode}
                onSelect={() => onSelectHouse(house.id)}
                onOpen={() => onOpenHouse(house.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        {houses.length === 0 && !hasAnyHouses ? (
          <View style={styles.emptyNearby}>
            <Text style={styles.emptyNearbyTitle}>아직 기록한 집이 없어요</Text>
            <Text style={styles.emptyNearbyBody}>처음 둘러본 집부터 기록하면 지도와 보관함에 쌓여요.</Text>
            <Pressable accessibilityRole="button" onPress={onCreateHouse} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>첫 집 기록하기</Text>
            </Pressable>
          </View>
        ) : houses.length === 0 ? (
          <View style={styles.emptyNearby}>
            <Text style={styles.emptyNearbyTitle}>이 조건에 맞는 집이 없어요</Text>
            <Text style={styles.emptyNearbyBody}>지도를 움직이거나 검색어와 필터를 조정해보세요.</Text>
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}

function HomeFullListMode({
  houses,
  hasAnyHouses,
  selectedHouseId,
  query,
  activeFilterCount,
  sortMode,
  sortOpen,
  topInset,
  onQueryChange,
  onFilterPress,
  onSelectHouse,
  onOpenHouse,
  onCreateHouse,
  onSortOpenChange,
  onSortChange,
}: {
  houses: House[];
  hasAnyHouses: boolean;
  selectedHouseId: string | null;
  query: string;
  activeFilterCount: number;
  sortMode: HomeSortMode;
  sortOpen: boolean;
  topInset: number;
  onQueryChange: (value: string) => void;
  onFilterPress: () => void;
  onSelectHouse: (houseId: string) => void;
  onOpenHouse: (houseId: string) => void;
  onCreateHouse: () => void;
  onSortOpenChange: (open: boolean) => void;
  onSortChange: (sortMode: HomeSortMode) => void;
}) {
  return (
    <View testID="home-full-list-mode" style={[styles.fullListMode, { paddingTop: topInset + 5 }]}>
      <View style={styles.fullListHeader}>
        <HomeSearchFilterBar
          query={query}
          activeFilterCount={activeFilterCount}
          onQueryChange={onQueryChange}
          onFilterPress={onFilterPress}
        />

        <View style={styles.fullListTitleRow}>
          <View style={styles.sheetTitleGroup}>
            <Text style={styles.sheetTitle}>이 근처 내 집</Text>
            <Text style={styles.sheetCount}>{houses.length}</Text>
          </View>
          <Pressable
            testID="home-sort-button"
            accessibilityRole="button"
            onPress={() => onSortOpenChange(!sortOpen)}
            style={styles.sortPill}
          >
            <Text testID="home-sort-label" style={styles.sortText}>
              {getSortLabel(sortMode)}
            </Text>
            <Ionicons name="chevron-down" size={12} color={homeColors.muted} />
          </Pressable>
        </View>

        {sortOpen ? (
          <View style={styles.fullListSortMenu}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                testID={option.testID}
                accessibilityRole="button"
                onPress={() => onSortChange(option.key)}
                style={[styles.sortMenuItem, option.key === sortMode && styles.activeSortMenuItem]}
              >
                <Text style={[styles.sortMenuText, option.key === sortMode && styles.activeSortMenuText]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {houses.length > 0 ? (
        <ScrollView
          testID="home-full-list"
          style={styles.fullListBody}
          contentContainerStyle={styles.fullListContent}
          keyboardShouldPersistTaps="handled"
        >
          {houses.map((house) => (
            <HomeFullListRow
              key={house.id}
              house={house}
              active={house.id === selectedHouseId}
              onSelect={() => onSelectHouse(house.id)}
              onOpen={() => onOpenHouse(house.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.fullListEmpty}>
          <Text style={styles.emptyNearbyTitle}>
            {hasAnyHouses ? '조건에 맞는 집이 없어요' : '아직 기록한 집이 없어요'}
          </Text>
          <Text style={styles.emptyNearbyBody}>
            {hasAnyHouses
              ? '지도 위치, 검색어, 필터를 조금 넓혀서 다시 확인해보세요.'
              : '처음 둘러본 집부터 기록하면 지도와 목록에서 바로 비교할 수 있어요.'}
          </Text>
          {!hasAnyHouses ? (
            <Pressable accessibilityRole="button" onPress={onCreateHouse} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>첫 집 기록하기</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

function HomeFullListRow({
  house,
  active,
  onSelect,
  onOpen,
}: {
  house: House;
  active: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const visitedAt = new Date(house.createdAt);
  const visitedLabel = Number.isNaN(visitedAt.getTime())
    ? '기록'
    : `${visitedAt.getMonth() + 1}. ${visitedAt.getDate()}. 기록`;

  return (
    <Pressable
      testID={`home-full-list-row-${house.id}`}
      accessibilityRole="button"
      onPress={onSelect}
      style={[styles.fullListRow, active && styles.activeFullListRow]}
    >
      <View style={[styles.fullListDealTile, active && styles.activeFullListDealTile]}>
        <Text style={[styles.fullListDealText, active && styles.activeFullListDealText]}>
          {getMarkerDealTypeLabel(house).replace('세', '')}
        </Text>
      </View>

      <View style={styles.fullListRowMain}>
        <View style={styles.fullListRowTitleLine}>
          <Text style={styles.fullListRowTitle} numberOfLines={1}>
            {getHouseTitle(house)}
          </Text>
        </View>
        <Text style={styles.fullListAddress} numberOfLines={1}>
          {getHouseSubtitle(house)}
        </Text>
        <Text style={styles.fullListPrice} numberOfLines={1}>
          {formatHousePrice(house)}
          <Text style={styles.fullListMeta}>  {getHouseMeta(house)}</Text>
        </Text>
        <Text style={styles.fullListVisited}>{visitedLabel}</Text>
      </View>

      <Pressable
        testID={`open-house-detail-${house.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${getHouseTitle(house)} 상세 보기`}
        onPress={onOpen}
        hitSlop={10}
        style={styles.fullListChevron}
      >
        <Ionicons name="chevron-forward" size={19} color={homeColors.muted} />
      </Pressable>
    </Pressable>
  );
}

// 카드 하단 컨디션 점 — 햇빛/수압/곰팡이/방음/환기 (좋음=green·보통=amber·나쁨=red).
const CARD_CHECKS: { key: keyof House; icon: string }[] = [
  { key: 'sunlight', icon: 'sunny' },
  { key: 'waterPressure', icon: 'water' },
  { key: 'moisture', icon: 'bug' },
  { key: 'noise', icon: 'volume-high' },
  { key: 'ventilation', icon: 'sync' },
];

function HomeHouseCard({
  house,
  active,
  primaryAnchors,
  commuteMode,
  onSelect,
  onOpen,
}: {
  house: House;
  active: boolean;
  primaryAnchors: PrimaryAnchors;
  commuteMode: 'none' | 'work' | 'school' | 'both';
  onSelect: () => void;
  onOpen: () => void;
}) {
  const visitedAt = new Date(house.createdAt);
  const visitedLabel = Number.isNaN(visitedAt.getTime())
    ? '방문'
    : `${visitedAt.getMonth() + 1}/${visitedAt.getDate()} 방문`;
  const commute = useHouseCommute(house, primaryAnchors);
  const showWork = (commuteMode === 'work' || commuteMode === 'both') && typeof commute.work === 'number';
  const showSchool = (commuteMode === 'school' || commuteMode === 'both') && typeof commute.school === 'number';

  return (
    <Pressable
      testID={`home-house-card-${house.id}`}
      onPress={onSelect}
      onLongPress={onOpen}
      style={[styles.houseCard, active && styles.activeHouseCard]}
    >
      <View style={styles.cardPhoto}>
        <View style={styles.photoShade} />
        <View style={styles.photoWindow} />
        <View style={styles.photoWindowAlt} />
        <Text style={styles.visitBadge}>{visitedLabel}</Text>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.typeLine}>
          <Text style={[styles.dealBadge, house.dealType === 'JEONSE' && styles.jeonseBadge]}>
            {getDealTypeLabel(house)}
          </Text>
          <Ionicons name="bookmark-outline" size={14} color={homeColors.muted} style={styles.cardBookmark} />
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {getHouseTitle(house)}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {getHouseSubtitle(house)}
        </Text>
        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice} numberOfLines={1}>
            {formatHousePrice(house)}
          </Text>
          {house.dealType !== 'JEONSE' && typeof house.maintenanceFee === 'number' && house.maintenanceFee > 0 ? (
            <Text style={styles.cardMgmt}>관리비 {house.maintenanceFee}만</Text>
          ) : null}
        </View>

        <View style={styles.cardBottomRow}>
          <View style={styles.checkDots}>
            {CARD_CHECKS.map(({ key, icon }) => {
              const value = house[key];
              const color =
                typeof value === 'number' ? conditionColor(value as 1 | 2 | 3) : homeColors.borderSoft;
              return <Ionicons key={key} name={icon as never} size={13} color={color} />;
            })}
          </View>
          {showWork || showSchool ? (
            <View style={styles.commuteGroup}>
              {showWork ? (
                <View style={styles.commuteItem}>
                  <Ionicons name="briefcase" size={11} color={homeColors.primary} />
                  <Text style={[styles.commuteText, { color: homeColors.primary }]}>{commute.work}분</Text>
                </View>
              ) : null}
              {showSchool ? (
                <View style={styles.commuteItem}>
                  <Ionicons name="school" size={11} color={homeColors.school} />
                  <Text style={[styles.commuteText, { color: homeColors.school }]}>{commute.school}분</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function FilterSheet({
  sourceHouses,
  appliedFilter,
  onApply,
  onClose,
}: {
  sourceHouses: House[];
  appliedFilter: HomeFilterState;
  onApply: (nextFilter: HomeFilterState) => void;
  onClose: () => void;
}) {
  const [draftFilter, setDraftFilter] = useState<HomeFilterState>(() => appliedFilter);
  const [rangeDragging, setRangeDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(FILTER_SNAP_HEIGHTS.HALF);
  const dragStartY = useRef<number | null>(null);
  const lastDragY = useRef<number | null>(null);
  const dragStartHeight = useRef(FILTER_SNAP_HEIGHTS.HALF);
  const dragStartAt = useRef(0);

  const previewCount = useMemo(
    () => filterHousesByHomeFilter(sourceHouses, draftFilter).length,
    [draftFilter, sourceHouses],
  );

  const setDealType = (dealType: DealFilter) => {
    setDraftFilter((current) => ({
      ...current,
      dealType,
      rent: dealType === 'JEONSE' ? RENT_LIMITS : current.rent,
    }));
  };

  const toggleAreaBucket = (bucket: AreaBucket | null) => {
    setDraftFilter((current) => ({
      ...current,
      areaBuckets: bucket ? toggleValue(current.areaBuckets, bucket) : [],
    }));
  };

  const toggleRoomBucket = (bucket: RoomBucket | null) => {
    setDraftFilter((current) => ({
      ...current,
      roomBuckets: bucket ? toggleValue(current.roomBuckets, bucket) : [],
    }));
  };

  const handleDragGrant = (event: GestureResponderEvent) => {
    dragStartY.current = event.nativeEvent.pageY;
    lastDragY.current = event.nativeEvent.pageY;
    dragStartHeight.current = sheetHeight;
    dragStartAt.current = Date.now();
  };

  const handleDragMove = (event: GestureResponderEvent) => {
    lastDragY.current = event.nativeEvent.pageY;
    if (dragStartY.current == null) return;
    const deltaY = event.nativeEvent.pageY - dragStartY.current;
    setSheetHeight(clamp(dragStartHeight.current - deltaY, FILTER_SNAP_HEIGHTS.PEEK, FILTER_SNAP_HEIGHTS.FULL));
  };

  const handleDragRelease = (event: GestureResponderEvent) => {
    const startY = dragStartY.current;
    const endY = event.nativeEvent.pageY ?? lastDragY.current;
    const elapsed = Date.now() - dragStartAt.current;
    dragStartY.current = null;
    lastDragY.current = null;
    if (typeof startY !== 'number' || typeof endY !== 'number') return;

    const deltaY = endY - startY;
    const isFastDownFlick = deltaY > 60 && elapsed < 220;
    if (deltaY > 120 || isFastDownFlick) {
      onClose();
      return;
    }

    const releasedHeight = clamp(dragStartHeight.current - deltaY, FILTER_SNAP_HEIGHTS.PEEK, FILTER_SNAP_HEIGHTS.FULL);
    setSheetHeight(findNearestFilterSnap(releasedHeight));
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.filterDim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View testID="filter-sheet" style={[styles.filterSheet, { height: sheetHeight }]}>
          <View
            testID="filter-sheet-drag-zone"
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleDragGrant}
            onResponderMove={handleDragMove}
            onResponderRelease={handleDragRelease}
            style={styles.filterDragZone}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>필터</Text>
              <Pressable
                testID="filter-reset-button"
                accessibilityRole="button"
                onPress={() => setDraftFilter(DEFAULT_HOME_FILTER)}
                hitSlop={8}
              >
                <Text style={styles.filterReset}>초기화</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            testID="filter-body"
            style={styles.filterBody}
            scrollEnabled={!rangeDragging}
            contentContainerStyle={styles.filterBodyContent}
          >
            <FilterSection title="거래 유형">
              <View style={styles.segmented}>
                {[
                  { key: 'ALL' as const, label: '전체', testID: 'filter-deal-all' },
                  { key: 'WOLSE' as const, label: '월세', testID: 'filter-deal-wolse' },
                  { key: 'JEONSE' as const, label: '전세', testID: 'filter-deal-jeonse' },
                ].map((item) => {
                  const active = draftFilter.dealType === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      testID={item.testID}
                      accessibilityRole="button"
                      onPress={() => setDealType(item.key)}
                      style={[styles.segmentItem, active && styles.activeSegment]}
                    >
                      <Text style={[styles.segmentText, active && styles.activeSegmentText]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </FilterSection>

            <FilterSection title="보증금" value={formatFilterRange(draftFilter.deposit, DEPOSIT_LIMITS)}>
              <RangeControl
                testID="filter-deposit-range"
                range={draftFilter.deposit}
                limits={DEPOSIT_LIMITS}
                step={500}
                onChange={(deposit) => setDraftFilter((current) => ({ ...current, deposit }))}
                onDragStateChange={setRangeDragging}
              />
            </FilterSection>
            {draftFilter.dealType !== 'JEONSE' ? (
              <FilterSection
                testID="filter-rent-section"
                title="월세"
                value={formatFilterRange(draftFilter.rent, RENT_LIMITS)}
              >
                <RangeControl
                  testID="filter-rent-range"
                  range={draftFilter.rent}
                  limits={RENT_LIMITS}
                  step={5}
                  onChange={(rent) => setDraftFilter((current) => ({ ...current, rent }))}
                  onDragStateChange={setRangeDragging}
                />
              </FilterSection>
            ) : null}
            <FilterSection title="평수">
              <View style={styles.filterChips}>
                <FilterChip
                  label="전체"
                  testID="filter-area-all"
                  active={draftFilter.areaBuckets.length === 0}
                  onPress={() => toggleAreaBucket(null)}
                />
                {AREA_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    testID={option.testID}
                    active={draftFilter.areaBuckets.includes(option.key)}
                    onPress={() => toggleAreaBucket(option.key)}
                  />
                ))}
              </View>
            </FilterSection>
            <FilterSection title="방 개수">
              <View style={styles.filterChips}>
                <FilterChip
                  label="전체"
                  testID="filter-room-all"
                  active={draftFilter.roomBuckets.length === 0}
                  onPress={() => toggleRoomBucket(null)}
                />
                {ROOM_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    testID={option.testID}
                    active={draftFilter.roomBuckets.includes(option.key)}
                    onPress={() => toggleRoomBucket(option.key)}
                  />
                ))}
              </View>
            </FilterSection>
          </ScrollView>

          <View style={styles.filterFooter}>
            <Pressable onPress={onClose} style={styles.filterCloseButton}>
              <Text style={styles.filterCloseText}>닫기</Text>
            </Pressable>
            <Pressable
              testID="filter-apply-button"
              onPress={() => onApply(draftFilter)}
              style={styles.filterApplyButton}
            >
              <Text style={styles.filterApplyText}>{previewCount}개 집 보기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterChip({
  label,
  testID,
  active,
  onPress,
}: {
  label: string;
  testID: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterChip, active && styles.activeFilterChip]}
    >
      <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>{label}</Text>
    </Pressable>
  );
}

function FilterSection({
  testID,
  title,
  value,
  children,
}: {
  testID?: string;
  title: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <View testID={testID} style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <Text style={styles.filterSectionTitle}>{title}</Text>
        {value ? <Text style={styles.filterSectionValue}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function RangeControl({
  testID,
  range,
  limits,
  step,
  onChange,
  onDragStateChange,
}: {
  testID?: string;
  range: NumericRange;
  limits: NumericRange;
  step: number;
  onChange: (range: NumericRange) => void;
  onDragStateChange?: (dragging: boolean) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(1);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const lowerPercent = ((range.min - limits.min) / (limits.max - limits.min)) * 100;
  const upperPercent = ((range.max - limits.min) / (limits.max - limits.min)) * 100;
  const activeWidth = Math.max(0, upperPercent - lowerPercent);

  const valueFromLocation = (locationX: number) => {
    const raw = limits.min + (locationX / Math.max(trackWidth, 1)) * (limits.max - limits.min);
    const stepped = Math.round(raw / step) * step;
    return Math.min(Math.max(stepped, limits.min), limits.max);
  };

  const updateRangeFromTouch = (event: GestureResponderEvent, forcedThumb?: 'min' | 'max') => {
    const value = valueFromLocation(event.nativeEvent.locationX);
    const thumb =
      forcedThumb ??
      activeThumb ??
      (Math.abs(value - range.min) <= Math.abs(value - range.max) ? 'min' : 'max');

    if (thumb === 'min') {
      onChange({ min: Math.min(value, range.max), max: range.max });
      return;
    }

    onChange({ min: range.min, max: Math.max(value, range.min) });
  };

  return (
    <View
      testID={testID}
      style={styles.rangeTrack}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        onDragStateChange?.(true);
        const value = valueFromLocation(event.nativeEvent.locationX);
        const thumb = Math.abs(value - range.min) <= Math.abs(value - range.max) ? 'min' : 'max';
        setActiveThumb(thumb);
        updateRangeFromTouch(event, thumb);
      }}
      onResponderMove={(event) => updateRangeFromTouch(event)}
      onResponderRelease={() => {
        setActiveThumb(null);
        onDragStateChange?.(false);
      }}
      onResponderTerminate={() => {
        setActiveThumb(null);
        onDragStateChange?.(false);
      }}
    >
      <View style={styles.rangeRail} />
      <View style={[styles.rangeActive, { left: `${lowerPercent}%`, width: `${activeWidth}%` }]} />
      <View style={[styles.rangeThumb, { left: `${lowerPercent}%` }]} />
      <View style={[styles.rangeThumb, { left: `${upperPercent}%` }]} />
    </View>
  );
}

function buildHomeMarkerItems(houses: House[], selectedHouseId: string | null, zoomLevel: number): HomeMarkerItem[] {
  const housesWithCoordinates = houses
    .map((house) => ({ house, coordinate: getHouseCoordinate(house) }))
    .filter((item): item is { house: House; coordinate: MapCoordinate } => Boolean(item.coordinate));

  if (zoomLevel >= INDIVIDUAL_MARKER_MIN_ZOOM) {
    return housesWithCoordinates.map(({ house, coordinate }) => ({ type: 'house', house, coordinate }));
  }

  const cellSize = getClusterCellSize(zoomLevel);
  const groups = new Map<string, { house: House; coordinate: MapCoordinate }[]>();

  housesWithCoordinates.forEach((item) => {
    const key = `${Math.floor(item.coordinate.latitude / cellSize)}:${Math.floor(item.coordinate.longitude / cellSize)}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    if (!first) {
      throw new Error('Home marker cluster group cannot be empty');
    }

    if (group.length === 1) {
      return { type: 'house', house: first.house, coordinate: first.coordinate };
    }

    const houseIds = group.map((item) => item.house.id);
    const sortedHouseIds = [...houseIds].sort();
    const representativeHouseId = selectedHouseId && houseIds.includes(selectedHouseId) ? selectedHouseId : first.house.id;
    return {
      type: 'cluster',
      id: sortedHouseIds.join('-'),
      coordinate: getAverageCoordinate(group.map((item) => item.house)) ?? first.coordinate,
      count: group.length,
      houseIds,
      representativeHouseId,
    };
  });
}

function getClusterCellSize(zoomLevel: number): number {
  if (zoomLevel <= 10) return 0.08;
  if (zoomLevel <= 11) return 0.04;
  return 0.02;
}

// 미선택 하우스 핀 — 코랄 물방울(원 + 꼬리) + 흰 집 글리프.
// iOS New Arch 는 collapsable=false 가 아닌 View 를 평탄화해 캡처에서 누락하므로(라이브러리 문서),
// 마커 안의 "모든" View 에 collapsable={false} 를 명시한다.
function HousePinShape() {
  return (
    <View collapsable={false} style={styles.pinWrap}>
      <View collapsable={false} style={styles.pinCircle} />
      <View collapsable={false} style={styles.pinHomeRoof} />
      <View collapsable={false} style={styles.pinHomeBody} />
      <View collapsable={false} style={styles.pinTail} />
    </View>
  );
}

// 클러스터 핀 — 코랄 원(카운트 텍스트는 네이티브 caption).
function ClusterPinShape() {
  return <View collapsable={false} style={styles.clusterCircle} />;
}

// 야놀자식 선택 콜아웃 — 흰 알약 + 코랄 집 아이콘 + 좌측정렬 2줄(거래유형/가격) + 코랄 꼬리.
// iOS 스냅샷은 루트의 "직속 자식"만 안정적으로 그리므로(라이브러리 문서 예시 구조),
// 배경·아이콘·꼬리(도형)와 2개의 텍스트를 모두 root 의 직속 자식으로 절대배치한다.
function SelectedCallout({
  width,
  dealLabel,
  priceText,
  labelColor,
}: {
  width: number;
  dealLabel: string;
  priceText: string;
  labelColor: string;
}) {
  return (
    <View key={`${dealLabel}/${priceText}/${width}`} collapsable={false} style={[styles.calloutRoot, { width }]}>
      <View collapsable={false} style={[styles.calloutPillBg, { width }]} />
      <View collapsable={false} style={styles.calloutIconBox} />
      <View collapsable={false} style={styles.calloutHomeRoof} />
      <View collapsable={false} style={styles.calloutHomeBody} />
      <Text style={[styles.calloutLabel, { color: labelColor }]}>{dealLabel}</Text>
      <Text style={styles.calloutPriceText}>{priceText}</Text>
      <View collapsable={false} style={[styles.calloutTail, { left: width / 2 - 7 }]} />
    </View>
  );
}

function getMarkerDealTypeLabel(house: House): string {
  if (house.dealType === 'JEONSE') return '전세';
  if (house.dealType === 'BAN_JEONSE') return '반전세';
  return '월세';
}

function getAverageCoordinate(houses: House[]): MapCoordinate | null {
  const coordinates = houses.map(getHouseCoordinate).filter((coordinate): coordinate is MapCoordinate => Boolean(coordinate));
  if (coordinates.length === 0) return null;

  const sum = coordinates.reduce(
    (acc, coordinate) => ({
      latitude: acc.latitude + coordinate.latitude,
      longitude: acc.longitude + coordinate.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function findNearestFilterSnap(height: number): number {
  return Object.values(FILTER_SNAP_HEIGHTS).reduce((nearest, candidate) =>
    Math.abs(candidate - height) < Math.abs(nearest - height) ? candidate : nearest,
  );
}

function getSortLabel(sortMode: HomeSortMode): string {
  return SORT_OPTIONS.find((option) => option.key === sortMode)?.label ?? '최근 본 순';
}

function sortHomeHouses(houses: House[], sortMode: HomeSortMode, baseCoordinate: MapCoordinate | null): House[] {
  return [...houses].sort((a, b) => {
    switch (sortMode) {
      case 'DISTANCE':
        return getDistanceScore(a, baseCoordinate) - getDistanceScore(b, baseCoordinate);
      case 'PRICE_ASC':
        return getPriceSortValue(a) - getPriceSortValue(b);
      case 'RECENT':
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
}

function getDistanceScore(house: House, baseCoordinate: MapCoordinate | null): number {
  const coordinate = getHouseCoordinate(house);
  if (!coordinate || !baseCoordinate) return Number.MAX_SAFE_INTEGER;
  const latitudeDistance = coordinate.latitude - baseCoordinate.latitude;
  const longitudeDistance = coordinate.longitude - baseCoordinate.longitude;
  return latitudeDistance * latitudeDistance + longitudeDistance * longitudeDistance;
}

function getPriceSortValue(house: House): number {
  if (house.dealType === 'JEONSE') return house.deposit;
  return house.deposit + (house.rent ?? 0) * 100;
}

function filterHousesByHomeFilter(houses: House[], filter: HomeFilterState): House[] {
  return houses.filter((house) => {
    if (filter.dealType === 'JEONSE' && house.dealType !== 'JEONSE') return false;
    if (filter.dealType === 'WOLSE' && house.dealType === 'JEONSE') return false;
    if (house.deposit < filter.deposit.min || house.deposit > filter.deposit.max) return false;

    if (!isDefaultRange(filter.rent, RENT_LIMITS) && house.dealType !== 'JEONSE') {
      const rent = house.rent ?? 0;
      if (rent < filter.rent.min || rent > filter.rent.max) return false;
    }

    if (filter.areaBuckets.length > 0 && !filter.areaBuckets.some((bucket) => matchesAreaBucket(house, bucket))) {
      return false;
    }

    if (filter.roomBuckets.length > 0 && !filter.roomBuckets.some((bucket) => matchesRoomBucket(house, bucket))) {
      return false;
    }

    return true;
  });
}

function matchesAreaBucket(house: House, bucket: AreaBucket): boolean {
  if (typeof house.area !== 'number') return false;
  switch (bucket) {
    case 'UP_TO_5':
      return house.area <= 5;
    case 'UP_TO_10':
      return house.area > 5 && house.area <= 10;
    case 'UP_TO_15':
      return house.area > 10 && house.area <= 15;
    case 'UP_TO_20':
      return house.area > 15 && house.area <= 20;
    case 'OVER_20':
      return house.area > 20;
  }
}

function matchesRoomBucket(house: House, bucket: RoomBucket): boolean {
  const rooms = house.rooms;
  if (typeof rooms !== 'number') return false;
  switch (bucket) {
    case 'STUDIO':
      return rooms <= 1;
    case 'ONE_HALF':
      return rooms > 1 && rooms < 2;
    case 'TWO':
      return rooms === 2;
    case 'THREE_PLUS':
      return rooms >= 3;
  }
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function isDefaultRange(range: NumericRange, limits: NumericRange): boolean {
  return range.min === limits.min && range.max === limits.max;
}

function countActiveFilters(filter: HomeFilterState): number {
  let count = 0;
  if (filter.dealType !== 'ALL') count += 1;
  if (!isDefaultRange(filter.deposit, DEPOSIT_LIMITS)) count += 1;
  if (filter.dealType !== 'JEONSE' && !isDefaultRange(filter.rent, RENT_LIMITS)) count += 1;
  if (filter.areaBuckets.length > 0) count += 1;
  if (filter.roomBuckets.length > 0) count += 1;
  return count;
}

function formatFilterRange(range: NumericRange, limits: NumericRange): string {
  if (isDefaultRange(range, limits)) return '전체';
  return `${range.min.toLocaleString('ko-KR')} ~ ${range.max.toLocaleString('ko-KR')}만`;
}

const homeColors = {
  primary: '#1B7A53',
  primarySoft: '#E8F3EC',
  ink: '#0E1A14',
  ink70: '#3B4641',
  muted: '#6B7068',
  border: '#E5E2DA',
  borderSoft: '#EFEDE5',
  surface: '#FAFAF6',
  white: '#FFFFFF',
  coral: '#E8754A',
  school: '#7B5FCC',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: homeColors.surface,
  },
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
  },
  searchPill: {
    height: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 24,
    backgroundColor: homeColors.white,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  searchMenuIcon: { marginRight: 2 },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: homeColors.ink,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.primary,
  },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: homeColors.ink,
    borderWidth: 1,
    borderColor: homeColors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: homeColors.coral,
    borderWidth: 2,
    borderColor: homeColors.white,
  },
  filterBadgeText: {
    color: homeColors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  locationBanner: {
    position: 'absolute',
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  anchorNudgeWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 28,
    elevation: 28,
  },
  locationBannerText: {
    ...typography.caption,
    color: homeColors.ink70,
    fontWeight: '600',
  },
  mapTools: {
    position: 'absolute',
    right: 14,
    bottom: 303,
    gap: spacing.sm,
  },
  mapToolButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: homeColors.white,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addHouseButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderColor: homeColors.primary,
    backgroundColor: homeColors.primary,
  },
  listToggle: {
    position: 'absolute',
    left: '50%',
    bottom: 293,
    width: 86,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: homeColors.ink,
    backgroundColor: homeColors.white,
    transform: [{ translateX: -43 }],
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 65,
    elevation: 65,
  },
  listToggleOnList: {
    borderColor: homeColors.border,
  },
  listToggleText: {
    ...typography.caption,
    color: homeColors.ink,
    fontWeight: '800',
  },
  mapOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    elevation: 12,
  },
  overlayHouseMarker: {
    position: 'absolute',
    zIndex: 2,
    elevation: 2,
  },
  pinWrap: { width: PIN_WIDTH, height: PIN_HEIGHT, alignItems: 'center' },
  pinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: homeColors.coral,
    borderWidth: 2.5,
    borderColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  // 흰 집 글리프 — 핀 루트의 직속 자식으로 원(상단 30px, 중심 x17/y15) 중앙에 절대배치.
  // 지붕(16×7 삼각형) 위, 몸통(10×8 사각형) 아래로 또렷한 집 실루엣.
  pinHomeRoof: {
    position: 'absolute',
    top: 8,
    left: 9,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: homeColors.white,
  },
  pinHomeBody: {
    position: 'absolute',
    top: 15,
    left: 12,
    width: 10,
    height: 8,
    backgroundColor: homeColors.white,
  },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -3,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: homeColors.coral,
  },
  clusterCircle: {
    width: CLUSTER_MARKER_SIZE,
    height: CLUSTER_MARKER_SIZE,
    borderRadius: CLUSTER_MARKER_SIZE / 2,
    backgroundColor: homeColors.coral,
    borderWidth: 2.5,
    borderColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  // 콜아웃 — 모든 요소가 root 의 직속 자식(절대배치). width 는 내용에 맞춰 동적(인라인).
  calloutRoot: { height: SELECTED_CALLOUT_HEIGHT },
  calloutPillBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 42,
    borderRadius: 21,
    backgroundColor: homeColors.white,
    borderWidth: 1.5,
    borderColor: homeColors.coral,
    shadowColor: '#0E1A14',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  calloutIconBox: {
    position: 'absolute',
    left: 10,
    top: 9,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: homeColors.coral,
  },
  // 흰 집(아이콘박스 중심 x22 기준) — 지붕(14×6) 위, 몸통(10×8) 아래.
  calloutHomeRoof: {
    position: 'absolute',
    top: 14,
    left: 15,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: homeColors.white,
  },
  calloutHomeBody: { position: 'absolute', top: 20, left: 17, width: 10, height: 8, backgroundColor: homeColors.white },
  calloutLabel: { position: 'absolute', left: CALLOUT_TEXT_LEFT, top: 7, fontSize: 10, fontWeight: '700', letterSpacing: -0.2 },
  calloutPriceText: {
    position: 'absolute',
    left: CALLOUT_TEXT_LEFT,
    top: 19,
    fontSize: 14,
    fontWeight: '800',
    color: homeColors.ink,
    letterSpacing: -0.3,
  },
  calloutTail: {
    position: 'absolute',
    top: 41,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: homeColors.coral,
  },
  currentLocationMarker: {
    position: 'absolute',
    width: CURRENT_LOCATION_MARKER_SIZE,
    height: CURRENT_LOCATION_MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 132, 245, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 132, 245, 0.28)',
  },
  currentLocationDot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2284F5',
    borderWidth: 3,
    borderColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  clusterCount: {
    position: 'absolute',
    right: 5,
    top: 4,
    minWidth: 17,
    height: 17,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: homeColors.coral,
    color: homeColors.white,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 17,
    includeFontPadding: false,
  },
  carouselSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 254,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -5 },
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 3,
    backgroundColor: '#D8D5CD',
  },
  sheetShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -5 },
    elevation: 24,
  },
  sheetBackground: {
    backgroundColor: homeColors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetBody: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sheetTitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sheetTitle: {
    ...typography.bodyBold,
    color: homeColors.ink,
  },
  sheetCount: {
    ...typography.bodyBold,
    color: homeColors.primary,
  },
  sortPill: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  sortText: {
    ...typography.caption,
    color: homeColors.ink70,
    fontWeight: '600',
  },
  sortMenu: {
    position: 'absolute',
    top: 61,
    right: spacing.lg,
    zIndex: 5,
    width: 118,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    backgroundColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sortMenuItem: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  activeSortMenuItem: {
    backgroundColor: homeColors.primarySoft,
  },
  sortMenuText: {
    color: homeColors.ink70,
    fontSize: 12,
    fontWeight: '700',
  },
  activeSortMenuText: {
    color: homeColors.primary,
  },
  cardScroller: {
    gap: spacing.sm,
    paddingHorizontal: 41,
    paddingBottom: spacing.sm,
  },
  houseCard: {
    width: 320,
    height: 188,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    backgroundColor: homeColors.white,
    shadowColor: '#0E1A14',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  resultList: {
    flex: 1,
  },
  resultListContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  fullListMode: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: homeColors.white,
    zIndex: 40,
    elevation: 40,
  },
  fullListHeader: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: homeColors.borderSoft,
    backgroundColor: homeColors.white,
    zIndex: 2,
  },
  fullListTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  fullListSortMenu: {
    position: 'absolute',
    top: 68,
    right: spacing.lg,
    zIndex: 8,
    width: 118,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    backgroundColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  fullListBody: {
    flex: 1,
    backgroundColor: homeColors.white,
  },
  fullListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 88,
  },
  fullListRow: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: homeColors.borderSoft,
    backgroundColor: homeColors.white,
  },
  activeFullListRow: {
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderBottomColor: 'transparent',
    backgroundColor: '#F5F8F2',
  },
  fullListDealTile: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    backgroundColor: '#F1EBDD',
  },
  activeFullListDealTile: {
    backgroundColor: '#82A37E',
  },
  fullListDealText: {
    color: homeColors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  activeFullListDealText: {
    color: homeColors.white,
  },
  fullListRowMain: {
    flex: 1,
    minWidth: 0,
  },
  fullListRowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullListRowTitle: {
    flex: 1,
    minWidth: 0,
    color: homeColors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  fullListRating: {
    color: '#D6A33B',
    fontSize: 14,
    fontWeight: '800',
  },
  fullListAddress: {
    marginTop: 4,
    color: homeColors.muted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  fullListPrice: {
    marginTop: 7,
    color: homeColors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  fullListMeta: {
    color: homeColors.ink70,
    fontWeight: '500',
  },
  fullListVisited: {
    marginTop: 6,
    color: homeColors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  fullListChevron: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullListEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: homeColors.white,
  },
  activeHouseCard: {
    borderColor: homeColors.ink,
    borderWidth: 1.5,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardPhoto: {
    width: 118,
    height: 164,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#C8D9CC',
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,26,20,0.12)',
  },
  photoWindow: {
    position: 'absolute',
    top: 16,
    right: 12,
    width: 38,
    height: 30,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  photoWindowAlt: {
    position: 'absolute',
    top: 16,
    right: 56,
    width: 30,
    height: 30,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  visitBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: homeColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  tagBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: homeColors.coral,
    color: homeColors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  typeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dealBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FCEFE7',
    color: homeColors.coral,
    fontSize: 10,
    fontWeight: '700',
  },
  jeonseBadge: {
    backgroundColor: homeColors.primarySoft,
    color: homeColors.primary,
  },
  cardTitle: {
    marginTop: 2,
    color: homeColors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 1,
    color: homeColors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  cardBookmark: { marginLeft: 'auto' },
  cardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: spacing.sm, marginBottom: 'auto' },
  cardPrice: {
    color: homeColors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardMgmt: { color: homeColors.muted, fontSize: 11, fontWeight: '500' },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: homeColors.borderSoft,
  },
  checkDots: { flexDirection: 'row', gap: 7 },
  commuteGroup: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 },
  commuteItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commuteText: { fontSize: 11, fontWeight: '700', letterSpacing: -0.2 },
  commuteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: 9,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 13,
    backgroundColor: homeColors.white,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  commuteBannerIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.primarySoft,
  },
  commuteBannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: homeColors.ink70, letterSpacing: -0.2 },
  commuteBannerStrong: { fontWeight: '800', color: homeColors.ink },
  commuteBannerBtn: { height: 30, paddingHorizontal: 13, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: homeColors.ink },
  commuteBannerBtnText: { fontSize: 12, fontWeight: '700', color: homeColors.white },
  miniChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  miniChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    backgroundColor: homeColors.surface,
    color: homeColors.ink70,
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  detailPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: homeColors.ink,
  },
  detailPillText: {
    color: homeColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyNearby: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyNearbyTitle: {
    ...typography.bodyBold,
    color: homeColors.ink,
    textAlign: 'center',
  },
  emptyNearbyBody: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: homeColors.muted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: homeColors.ink,
  },
  emptyCtaText: {
    color: homeColors.white,
    fontWeight: '800',
  },
  filterDim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 26, 20, 0.35)',
  },
  filterSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: homeColors.white,
    overflow: 'hidden',
  },
  filterDragZone: {
    backgroundColor: homeColors.white,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterTitle: {
    color: homeColors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  filterReset: {
    ...typography.caption,
    color: homeColors.muted,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: homeColors.borderSoft,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    ...typography.caption,
    color: homeColors.ink,
    fontWeight: '700',
  },
  filterSectionValue: {
    ...typography.caption,
    color: homeColors.primary,
    fontWeight: '600',
  },
  segmented: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: 10,
    backgroundColor: homeColors.surface,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentText: {
    color: homeColors.muted,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  activeSegment: {
    backgroundColor: homeColors.white,
  },
  activeSegmentText: {
    color: homeColors.ink,
  },
  rangeTrack: {
    height: 28,
    justifyContent: 'center',
  },
  rangeRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: homeColors.borderSoft,
  },
  rangeActive: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: homeColors.primary,
  },
  rangeThumb: {
    position: 'absolute',
    top: 3,
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: homeColors.primary,
    backgroundColor: homeColors.white,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: homeColors.border,
    backgroundColor: homeColors.white,
  },
  activeFilterChip: {
    borderColor: homeColors.primary,
    backgroundColor: homeColors.primarySoft,
  },
  filterChipText: {
    color: homeColors.ink70,
    fontWeight: '600',
    includeFontPadding: false,
  },
  activeFilterChipText: {
    color: homeColors.primary,
  },
  filterBody: {
    flex: 1,
  },
  filterBodyContent: {
    paddingBottom: spacing.md,
  },
  filterFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: homeColors.borderSoft,
  },
  filterCloseButton: {
    height: 50,
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  filterCloseText: {
    color: homeColors.ink70,
    fontWeight: '700',
  },
  filterApplyButton: {
    height: 50,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: homeColors.ink,
  },
  filterApplyText: {
    color: homeColors.white,
    fontWeight: '700',
  },
});
