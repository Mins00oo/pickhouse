import { View, Text } from 'react-native';
import { colors, radii, spacing, typography, shadows } from '@/theme';

/** Decorative sample house cards shown on the login screen. */
const SAMPLE_HOUSES = [
  {
    photo: '#a8c0d8',
    name: '망원동 투룸',
    rating: 4,
    meta: '보증금 1000 / 월 65',
    rotate: '-8deg',
    offset: { left: 0, top: spacing.lg },
  },
  {
    photo: colors.accentBeige,
    name: '성수동 오피스텔',
    rating: 3,
    meta: '보증금 2000 / 월 80',
    rotate: '7deg',
    offset: { right: 0, top: 0 },
  },
] as const;

const FEATURES = [
  { icon: '📸', label: '사진 기록' },
  { icon: '⭐', label: '별점 평가' },
  { icon: '🏠', label: '한눈 비교' },
] as const;

function Stars({ value }: { value: number }) {
  return (
    <Text style={{ fontSize: 11, letterSpacing: 1 }}>
      <Text style={{ color: colors.star }}>{'★'.repeat(value)}</Text>
      <Text style={{ color: colors.border }}>{'★'.repeat(5 - value)}</Text>
    </Text>
  );
}

function HouseCard({ house }: { house: (typeof SAMPLE_HOUSES)[number] }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: 156,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.sm,
          transform: [{ rotate: house.rotate }],
        },
        house.offset,
        shadows.soft,
      ]}
    >
      <View style={{ height: 70, borderRadius: radii.sm, backgroundColor: house.photo }} />
      <Text style={[typography.caption, { fontWeight: '700', color: colors.ink, marginTop: spacing.sm }]}>
        {house.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
        <Stars value={house.rating} />
      </View>
      <Text style={[typography.caption, { fontSize: 11, color: colors.inkMuted, marginTop: 2 }]}>
        {house.meta}
      </Text>
    </View>
  );
}

/**
 * Visual hero for the login screen: two overlapping sample house cards
 * above a row of the app's three core features.
 */
export function AuthHero() {
  return (
    <View style={{ alignItems: 'center', gap: spacing.xl }}>
      <View style={{ width: 250, height: 180 }}>
        {SAMPLE_HOUSES.map((house) => (
          <HouseCard key={house.name} house={house} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch' }}>
        {FEATURES.map((feature) => (
          <View key={feature.label} style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text style={{ fontSize: 24 }}>{feature.icon}</Text>
            <Text style={[typography.caption, { fontWeight: '700', color: colors.ink }]}>
              {feature.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
