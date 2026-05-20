import { Pressable, Text } from 'react-native';
import { radii, typography } from '@/theme';

export interface KakaoSignInButtonProps {
  onPress: () => void;
}

export function KakaoSignInButton({ onPress }: KakaoSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#FEE500',
        height: 52,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.9 : 1,
        width: '100%',
      })}
    >
      <Text style={[typography.bodyBold, { color: '#1A1A1A' }]}>카카오로 시작하기</Text>
    </Pressable>
  );
}
