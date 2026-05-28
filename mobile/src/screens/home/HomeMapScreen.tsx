import {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
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
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  NaverMapMarkerOverlay,
  type NaverMapMarkerOverlayProps,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseStackParamList, MainTabParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { getDisplayHouses } from '@/screens/houses/houseSampleData';
import {
  DEFAULT_MAP_CENTER,
  filterHousesByKeyword,
  filterHousesByRegion,
  formatDepositShort,
  formatHousePrice,
  getAverageRating,
  getDealTypeLabel,
  getHouseCoordinate,
  getHouseMeta,
  getHouseSubtitle,
  getHouseTitle,
  type MapCoordinate,
  type MapRegion,
} from '@/screens/houses/houseMapUtils';
import { radii, spacing, typography } from '@/theme';
import { House } from '@/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];
type CameraIdleParams = {
  latitude: number;
  longitude: number;
  zoom?: number;
  region: MapRegion;
};

type TestableMarkerProps = NaverMapMarkerOverlayProps & { testID?: string };
type DealFilter = 'ALL' | 'WOLSE' | 'JEONSE';
type AreaBucket = 'UP_TO_5' | 'UP_TO_10' | 'UP_TO_15' | 'UP_TO_20' | 'OVER_20';
type RoomBucket = 'STUDIO' | 'ONE_HALF' | 'TWO' | 'THREE_PLUS';
type NumericRange = { min: number; max: number };
type HomeFilterState = {
  dealType: DealFilter;
  deposit: NumericRange;
  rent: NumericRange;
  areaBuckets: AreaBucket[];
  roomBuckets: RoomBucket[];
};

const TestableMarker = NaverMapMarkerOverlay as ComponentType<TestableMarkerProps>;
const CAMERA_IDLE_DEBOUNCE_MS = 1200;
const MAP_INITIAL_ZOOM = 14;
const CARD_WIDTH = 320;
const CARD_GAP = 10;
const CARD_SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const INITIAL_CAMERA = {
  latitude: DEFAULT_MAP_CENTER.latitude,
  longitude: DEFAULT_MAP_CENTER.longitude,
  zoom: MAP_INITIAL_ZOOM,
};
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

export function HomeMapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NaverMapViewRef>(null);
  const cameraIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCenteredOnUser = useRef(false);
  const { data = [] } = useHouses();
  const houses = useMemo(() => getDisplayHouses(data), [data]);
  const [query, setQuery] = useState('');
  const [activeHouseId, setActiveHouseId] = useState<string | null>(null);
  const [viewportRegion, setViewportRegion] = useState<MapRegion | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState(MAP_INITIAL_ZOOM);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [homeFilter, setHomeFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const baseVisibleHouses = useMemo(() => {
    const inViewport = filterHousesByRegion(houses, viewportRegion);
    return filterHousesByKeyword(inViewport, query);
  }, [houses, query, viewportRegion]);

  const visibleHouses = useMemo(
    () => filterHousesByHomeFilter(baseVisibleHouses, homeFilter),
    [baseVisibleHouses, homeFilter],
  );

  const activeHouse = useMemo(() => {
    const selected = visibleHouses.find((house) => house.id === activeHouseId);
    return selected ?? visibleHouses[0] ?? null;
  }, [activeHouseId, visibleHouses]);

  const activeFilterCount = useMemo(() => countActiveFilters(homeFilter), [homeFilter]);

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
        if (!hasCenteredOnUser.current) {
          hasCenteredOnUser.current = true;
          mapRef.current?.animateCameraTo({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            zoom: 15,
            duration: 500,
          });
        }
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

  const handleCameraIdle = useCallback((params: CameraIdleParams) => {
    setMapZoomLevel((current) => params.zoom ?? current);
    if (cameraIdleTimer.current) clearTimeout(cameraIdleTimer.current);
    cameraIdleTimer.current = setTimeout(() => {
      setViewportRegion(params.region);
    }, CAMERA_IDLE_DEBOUNCE_MS);
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

  const openHouseDetail = (houseId: string) => {
    const rootNavigation =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    rootNavigation.navigate('HouseDetail', { houseId });
  };

  return (
    <View style={styles.root}>
      <NaverMapView
        ref={mapRef}
        testID="house-map-view"
        style={StyleSheet.absoluteFill}
        initialCamera={INITIAL_CAMERA}
        animationDuration={260}
        isShowCompass={false}
        isShowLocationButton={false}
        isShowScaleBar={false}
        isShowZoomControls={false}
        logoAlign="BottomLeft"
        logoMargin={{ bottom: 282, left: 14 }}
        locale="ko"
        onCameraIdle={handleCameraIdle}
        locationOverlay={
          userLocation
            ? {
                isVisible: true,
                position: userLocation,
                circleColor: 'rgba(28, 127, 231, 0.22)',
                circleOutlineColor: 'rgba(28, 127, 231, 0.28)',
                circleOutlineWidth: 1,
                circleRadius: 28,
              }
            : undefined
        }
      >
        <HomeMarkers
          houses={visibleHouses}
          selectedHouseId={activeHouse?.id ?? null}
          zoomLevel={mapZoomLevel}
          onSelectHouse={setActiveHouseId}
        />
      </NaverMapView>

      <View pointerEvents="box-none" style={[styles.topOverlay, { top: insets.top + 8 }]}>
        <View testID="home-top-bar" style={styles.topBar}>
          <View style={styles.searchPill}>
            <Ionicons name="menu-outline" size={20} color={homeColors.ink70} />
            <TextInput
              value={query}
              onChangeText={setQuery}
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
            onPress={() => setFilterOpen(true)}
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
      </View>

      {locationMessage ? (
        <View style={[styles.locationBanner, { top: insets.top + 64 }]}>
          <Text style={styles.locationBannerText}>{locationMessage}</Text>
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.mapTools}>
        <MapTool icon="layers-outline" label="지도 레이어" />
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

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('HouseList')}
        style={styles.listToggle}
      >
        <Ionicons name="list" size={15} color={homeColors.white} />
        <Text style={styles.listToggleText}>목록 보기</Text>
      </Pressable>

      <HomeCarousel
        houses={visibleHouses}
        selectedHouseId={activeHouse?.id ?? null}
        onSelectHouse={setActiveHouseId}
        onOpenHouse={openHouseDetail}
      />

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

function HomeMarkers({
  houses,
  selectedHouseId,
  zoomLevel,
  onSelectHouse,
}: {
  houses: House[];
  selectedHouseId: string | null;
  zoomLevel: number;
  onSelectHouse: (houseId: string) => void;
}) {
  if (zoomLevel <= 12) {
    const clusterHouses = houses.slice(0, 4);
    if (clusterHouses.length === 0) return null;
    const firstHouse = clusterHouses[0];
    if (!firstHouse) return null;
    const firstCoordinate = getHouseCoordinate(firstHouse);
    if (!firstCoordinate) return null;

    return (
      <TestableMarker
        testID="home-house-cluster"
        latitude={firstCoordinate.latitude}
        longitude={firstCoordinate.longitude}
        width={56}
        height={56}
      >
        <View style={styles.clusterMarker}>
          <Text style={styles.clusterCount}>{clusterHouses.length}</Text>
          <Text style={styles.clusterLabel}>매물</Text>
        </View>
      </TestableMarker>
    );
  }

  return (
    <>
      {houses.map((house) => {
        const coordinate = getHouseCoordinate(house);
        if (!coordinate) return null;

        const selected = house.id === selectedHouseId;
        const markerWidth = selected ? 92 : 84;
        const markerHeight = 42;

        return (
          <TestableMarker
            key={house.id}
            testID={`home-house-marker-${house.id}`}
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
            width={markerWidth}
            height={markerHeight}
            caption={{
              text: formatMarkerCaption(house),
              align: 'Center',
              offset: 0,
              requestedWidth: markerWidth,
              textSize: 12,
              color: selected ? homeColors.white : homeColors.ink,
              haloColor: 'transparent',
            }}
            onTap={() => onSelectHouse(house.id)}
          >
            <HomePriceMarker house={house} selected={selected} width={markerWidth} height={markerHeight} />
          </TestableMarker>
        );
      })}
    </>
  );
}

function HomePriceMarker({
  house,
  selected,
  width,
  height,
}: {
  house: House;
  selected: boolean;
  width: number;
  height: number;
}) {
  const price = formatMarkerPrice(house);

  return (
    <View
      key={`${house.id}/${selected}/${price}/${width}/${height}`}
      testID={`home-price-marker-${house.id}`}
      collapsable={false}
      style={[styles.priceMarkerShell, { width, height }]}
    >
      <View style={[styles.priceMarkerPill, selected && styles.selectedPriceMarkerPill]} />
      <View style={[styles.priceMarkerTail, selected && styles.selectedPriceMarkerTail]} />
    </View>
  );
}

function HomeCarousel({
  houses,
  selectedHouseId,
  onSelectHouse,
  onOpenHouse,
}: {
  houses: House[];
  selectedHouseId: string | null;
  onSelectHouse: (houseId: string) => void;
  onOpenHouse: (houseId: string) => void;
}) {
  const carouselRef = useRef<ScrollView>(null);
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
    <View style={styles.carouselSheet}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHeader}>
        <View style={styles.sheetTitleGroup}>
          <Text style={styles.sheetTitle}>이 근처 내 집</Text>
          <Text style={styles.sheetCount}>{houses.length}</Text>
        </View>
        <View style={styles.sortPill}>
          <Text style={styles.sortText}>최근 본 순</Text>
          <Ionicons name="chevron-down" size={12} color={homeColors.muted} />
        </View>
      </View>

      {houses.length > 0 ? (
        <ScrollView
          ref={carouselRef}
          testID="home-house-carousel"
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_SNAP_INTERVAL}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          contentContainerStyle={styles.cardScroller}
        >
          {houses.map((house) => (
            <HomeHouseCard
              key={house.id}
              house={house}
              active={house.id === selectedHouseId}
              onSelect={() => onSelectHouse(house.id)}
              onOpen={() => onOpenHouse(house.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyNearby}>
          <Text style={styles.emptyNearbyTitle}>이 지도 영역에 기록한 집이 없어요</Text>
          <Text style={styles.emptyNearbyBody}>지도를 조금 움직이거나 검색어를 바꿔보세요.</Text>
        </View>
      )}
    </View>
  );
}

function HomeHouseCard({
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
  const rating = getAverageRating(house);
  const visitedAt = new Date(house.createdAt);
  const visitedLabel = Number.isNaN(visitedAt.getTime())
    ? '방문'
    : `${visitedAt.getMonth() + 1}/${visitedAt.getDate()} 방문`;

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
        <Text style={styles.tagBadge}>{rating > 0 ? `평점 ${rating.toFixed(1)}` : '기록 중'}</Text>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.typeLine}>
          <Text style={[styles.dealBadge, house.dealType === 'JEONSE' && styles.jeonseBadge]}>
            {getDealTypeLabel(house)}
          </Text>
          <Ionicons name="bookmark-outline" size={14} color={homeColors.muted} />
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {getHouseTitle(house)}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {getHouseSubtitle(house)}
        </Text>
        <Text style={styles.cardPrice}>{formatHousePrice(house)}</Text>

        <View style={styles.miniChips}>
          {getHouseMeta(house)
            .split(' · ')
            .filter(Boolean)
            .slice(0, 3)
            .map((item) => (
              <Text key={item} style={styles.miniChip}>
                {item}
              </Text>
            ))}
        </View>

        <View style={styles.cardActions}>
          <Pressable onPress={onOpen} style={styles.detailPill}>
            <Text style={styles.detailPillText}>상세 보기</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function MapTool({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <View accessibilityLabel={label} style={styles.mapToolButton}>
      <Ionicons name={icon} size={18} color={homeColors.ink70} />
    </View>
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
  const dragStartY = useRef<number | null>(null);
  const lastDragY = useRef<number | null>(null);

  const previewCount = useMemo(
    () => filterHousesByHomeFilter(sourceHouses, draftFilter).length,
    [draftFilter, sourceHouses],
  );

  const setDealType = (dealType: DealFilter) => {
    setDraftFilter((current) => ({ ...current, dealType }));
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
  };

  const handleDragMove = (event: GestureResponderEvent) => {
    lastDragY.current = event.nativeEvent.pageY;
  };

  const handleDragRelease = (event: GestureResponderEvent) => {
    const startY = dragStartY.current;
    const endY = event.nativeEvent.pageY ?? lastDragY.current;
    dragStartY.current = null;
    lastDragY.current = null;
    if (typeof startY === 'number' && endY - startY > 80) onClose();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.filterDim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.filterSheet}>
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

          <ScrollView style={styles.filterBody} contentContainerStyle={styles.filterBodyContent}>
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
                range={draftFilter.deposit}
                limits={DEPOSIT_LIMITS}
                step={500}
                onChange={(deposit) => setDraftFilter((current) => ({ ...current, deposit }))}
              />
            </FilterSection>
            <FilterSection title="월세" value={formatFilterRange(draftFilter.rent, RENT_LIMITS)}>
              <RangeControl
                range={draftFilter.rent}
                limits={RENT_LIMITS}
                step={5}
                onChange={(rent) => setDraftFilter((current) => ({ ...current, rent }))}
              />
            </FilterSection>
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
              <Text style={styles.filterApplyText}>{previewCount}개 매물 보기</Text>
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
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <Text style={styles.filterSectionTitle}>{title}</Text>
        {value ? <Text style={styles.filterSectionValue}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function RangeControl({
  range,
  limits,
  step,
  onChange,
}: {
  range: NumericRange;
  limits: NumericRange;
  step: number;
  onChange: (range: NumericRange) => void;
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
      style={styles.rangeTrack}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        const value = valueFromLocation(event.nativeEvent.locationX);
        const thumb = Math.abs(value - range.min) <= Math.abs(value - range.max) ? 'min' : 'max';
        setActiveThumb(thumb);
        updateRangeFromTouch(event, thumb);
      }}
      onResponderMove={(event) => updateRangeFromTouch(event)}
      onResponderRelease={() => setActiveThumb(null)}
      onResponderTerminate={() => setActiveThumb(null)}
    >
      <View style={styles.rangeRail} />
      <View style={[styles.rangeActive, { left: `${lowerPercent}%`, width: `${activeWidth}%` }]} />
      <View style={[styles.rangeThumb, { left: `${lowerPercent}%` }]} />
      <View style={[styles.rangeThumb, { left: `${upperPercent}%` }]} />
    </View>
  );
}

function formatMarkerPrice(house: House): string {
  if (house.dealType === 'JEONSE') return formatDepositShort(house.deposit);

  const deposit = house.deposit >= 10000 ? formatDepositShort(house.deposit) : `${house.deposit}`;
  return `${deposit}/${house.rent ?? 0}`;
}

function formatMarkerCaption(house: House): string {
  return `${house.dealType === 'JEONSE' ? '전' : '월'} ${formatMarkerPrice(house)}`;
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
  if (!isDefaultRange(filter.rent, RENT_LIMITS)) count += 1;
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
    paddingLeft: spacing.md,
    paddingRight: 6,
    borderRadius: 24,
    backgroundColor: homeColors.white,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  searchInput: {
    ...typography.caption,
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: homeColors.ink,
    fontWeight: '500',
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
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
  locationBannerText: {
    ...typography.caption,
    color: homeColors.ink70,
    fontWeight: '600',
  },
  mapTools: {
    position: 'absolute',
    right: 14,
    bottom: 335,
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
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  listToggle: {
    position: 'absolute',
    left: '50%',
    bottom: 325,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    borderRadius: 19,
    backgroundColor: homeColors.ink,
    transform: [{ translateX: -52 }],
  },
  listToggleText: {
    ...typography.caption,
    color: homeColors.white,
    fontWeight: '700',
  },
  priceMarkerShell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  priceMarkerPill: {
    width: '100%',
    height: 32,
    borderRadius: 16,
    backgroundColor: homeColors.white,
    borderWidth: 1.5,
    borderColor: homeColors.borderSoft,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  selectedPriceMarkerPill: {
    backgroundColor: homeColors.coral,
    borderColor: homeColors.coral,
  },
  priceMarkerTail: {
    width: 8,
    height: 8,
    marginTop: -5,
    backgroundColor: homeColors.white,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: homeColors.borderSoft,
    transform: [{ rotate: '45deg' }],
  },
  selectedPriceMarkerTail: {
    backgroundColor: homeColors.coral,
    borderColor: homeColors.coral,
  },
  clusterMarker: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: homeColors.white,
    borderWidth: 2,
    borderColor: homeColors.primary,
  },
  clusterCount: {
    color: homeColors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  clusterLabel: {
    color: homeColors.muted,
    fontSize: 8,
    fontWeight: '700',
  },
  carouselSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 286,
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: homeColors.borderSoft,
    backgroundColor: homeColors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
  cardPrice: {
    marginTop: spacing.sm,
    color: homeColors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
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
  filterDim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 26, 20, 0.35)',
  },
  filterSheet: {
    maxHeight: 580,
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
    maxHeight: 420,
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
