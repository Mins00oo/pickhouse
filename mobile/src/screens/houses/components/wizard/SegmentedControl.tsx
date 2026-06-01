import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';

export interface SegmentedControlProps {
  options: string[];
  value: number;
  onChange: (index: number) => void;
  /** testID 접두사 (기본 'segmented'). 예: 'dealtype' -> 'dealtype-월세' */
  testIDPrefix?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  testIDPrefix = 'segmented',
}: SegmentedControlProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        padding: 3,
        borderRadius: 12,
      }}
    >
      {options.map((o, i) => {
        const active = i === value;
        return (
          <Pressable
            key={o}
            testID={`${testIDPrefix}-${o}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o}
            onPress={() => onChange(i)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 9,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              backgroundColor: active ? colors.white : 'transparent',
              borderWidth: 1,
              borderColor: active ? colors.primary : 'transparent',
            }}
          >
            {active ? (
              <View
                style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary }}
              />
            ) : null}
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '700' : '600',
                letterSpacing: -0.3,
                color: active ? colors.inkStrong : colors.muted,
              }}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
