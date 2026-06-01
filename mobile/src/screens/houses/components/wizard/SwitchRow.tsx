import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export interface SwitchRowProps {
  icon: string;
  label: string;
  value: boolean;
  onToggle: () => void;
}

export function SwitchRow({ icon, label, value, onToggle }: SwitchRowProps) {
  return (
    <Pressable
      testID={`switch-${label}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: colors.white,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.borderSoft,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={17} color={value ? colors.primary : colors.muted} />
      </View>
      <Text
        style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          padding: 3,
          backgroundColor: value ? colors.primary : '#D8D5CD',
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white }} />
      </View>
    </Pressable>
  );
}
