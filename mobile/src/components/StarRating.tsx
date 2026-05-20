import { Pressable, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

export interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={`별 ${n}점`}
          onPress={() => onChange(n)}
          hitSlop={6}
        >
          <Text style={{ fontSize: 28, color: n <= value ? colors.star : colors.border }}>
            {'★'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
