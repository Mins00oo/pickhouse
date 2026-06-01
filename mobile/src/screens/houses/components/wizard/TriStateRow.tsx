import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, conditionColor } from '@/theme';
import type { ConditionLevel } from '@/types';

const OPTIONS: { level: ConditionLevel; label: string; color: string }[] = [
  { level: 3, label: '좋음', color: colors.condGood },
  { level: 2, label: '보통', color: colors.condMid },
  { level: 1, label: '나쁨', color: colors.condBad },
];

export interface TriStateRowProps {
  icon: string;
  label: string;
  value?: ConditionLevel;
  onChange: (v: ConditionLevel) => void;
}

export function TriStateRow({ icon, label, value, onChange }: TriStateRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        backgroundColor: colors.white,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.borderSoft,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={18} color={value ? conditionColor(value) : colors.muted} />
      </View>
      <Text
        style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {OPTIONS.map((o) => {
          const on = value === o.level;
          return (
            <Pressable
              key={o.level}
              testID={`condition-${label}-${o.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label} ${o.label}`}
              onPress={() => onChange(o.level)}
              style={{
                minWidth: 46,
                height: 34,
                paddingHorizontal: 8,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? o.color : colors.surface,
                borderWidth: 1,
                borderColor: on ? o.color : colors.borderSoft,
              }}
            >
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: on ? '700' : '600',
                  letterSpacing: -0.3,
                  color: on ? colors.white : colors.muted,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
