import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { AuthProvider } from '@/types';
import { appleAuth } from './appleAuth';
import { kakaoAuth } from './kakaoAuth';

async function loginWith(provider: AuthProvider, idToken: string): Promise<void> {
  const res = await authApi.login({ provider, idToken });
  await secureTokens.save({ accessToken: res.accessToken, refreshToken: res.refreshToken });
  useAuthStore.getState().setSession({
    user: res.user,
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
}

export const authService = {
  async loginWithApple(): Promise<void> {
    const idToken = await appleAuth.signIn();
    await loginWith('apple', idToken);
  },

  async loginWithKakao(): Promise<void> {
    const idToken = await kakaoAuth.signIn();
    await loginWith('kakao', idToken);
  },

  async refreshAccessToken(): Promise<string | null> {
    const current = useAuthStore.getState().refreshToken;
    if (!current) return null;
    try {
      const res = await authApi.refresh(current);
      useAuthStore.getState().updateTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      await secureTokens.save({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      return res.accessToken;
    } catch {
      await this.logout();
      return null;
    }
  },

  async logout(): Promise<void> {
    await secureTokens.clear();
    await kakaoAuth.signOut();
    useAuthStore.getState().clear();
  },

  async restoreSession(): Promise<void> {
    const tokens = await secureTokens.load();
    if (!tokens) {
      useAuthStore.getState().setStatus('unauthenticated');
      return;
    }
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    });
  },
};
