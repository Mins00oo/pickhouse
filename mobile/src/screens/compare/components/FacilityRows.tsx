import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { COMPARE_COLOR_A, COMPARE_COLOR_B } from '../compareUtils';

/**
 * 시설 비교 한 줄(요약) — 있음=집 색 + 체크, 없음=흐린 대시.
 * 떠다니는 칩이 아니라 한 줄에서 좌우를 대조한다.
 */
export function FacilityCompareRow({ label, la, rb }: { label: string; la?: boolean; rb?: boolean }) {
  const cell = (on: boolean | undefined, color: string) => (
    <View style={styles.cmpCell}>
      {on ? (
        <>
          <Ionicons name="checkmark" size={14} color={color} />
          <Text style={[styles.onText, { color }]}>있음</Text>
        </>
      ) : (
        <>
          <View style={styles.dash} />
          <Text style={styles.offText}>없음</Text>
        </>
      )}
    </View>
  );
  return (
    <View style={styles.row}>
      {cell(la, COMPARE_COLOR_A)}
      <Text style={styles.label}>{label}</Text>
      {cell(rb, COMPARE_COLOR_B)}
    </View>
  );
}

/** 시설 O/X 한 줄(풀표) — 있음=green 체크, 없음=muted X. */
export function FacilityRow({ label, la, rb }: { label: string; la?: boolean; rb?: boolean }) {
  const cell = (on: boolean | undefined) => (
    <View style={styles.oxCell}>
      {on ? (
        <>
          <Ionicons name="checkmark" size={13} color={colors.green} />
          <Text style={styles.oxOn}>있음</Text>
        </>
      ) : (
        <>
          <Ionicons name="close" size={12} color={colors.muted} />
          <Text style={styles.oxOff}>없음</Text>
        </>
      )}
    </View>
  );
  return (
    <View style={styles.row}>
      {cell(la)}
      <Text style={styles.label}>{label}</Text>
      {cell(rb)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { width: 56, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.muted },
  cmpCell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7 },
  onText: { fontSize: 13, fontWeight: '700' },
  dash: { width: 12, height: 2, borderRadius: 2, backgroundColor: '#CFCBBF' },
  offText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  oxCell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 },
  oxOn: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  oxOff: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
});
