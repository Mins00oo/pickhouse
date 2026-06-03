import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { House } from '@/types';
import { colors } from '@/theme';
import { formatHousePriceShort, getHouseTitle } from '@/screens/houses/houseMapUtils';
import { COMPARE_COLOR_A, COMPARE_COLOR_B, CompareSide, dealTypeShort } from '../compareUtils';

/** 두 집 헤더 — [1fr 40px 1fr]. 가운데 VS, 이름 옆 집 색 점. (사진은 placeholder 블록) */
export function CompareHeader({ a, b }: { a: House; b: House }) {
  return (
    <View style={styles.row}>
      <Cell house={a} side="l" />
      <View style={styles.vsWrap}>
        <View style={styles.vs}>
          <Text style={styles.vsText}>VS</Text>
        </View>
      </View>
      <Cell house={b} side="r" />
    </View>
  );
}

function Cell({ house, side }: { house: House; side: CompareSide }) {
  const isJeonse = house.dealType === 'JEONSE';
  return (
    <View style={styles.cell}>
      <View style={styles.photo}>
        <Ionicons name="home" size={26} color="rgba(255,255,255,0.85)" />
      </View>
      <View style={styles.idLine}>
        <View style={[styles.dot, { backgroundColor: side === 'l' ? COMPARE_COLOR_A : COMPARE_COLOR_B }]} />
        <View
          style={[
            styles.dealBadge,
            { backgroundColor: isJeonse ? colors.primarySoft : '#FCEFE7' },
          ]}
        >
          <Text style={[styles.dealText, { color: isJeonse ? colors.primary : colors.coral }]}>
            {dealTypeShort(house)}
          </Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {getHouseTitle(house)}
      </Text>
      <Text style={styles.price}>{formatHousePriceShort(house)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  cell: { flex: 1, alignItems: 'center' },
  vsWrap: { width: 40, alignItems: 'center', paddingTop: 36 },
  vs: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.inkStrong, alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 11, fontWeight: '800', color: colors.white },
  photo: {
    width: '100%',
    height: 92,
    borderRadius: 12,
    backgroundColor: colors.accentBeige,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  idLine: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dealBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  dealText: { fontSize: 9.5, fontWeight: '700' },
  name: { marginTop: 3, fontSize: 13.5, fontWeight: '700', color: colors.ink, letterSpacing: -0.3, maxWidth: '100%' },
  price: { marginTop: 2, fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
});
