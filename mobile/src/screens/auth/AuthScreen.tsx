import { useState, useEffect } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, isAuthCancellation } from '@/auth/authErrors';
import { authService } from '@/auth/authService';
import { appleAuth } from '@/auth/appleAuth';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { KakaoSignInButton } from '@/components/KakaoSignInButton';
import { AuthHero } from './AuthHero';
import { colors, spacing, typography } from '@/theme';

export function AuthScreen() {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      void appleAuth.isAvailable().then(setAppleAvailable);
    }
  }, []);

  async function handleApple() {
    try {
      await authService.loginWithApple();
    } catch (e) {
      if (isAuthCancellation(e)) return;
      Alert.alert('Apple 로그인 실패', getAuthErrorMessage(e));
    }
  }

  async function handleKakao() {
    try {
      await authService.loginWithKakao();
    } catch (e) {
      if (isAuthCancellation(e)) return;
      Alert.alert('카카오 로그인 실패', getAuthErrorMessage(e));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
        <View style={{ marginTop: spacing.xxl }}>
          <Text style={[typography.display, { color: colors.ink }]}>살래말래</Text>
          <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.md }]}>
            마음에 든 집, 사진과 별점으로 남겨두세요
          </Text>
        </View>

        <AuthHero />

        <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
          {appleAvailable ? <AppleSignInButton onPress={handleApple} /> : null}
          <KakaoSignInButton onPress={handleKakao} />
          <Text style={[typography.caption, { color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            로그인 시 이용약관 · 개인정보 처리방침에 동의합니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
