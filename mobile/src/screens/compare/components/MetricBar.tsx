import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { COMPARE_COLOR_A, COMPARE_COLOR_B } from '../compareUtils';

/**
 * 숫자 비교 — 가운데서 양옆으로 뻗는 미러 막대 + 큰 숫자(집 색) + "N단위 차이" 델타.
 * 막대 길이 = 값/max(최소 10%). 판단이 아니라 크기 사실을 보여준다.
 */
export function MetricBar({
  label,
  la,
  rb,
  unit = '',
}: {
  label: string;
  la: number;
  rb: number;
  unit?: string;
}) {
  const max = Math.max(la, rb) || 1;
  const lp = Math.max(10, Math.round((la / max) * 100));
  const rp = Math.max(10, Math.round((rb / max) * 100));
  const diff = Math.abs(la - rb);

  return (
    <View style={styles.row}>
      {/* left: 숫자 + 막대(가운데로 자람) */}
      <View style={styles.sideLeft}>
        <Num value={la} unit={unit} color={COMPARE_COLOR_A} />
        <View style={styles.track}>
          <View style={[styles.fillRight, { width: `${lp}%`, backgroundColor: COMPARE_COLOR_A }]} />
        </View>
      </View>

      {/* center: 라벨 + 델타 */}
      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        {diff > 0 ? (
          <Text style={styles.delta}>
            {diff}
            {unit} 차이
          </Text>
        ) : null}
      </View>

      {/* right: 막대 + 숫자 */}
      <View style={styles.sideRight}>
        <View style={styles.track}>
          <View style={[styles.fillLeft, { width: `${rp}%`, backgroundColor: COMPARE_COLOR_B }]} />
        </View>
        <Num value={rb} unit={unit} color={COMPARE_COLOR_B} />
      </View>
    </View>
  );
}

function Num({ value, unit, color }: { value: number; unit: string; color: string }) {
  return (
    <Text style={[styles.num, { color }]} numberOfLines={1}>
      {value}
      <Text style={styles.numUnit}>{unit}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  sideLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  center: { width: 62, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: colors.ink70 },
  delta: { fontSize: 9.5, fontWeight: '700', color: colors.muted, marginTop: 1 },
  track: { flex: 1, height: 9, borderRadius: 5, backgroundColor: colors.borderSoft, overflow: 'hidden', flexDirection: 'row' },
  fillRight: { height: 9, borderRadius: 5, marginLeft: 'auto' }, // 오른쪽 정렬 → 가운데를 향해 채움
  fillLeft: { height: 9, borderRadius: 5 }, // 왼쪽 정렬 → 가운데를 향해 채움
  num: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  numUnit: { fontSize: 11, fontWeight: '600' },
});
