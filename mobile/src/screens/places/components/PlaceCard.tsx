import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MyPlace } from '@/types';
import { PLACE_META, TRANSPORT_META } from '@/screens/houses/placeMeta';
import { colors } from '@/theme';

/** 등록된 내 장소 카드 — 아이콘 + 타입/주통근지 뱃지 + 이름(2줄) + 주소 + 이동수단 기준. */
export function PlaceCard({ place, onEdit }: { place: MyPlace; onEdit: () => void }) {
  const meta = PLACE_META[place.placeType];
  const transport = TRANSPORT_META[place.transport];
  const name = place.label?.trim() || meta.label;
  const addr = place.address.roadAddress || place.address.jibunAddress || '';

  return (
    <Pressable
      testID={`place-card-${place.id}`}
      accessibilityRole="button"
      onPress={onEdit}
      style={[styles.card, place.isPrimary && { borderColor: meta.color }]}
    >
      <View style={styles.top}>
        <View style={[styles.iconBox, { backgroundColor: meta.soft }]}>
          <Ionicons name={meta.icon as never} size={22} color={meta.color} />
        </View>
        <View style={styles.main}>
          <View style={styles.badgeRow}>
            <Text style={[styles.kindBadge, { backgroundColor: meta.soft, color: meta.color }]}>{meta.label}</Text>
            {place.isPrimary ? (
              <View style={styles.primaryBadge}>
                <Ionicons name="checkmark" size={10} color={colors.white} />
                <Text style={styles.primaryBadgeText}>주 통근지</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.addr} numberOfLines={1}>
            {addr}
          </Text>
        </View>
        <Ionicons name="create-outline" size={18} color={colors.muted} />
      </View>

      <View style={styles.transportRow}>
        <View style={styles.transportChip}>
          <Ionicons name={transport.icon as never} size={14} color={colors.ink70} />
          <Text style={styles.transportText}>{transport.label} 기준</Text>
        </View>
        <View style={styles.autoCalc}>
          <Ionicons name="navigate-outline" size={13} color={colors.muted} />
          <Text style={styles.autoCalcText}>매물별 통근시간 자동 계산</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  kindBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 5,
    overflow: 'hidden',
    fontSize: 10.5,
    fontWeight: '700',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: colors.inkStrong,
  },
  primaryBadgeText: { fontSize: 10.5, fontWeight: '700', color: colors.white },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.4, lineHeight: 20 },
  addr: { fontSize: 12, fontWeight: '500', color: colors.muted, marginTop: 2 },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  transportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
  transportText: { fontSize: 12, fontWeight: '600', color: colors.ink70 },
  autoCalc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  autoCalcText: { fontSize: 11.5, fontWeight: '600', color: colors.muted },
});
