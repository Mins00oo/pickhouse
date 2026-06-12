import { authApi } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import { queryClient } from '@/queries/queryClient';
import { deviceId } from '@/storage/deviceId';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { AuthProvider, SocialLoginCredential } from '@/types';
import { appleAuth } from './appleAuth';
import { kakaoAuth } from './kakaoAuth';

let refreshPromise: Promise<string | null> | null = null;

function responseStatus(error: unknown): number | null {
  if (error instanceof ApiError) return error.status;
  if (error !== null && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: unknown } }).response;
    return typeof response?.status === 'number' ? response.status : null;
  }
  return null;
}

async function clearStoredSession(): Promise<void> {
  await secureTokens.clear();
  useAuthStore.getState().clear();
  queryClient.clear();
}

async function signOutFromSocialProvider(): Promise<void> {
  try {
    await kakaoAuth.signOut();
  } catch {
    // The backend and local sessions are already closed.
  }
}

async function loginWith(
  provider: AuthProvider,
  credential: SocialLoginCredential,
): Promise<void> {
  const tokens = await authApi.login({
    provider,
    idToken: credential.idToken,
    deviceId: await deviceId.get(),
    displayName: credential.displayName,
  });
  await secureTokens.save(tokens);
  useAuthStore.getState().setSession(tokens);
}

async function performRefreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  try {
    const tokens = await authApi.refresh({
      refreshToken,
      deviceId: await deviceId.get(),
    });
    useAuthStore.getState().updateTokens(tokens);
    await secureTokens.save(tokens);
    return tokens.accessToken;
  } catch (error) {
    const status = responseStatus(error);
    if (status === 401 || status === 409) {
      await clearStoredSession();
      return null;
    }
    throw error;
  }
}

export const authService = {
  async loginWithApple(): Promise<void> {
    await loginWith('APPLE', await appleAuth.signIn());
  },

  async loginWithKakao(): Promise<void> {
    await loginWith('KAKAO', await kakaoAuth.signIn());
  },

  async refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
      refreshPromise = performRefreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  },

  async logout(): Promise<void> {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await authApi.logout({
          refreshToken,
          deviceId: await deviceId.get(),
        });
      }
    } catch {
      // A server or network failure must not trap the user in the local session.
    } finally {
      await clearStoredSession();
      await signOutFromSocialProvider();
    }
  },

  async deleteAccount(): Promise<void> {
    await authApi.deleteMe();
    await clearStoredSession();
    await signOutFromSocialProvider();
  },

  async restoreSession(): Promise<void> {
    const session = await secureTokens.load();
    if (!session) {
      useAuthStore.getState().setStatus('unauthenticated');
      return;
    }
    useAuthStore.getState().setSession(session);
  },
};
