import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { House } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatKm } from '@/screens/houses/houseMapUtils';
import { useAnchorDistances } from '@/queries/anchorDistances.queries';
import { ANCHOR_META } from '@/screens/houses/anchorMeta';

/**
 * 집 ↔ 등록된 거점(직장/학교)의 거리 스탯.
 * 아이콘 + 큰 숫자 + 작은 보조(차 N분 / 직선거리)로 글랜서블하게.
 * 거점 미등록·좌표 없음이면 렌더하지 않는다.
 */
export function AnchorDistanceCard({ house }: { house: House }) {
  const { distances, isLoading } = useAnchorDistances(house);

  if (!isLoading && distances.length === 0) return null;

  return (
    <Card testID="anchor-distance-card">
      <Text style={typography.caption}>내 거점까지</Text>
      {isLoading && distances.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.muted} />
          <Text style={styles.loadingText}>거리 계산 중…</Text>
        </View>
      ) : (
        <View style={styles.stats}>
          {distances.map((d) => {
            const meta = ANCHOR_META[d.anchorType];
            const sub =
              d.source === 'driving'
                ? d.durationMin != null
                  ? `차 ${d.durationMin}분`
                  : '도로 거리'
                : '직선거리';
            return (
              <View key={d.anchorType} testID={`anchor-distance-${d.anchorType}`} style={styles.stat}>
                <View style={styles.statIcon}>
                  <Ionicons name={meta.icon as never} size={18} color={colors.primary} />
                </View>
                <Text style={styles.statLabel}>{meta.label}</Text>
                <Text style={styles.statValue}>{formatKm(d.km)}</Text>
                <Text style={styles.statSub}>{sub}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  loadingText: { ...typography.caption, color: colors.inkMuted },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xs,
  },
  statLabel: { ...typography.caption, color: colors.inkMuted },
  statValue: { ...typography.amount, color: colors.ink },
  statSub: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
