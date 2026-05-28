import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
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
  useEffect(() => {
    initializeApi(resolveApiBaseUrl());
    void authService.restoreSession();
  }, []);

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
