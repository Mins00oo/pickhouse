import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export interface ChipsProps {
  options: string[];
  /** 단일 선택이면 number(인덱스), 다중이면 number[] */
  value: number | number[];
  multi?: boolean;
  onToggle: (index: number) => void;
  testIDPrefix?: string;
}

export function Chips({ options, value, multi = false, onToggle, testIDPrefix = 'chip' }: ChipsProps) {
  const selected = Array.isArray(value) ? value : value < 0 ? [] : [value];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {options.map((o, i) => {
        const on = selected.includes(i);
        const bg = on ? (multi ? colors.primary : colors.primarySoft) : colors.white;
        const fg = on ? (multi ? colors.white : colors.primary) : colors.ink70;
        return (
          <Pressable
            key={o}
            testID={`${testIDPrefix}-${o}`}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o}
            onPress={() => onToggle(i)}
            style={{
              height: 40,
              paddingHorizontal: 15,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: bg,
              borderWidth: 1,
              borderColor: on ? colors.primary : colors.borderHard,
            }}
          >
            {on ? (
              <Ionicons name="checkmark" size={13} color={multi ? colors.white : colors.primary} />
            ) : null}
            <Text
              style={{ fontSize: 13.5, fontWeight: on ? '700' : '600', letterSpacing: -0.3, color: fg }}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
