import { Platform, Pressable, Text } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export interface AppleSignInButtonProps {
  onPress: () => void;
}

// U+F8FF renders as the Apple logo glyph in the iOS system font.
const APPLE_GLYPH = '';

/**
 * Custom Apple sign-in button. Replaces the native AppleAuthentication
 * button so its label matches the Kakao button's font size exactly
 * (both use typography.bodyBold).
 *
 * iOS only — the native Apple flow is unavailable elsewhere.
 */
export function AppleSignInButton({ onPress }: AppleSignInButtonProps) {
  if (Platform.OS !== 'ios') return null;
  return (
    <Pressable
      testID="apple-sign-in"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.ink,
        height: 52,
        borderRadius: radii.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        opacity: pressed ? 0.9 : 1,
        width: '100%',
      })}
    >
      <Text style={{ fontSize: 18, color: colors.white }}>{APPLE_GLYPH}</Text>
      <Text style={[typography.bodyBold, { color: colors.white }]}>Apple로 로그인</Text>
    </Pressable>
  );
}
