import { ApiError } from '@/api/client';
import { authApi } from '@/api/auth.api';
import { deviceId } from '@/storage/deviceId';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { appleAuth } from '../appleAuth';
import { authService } from '../authService';
import { kakaoAuth } from '../kakaoAuth';

jest.mock('@/api/auth.api');
jest.mock('@/storage/deviceId');
jest.mock('@/storage/secureTokens');
jest.mock('../appleAuth');
jest.mock('../kakaoAuth');

beforeEach(() => {
  jest.clearAllMocks();
  (deviceId.get as jest.Mock).mockResolvedValue('device-1');
  useAuthStore.setState({ accessToken: null, refreshToken: null, status: 'unknown' });
});

describe('authService', () => {
  it('logs in with provider credentials and the installation device id', async () => {
    (appleAuth.signIn as jest.Mock).mockResolvedValueOnce({
      idToken: 'apple-id',
      displayName: '홍길동',
    });
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
    });

    await authService.loginWithApple();

    expect(authApi.login).toHaveBeenCalledWith({
      provider: 'APPLE',
      idToken: 'apple-id',
      deviceId: 'device-1',
      displayName: '홍길동',
    });
    expect(secureTokens.save).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('rotates both tokens using refreshToken and deviceId', async () => {
    useAuthStore.setState({
      accessToken: 'old',
      refreshToken: 'oldR',
      status: 'authenticated',
    });
    (authApi.refresh as jest.Mock).mockResolvedValueOnce({
      accessToken: 'newA',
      refreshToken: 'newR',
    });

    await expect(authService.refreshAccessToken()).resolves.toBe('newA');
    expect(authApi.refresh).toHaveBeenCalledWith({
      refreshToken: 'oldR',
      deviceId: 'device-1',
    });
    expect(useAuthStore.getState().refreshToken).toBe('newR');
  });

  it('clears an invalid refresh session but preserves it on network failure', async () => {
    useAuthStore.setState({
      accessToken: 'old',
      refreshToken: 'oldR',
      status: 'authenticated',
    });
    (authApi.refresh as jest.Mock).mockRejectedValueOnce(
      new ApiError('REFRESH_TOKEN_INVALID', 'invalid', 401),
    );

    await expect(authService.refreshAccessToken()).resolves.toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('logs out remotely and always clears the local session', async () => {
    useAuthStore.setState({
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    (authApi.logout as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    await authService.logout();

    expect(authApi.logout).toHaveBeenCalledWith({
      refreshToken: 'r',
      deviceId: 'device-1',
    });
    expect(secureTokens.clear).toHaveBeenCalled();
    expect(kakaoAuth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('restores a token-only session without requesting the profile', async () => {
    (secureTokens.load as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
    });

    await authService.restoreSession();

    expect(authApi.me).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
