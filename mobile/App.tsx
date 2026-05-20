import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { initializeApi } from '@/api/setup';
import { authService } from '@/auth/authService';
import { queryClient } from '@/queries/queryClient';
import { colors } from '@/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function App() {
  useEffect(() => {
    initializeApi(API_BASE_URL);
    void authService.restoreSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text>PickHouse</Text>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}
