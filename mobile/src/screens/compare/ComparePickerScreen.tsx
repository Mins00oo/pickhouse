import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseStackParamList, MainTabParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { House } from '@/types';
import { colors } from '@/theme';
import { getDisplayHouses } from '@/screens/houses/houseSampleData';
import {
  formatHousePriceShort,
  getHouseTitle,
} from '@/screens/houses/houseMapUtils';
import { roomTypeLabel } from '@/screens/houses/wizardConstants';
import { CompareTopBar } from './components/CompareTopBar';
import { dealTypeShort } from './compareUtils';

type Props = BottomTabScreenProps<MainTabParamList, 'Compare'>;

/** 비교 진입 — 기록한 집 중 딱 2개를 골라 1:1 비교로 이동. */
export function ComparePickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data = [] } = useHouses();
  const houses = useMemo(() => getDisplayHouses(data), [data]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // 2개까지만
      return [...prev, id];
    });
  }, []);

  const canCompare = selected.length === 2;

  const startCompare = () => {
    const [aId, bId] = selected;
    if (!aId || !bId) return;
    const stack =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    stack.navigate('CompareResult', { aId, bId });
  };

  return (
    <View style={styles.root}>
      <CompareTopBar title="비교할 집 고르기" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body}>
        {/* 선택 슬롯 2칸 */}
        <View style={styles.slots}>
          {[0, 1].map((i) => {
            const id = selected[i];
            const house = id ? houses.find((h) => h.id === id) : undefined;
            if (!house) {
              return (
                <View key={i} style={styles.slotEmpty}>
                  <Ionicons name="add" size={20} color={colors.muted} />
                  <Text style={styles.slotEmptyText}>{i + 1}번째 집</Text>
                </View>
              );
            }
            const isJeonse = house.dealType === 'JEONSE';
            return (
              <View key={i} style={styles.slotFilled}>
                <Pressable
                  testID={`compare-slot-remove-${i}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${getHouseTitle(house)} 선택 해제`}
                  hitSlop={8}
                  onPress={() => toggle(house.id)}
                  style={styles.slotRemove}
                >
                  <Ionicons name="close" size={12} color={colors.white} />
                </Pressable>
                <View style={[styles.dealBadge, { backgroundColor: isJeonse ? colors.primarySoft : '#FCEFE7' }]}>
                  <Text style={[styles.dealText, { color: isJeonse ? colors.primary : colors.coral }]}>
                    {dealTypeShort(house)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.slotName} numberOfLines={1}>
                    {getHouseTitle(house)}
                  </Text>
                  <Text style={styles.slotPrice}>{formatHousePriceShort(house)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.countLabel}>
          내가 기록한 집 <Text style={{ color: colors.primary }}>{houses.length}</Text>
        </Text>

        <View style={{ gap: 8 }}>
          {houses.map((house) => (
            <HouseRow
              key={house.id}
              house={house}
              selected={selected.includes(house.id)}
              onToggle={() => toggle(house.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          testID="compare-start"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCompare }}
          disabled={!canCompare}
          onPress={startCompare}
          style={[styles.ctaBtn, !canCompare && styles.ctaDisabled]}
        >
          <Ionicons name="grid" size={16} color={colors.white} />
          <Text style={styles.ctaText}>{canCompare ? '2개 비교하기' : `${selected.length}/2 선택`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HouseRow({
  house,
  selected,
  onToggle,
}: {
  house: House;
  selected: boolean;
  onToggle: () => void;
}) {
  const isJeonse = house.dealType === 'JEONSE';
  const meta = [house.area ? `${house.area}평` : null, roomTypeLabel(house.roomType)]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      testID={`compare-house-${house.id}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onToggle}
      style={[styles.row, { borderColor: selected ? colors.ink : colors.borderSoft }]}
    >
      <View style={styles.thumb}>
        <Ionicons name="home" size={20} color="rgba(255,255,255,0.85)" />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <View style={[styles.dealBadgeSm, { backgroundColor: isJeonse ? colors.primarySoft : '#FCEFE7' }]}>
            <Text style={[styles.dealTextSm, { color: isJeonse ? colors.primary : colors.coral }]}>
              {dealTypeShort(house)}
            </Text>
          </View>
          <Text style={styles.rowName} numberOfLines={1}>
            {getHouseTitle(house)}
          </Text>
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatHousePriceShort(house)}
          {meta ? ` · ${meta}` : ''}
        </Text>
      </View>
      <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
        {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 16, paddingBottom: 24 },
  slots: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  slotEmpty: {
    flex: 1,
    height: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderHard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  slotEmptyText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  slotFilled: {
    flex: 1,
    height: 96,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 10,
    justifyContent: 'space-between',
  },
  slotRemove: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dealBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  dealText: { fontSize: 9.5, fontWeight: '700' },
  slotName: { fontSize: 13.5, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  slotPrice: { marginTop: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  countLabel: { fontSize: 13, fontWeight: '700', color: colors.ink70, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 10,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1.5,
  },
  thumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: colors.accentBeige, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dealBadgeSm: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  dealTextSm: { fontSize: 9, fontWeight: '700' },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  rowMeta: { marginTop: 2, fontSize: 11, fontWeight: '500', color: colors.muted },
  check: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  checkOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkOff: { backgroundColor: 'transparent', borderColor: colors.borderHard },
  footer: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, backgroundColor: colors.white },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 52, borderRadius: 14, backgroundColor: colors.inkStrong },
  ctaDisabled: { backgroundColor: colors.accentBeige },
  ctaText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
