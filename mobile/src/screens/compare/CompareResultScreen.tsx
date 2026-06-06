import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HouseStackParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { useMyPlaces } from '@/queries/myPlaces.queries';
import { useHouseCommute } from '@/queries/myPlaceDistances.queries';
import { House } from '@/types';
import { colors } from '@/theme';
import { formatDepositShort, pickPrimaryMyPlaces } from '@/screens/houses/houseMapUtils';
import { builtYearLabel, dealTypeLabel, FACILITY_META, roomTypeLabel } from '@/domain/house';
import { CompareTopBar } from './components/CompareTopBar';
import { CompareHeader } from './components/CompareHeader';
import { SectionLabel } from './components/SectionLabel';
import { CompareRow } from './components/CompareRow';
import { MetricBar } from './components/MetricBar';
import { ConditionRows } from './components/ConditionRow';
import { FacilityCompareRow, FacilityRow } from './components/FacilityRows';
import { higherSide } from './compareUtils';

type Props = NativeStackScreenProps<HouseStackParamList, 'CompareResult'>;

type Commute = { work?: number; school?: number };

export function CompareResultScreen({ route, navigation }: Props) {
  const { aId, bId } = route.params;
  const { data: houses = [] } = useHouses();
  const a = houses.find((h) => h.id === aId);
  const b = houses.find((h) => h.id === bId);

  const { data: places = [] } = useMyPlaces();
  const primaryMyPlaces = useMemo(() => pickPrimaryMyPlaces(places), [places]);

  // 두 집의 통근시간(주 통근지 기준). 등록 안 됐으면 빈 객체.
  const commuteA = useHouseCommute(a ?? EMPTY_HOUSE, primaryMyPlaces);
  const commuteB = useHouseCommute(b ?? EMPTY_HOUSE, primaryMyPlaces);

  const [full, setFull] = useState(false);

  if (!a || !b) {
    return (
      <View style={styles.root}>
        <CompareTopBar onBack={() => navigation.goBack()} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>비교할 집을 찾을 수 없어요.</Text>
        </View>
      </View>
    );
  }

  const hasWork = Boolean(primaryMyPlaces.work);
  const hasSchool = Boolean(primaryMyPlaces.school);

  const toggle = (
    <Pressable
      testID="compare-view-toggle"
      accessibilityRole="button"
      accessibilityLabel={full ? '요약 보기' : '전체 보기'}
      onPress={() => setFull((v) => !v)}
      style={[styles.toggle, full ? styles.toggleOutline : styles.toggleFilled]}
    >
      <Ionicons
        name={full ? 'grid' : 'list'}
        size={13}
        color={full ? colors.ink70 : colors.white}
      />
      <Text style={[styles.toggleText, { color: full ? colors.ink70 : colors.white }]}>
        {full ? '요약' : '전체'}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <CompareTopBar onBack={() => navigation.goBack()} right={toggle} />
      <View style={styles.stickyHeader}>
        <CompareHeader a={a} b={b} />
      </View>
      {full ? (
        <FullTable
          a={a}
          b={b}
          commuteA={commuteA}
          commuteB={commuteB}
          hasWork={hasWork}
          hasSchool={hasSchool}
        />
      ) : (
        <Summary
          a={a}
          b={b}
          commuteA={commuteA}
          commuteB={commuteB}
          hasWork={hasWork}
          hasSchool={hasSchool}
        />
      )}
    </View>
  );
}

