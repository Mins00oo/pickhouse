import { Pressable, StyleSheet, Text, View } from 'react-native';
import { House } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';
import {
  formatHousePrice,
  getDealTypeLabel,
  getHouseCoordinate,
  getHouseMeta,
  getHouseSubtitle,
  getHouseTitle,
  getVisitedLabel,
} from '../houseMapUtils';

type Props = {
  house: House;
  selected: boolean;
  onSelect: (houseId: string) => void;
  onOpen: (houseId: string) => void;
  testID?: string;
};

export function HouseRecordRow({ house, selected, onSelect, onOpen, testID }: Props) {
  const meta = getHouseMeta(house);
  const hasCoordinate = Boolean(getHouseCoordinate(house));

  return (
    <Pressable
      testID={testID}
      onPress={() => onSelect(house.id)}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selectedRow,
        pressed && styles.pressedRow,
      ]}
    >
      <View style={[styles.thumbnail, selected && styles.selectedThumbnail]}>
        <Text style={styles.thumbnailText}>{getDealTypeLabel(house).slice(0, 1)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.title} numberOfLines={1}>
            {getHouseTitle(house)}
          </Text>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {getHouseSubtitle(house)}
        </Text>

        <View style={styles.metaLine}>
          <Text style={styles.price} numberOfLines={1}>
            {formatHousePrice(house)}
          </Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>

        <View style={styles.statusLine}>
          <Text style={styles.date}>{getVisitedLabel(house)} 기록</Text>
          {!hasCoordinate ? <Text style={styles.noMap}>지도 위치 없음</Text> : null}
        </View>
      </View>

      <Pressable
        testID={`open-house-detail-${house.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${getHouseTitle(house)} 상세 보기`}
        hitSlop={10}
        onPress={(event) => {
          event?.stopPropagation?.();
          onOpen(house.id);
        }}
        style={styles.detailButton}
      >
        <Text style={styles.detailIcon}>›</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    backgroundColor: colors.white,
  },
  selectedRow: {
    borderLeftColor: colors.ink,
    backgroundColor: '#f3f7ef',
  },
  pressedRow: {
    opacity: 0.82,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedThumbnail: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  thumbnailText: {
    ...typography.bodyBold,
    color: colors.ink,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    flex: 1,
    color: colors.ink,
  },
  rating: {
    ...typography.caption,
    color: colors.star,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  metaLine: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  price: {
    ...typography.caption,
    flexShrink: 1,
    color: colors.ink,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    flexShrink: 0,
    color: colors.inkSoft,
  },
  statusLine: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  date: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  noMap: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
  detailButton: {
    width: 34,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {
    color: colors.inkMuted,
    fontSize: 28,
    lineHeight: 30,
  },
});
