import { useState, useEffect } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/auth/authService';
import { appleAuth } from '@/auth/appleAuth';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { KakaoSignInButton } from '@/components/KakaoSignInButton';
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
      Alert.alert('Apple 로그인 실패', e instanceof Error ? e.message : String(e));
    }
  }

  async function handleKakao() {
    try {
      await authService.loginWithKakao();
    } catch (e) {
      Alert.alert('카카오 로그인 실패', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
        <View style={{ marginTop: spacing.xxxl }}>
          <Text style={[typography.miniLabel, { color: colors.inkMuted }]}>PICKHOUSE</Text>
          <Text style={[typography.display, { color: colors.ink, marginTop: spacing.sm }]}>살래말래</Text>
          <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.md }]}>
            본 집들을 정리해서{'\n'}한눈에 비교하는 나만의 기록장
          </Text>
        </View>

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
