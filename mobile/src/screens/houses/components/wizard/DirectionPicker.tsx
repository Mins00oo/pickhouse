import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { Direction } from '@/types';
import { DIRECTION_OPTIONS } from '../../wizardConstants';

export interface DirectionPickerProps {
  value?: Direction;
  onChange: (d: Direction) => void;
}

export function DirectionPicker({ value, onChange }: DirectionPickerProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {DIRECTION_OPTIONS.map((o, i) => {
        const on = o.code === value;
        const sunny = i <= 2; // 남/남동/남서
        return (
          <Pressable
            key={o.code}
            testID={`direction-${o.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.code)}
            style={{
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: on ? colors.primarySoft : colors.white,
              borderWidth: 1,
              borderColor: on ? colors.primary : colors.borderHard,
            }}
          >
            {sunny ? (
              <Ionicons name="sunny-outline" size={13} color={on ? colors.primary : colors.amber} />
            ) : null}
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: on ? '700' : '600',
                letterSpacing: -0.3,
                color: on ? colors.primary : colors.ink70,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
