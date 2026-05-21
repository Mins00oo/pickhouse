import { authService } from '../authService';
import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { appleAuth } from '../appleAuth';
import { kakaoAuth } from '../kakaoAuth';

jest.mock('@/api/auth.api');
jest.mock('@/storage/secureTokens');
jest.mock('../appleAuth');
jest.mock('../kakaoAuth');

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'unknown' });
});

describe('authService', () => {
  it('loginWithApple gets token, calls backend, saves tokens, updates store', async () => {
    (appleAuth.signIn as jest.Mock).mockResolvedValueOnce('apple-id');
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1', authProviders: { apple: 'a' }, createdAt: '' },
    });

    await authService.loginWithApple();

    expect(authApi.login).toHaveBeenCalledWith({ provider: 'apple', idToken: 'apple-id' });
    expect(secureTokens.save).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.id).toBe('u1');
  });

  it('loginWithKakao does the same with kakao provider', async () => {
    (kakaoAuth.signIn as jest.Mock).mockResolvedValueOnce('kakao-id');
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u2', authProviders: { kakao: 'b' }, createdAt: '' },
    });

    await authService.loginWithKakao();

    expect(authApi.login).toHaveBeenCalledWith({ provider: 'kakao', idToken: 'kakao-id' });
    expect(useAuthStore.getState().user?.id).toBe('u2');
  });

  it('refreshAccessToken calls /auth/refresh and updates tokens', async () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'old',
      refreshToken: 'oldR',
      status: 'authenticated',
    });
    (authApi.refresh as jest.Mock).mockResolvedValueOnce({ accessToken: 'newA', refreshToken: 'newR' });

    const newAccess = await authService.refreshAccessToken();

    expect(authApi.refresh).toHaveBeenCalledWith('oldR');
    expect(newAccess).toBe('newA');
    expect(useAuthStore.getState().accessToken).toBe('newA');
    expect(secureTokens.save).toHaveBeenCalledWith({ accessToken: 'newA', refreshToken: 'newR' });
  });

  it('logout clears store and secure storage and calls kakao signOut', async () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'a', refreshToken: 'r', status: 'authenticated',
    });
    await authService.logout();
    expect(secureTokens.clear).toHaveBeenCalled();
    expect(kakaoAuth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('restoreSession loads tokens and fetches current user if present', async () => {
    (secureTokens.load as jest.Mock).mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' });
    (authApi.me as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'me@example.com',
      nickname: 'picker',
      authProviders: {},
      createdAt: '',
    });

    await authService.restoreSession();

    expect(authApi.me).toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBe('a');
    expect(useAuthStore.getState().user?.id).toBe('u1');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('restoreSession marks unauthenticated when no tokens', async () => {
    (secureTokens.load as jest.Mock).mockResolvedValueOnce(null);
    await authService.restoreSession();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
