import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { initializeApi } from '@/api/setup';
import { resolveApiBaseUrl } from '@/api/baseUrl';
import { authService } from '@/auth/authService';
import { queryClient } from '@/queries/queryClient';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useSyncOrchestrator } from '@/sync/useSyncOrchestrator';
import { colors } from '@/theme';
import { applyGlobalFont, fontAssets } from '@/theme/fonts';

// Text/TextInput 전역 기본 글꼴 패치(모듈 로드 시 1회). 폰트는 아래 useFonts 로 로드.
applyGlobalFont();

function AppInner() {
  useSyncOrchestrator();
  return (
    <>
      <RootNavigator />
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    initializeApi(resolveApiBaseUrl());
    void authService.restoreSession();
  }, []);

  // Pretendard 로드 전 시스템 폰트로 잠깐 보였다 바뀌는 깜빡임을 막는다.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
