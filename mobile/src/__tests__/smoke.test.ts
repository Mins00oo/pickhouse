import { authService } from '@/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { appleAuth } from '@/auth/appleAuth';
import { housesApi } from '@/api/houses.api';

jest.mock('@/api/auth.api');
jest.mock('@/storage/secureTokens');
jest.mock('@/auth/appleAuth');
jest.mock('@/api/houses.api');

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'unknown' });
});

describe('mobile smoke', () => {
  it('apple login -> create house calls the backend API', async () => {
    (appleAuth.signIn as jest.Mock).mockResolvedValueOnce('apple-token');
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1', authProviders: { apple: 'a' }, createdAt: '' },
    });

    await authService.loginWithApple();
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(secureTokens.save).toHaveBeenCalled();

    const now = new Date().toISOString();
    const house = {
      id: 'h1',
      address: { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType: 'WOLSE' as const,
      deposit: 1000,
      photoIds: [],
      createdAt: now,
      updatedAt: now,
    };
    (housesApi.create as jest.Mock).mockResolvedValueOnce(house);
    await housesApi.create(house as any);

    expect(housesApi.create).toHaveBeenCalledWith(house);
  });
});
