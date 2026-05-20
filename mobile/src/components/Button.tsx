import { Pressable, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const bg = disabled
    ? colors.border
    : variant === 'primary'
      ? colors.accentGreen
      : variant === 'secondary'
        ? colors.cream
        : 'transparent';
  const fg = variant === 'primary' && !disabled ? colors.white : colors.ink;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.pill,
          alignItems: 'center',
          opacity: pressed && !disabled ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text style={[typography.bodyBold, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
