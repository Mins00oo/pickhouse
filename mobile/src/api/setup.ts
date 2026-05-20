import { createApiClient, setApiClient } from './client';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/auth/authService';

export function initializeApi(baseURL: string): void {
  const client = createApiClient({
    baseURL,
    getAccessToken: async () => useAuthStore.getState().accessToken,
    onUnauthorized: async () => authService.refreshAccessToken(),
  });
  setApiClient(client);
}