// ── 요약 (무스크롤 기본 화면) ────────────────────────────────────
function Summary({
  a,
  b,
  commuteA,
  commuteB,
  hasWork,
  hasSchool,
}: {
  a: House;
  b: House;
  commuteA: Commute;
  commuteB: Commute;
  hasWork: boolean;
  hasSchool: boolean;
}) {
  const showWork = hasWork && typeof commuteA.work === 'number' && typeof commuteB.work === 'number';
  const showSchool =
    hasSchool && typeof commuteA.school === 'number' && typeof commuteB.school === 'number';

  return (
    <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
      {/* 가격·공간·통근 — 미러 막대 */}
      <View style={styles.card}>
        <MetricBar label="관리비" la={a.maintenanceFee ?? 0} rb={b.maintenanceFee ?? 0} unit="만" />
        <View style={styles.divider} />
        <MetricBar label="평수" la={a.area ?? 0} rb={b.area ?? 0} unit="평" />
        {showWork ? (
          <>
            <View style={styles.divider} />
            <MetricBar label="직장" la={commuteA.work!} rb={commuteB.work!} unit="분" />
          </>
        ) : null}
        {showSchool ? (
          <>
            <View style={styles.divider} />
            <MetricBar label="학교" la={commuteA.school!} rb={commuteB.school!} unit="분" />
          </>
        ) : null}
        {a.builtYear || b.builtYear ? (
          <>
            <View style={styles.divider} />
            <CompareRow
              label="건축연도"
              left={builtYearLabel(a.builtYear)}
              right={builtYearLabel(b.builtYear)}
              hi={higherSide(a.builtYear, b.builtYear)}
              dense
            />
          </>
        ) : null}
      </View>

      {/* 컨디션 — 실제 값 + 색 */}
      <View style={[styles.card, styles.cardGap]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>컨디션</Text>
          <Text style={styles.cardLegend}>초록 좋음 · 노랑 보통 · 빨강 주의</Text>
        </View>
        <ConditionRows a={a} b={b} dense />
      </View>

      {/* 시설 — 있음/없음 대조 */}
      <View style={[styles.card, styles.cardGap]}>
        <FacilityCompareRow label={FACILITY_META.hasElevator.shortLabel} la={a.hasElevator} rb={b.hasElevator} />
        <FacilityCompareRow label={FACILITY_META.hasParking.shortLabel} la={a.hasParking} rb={b.hasParking} />
        <FacilityCompareRow label={FACILITY_META.fullOption.shortLabel} la={a.fullOption} rb={b.fullOption} />
      </View>
    </ScrollView>
  );
}

// ── 풀 비교표 (스크롤 2열) ───────────────────────────────────────
function FullTable({
  a,
  b,
  commuteA,
  commuteB,
  hasWork,
  hasSchool,
}: {
  a: House;
  b: House;
  commuteA: Commute;
  commuteB: Commute;
  hasWork: boolean;
  hasSchool: boolean;
}) {
  const min = (v?: number) => (typeof v === 'number' ? `${v}분` : '—');
  return (
    <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.fullContent}>
      <SectionLabel icon="home">가격</SectionLabel>
      <CompareRow label="거래" left={dealTypeLabel(a.dealType)} right={dealTypeLabel(b.dealType)} />
      <CompareRow label="보증금" left={formatDepositShort(a.deposit)} right={formatDepositShort(b.deposit)} />
      {a.dealType !== 'JEONSE' ? (
        <CompareRow
          label="월세"
          left={`${a.rent ?? 0}만`}
          right={b.dealType !== 'JEONSE' ? `${b.rent ?? 0}만` : '—'}
          hi={b.dealType !== 'JEONSE' ? higherSide(a.rent, b.rent) : null}
        />
      ) : null}
      <CompareRow
        label="관리비"
        left={`${a.maintenanceFee ?? 0}만`}
        right={`${b.maintenanceFee ?? 0}만`}
        hi={higherSide(a.maintenanceFee, b.maintenanceFee)}
      />

      <SectionLabel icon="grid">공간</SectionLabel>
      <CompareRow label="평수" left={`${a.area ?? 0}평`} right={`${b.area ?? 0}평`} hi={higherSide(a.area, b.area)} />
      <CompareRow label="방" left={roomLabel(a)} right={roomLabel(b)} />
      <CompareRow label="층" left={floorLabel(a)} right={floorLabel(b)} />
      <CompareRow
        label="건축연도"
        left={builtYearLabel(a.builtYear)}
        right={builtYearLabel(b.builtYear)}
        hi={higherSide(a.builtYear, b.builtYear)}
      />

      <SectionLabel icon="sunny">컨디션</SectionLabel>
      <ConditionRows a={a} b={b} />

      <SectionLabel icon="layers">시설</SectionLabel>
      <FacilityRow label={FACILITY_META.hasElevator.shortLabel} la={a.hasElevator} rb={b.hasElevator} />
      <FacilityRow label={FACILITY_META.hasParking.shortLabel} la={a.hasParking} rb={b.hasParking} />
      <FacilityRow label={FACILITY_META.fullOption.shortLabel} la={a.fullOption} rb={b.fullOption} />

      {hasWork || hasSchool ? <SectionLabel icon="navigate">통근</SectionLabel> : null}
      {hasWork ? (
        <CompareRow label="직장" left={min(commuteA.work)} right={min(commuteB.work)} hi={higherSide(commuteA.work, commuteB.work)} />
      ) : null}
      {hasSchool ? (
        <CompareRow label="학교" left={min(commuteA.school)} right={min(commuteB.school)} hi={higherSide(commuteA.school, commuteB.school)} />
      ) : null}
    </ScrollView>
  );
}

function roomLabel(house: House): string {
  return roomTypeLabel(house.roomType) ?? (typeof house.rooms === 'number' ? `방 ${house.rooms}` : '—');
}

function floorLabel(house: House): string {
  if (typeof house.floor === 'number' && typeof house.totalFloor === 'number') {
    return `${house.floor}/${house.totalFloor}층`;
  }
  if (typeof house.floor === 'number') return `${house.floor}층`;
  return '—';
}

// useHouseCommute는 항상 호출돼야 하므로(훅 규칙), 집이 없을 때 쓸 좌표 없는 더미.
const EMPTY_HOUSE: House = {
  id: '__none__',
  address: { roadAddress: '', jibunAddress: '', zonecode: '' },
  dealType: 'WOLSE',
  deposit: 0,
  photoIds: [],
  createdAt: '',
  updatedAt: '',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  stickyHeader: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingTop: 6 },
  bodyScroll: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  fullContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, paddingHorizontal: 14, paddingVertical: 6 },
  cardGap: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 10 },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.ink70 },
  cardLegend: { fontSize: 10, fontWeight: '500', color: colors.muted },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 11, borderRadius: 16 },
  toggleFilled: { backgroundColor: colors.inkStrong },
  toggleOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderHard },
  toggleText: { fontSize: 12, fontWeight: '600' },
});
