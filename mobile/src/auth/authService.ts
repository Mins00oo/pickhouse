import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { AuthProvider } from '@/types';
import { appleAuth } from './appleAuth';
import { kakaoAuth } from './kakaoAuth';

let refreshPromise: Promise<string | null> | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function responseStatus(error: unknown): number | null {
  const response = asRecord(error)?.response;
  const status = asRecord(response)?.status;
  return typeof status === 'number' ? status : null;
}

function isUnauthorized(error: unknown): boolean {
  return responseStatus(error) === 401;
}

async function clearStoredSession(): Promise<void> {
  await secureTokens.clear();
  useAuthStore.getState().clear();
}

async function loginWith(provider: AuthProvider, idToken: string): Promise<void> {
  const res = await authApi.login({ provider, idToken });
  await secureTokens.save({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    user: res.user,
  });
  useAuthStore.getState().setSession({
    user: res.user,
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
}

async function performRefreshAccessToken(): Promise<string | null> {
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
  } catch (e) {
    if (isUnauthorized(e)) {
      await clearStoredSession();
      return null;
    }
    throw e;
  }
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
    if (!refreshPromise) {
      refreshPromise = performRefreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  },

  async logout(): Promise<void> {
    await clearStoredSession();
    await kakaoAuth.signOut();
  },

  async restoreSession(): Promise<void> {
    const session = await secureTokens.load();
    if (!session) {
      useAuthStore.getState().setStatus('unauthenticated');
      return;
    }

    if (session.user) {
      useAuthStore.getState().setSession({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } else {
      useAuthStore.setState({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        status: 'unknown',
      });
    }

    try {
      const user = await authApi.me();
      const current = useAuthStore.getState();
      const accessToken = current.accessToken ?? session.accessToken;
      const refreshToken = current.refreshToken ?? session.refreshToken;
      await secureTokens.save({ accessToken, refreshToken, user });
      useAuthStore.getState().setSession({
        user,
        accessToken,
        refreshToken,
      });
    } catch (e) {
      if (isUnauthorized(e)) {
        await clearStoredSession();
      } else if (!session.user) {
        useAuthStore.getState().setStatus('unauthenticated');
      }
    }
  },
};
