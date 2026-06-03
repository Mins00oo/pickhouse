import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { CompareSide } from '../compareUtils';

/**
 * 비교 한 줄 — 가운데 라벨 + 좌우 값. hi: 숫자상 더 큰 쪽('l'|'r'|null).
 * ▲(더 큼, 진하게) / ▼(더 작음, 연하게) — 판단이 아닌 크기 사실.
 * 사과-오렌지 항목(거래/보증금/방/층)은 hi=null로 화살표 없이 값만.
 */
export function CompareRow({
  label,
  left,
  right,
  hi = null,
  dense = false,
}: {
  label: string;
  left: string | number;
  right: string | number;
  hi?: CompareSide | null;
  dense?: boolean;
}) {
  return (
    <View style={styles.row}>
      <ValueCell value={left} side="l" hi={hi} dense={dense} />
      <Text style={styles.label}>{label}</Text>
      <ValueCell value={right} side="r" hi={hi} dense={dense} />
    </View>
  );
}

function ValueCell({
  value,
  side,
  hi,
  dense,
}: {
  value: string | number;
  side: CompareSide;
  hi: CompareSide | null;
  dense: boolean;
}) {
  const up = hi != null && hi === side;
  return (
    <View style={[styles.cell, { paddingVertical: dense ? 6 : 9 }]}>
      <Text style={[styles.value, { fontSize: dense ? 13.5 : 15 }]}>{value}</Text>
      {hi != null ? (
        <Ionicons
          name={up ? 'caret-up' : 'caret-down'}
          size={dense ? 10 : 11}
          color={up ? colors.ink70 : '#C2BEB2'}
          style={styles.arrow}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { width: 56, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: -0.2 },
  value: { fontWeight: '700', color: colors.ink, letterSpacing: -0.3, textAlign: 'center' },
  arrow: { marginTop: 1 },
});
